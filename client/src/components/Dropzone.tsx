import { useRef, useState, type DragEvent } from "react";

export function Dropzone({
  accept,
  label,
  onFile,
  disabled,
}: {
  accept?: string;
  label: string;
  onFile: (file: File) => unknown;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inactive = disabled || busy;

  async function handleFile(file: File) {
    setBusy(true);
    try {
      await onFile(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`dropzone${dragOver ? " dropzone-active" : ""}${inactive ? " dropzone-disabled" : ""}`}
      role="button"
      tabIndex={inactive ? -1 : 0}
      onClick={() => !inactive && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!inactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!inactive) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        if (inactive) return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          e.target.value = "";
        }}
      />
      <span className="dropzone-text">{busy ? "Wird hochgeladen…" : label}</span>
    </div>
  );
}
