import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const DEFAULT_ADMIN_PORTAL_CODE = "Admin1234";
export const PORTAL_SETTINGS_COLLECTION = "systemSettings";
export const PORTAL_SETTINGS_DOC = "portalSecurity";

export async function getPortalSecuritySettings() {
  try {
    const snapshot = await getDoc(doc(db, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC));
    if (!snapshot.exists()) {
      return {
        adminCode: DEFAULT_ADMIN_PORTAL_CODE,
      };
    }

    const data = snapshot.data();
    return {
      adminCode: String(data.adminCode || DEFAULT_ADMIN_PORTAL_CODE),
    };
  } catch (error) {
    if (error?.code === "permission-denied") {
      return {
        adminCode: DEFAULT_ADMIN_PORTAL_CODE,
      };
    }
    throw error;
  }
}

export function generateEmployeePortalCode(seed = "") {
  const sanitizedSeed = String(seed || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EMP-${sanitizedSeed}-${randomPart}`;
}
