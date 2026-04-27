import { useMemo, useState } from "react";
import {
  SALES_CATEGORIES,
  formatDateLabel,
  formatStatus,
  getSalesTotal,
  normalizeSalesByCategory,
  summarizeSales,
  todayKey,
} from "./attendanceShared";

function createAdminForm(record) {
  return {
    id: record?.id,
    employeeUid: record?.employeeUid || "",
    date: record?.date || todayKey(),
    status: record?.status || "present",
    checkIn: record?.checkIn || "09:00",
    checkOut: record?.checkOut || "18:00",
    note: record?.note || "",
    salesByCategory: normalizeSalesByCategory(record?.salesByCategory),
  };
}

function AttendanceRecordModal({ employees, form, setForm, onClose, onSubmit, saving }) {
  const updateCategory = (key, value) => {
    setForm((current) => ({
      ...current,
      salesByCategory: {
        ...current.salesByCategory,
        [key]: Math.max(0, Number(value) || 0),
      },
    }));
  };

  return (
    <div className="employee-admin-overlay" onClick={onClose}>
      <div className="employee-admin-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="employee-admin-panel-head">
          <div>
            <h2>{form.id ? "Update Attendance" : "Add Attendance"}</h2>
            <p>Admin can create and update attendance records for any employee.</p>
          </div>
          <button type="button" className="employee-admin-secondary" onClick={onClose}>Close</button>
        </div>

        <form className="employee-admin-form" onSubmit={onSubmit}>
          <label>
            Employee
            <select className="employee-admin-select" value={form.employeeUid} onChange={(event) => setForm((current) => ({ ...current, employeeUid: event.target.value }))} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.uid} value={employee.uid}>{employee.fullName || employee.email}</option>
              ))}
            </select>
          </label>

          <div className="employee-admin-form-row">
            <label>
              Date
              <input className="employee-admin-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </label>
            <label>
              Status
              <select className="employee-admin-select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </label>
          </div>

          <div className="employee-admin-form-row">
            <label>
              Check In
              <input className="employee-admin-date" type="time" value={form.checkIn} onChange={(event) => setForm((current) => ({ ...current, checkIn: event.target.value }))} />
            </label>
            <label>
              Check Out
              <input className="employee-admin-date" type="time" value={form.checkOut} onChange={(event) => setForm((current) => ({ ...current, checkOut: event.target.value }))} />
            </label>
          </div>

          <div>
            <div className="employee-admin-field-label">Sales By Product Category</div>
            <div className="employee-admin-category-grid">
              {SALES_CATEGORIES.map((category) => (
                <label key={category.key} className="employee-admin-category-card">
                  <span>{category.label}</span>
                  <input className="employee-admin-date" type="number" min="0" value={form.salesByCategory[category.key]} onChange={(event) => updateCategory(category.key, event.target.value)} />
                </label>
              ))}
            </div>
          </div>

          <label>
            Note
            <textarea className="employee-admin-textarea" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
          </label>

          <button className="employee-admin-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AttendanceDetailModal({ record, onClose }) {
  return (
    <div className="employee-admin-overlay" onClick={onClose}>
      <div className="employee-admin-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="employee-admin-panel-head">
          <div>
            <h2>Attendance Detail View</h2>
            <p>Admin-only view with deeper employee attendance information.</p>
          </div>
          <button type="button" className="employee-admin-secondary" onClick={onClose}>Close</button>
        </div>

        <div className="employee-admin-detail-grid">
          <div className="employee-admin-detail-tile"><span>Employee</span><strong>{record.employeeName || "-"}</strong></div>
          <div className="employee-admin-detail-tile"><span>Email</span><strong>{record.employeeEmail || "-"}</strong></div>
          <div className="employee-admin-detail-tile"><span>Phone</span><strong>{record.employeePhone || "-"}</strong></div>
          <div className="employee-admin-detail-tile"><span>Date</span><strong>{formatDateLabel(record.date)}</strong></div>
          <div className="employee-admin-detail-tile"><span>Status</span><strong>{formatStatus(record.status)}</strong></div>
          <div className="employee-admin-detail-tile"><span>Total Sales</span><strong>{getSalesTotal(record)}</strong></div>
          <div className="employee-admin-detail-tile"><span>Sales Mix</span><strong>{summarizeSales(record)}</strong></div>
          <div className="employee-admin-detail-tile"><span>Marked By Role</span><strong>{formatStatus(record.markedByRole)}</strong></div>
          <div className="employee-admin-detail-tile"><span>Check Window</span><strong>{record.checkIn || "-"} - {record.checkOut || "-"}</strong></div>
        </div>
        <div className="employee-admin-message" style={{ marginTop: 16 }}>{record.note || "No note was added for this record."}</div>
      </div>
    </div>
  );
}

