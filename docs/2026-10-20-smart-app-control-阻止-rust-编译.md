# Smart App Control 阻止 Rust 编译（os error 4551）

> 日期：2026-10-20
> 环境：Windows 11 家庭中文版 26200、Rust stable-msvc、Tauri 2

## 1. 现象

`pnpm tauri dev` 编译时，多个 crate 的构建脚本无法执行：

```
error: failed to run custom build command for `serde v1.0.229`
Caused by:
  could not execute process `...\target\debug\build\serde-xxxx\build-script-build` (never executed)
Caused by:
  应用程序控制策略已阻止此文件。 (os error 4551)
```

`thiserror`、`serde` 等带 `build.rs` 的依赖会成批失败。

## 2. 原因

不是 Rust、VS 或项目代码的问题，而是 Windows 的 **智能应用控制（Smart App Control，SAC）** 拦截了刚编译出来的未签名可执行文件。

Cargo 编译依赖时会生成并运行 `build-script-build.exe`，这些文件没有签名，SAC 的策略会直接阻止执行，返回 `os error 4551`。

Code Integrity 日志中的关键信息：

```
Code Integrity determined that a process (...\cargo.exe) attempted to load
\Device\HarddiskVolume4\...\build-script-build.exe that did not meet the
Enterprise signing level requirements or violated code integrity policy
(Policy ID:{0283ac0f-fff1-49ae-ada1-8a933130cad6})
```

事件 ID `3077` / `3033` 即为策略拦截，`3118` 为 Smart App Control 拦截详情。

## 3. 诊断

### 3.1 查看 SAC 状态

```powershell
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy' |
  Select-Object VerifiedAndReputablePolicyState
```

| 值 | 含义 |
|---|---|
| 0 | 关闭 |
| 1 | 开启（强制拦截，本项目遇到的情况） |
| 2 | 评估模式 |

### 3.2 查看拦截记录

```powershell
Get-WinEvent -LogName 'Microsoft-Windows-CodeIntegrity/Operational' -MaxEvents 10 |
  Where-Object { $_.Id -in 3077,3033,3118 } |
  Select-Object TimeCreated,Id,Message | Format-List
```

出现 `build-script-build.exe` + `Policy ID:{0283ac0f-...}` 即可确认是 SAC。

### 3.3 排除其他原因

- 公司域/组策略下发的 WDAC：`Get-CimInstance Win32_ComputerSystem | Select PartOfDomain`，本机为 `False`
- AppLocker：本机 `AppIDSvc` 虽在运行，但无 AppLocker 策略；日志指向 SAC 策略 ID

## 4. 解决方案

### 方案 A：关闭智能应用控制（推荐，一次性）

1. 打开 **Windows 安全中心**
2. 进入 **应用和浏览器控制** → **智能应用控制** → **设置**
3. 选择 **关闭**

> 需要管理员账户。关闭后立即生效，若未生效则重启。

**重要提醒**：智能应用控制一旦关闭，**无法再开启**（微软设计如此），除非重置或重装 Windows。关闭后 Windows 仍保留 Defender 实时防护，但会失去 SAC 对未知/未签名程序的拦截。

### 方案 B：注册表关闭（界面不可用时）

以管理员身份打开 PowerShell（官方不推荐，操作前先确认 SAC 可用界面方式关闭）：

```powershell
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy' `
  -Name VerifiedAndReputablePolicyState -Value 0 -Type DWord
Restart-Computer
```

重启后按 3.1 复查，值应为 `0`。

### 方案 C：无法关闭时

如果机器受组织策略管控、开关灰色不可用：

- 在不受策略管控的机器或 Windows 虚拟机中开发
- 使用 WSL2 + Linux 工具链开发（注意：无法直接产出 Windows 安装包，仅适合调 UI/逻辑）

> 注意：把项目挪到其他盘符或目录**无效**，SAC 拦截与路径无关；为单个文件签名也无效，SAC 校验的是签名信誉而非仅签名本身。

## 5. 关闭后重新编译

```powershell
cd D:\rust\rich-text-reader
cargo clean --manifest-path src-tauri\Cargo.toml
pnpm tauri dev
```

被拦截过的产物无需特殊处理，删除 `target` 只是为了避免残留状态干扰排查。

## 6. 验证清单

- [ ] `VerifiedAndReputablePolicyState` 为 `0`
- [ ] `Get-WinEvent` 中不再新增 `3077` 拦截记录
- [ ] `pnpm tauri dev` 不再出现 `os error 4551`
- [ ] 应用窗口正常弹出
