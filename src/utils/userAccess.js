import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function normalizeRole(role) {
  return String(role || "customer").trim().toLowerCase();
}

export function normalizeAccessStatus(status, role = "customer") {
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedRole === "employee") {
    if (normalizedStatus === "approved" || normalizedStatus === "rejected" || normalizedStatus === "pending") {
      return normalizedStatus;
    }
    return "pending";
  }

  return normalizedStatus || "active";
}

export async function getUserAccess(uid) {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      const role = normalizeRole(data.role);
      return {
        source: "users",
        role,
        accessStatus: normalizeAccessStatus(data.accessStatus || data.status, role),
        profile: data,
      };
    }
  } catch (error) {
    if (error?.code !== "permission-denied") {
      throw error;
    }
  }

  try {
    const customerSnap = await getDoc(doc(db, "customers", uid));
    if (customerSnap.exists()) {
      const data = customerSnap.data();
      const role = normalizeRole(data.role);
      return {
        source: "customers",
        role,
        accessStatus: normalizeAccessStatus(data.accessStatus || data.status, role),
        profile: data,
      };
    }
  } catch (error) {
    if (error?.code !== "permission-denied") {
      throw error;
    }
  }

  return {
    source: "fallback",
    role: "customer",
    accessStatus: "active",
    profile: null,
  };
}
