import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

interface ToolbarProps {
  editor: Editor;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onInsertImage: () => void;
  onLink: () => void;
}

function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={active ? "toolbar-btn active" : "toolbar-btn"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Toolbar({
  editor,
  onOpen,
  onSave,
  onSaveAs,
  onInsertImage,
  onLink,
}: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      codeBlock: e.isActive("codeBlock"),
      blockquote: e.isActive("blockquote"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      link: e.isActive("link"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  return (
    <div className="toolbar">
      <Btn title="打开 (Ctrl+O)" onClick={onOpen}>
        打开
      </Btn>
      <Btn title="保存 (Ctrl+S)" onClick={onSave}>
        保存
      </Btn>
      <Btn title="另存为" onClick={onSaveAs}>
        另存为
      </Btn>
      <span className="divider" />
      <Btn title="撤销 (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        ⟲
      </Btn>
      <Btn title="重做 (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        ⟳
      </Btn>
      <span className="divider" />
      <Btn title="标题 1" active={state.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn title="标题 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn title="标题 3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <span className="divider" />
      <Btn title="粗体 (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </Btn>
      <Btn title="斜体 (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </Btn>
      <Btn title="下划线 (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <Btn title="删除线" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Btn>
      <Btn title="行内代码" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
        {"</>"}
      </Btn>
      <span className="divider" />
      <Btn title="无序列表" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •
      </Btn>
      <Btn title="有序列表" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </Btn>
      <Btn title="引用块" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </Btn>
      <Btn title="代码块" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {"{ }"}
      </Btn>
      <Btn title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        —
      </Btn>
      <span className="divider" />
      <Btn title="链接" active={state.link} onClick={onLink}>
        🔗
      </Btn>
      <Btn title="插入图片" onClick={onInsertImage}>
        🖼
      </Btn>
    </div>
  );
}
