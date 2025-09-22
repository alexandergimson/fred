// EditContentScreen.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import SaveIcon from "./icons/SaveIcon";
import { db, storage, auth } from "./lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/** Small UI */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/** URL helpers */
function extractPathFromUrl(url) {
  try {
    const afterO = url.split("/o/")[1];
    if (!afterO) return null;
    const encoded = afterO.split("?")[0];
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}
function isImageUrl(url = "") {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
}

/** Inline dropzone that can show current file OR new selection */
function InlineFileDropzone({
  selectedFile,
  currentUrl,
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
    const t = file.type || "";
    const okType = t === "application/pdf" || t.startsWith("image/");
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

  // Nice filename from URL
  function fileNameFromUrl(url = "") {
    try {
      const fromO = extractPathFromUrl(url);
      const raw = fromO
        ? fromO.split("/").pop()
        : new URL(url).pathname.split("/").pop();
      return decodeURIComponent(raw || "file");
    } catch {
      const parts = url.split("?")[0].split("/");
      return decodeURIComponent(parts.pop() || "file");
    }
  }

  const inner = (() => {
    if (selectedFile) {
      const isImg = selectedFile.type?.startsWith("image/");
      return (
        <div className="flex items-center gap-3 px-4">
          {isImg ? (
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
    if (currentUrl) {
      const name = fileNameFromUrl(currentUrl);
      if (isImageUrl(currentUrl)) {
        return (
          <div className="flex items-center gap-3 px-4">
            <img
              src={currentUrl}
              alt="Current file"
              className="h-16 w-16 object-contain rounded border border-gray-200 bg-white"
            />
            <div className="text-sm">
              <div className="font-medium text-gray-800 truncate max-w-[220px]">
                {name}
              </div>
              <div className="text-gray-500">
                Click to replace or drag a new file here
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3 px-4">
          <div className="h-16 w-16 grid place-items-center rounded border border-gray-200 bg-white text-gray-500">
            PDF
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-800 truncate max-w-[260px]">
              {name}
            </div>
            <div className="text-gray-500">
              Click to replace or drag a new file here
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

export default function EditContentScreen() {
  const { hubId, contentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    kind: "embed", // "embed" | "file"
    embedUrl: "",
    fileUrl: null, // current file URL (if kind === "file")
    newFile: null, // File selected to replace
  });

  const openPickerRef = useRef(null);
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId, "content", contentId));
        if (!snap.exists()) {
          alert("Content not found");
          navigate(`/admin/hubs/${hubId}/content`);
          return;
        }
        const d = snap.data();
        setForm({
          name: d.name ?? "",
          kind: d.kind ?? "embed",
          embedUrl: d.embedUrl ?? "",
          fileUrl: d.fileUrl ?? null,
          newFile: null,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId, contentId, navigate]);

  async function save() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in");
        return;
      }

      let fileUrl = form.fileUrl ?? null;

      // If replacing/adding a file, upload with caching + versioned filename
      if (form.kind === "file" && form.newFile) {
        const versionedName = `${Date.now()}-${form.newFile.name}`;
        const path = `hubs/${hubId}/content/${contentId}/${versionedName}`;
        const fileRef = ref(storage, path);
        const metadata = {
          contentType: form.newFile.type || "application/pdf",
          cacheControl: "public,max-age=31536000,immutable",
        };
        const task = uploadBytesResumable(fileRef, form.newFile, metadata);
        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res)
        );
        fileUrl = await getDownloadURL(fileRef);
      }

      // Normalize token-less firebasestorage.app links if present
      if (
        form.kind === "file" &&
        fileUrl &&
        fileUrl.includes("firebasestorage.app")
      ) {
        const p = extractPathFromUrl(fileUrl);
        if (p) fileUrl = await getDownloadURL(ref(storage, p));
      }

      if (form.kind === "embed") fileUrl = null;

      await updateDoc(doc(db, "hubs", hubId, "content", contentId), {
        name: (form.name || "").trim(),
        kind: form.kind,
        embedUrl: form.kind === "embed" ? (form.embedUrl || "").trim() : null,
        fileUrl,
        updatedAt: serverTimestamp(),
      });

      navigate(`/admin/hubs/${hubId}/content`);
    } catch (e) {
      console.error(e);
      alert("Failed to update content");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Edit content"
            action={{
              label: "Save changes",
              onClick: save,
              icon: <SaveIcon className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <Field label="Name">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.name ?? ""}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>

              <Field label="Type">
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
                  value={form.kind ?? "embed"}
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
                    value={form.embedUrl ?? ""}
                    onChange={(e) => update({ embedUrl: e.target.value })}
                  />
                </Field>
              ) : (
                <>
                  {/* Inline dropzone shows current file (if any) or the new selection */}
                  <InlineFileDropzone
                    selectedFile={form.newFile}
                    currentUrl={form.fileUrl}
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
                      {form.newFile
                        ? "Choose another…"
                        : form.fileUrl
                        ? "Replace…"
                        : "Upload…"}
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

                    {form.fileUrl && !form.newFile && (
                      <a
                        href={form.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="TextLink"
                        title="Open current file in a new tab"
                      >
                        Open current
                      </a>
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
