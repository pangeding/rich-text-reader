export type UnsavedChoice = "save" | "discard" | "cancel";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onChoice: (choice: UnsavedChoice) => void;
}

export default function ConfirmDialog({ open, message, onChoice }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-mask" onMouseDown={() => onChoice("cancel")}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="未保存的修改"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChoice("cancel");
        }}
      >
        <h3>未保存的修改</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={() => onChoice("cancel")}>取消</button>
          <button className="danger" onClick={() => onChoice("discard")}>
            不保存
          </button>
          <button className="primary" autoFocus onClick={() => onChoice("save")}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
