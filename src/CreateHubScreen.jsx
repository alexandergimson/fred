import { useEffect, useRef, useState } from "react";
import HubScreenHeader from "./HubScreenHeader";
import { useNavigate } from "react-router-dom";

import { db, storage, auth } from "./lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import SaveIcon from "./icons/SaveIcon";
import {
  AdminPage,
  AdminPageContent,
  AdminPageHeader,
} from "./components/admin/AdminPage";
import { FormField, TextInput } from "./components/admin/FormControls";
import SettingsCard from "./components/admin/SettingsCard";
import { defaultProspectTheme } from "./theme/defaults";

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
            className="h-14 max-w-[180px] object-contain"
          />
          <div className="text-sm">
            <div className="max-w-[220px] truncate font-medium text-gray-900">
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
      <div className="px-4 text-center text-sm text-gray-500">
        <div className="font-medium text-gray-900">Upload a logo</div>
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
          "flex h-40 w-full cursor-pointer items-center justify-center rounded-md border border-dashed transition-colors",
          dragOver
            ? "border-[#1F50AF] bg-background"
            : "border-gray-300 bg-gray-50",
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
    <AdminPage>
      <AdminPageHeader>
        <HubScreenHeader
          title="New Hub"
          action={{
            label: "Save hub",
            onClick: save,
            icon: <SaveIcon className="h-5 w-5" />,
          }}
        />
      </AdminPageHeader>

      <AdminPageContent>
        <div className="mx-auto grid max-w-[1450px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <SettingsCard
            id="hub-details"
            title="Hub details"
            description="Name the hub and add the contact destination prospects can use."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Hub name" required>
                <TextInput
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Coca-Cola"
                />
              </FormField>

              <FormField label="Contact Us link">
                <TextInput
                  type="url"
                  value={form.contactLink || ""}
                  onChange={(e) => update("contactLink", e.target.value)}
                  placeholder="https://example.com/contact"
                />
              </FormField>
            </div>
          </SettingsCard>

          <SettingsCard
            id="branding"
            title="Branding"
            description="Upload a logo to show in the prospect experience and hub list."
          >
            <InlineImageDropzone
              selectedFile={previewFile}
              onPick={(file) =>
                update("logo", { file, url: URL.createObjectURL(file) })
              }
              accept="image/*"
              maxBytes={8 * 1024 * 1024}
              triggerRef={openPickerRef}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="h-10 transform-gpu cursor-pointer rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md"
                onClick={() => openPickerRef.current?.()}
              >
                {previewFile ? "Choose another" : "Upload logo"}
              </button>

              {previewFile ? (
                <button
                  type="button"
                  className="h-10 transform-gpu cursor-pointer rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:bg-red-50 hover:shadow-md"
                  onClick={() => update("logo", null)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </SettingsCard>
        </div>
      </AdminPageContent>
    </AdminPage>
  );
}
