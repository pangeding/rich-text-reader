use serde::Serialize;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
struct OpenResult {
    path: String,
    content: String,
}

#[derive(Serialize)]
struct ImportImageResult {
    /// 相对 markdown 文档的路径，如 assets/foo.png
    relative_path: String,
    file_name: String,
}

/// 打开 Markdown 文档：弹窗选文件并读取内容。
#[tauri::command]
async fn open_document(app: tauri::AppHandle) -> Result<OpenResult, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_file();
    let Some(file) = file else {
        return Err("cancelled".into());
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(OpenResult {
        path: path.display().to_string(),
        content,
    })
}

/// 保存文档。path 为空时弹「另存为」对话框。
/// 返回最终保存的路径。
#[tauri::command]
async fn save_document(
    app: tauri::AppHandle,
    path: Option<String>,
    content: String,
) -> Result<String, String> {
    let target = match path {
        Some(p) => std::path::PathBuf::from(p),
        None => {
            let file = app
                .dialog()
                .file()
                .add_filter("Markdown", &["md", "markdown"])
                .set_file_name("untitled.md")
                .blocking_save_file();
            let Some(fp) = file else {
                return Err("cancelled".into());
            };
            let mut p = fp.into_path().map_err(|e| e.to_string())?;
            if p.extension().is_none() {
                p.set_extension("md");
            }
            p
        }
    };
    std::fs::write(&target, content).map_err(|e| e.to_string())?;
    Ok(target.display().to_string())
}

/// 选择一张本地图片并复制到文档同目录的 assets/ 下。
/// 返回相对路径用于写入 markdown，保证文档文件夹自包含。
#[tauri::command]
async fn import_image(
    app: tauri::AppHandle,
    document_path: String,
) -> Result<ImportImageResult, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"])
        .blocking_pick_file();
    let Some(src) = file else {
        return Err("cancelled".into());
    };
    let src = src.into_path().map_err(|e| e.to_string())?;

    let doc = Path::new(&document_path);
    let assets_dir = doc
        .parent()
        .ok_or_else(|| "无效的文档路径".to_string())?
        .join("assets");
    std::fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;

    let file_name = src
        .file_name()
        .ok_or_else(|| "无效的文件名".to_string())?;
    let dest = assets_dir.join(file_name);
    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;

    Ok(ImportImageResult {
        relative_path: format!("assets/{}", file_name.to_string_lossy()),
        file_name: file_name.to_string_lossy().to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_document,
            save_document,
            import_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
