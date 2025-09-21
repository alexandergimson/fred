// CreateContentScreen.jsx
import { useState } from "react";
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function CreateContentScreen() {
  const { hubId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    kind: "file", // default to PDF flow
    embedUrl: "",
    file: null,
  });
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in");
        return;
      }

      if (!form.name.trim()) {
        alert("Please enter a name");
        return;
      }
      if (form.kind === "embed" && !form.embedUrl.trim()) {
        alert("Please enter an embed URL");
        return;
      }
      if (form.kind === "file" && !form.file) {
        alert("Please choose a file");
        return;
      }
      if (
        form.kind === "file" &&
        form.file &&
        !(/\.pdf$/i.test(form.file.name) || /pdf/i.test(form.file.type || ""))
      ) {
        alert("Please upload a PDF file (.pdf)");
        return;
      }

      // 1) Create a doc FIRST to reserve a stable id for the storage path
      const colRef = collection(db, "hubs", hubId, "content");
      const docRef = doc(colRef); // generates id without writing yet
      const contentId = docRef.id;

      const base = {
        name: form.name.trim(),
        kind: form.kind, // "file" | "embed"
        embedUrl: form.kind === "embed" ? form.embedUrl.trim() : null,
        fileUrl: null,
        position: Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, base);

      // 2) If it's an embed, we’re done
      if (form.kind === "embed") {
        navigate(`/admin/hubs/${hubId}/content`);
        return;
      }

      // 3) Upload the PDF under the docId folder
      const filename = form.file.name;
      const path = `hubs/${hubId}/content/${contentId}/${filename}`;
      const fileRef = ref(storage, path);
      const metadata = { contentType: form.file.type || "application/pdf" };

      const task = uploadBytesResumable(fileRef, form.file, metadata);
      await new Promise((resolve, reject) => {
        task.on("state_changed", null, reject, resolve);
      });

      const fileUrl = await getDownloadURL(fileRef);

      // 4) Update the same doc with the fileUrl
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
                  <option value="file">File (PDF)</option>
                  <option value="embed">Embed (YouTube, Vimeo…)</option>
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
                <Field label="Upload PDF">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) =>
                      update({ file: e.target.files?.[0] || null })
                    }
                    className="text-sm"
                  />
                </Field>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
