interface StatusBarProps {
  path: string | null;
  dirty: boolean;
  wordCount: number;
}

export default function StatusBar({ path, dirty, wordCount }: StatusBarProps) {
  const name = path ? path.split(/[\\/]/).pop() : "未命名";
  return (
    <div className="statusbar">
      <span className="status-item">
        {dirty ? <span className="dot dirty" /> : <span className="dot" />}
        {dirty ? "未保存" : "已保存"}
      </span>
      <span className="status-item file-name" title={path ?? ""}>
        {name}
      </span>
      <span className="spacer" />
      <span className="status-item">{wordCount} 字</span>
    </div>
  );
}
