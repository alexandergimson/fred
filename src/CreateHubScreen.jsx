import { useEffect, useRef, useState } from "react";
import HubScreenHeader from "./HubScreenHeader";
import { useNavigate } from "react-router-dom";
import ThemePreview from "./ThemePreview";

import { db, storage, auth } from "./lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/* shared theme bits */
import ColorInput from "./theme/ColorInput";
import BgField from "./theme/BgField";
import { defaultProspectTheme } from "./theme/defaults";

/* ---------- small UI helpers ---------- */
function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF] ${
        props.className || ""
      }`}
    />
  );
}

/* ---------- helpers (inline dropzone bits) ---------- */
function isImageFile(file) {
  return (file?.type || "").startsWith("image/");
}

/** Inline image-only dropzone (max 8MB) */
function InlineImageDropzone({
  selectedFile, // File | null
  onPick, // (file: File) => void
  accept = "image/*",
  maxBytes = 8 * 1024 * 1024,
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
    if (!isImageFile(file)) {
      alert("Please pick an image file (PNG, JPG, SVG, or WebP).");
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
      return (
        <div className="flex items-center gap-3 px-4">
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Logo preview"
            className="h-14 object-contain"
          />
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
        <div className="font-medium text-gray-700">Upload a logo</div>
        <div className="text-gray-500">
          Click to choose or drag & drop (PNG, JPG, SVG, WebP — Max 8MB)
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
            : "border-gray-300 bg-white",
          "cursor-pointer",
        ].join(" ")}
        title="Click to upload or drag & drop"
      >
        {inner}
      </div>
    </div>
  );
}

/* ---------- main ---------- */
export default function CreateHubScreen() {
  const [form, setForm] = useState({
    name: "",
    contactLink: "",
    prospectTheme: defaultProspectTheme,
    logo: null, // { file, url }
  });

  const openPickerRef = useRef(null);
  const navigate = useNavigate();

  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts.at(-1)] = value;
      return next;
    });
  };

  const save = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Please sign in");

      // 1) Create the hub (no logo yet)
      const basePayload = {
        name: (form.name || "").trim(),
        contactLink: (form.contactLink || "").trim() || null,
        prospectTheme: form.prospectTheme,
        logoUrl: null,
        ownerId: user.uid,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const hubsCol = collection(db, "hubs");
      const docRef = await addDoc(hubsCol, basePayload);

      // 2) Upload logo if selected
      if (form.logo?.file) {
        const path = `hubs/${docRef.id}/logo/${form.logo.file.name}`;
        const fileRef = ref(storage, path);
        const metadata = { contentType: form.logo.file.type || "image/png" };
        const task = uploadBytesResumable(fileRef, form.logo.file, metadata);
        await new Promise((res, rej) =>
          task.on("state_changed", null, rej, res)
        );
        const logoUrl = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "hubs", docRef.id), {
          logoUrl,
          updatedAt: serverTimestamp(),
        });
      }

      // 3) Go to content list
      navigate(`/admin/hubs/${docRef.id}/content`);
    } catch (e) {
      console.error(e);
      alert("Failed to save hub");
    }
  };

  const previewFile =
    form.logo && typeof form.logo === "object" ? form.logo.file : null;

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="New Hub"
            action={{ label: "Save hub", onClick: save }}
          />

          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className="space-y-10 max-w-screen-2xl mx-auto">
              {/* Top row: left inputs, right inline logo upload */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="lg:col-span-1 grid grid-cols-1 gap-4">
                  <Field label="Hub Name" required>
                    <TextInput
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Coca-Cola"
                    />
                  </Field>
                  <Field label="Contact Us link">
                    <TextInput
                      type="url"
                      value={form.contactLink || ""}
                      onChange={(e) => update("contactLink", e.target.value)}
                      placeholder="https://example.com/contact"
                    />
                  </Field>
                </div>

                {/* Right: inline logo dropzone + controls */}
                <div className="lg:col-span-1">
                  <div className="mb-2 text-sm text-gray-600">Logo</div>

                  <InlineImageDropzone
                    selectedFile={previewFile}
                    onPick={(file) =>
                      update("logo", { file, url: URL.createObjectURL(file) })
                    }
                    accept="image/*"
                    maxBytes={8 * 1024 * 1024}
                    triggerRef={openPickerRef}
                  />

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      className="UserPrimaryCta w-auto px-4"
                      onClick={() => openPickerRef.current?.()}
                    >
                      {previewFile ? "Choose another…" : "Upload…"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
