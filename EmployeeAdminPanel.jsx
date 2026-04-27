import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import AttendanceAdminView from "./AttendanceAdminView";
import AttendanceEmployeeView from "./AttendanceEmployeeView";
import {
  EMPLOYEE_ATTENDANCE_COLLECTION,
  getSalesTotal,
  normalizeAttendanceRecord,
  normalizeSalesByCategory,
} from "./attendanceShared";
import "./EmployeeAdminPanel.css";
import { getUserAccess } from "../../utils/userAccess";

export default function EmployeeAdminPanel() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [role, setRole] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("iconx_employee_theme") || "dark");
  const [authLoading, setAuthLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    localStorage.setItem("iconx_employee_theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { role: nextRole, accessStatus } = await getUserAccess(user.uid);
        if (nextRole !== "admin" && nextRole !== "employee") {
          navigate("/login", { replace: true });
          return;
        }
        if (nextRole === "employee" && accessStatus !== "approved") {
          navigate("/login", { replace: true });
          return;
        }

        setAuthUser(user);
        setRole(nextRole);
      } catch (error) {
        console.error("Failed to load role:", error);
        navigate("/login", { replace: true });
      } finally {
        setAuthLoading(false);
      }
    });

    return unsub;
  }, [navigate]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const nextEmployees = snapshot.docs
          .map((item) => ({ uid: item.id, ...item.data() }))
          .filter((item) => item.role === "employee")
          .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

        setEmployees(nextEmployees);
      },
      (error) => {
        console.error("Failed to load employees:", error);
      }
    );

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, EMPLOYEE_ATTENDANCE_COLLECTION),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => normalizeAttendanceRecord({ id: item.id, ...item.data() }))
          .sort((a, b) => `${b.date || ""}${b.checkIn || ""}`.localeCompare(`${a.date || ""}${a.checkIn || ""}`));

        setAttendance(rows);
      },
      (error) => {
        console.error("Failed to load attendance records:", error);
      }
    );

    return unsub;
  }, []);

  const currentEmployee = useMemo(
    () => employees.find((employee) => employee.uid === authUser?.uid) || null,
    [authUser?.uid, employees]
  );

  const totalSales = attendance.reduce((sum, record) => sum + getSalesTotal(record), 0);

  const saveAttendance = async (payload) => {
    const employee = employees.find((item) => item.uid === payload.employeeUid);
    if (!employee) {
      throw new Error("Employee not found.");
    }

    const nextId = `${payload.employeeUid}_${payload.date}`;
    const salesByCategory = normalizeSalesByCategory(payload.salesByCategory);
    const existingId = payload.id;

    if (existingId && existingId !== nextId) {
      await deleteDoc(doc(db, EMPLOYEE_ATTENDANCE_COLLECTION, existingId));
    }

    await setDoc(
      doc(db, EMPLOYEE_ATTENDANCE_COLLECTION, nextId),
      {
        employeeUid: employee.uid,
        employeeName: employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        employeeEmail: (employee.email || "").toLowerCase(),
        employeePhone: employee.phone || "",
        date: payload.date,
        status: payload.status,
        checkIn: payload.checkIn || "",
        checkOut: payload.checkOut || "",
        note: (payload.note || "").trim(),
        salesByCategory,
        salesCount: getSalesTotal({ salesByCategory }),
        markedByUid: authUser?.uid || "",
        markedByRole: role,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const deleteAttendance = async (recordId) => {
    await deleteDoc(doc(db, EMPLOYEE_ATTENDANCE_COLLECTION, recordId));
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("iconx_admin_portal_verified");
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  if (authLoading) {
    return <div className="employee-admin-loading">Loading attendance workspace...</div>;
  }

  return (
    <div className="employee-admin-root" data-theme={theme}>
      <aside className="employee-admin-sidebar">
        <div className="employee-admin-brand">
          <div className="employee-admin-logo">icon<span>X</span></div>
          <p>Attendance Workspace</p>
        </div>

        <div className="employee-admin-user">
          <div className="employee-admin-avatar">{(authUser?.displayName || authUser?.email || "U").charAt(0).toUpperCase()}</div>
          <div>
            <div className="employee-admin-user-name">{authUser?.displayName || "Portal User"}</div>
            <div className="employee-admin-user-role">{role === "admin" ? "Admin Access" : "Employee Access"}</div>
          </div>
        </div>

        <div className="employee-admin-side-card">
          <div className="employee-admin-side-label">Shared records</div>
          <div className="employee-admin-side-value">{attendance.length}</div>
          <p>{role === "admin" ? `Total sales captured: ${totalSales}` : "You can mark only your own attendance and sales."}</p>
        </div>

        <div className="employee-admin-side-actions">
          {role === "admin" && (
            <button className="employee-admin-secondary" onClick={() => navigate("/admin")}>
              Back to Admin Panel
            </button>
          )}
          <button className="employee-admin-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="employee-admin-main">
        <div className="employee-admin-theme-row">
          <button
            type="button"
            className="employee-admin-theme-btn"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        {role === "admin" ? (
          <AttendanceAdminView employees={employees} attendanceRecords={attendance} onSave={saveAttendance} onDelete={deleteAttendance} />
        ) : !currentEmployee ? (
          <div className="employee-admin-panel">
            <div className="employee-admin-panel-head">
              <div>
                <h2>Employee Profile Missing</h2>
                <p>Your login is valid, but no employee profile was found in the `users` collection yet.</p>
              </div>
            </div>
          </div>
        ) : (
          <AttendanceEmployeeView currentEmployee={currentEmployee} attendanceRecords={attendance} onSave={saveAttendance} />
        )}
      </main>
    </div>
  );
}
