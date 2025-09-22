// DropzoneModal.jsx
import { useEffect, useRef, useState } from "react";
import UploadIcon from "./icons/UploadIcon"; // adjust path as needed

export default function DropzoneModal({
  open,
  onClose,
  onSelect, // (file) => void
  accept = "*/*",
  maxBytes = 8 * 1024 * 1024, // 8MB
  title = "Upload a file",
  subtitle = "Click to browse or drag & drop",
  helper = "Max size 8MB",
  Icon = UploadIcon, // <— new: allows swapping icon per usage
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setDragging(false);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape" && open) onClose?.();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  function validateAndSend(file) {
    if (!file) return;
    if (file.size > maxBytes) {
      setError(
        `File too large. Max ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.`
      );
      return;
    }
    onSelect?.(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    validateAndSend(f);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[101] w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/10"
      >
        <div className="p-5 border-b border-gray-100">
          <h2 className="TextH2">{title}</h2>
          <p className="TextMuted mt-1">{subtitle}</p>
        </div>

        <div className="p-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              "flex flex-col items-center justify-center w-full h-56 rounded-xl cursor-pointer",
              "bg-gray-50 hover:bg-gray-100",
              "border-2 border-dashed",
              dragging ? "border-primary bg-background" : "border-gray-300",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => validateAndSend(e.target.files?.[0])}
            />

            <div className="flex flex-col items-center justify-center px-6 text-center">
              <Icon className="w-10 h-10 mb-3 text-gray-500" />

              <p className="TextBodySm">
                <span
                  className="TextLink cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    inputRef.current?.click();
                  }}
                >
                  Click to upload
                </span>{" "}
                or drag & drop
              </p>
              <p className="TextCaption mt-1">{helper}</p>

              {error ? (
                <p className="TextCaption mt-3 text-red-600">{error}</p>
              ) : null}
            </div>
          </label>
        </div>

        <div className="p-4 flex justify-end gap-3 border-t border-gray-100">
          <button className="UserIconBtn w-auto px-4" onClick={onClose}>
            Cancel
          </button>
          <button
            className="UserPrimaryCta w-auto px-4"
            onClick={() => inputRef.current?.click()}
          >
            Browse…
          </button>
        </div>
      </div>
    </div>
  );
}
