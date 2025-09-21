// SidebarUserFooter.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import ChevronUp from "./icons/ChevronUp";
import ChevronDown from "./icons/ChevronDown";

function initialsFromEmail(email = "") {
  const base = email.split("@")[0] || "";
  const parts = base
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(" ");
  const i1 = parts[0]?.[0] || "";
  const i2 = parts[1]?.[0] || "";
  return (i1 + i2).toUpperCase() || (email[0] || "?").toUpperCase();
}

export default function SidebarUserFooter() {
  const nav = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  // Wrap trigger + menu so we can anchor/animate from that point
  const popoverRef = useRef(null);

  // Auth state
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => setAuthUser(u));
  }, []);

  // Live profile doc
  useEffect(() => {
    if (!authUser?.uid) return;
    const unsub = onSnapshot(doc(db, "profiles", authUser.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
    });
    return () => unsub && unsub();
  }, [authUser?.uid]);

  // Close on outside click / Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (popoverRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const name = useMemo(
    () => profile?.name || authUser?.displayName || "",
    [profile, authUser]
  );
  const email = authUser?.email || "";
  const avatarSrc = profile?.photoDataUrl || authUser?.photoURL || null;

  async function handleSignOut() {
    try {
      await signOut(getAuth());
      setOpen(false);
      nav("/login");
    } catch (e) {
      console.error(e);
      alert("Failed to sign out");
    }
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-200">
      <div className="relative flex items-end justify-between">
        {/* Left cluster: avatar, text, trigger */}
        <div className="flex flex-row items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-gray-100 ring-1 ring-gray-200 overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Your avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm font-medium">
                {initialsFromEmail(email)}
              </div>
            )}
          </div>

          <div className="text-left">
            <div className="text-sm font-semibold text-gray-900 leading-tight">
              {name || "Your name"}
            </div>
            <div className="text-xs text-gray-500 leading-tight max-w-[180px] truncate">
              {email || "you@example.com"}
            </div>
          </div>

          {/* Trigger + Menu are wrapped to anchor the popup to the button */}
          <div ref={popoverRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls="account-menu"
              onClick={() => setOpen((v) => !v)}
              className="flex flex-col items-center justify-center gap-0.5 w-9 h-14 rounded-xl text-gray-700 hover:opacity-90 cursor-pointer"
              title="Account menu"
            >
              <ChevronUp
                className={`w-4 h-4 transition-transform ${
                  open ? "-translate-y-0.5" : "translate-y-0"
                }`}
              />
              <ChevronDown
                className={`w-4 h-4 -mt-1 transition-transform ${
                  open ? "translate-y-0.5" : "translate-y-0"
                }`}
              />
            </button>

            {/* Dropdown: anchored to button, expands from bottom-right, upwards */}
            <div
              id="account-menu"
              role="menu"
              aria-hidden={!open}
              className={[
                // positioning: attach to bottom-right of trigger
                "absolute right-0 bottom-full mb-2 w-48",
                // box + background
                "rounded-xl border border-gray-200 bg-white py-2 shadow-lg",
                // animation/morph: scale on Y from bottom-right (upwards), tiny X easing too
                "origin-bottom-right transform-gpu",
                "transition-[opacity,transform] duration-1000 ease-out",
                open
                  ? "opacity-100 scale-y-100 scale-x-100"
                  : "opacity-0 scale-y-0 scale-x-95 pointer-events-none",
              ].join(" ")}
            >
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  nav("/admin/profile");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                Profile settings
              </button>
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        {/* /Left cluster */}
      </div>
    </div>
  );
}
