import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const EMPLOYEE_ATTENDANCE_COLLECTION = "employeeAttendance";
export const SALES_CATEGORIES = [
  { key: "phones", label: "Phones" },
  { key: "laptops", label: "Laptops" },
  { key: "audios", label: "Audios" },
];

function normalizeRole(role) {
  return String(role || "customer").trim().toLowerCase();
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateLabel(value, includeYear = true) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

export function formatStatus(status) {
  return (status || "").charAt(0).toUpperCase() + (status || "").slice(1);
}

export function normalizeSalesByCategory(value) {
  return SALES_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = Math.max(0, Number(value?.[category.key]) || 0);
    return acc;
  }, {});
}

export function getSalesTotal(record) {
  const salesByCategory = normalizeSalesByCategory(record?.salesByCategory);
  return Object.values(salesByCategory).reduce((sum, count) => sum + count, 0);
}

export function summarizeSales(record) {
  const salesByCategory = normalizeSalesByCategory(record?.salesByCategory);
  return SALES_CATEGORIES.map((category) => `${category.label}: ${salesByCategory[category.key]}`).join(" | ");
}

export function normalizeAttendanceRecord(record) {
  const salesByCategory = normalizeSalesByCategory(record.salesByCategory);
  return {
    ...record,
    salesByCategory,
    salesCount: Number(record.salesCount) || getSalesTotal({ salesByCategory }),
  };
}

export async function getUserRole(uid) {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      return normalizeRole(userSnap.data().role);
    }
  } catch (error) {
    if (error?.code !== "permission-denied") {
      throw error;
    }
  }

  try {
    const customerSnap = await getDoc(doc(db, "customers", uid));
    if (customerSnap.exists()) {
      return normalizeRole(customerSnap.data().role);
    }
  } catch (error) {
    if (error?.code !== "permission-denied") {
      throw error;
    }
  }

  return "customer";
}
