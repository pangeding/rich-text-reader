import { useState } from "react";

interface LinkModalProps {
  open: boolean;
  initialUrl: string;
  onCancel: () => void;
  onConfirm: (url: string) => void;
}

export default function LinkModal({ open, initialUrl, onCancel, onConfirm }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);

  if (!open) return null;

  return (
    <div className="modal-mask" onMouseDown={onCancel}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm(url.trim());
          if (e.key === "Escape") onCancel();
        }}
      >
        <h3>编辑链接</h3>
        <input
          autoFocus
          value={url}
          placeholder="https://example.com"
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={onCancel}>取消</button>
          <button className="primary" onClick={() => onConfirm(url.trim())}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
