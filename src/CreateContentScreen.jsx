// CreateContentScreen.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db, storage, auth } from "./lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/** Reused Field label wrapper (same as EditContentScreen) */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/** Helpers (subset aligned with EditContentScreen for consistent UI copy) */
function isImageFile(file) {
  return (file?.type || "").startsWith("image/");
}
function isPdfFile(file) {
  return (
    (file?.type || "") === "application/pdf" || /\.pdf$/i.test(file?.name || "")
  );
}

/** Inline file dropzone (copied/adapted to mirror EditContentScreen UX) */
function InlineFileDropzone({
  selectedFile, // File | null
  onPick, // (file: File) => void
  accept = "application/pdf,image/*",
  maxBytes = 16 * 1024 * 1024,
  triggerRef, // ref to expose a .click() trigger
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

  const inner = (() => {
    if (selectedFile) {
      const img = isImageFile(selectedFile);
      return (
        <div className="flex items-center gap-3 px-4">
          {img ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="h-16 w-16 object-contain rounded border border-gray-200 bg-white"
            />
          ) : (
            <div className="h-16 w-16 grid place-items-center rounded border border-gray-200 bg-white text-gray-500">
              PDF
            </div>
          )}
          <div className="text-sm">
            <div className="font-medium text-gray-800 truncate max-w-[220px]">
              {selectedFile.name}
            </div>
            <div className="text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-600 text-center px-4">
        <div className="font-medium text-gray-700">Upload a PDF or image</div>
        <div className="text-gray-500">
          Click to choose or drag & drop (Max 16MB)
        </div>
      </div>
    );
  })();

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
        title="Click to upload or drag & drop"
      >
        {inner}
      </div>
    </div>
  );
}

export default function CreateContentScreen() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  // Mirror EditContentScreen shape for consistency
  const [form, setForm] = useState({
    name: "",
    kind: "embed", // "embed" | "file" (default to embed to match edit UI ordering)
    embedUrl: "",
    newFile: null, // File chosen for upload when kind === "file"
  });

  const openPickerRef = useRef(null);
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in");
        return;
      }

      const name = (form.name || "").trim();
      if (!name) {
        alert("Please enter a name");
        return;
      }

      // Prepare base doc first to reserve an ID for storage path
      const colRef = collection(db, "hubs", hubId, "content");
      const docRef = doc(colRef);
      const contentId = docRef.id;

      const base = {
        name,
        kind: form.kind,
        embedUrl: form.kind === "embed" ? (form.embedUrl || "").trim() : null,
        fileUrl: null,
        position: Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Validation per type
      if (form.kind === "embed") {
        if (!base.embedUrl) {
          alert("Please enter an embed URL");
          return;
        }
        await setDoc(docRef, base);
        navigate(`/admin/hubs/${hubId}/content`);
        return;
      }

      // kind === "file"
      const f = form.newFile;
      if (!f) {
        alert("Please choose a file to upload");
        return;
      }
      if (!(isPdfFile(f) || isImageFile(f))) {
        alert("Please upload a PDF or image file.");
        return;
      }

      // Create doc first (so content exists even while uploading)
      await setDoc(docRef, base);

      // Upload to a stable path using the reserved contentId
      const path = `hubs/${hubId}/content/${contentId}/${f.name}`;
      const fileRef = ref(storage, path);
      const metadata = {
        contentType: f.type || (isPdfFile(f) ? "application/pdf" : undefined),
      };

      const task = uploadBytesResumable(fileRef, f, metadata);
      await new Promise((resolve, reject) => {
        task.on("state_changed", null, reject, resolve);
      });

      const fileUrl = await getDownloadURL(fileRef);

      await updateDoc(docRef, {
        fileUrl,
        updatedAt: serverTimestamp(),
      });

      navigate(`/admin/hubs/${hubId}/content`);
    } catch (e) {
      console.error(e);
      alert("Failed to add content");
    }
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Add content"
            action={{ label: "Save content", onClick: save }}
          />

          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
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
                  <option value="embed">Embed</option>
                  <option value="file">File</option>
                </select>
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
