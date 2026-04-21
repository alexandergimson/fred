import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import SaveIcon from "./icons/SaveIcon";
import {
  createEmbedAsset,
  createFileAsset,
  isImageFile,
  isPdfFile,
} from "./lib/assets";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function InlineFileDropzone({
  selectedFile,
  onPick,
  accept = "application/pdf,image/*",
  maxBytes = 16 * 1024 * 1024,
  triggerRef,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!triggerRef) return;
    triggerRef.current = () => inputRef.current?.click();
  }, [triggerRef]);

  function validate(file) {
    if (!file) return false;
    const okType = isPdfFile(file) || isImageFile(file);
    if (!okType) {
      alert("Please pick a PDF or image file.");
      return false;
    }
    if (file.size > maxBytes) {
      alert(`File too large. Max ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return false;
    }
    return true;
  }

  function handleFile(file) {
    if (!file) return;
    if (!validate(file)) return;
    onPick?.(file);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          handleFile(f);
        }}
        className={[
          "flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          dragOver
            ? "border-[#1F50AF] bg-[#1F50AF]/5"
            : "border-gray-300 bg-gray-50",
          "cursor-pointer",
        ].join(" ")}
      >
        {selectedFile ? (
          <div className="text-center px-4">
            <div className="font-medium text-gray-800">{selectedFile.name}</div>
            <div className="text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 text-center px-4">
            <div className="font-medium text-gray-700">
              Upload a PDF or image
            </div>
            <div className="text-gray-500">
              Click to choose or drag & drop (Max 16MB)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateAssetScreen() {
  const navigate = useNavigate();
  const openPickerRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    kind: "file",
    embedUrl: "",
    newFile: null,
    tags: "",
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      const tags = (form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (!(form.name || "").trim()) {
        alert("Please enter a name");
        return;
      }

      if (form.kind === "embed") {
        if (!(form.embedUrl || "").trim()) {
          alert("Please enter an embed URL");
          return;
        }

        await createEmbedAsset({
          name: form.name,
          embedUrl: form.embedUrl,
          tags,
        });

        navigate("/admin/library");
        return;
      }

      if (!form.newFile) {
        alert("Please choose a file to upload");
        return;
      }

      await createFileAsset({
        name: form.name,
        file: form.newFile,
        tags,
      });

      navigate("/admin/library");
    } catch (e) {
      console.error(e);
      alert("Failed to create asset");
    }
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Upload content"
            action={{
              label: "Save asset",
              onClick: save,
              icon: <SaveIcon className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto ml-8 mr-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <Field label="Name">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>

              <Field label="Type">
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.kind}
                  onChange={(e) => update({ kind: e.target.value })}
                >
                  <option value="file">File</option>
                  <option value="embed">Embed</option>
                </select>
              </Field>

              <Field label="Tags (comma separated)">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.tags}
                  onChange={(e) => update({ tags: e.target.value })}
                />
              </Field>

              {form.kind === "embed" ? (
                <Field label="Embed URL">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.embedUrl}
                    onChange={(e) => update({ embedUrl: e.target.value })}
                  />
                </Field>
              ) : (
                <>
                  <InlineFileDropzone
                    selectedFile={form.newFile}
                    onPick={(file) => update({ newFile: file })}
                    accept="application/pdf,image/*"
                    maxBytes={16 * 1024 * 1024}
                    triggerRef={openPickerRef}
                  />

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      className="UserPrimaryCta w-auto px-4"
                      onClick={() => openPickerRef.current?.()}
                    >
                      {form.newFile ? "Choose another…" : "Upload…"}
                    </button>

                    {form.newFile && (
                      <button
                        type="button"
                        className="UserIconBtn w-auto px-3"
                        onClick={() => update({ newFile: null })}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