export default function AttendanceAdminView({ employees, attendanceRecords, onSave, onDelete }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingForm, setEditingForm] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredRecords = useMemo(
    () => attendanceRecords.filter((record) => {
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesSearch = !search.trim() || [record.employeeName, record.employeeEmail, record.note, record.date].filter(Boolean).some((value) => value.toLowerCase().includes(search.trim().toLowerCase()));
      return matchesStatus && matchesSearch;
    }),
    [attendanceRecords, search, statusFilter]
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(editingForm);
      setEditingForm(null);
    } catch (error) {
      console.error("Admin attendance save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (recordId) => {
    setSaving(true);
    try {
      await onDelete(recordId);
      if (detailRecord?.id === recordId) setDetailRecord(null);
    } catch (error) {
      console.error("Admin attendance delete failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="employee-admin-header">
        <div>
          <h1>Attendance Admin</h1>
          <p>Admins can add, update, delete, and inspect detailed employee attendance records including sales by category.</p>
        </div>
        <div className="employee-admin-toolbar">
          <input className="employee-admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee attendance..." />
          <button type="button" className="employee-admin-primary" onClick={() => setEditingForm(createAdminForm())}>Add Attendance</button>
        </div>
      </header>

      <section className="employee-admin-stats">
        <article className="employee-admin-stat-card success">
          <span>Total Records</span>
          <strong>{attendanceRecords.length}</strong>
          <small>Attendance rows currently available</small>
        </article>
        <article className="employee-admin-stat-card info">
          <span>Total Sales</span>
          <strong>{attendanceRecords.reduce((sum, record) => sum + getSalesTotal(record), 0)}</strong>
          <small>Combined category sales across all records</small>
        </article>
        <article className="employee-admin-stat-card warning">
          <span>Employees</span>
          <strong>{employees.length}</strong>
          <small>Employee accounts available for attendance</small>
        </article>
      </section>

      <section className="employee-admin-panel employee-admin-history">
        <div className="employee-admin-panel-head">
          <div>
            <h2>Attendance Records</h2>
            <p>Admin CRUD table with detailed access.</p>
          </div>
          <div className="employee-admin-filter-group">
            {["all", "present", "late", "absent", "leave"].map((status) => (
              <button key={status} type="button" className={`employee-admin-filter ${statusFilter === status ? "active" : ""}`} onClick={() => setStatusFilter(status)}>
                {formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="employee-admin-table-wrap">
          <table className="employee-admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Categories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && <tr><td colSpan="6" className="employee-admin-empty-row">No records found.</td></tr>}
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.employeeName || record.employeeEmail || "-"}</td>
                  <td>{formatDateLabel(record.date)}</td>
                  <td><span className={`employee-admin-status-pill ${record.status}`}>{formatStatus(record.status)}</span></td>
                  <td>{getSalesTotal(record)}</td>
                  <td>{summarizeSales(record)}</td>
                  <td>
                    <div className="employee-admin-action-row">
                      <button type="button" className="employee-admin-secondary" onClick={() => setDetailRecord(record)}>View</button>
                      <button type="button" className="employee-admin-secondary" onClick={() => setEditingForm(createAdminForm(record))}>Edit</button>
                      <button type="button" className="employee-admin-secondary employee-admin-danger" onClick={() => remove(record.id)} disabled={saving}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingForm && <AttendanceRecordModal employees={employees} form={editingForm} setForm={setEditingForm} onClose={() => setEditingForm(null)} onSubmit={submit} saving={saving} />}
      {detailRecord && <AttendanceDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />}
    </>
  );
}
