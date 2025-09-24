// ProfileScreen.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { db } from "./lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");

  const uid = getAuth()?.currentUser?.uid || "me"; // fallback if auth not wired yet
  const docRef = doc(db, "profiles", uid);

  // Load existing profile
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(docRef);
        if (active && snap.exists()) {
          const d = snap.data();
          setPhotoDataUrl(d.photoDataUrl || "");
          setName(d.name || "");
          setTitle(d.title || "");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line

  function onChoosePhoto() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  }

  async function onSave(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        docRef,
        {
          name: name.trim(),
          title: title.trim(),
          photoDataUrl: photoDataUrl || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      navigate(-1); // back to previous screen
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader title="Your profile" />

          <form
            onSubmit={onSave}
            className="flex-1 min-h-0 overflow-auto px-6 pb-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              {/* Photo column */}
              <div className="flex flex-col items-start">
                <label className="text-sm font-medium text-gray-700 mb-3">
                  Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="h-28 w-28 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                    {photoDataUrl ? (
                      <img
                        src={photoDataUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onChoosePhoto}
                      className="px-4 h-10 rounded-full bg-background text-gray-700 hover:opacity-90 text-sm font-medium"
                    >
                      Change photo
                    </button>
                    {photoDataUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoDataUrl("")}
                        className="px-4 h-10 rounded-full bg-background text-gray-500 hover:opacity-90 text-sm"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <p className="text-xs text-gray-500">
                      JPG or PNG. Square images look best.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F50AF]/30 focus:border-[#1F50AF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product Designer"
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F50AF]/30 focus:border-[#1F50AF]"
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 h-10 rounded-full bg-background text-gray-700 hover:opacity-90 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 h-10 rounded-full bg-[#1F50AF] text-white hover:opacity-90 text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
