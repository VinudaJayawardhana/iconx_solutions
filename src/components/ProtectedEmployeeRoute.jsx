import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getUserAccess } from "../utils/userAccess";

const ADMIN_PORTAL_SESSION_KEY = "iconx_admin_portal_verified";

export default function ProtectedEmployeeRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("blocked");
        return;
      }

      try {
        const { role, accessStatus } = await getUserAccess(user.uid);
        const verified = sessionStorage.getItem(ADMIN_PORTAL_SESSION_KEY) === "true";
        setStatus(
          (role === "admin" || (role === "employee" && accessStatus === "approved")) && verified ? "allowed" : "blocked"
        );
      } catch {
        setStatus("blocked");
      }
    });

    return unsub;
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "blocked") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
