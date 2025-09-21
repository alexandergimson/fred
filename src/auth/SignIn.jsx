import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // NEW
import { auth } from "../lib/firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // NEW

  async function sendLink(e) {
    e.preventDefault();
    setError("");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/signin`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send link");
    }
  }

  async function completeIfLink() {
    setError("");
    try {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let e = window.localStorage.getItem("emailForSignIn") || email;
        if (!e) {
          setError("Enter your email to complete sign-in.");
          return;
        }
        await signInWithEmailLink(auth, e, window.location.href);

        // clean up
        window.localStorage.removeItem("emailForSignIn");

        // ✅ redirect after successful email link sign-in
        navigate("/admin/hubs", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Failed to sign in");
    }
  }

  async function google() {
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // ✅ redirect after successful Google sign-in
      navigate("/admin/hubs", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    }
  }

  // ✅ Auto-complete if landed from the email link (run once on mount)
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      void completeIfLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-[#1F50AF]">Sign in</h1>
        <form onSubmit={sendLink} className="space-y-3">
          <label className="block text-sm text-gray-600">Email</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
          <button className="w-full h-10 rounded-lg bg-[#1F50AF] text-white hover:bg-[#17408b]">
            Send magic link
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">or</div>

        <button
          onClick={google}
          className="w-full h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        {sent && (
          <div className="text-sm text-green-700">
            Link sent! Check your inbox and open it on this device.
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </main>
  );
}
