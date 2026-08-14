import { useCallback, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { invoke } from "@tauri-apps/api/core";
import { RichImage, imageBaseDir } from "./extensions/image";
import Toolbar from "./components/Toolbar";
import StatusBar from "./components/StatusBar";
import LinkModal from "./components/LinkModal";
import "./App.css";

interface OpenResult {
  path: string;
  content: string;
}
interface ImportImageResult {
  relative_path: string;
  file_name: string;
}

function dirname(p: string) {
  const idx = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return idx === -1 ? "" : p.slice(0, idx);
}

const WELCOME = `# 我的富文本编辑器

这是一个基于 **Tauri + TipTap** 的 Markdown 富文本编辑器。

支持标题、列表、引用、代码块、链接与图片，以 Markdown 格式保存到本地文件。

> 提示：点击工具栏「打开 / 保存」，或使用 Ctrl+O / Ctrl+S 快捷键。`;

function App() {
  const [docPath, setDocPath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [linkModal, setLinkModal] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });

  const suppressDirty = useRef(false);
  const docPathRef = useRef<string | null>(null);
  docPathRef.current = docPath;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Markdown,
      RichImage,
      Placeholder.configure({ placeholder: "开始输入…" }),
    ],
    content: WELCOME,
    contentType: "markdown",
    autofocus: false,
    onUpdate: ({ editor: e }) => {
      setWordCount(e.getText().replace(/\s/g, "").length);
      if (!suppressDirty.current) setDirty(true);
    },
  });

  const setDocument = useCallback((path: string) => {
    docPathRef.current = path;
    imageBaseDir.current = dirname(path);
    setDocPath(path);
    setDirty(false);
  }, []);

  const handleOpen = useCallback(async () => {
    try {
      const res = await invoke<OpenResult>("open_document");
      if (!editor) return;
      suppressDirty.current = true;
      editor.commands.setContent(res.content, { contentType: "markdown" });
      suppressDirty.current = false;
      setDocument(res.path);
      setWordCount(editor.getText().replace(/\s/g, "").length);
    } catch (e) {
      if (e !== "cancelled") setBanner(String(e));
    }
  }, [editor, setDocument]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    try {
      const savedPath = await invoke<string>("save_document", {
        path: docPathRef.current,
        content: editor.getMarkdown(),
      });
      setDocument(savedPath);
    } catch (e) {
      if (e !== "cancelled") setBanner(String(e));
    }
  }, [editor, setDocument]);

  const handleSaveAs = useCallback(async () => {
    if (!editor) return;
    try {
      const savedPath = await invoke<string>("save_document", {
        path: null,
        content: editor.getMarkdown(),
      });
      setDocument(savedPath);
    } catch (e) {
      if (e !== "cancelled") setBanner(String(e));
    }
  }, [editor, setDocument]);

  const handleInsertImage = useCallback(async () => {
    if (!docPathRef.current) {
      setBanner("请先保存文档，再插入图片（图片会复制到文档旁的 assets/ 目录）");
      return;
    }
    try {
      const res = await invoke<ImportImageResult>("import_image", {
        documentPath: docPathRef.current,
      });
      editor
        ?.chain()
        .focus()
        .setImage({ src: res.relative_path, alt: res.file_name })
        .run();
      setDirty(true);
    } catch (e) {
      if (e !== "cancelled") setBanner(String(e));
    }
  }, [editor]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    const current = typeof attrs.href === "string" ? attrs.href : "";
    setLinkModal({ open: true, url: current });
  }, [editor]);

  const applyLink = useCallback(
    (url: string) => {
      setLinkModal({ open: false, url: "" });
      if (!editor) return;
      if (url) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      } else {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      }
      setDirty(true);
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="app">
      <Toolbar
        editor={editor}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onInsertImage={handleInsertImage}
        onLink={handleLink}
      />
      {banner && (
        <div className="banner" onClick={() => setBanner(null)}>
          {banner}
        </div>
      )}
      <div className="editor-wrap">
        <EditorContent editor={editor} className="editor" />
      </div>
      <StatusBar path={docPath} dirty={dirty} wordCount={wordCount} />
      <LinkModal
        open={linkModal.open}
        initialUrl={linkModal.url}
        onCancel={() => setLinkModal({ open: false, url: "" })}
        onConfirm={applyLink}
      />
    </div>
  );
}

export default App;
