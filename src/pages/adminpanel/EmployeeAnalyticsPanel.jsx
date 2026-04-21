import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  present: "#30d158",
  late: "#ff9f0a",
  absent: "#ff453a",
  leave: "#0a84ff",
};

function formatStatus(status) {
  return (status || "").charAt(0).toUpperCase() + (status || "").slice(1);
}

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function exportAttendanceSalesCsv(records) {
  const rows = [
    ["Employee", "Email", "Date", "Status", "Sales Count", "Check In", "Check Out", "Note"],
    ...records.map((item) => [
      item.employeeName || "",
      item.employeeEmail || "",
      item.date || "",
      item.status || "",
      Number(item.salesCount) || 0,
      item.checkIn || "",
      item.checkOut || "",
      (item.note || "").replace(/,/g, " "),
    ]),
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: "employee_attendance_sales_report.csv",
  });

  link.click();
  URL.revokeObjectURL(link.href);
}

function exportAttendanceSalesPdf(records, dailySales, statusBreakdown, topEmployees) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const totalSales = records.reduce((sum, item) => sum + (Number(item.salesCount) || 0), 0);
  const presentCount = records.filter((item) => item.status === "present").length;
  const lateCount = records.filter((item) => item.status === "late").length;
  const absentCount = records.filter((item) => item.status === "absent").length;

  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(10, 132, 255);
  doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Employee Attendance & Sales", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 166, 176);
  doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });

  const cards = [
    ["Records", String(records.length)],
    ["Sales", String(totalSales)],
    ["Present", String(presentCount + lateCount)],
    ["Absent", String(absentCount)],
  ];

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24);
    doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setTextColor(160, 166, 176);
    doc.text(label, x + 4, 36);
    doc.setTextColor(245, 245, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(value, x + 4, 44);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
  });

  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.text("Status Breakdown", margin, 58);
  autoTable(doc, {
    startY: 62,
    head: [["Status", "Count"]],
    body: statusBreakdown.map((item) => [item.name, item.value]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176] },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247] },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: 98,
    head: [["Date", "Daily Sales"]],
    body: dailySales.map((item) => [item.label, item.sales]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176] },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247] },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Employee", "Total Sales"]],
    body: topEmployees.map((item) => [item.name, item.sales]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176] },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247] },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Employee", "Date", "Status", "Sales", "Check In", "Check Out"]],
    body: records.slice(0, 18).map((item) => [
      item.employeeName || "-",
      item.date || "-",
      formatStatus(item.status),
      Number(item.salesCount) || 0,
      item.checkIn || "-",
      item.checkOut || "-",
    ]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176] },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  doc.save("employee_attendance_sales_report.pdf");
}

export default function EmployeeAnalyticsPanel({ records, search }) {
  const filtered = records.filter((item) =>
    !search.trim() ||
    [
      item.employeeName,
      item.employeeEmail,
      item.status,
      item.date,
      item.note,
      String(item.salesCount || ""),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const totalSales = filtered.reduce((sum, item) => sum + (Number(item.salesCount) || 0), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRecords = filtered.filter((item) => item.date === todayKey);
  const presentToday = todayRecords.filter((item) => item.status === "present" || item.status === "late").length;
  const absentToday = todayRecords.filter((item) => item.status === "absent").length;

  const statusBreakdown = ["present", "late", "absent", "leave"].map((status) => ({
    name: formatStatus(status),
    value: filtered.filter((item) => item.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const dailySales = Object.values(
    filtered.reduce((acc, item) => {
      const key = item.date || "unknown";
      if (!acc[key]) {
        acc[key] = { label: formatDateLabel(key), sortKey: key, sales: 0 };
      }
      acc[key].sales += Number(item.salesCount) || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-7);

  const topEmployees = Object.values(
    filtered.reduce((acc, item) => {
      const key = item.employeeUid || item.employeeEmail || item.employeeName;
      if (!acc[key]) {
        acc[key] = { name: item.employeeName || item.employeeEmail || "Employee", sales: 0, records: 0 };
      }
      acc[key].sales += Number(item.salesCount) || 0;
      acc[key].records += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 6);

  const attendanceByEmployee = topEmployees.map((item) => ({
    name: item.name.split(" ")[0],
    sales: item.sales,
    records: item.records,
  }));

  return (
    <>
      <div className="ap-filter-bar">
        <div>
          <div className="ap-settings-title">Employee Attendance & Sales</div>
          <div className="ap-settings-sub">Admin-only charts and reporting from the shared daily employee records.</div>
        </div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportAttendanceSalesPdf(filtered, dailySales, statusBreakdown, topEmployees)}>
          Export Attendance PDF
        </button>
        <button className="ap-export-btn excel" onClick={() => exportAttendanceSalesCsv(filtered)}>
          Export Attendance CSV
        </button>
      </div>

      <div className="ap-grid-4">
        <div className="ap-stat-card blue">
          <div className="ap-stat-icon blue">S</div>
          <div className="ap-stat-label">Total Sales</div>
          <div className="ap-stat-value">{totalSales}</div>
          <div className="ap-stat-sub">Sales entries captured in filtered records</div>
        </div>
        <div className="ap-stat-card green">
          <div className="ap-stat-icon green">P</div>
          <div className="ap-stat-label">Present Today</div>
          <div className="ap-stat-value" style={{ color: "var(--green)" }}>{presentToday}</div>
          <div className="ap-stat-sub">Present or late staff for today</div>
        </div>
        <div className="ap-stat-card red">
          <div className="ap-stat-icon red">A</div>
          <div className="ap-stat-label">Absent Today</div>
          <div className="ap-stat-value" style={{ color: "var(--red)" }}>{absentToday}</div>
          <div className="ap-stat-sub">Marked absent for today</div>
        </div>
        <div className="ap-stat-card purple">
          <div className="ap-stat-icon purple">R</div>
          <div className="ap-stat-label">Daily Records</div>
          <div className="ap-stat-value" style={{ color: "var(--purple)" }}>{filtered.length}</div>
          <div className="ap-stat-sub">Attendance and sales rows matching current search</div>
        </div>
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Daily Sales Trend <span className="ap-panel-sub">last 7 recorded days</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="employee-sales-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="var(--accent)" fill="url(#employee-sales-fill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-title">Attendance Status Mix <span className="ap-panel-sub">current filtered set</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78}>
                {statusBreakdown.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Top Employee Sales <span className="ap-panel-sub">highest total sales count</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceByEmployee}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="var(--green)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-title">Attendance Entries per Employee <span className="ap-panel-sub">same top employee slice</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceByEmployee}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip />
              <Bar dataKey="records" radius={[4, 4, 0, 0]} fill="var(--amber)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ap-panel">
        <div className="ap-panel-title">Recent Attendance & Sales Log <span className="ap-panel-sub">latest shared records</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No attendance or sales records found.
                  </td>
                </tr>
              )}
              {filtered.slice(0, 15).map((item) => (
                <tr key={item.id}>
                  <td>{item.employeeName || item.employeeEmail || "-"}</td>
                  <td>{formatDateLabel(item.date)}</td>
                  <td>
                    <span
                      className="ap-badge"
                      style={{
                        background: `${STATUS_COLORS[item.status] || "#6e6e73"}22`,
                        color: STATUS_COLORS[item.status] || "#6e6e73",
                      }}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td>{Number(item.salesCount) || 0}</td>
                  <td>{item.checkIn || "-"}</td>
                  <td>{item.checkOut || "-"}</td>
                  <td>{item.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
