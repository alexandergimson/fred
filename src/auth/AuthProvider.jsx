import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthCtx = createContext({ user: null, loading: true, signOut: () => {} });
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider
      value={{ ...state, signOut: () => signOut(auth) }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
