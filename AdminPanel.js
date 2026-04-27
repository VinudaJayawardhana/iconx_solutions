import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  RadialBarChart, RadialBar, Legend, LineChart, Line
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { auth, db } from "../../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import AttendancePanel from "./Attendance";
import ProductAdmin    from "./ProductAdmin";
import EmployeeAnalyticsPanel from "./EmployeeAnalyticsPanel";
import { CART_EVENT, getCartItems } from "../../utils/cart";
import { DEFAULT_ADMIN_PORTAL_CODE, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC, generateEmployeePortalCode } from "../../utils/portalSecurity";
import {
  addAttendanceRecord as fbAddRaw,
  getAttendanceRecords as fbGetAllRaw,
  updateAttendanceRecord as fbUpdateRaw,
  deleteAttendanceRecord as fbDelete,
} from "../../firebase";

/* ─── STYLES ──────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#090a0f;--surface:#111318;--surface2:#181b22;--border:rgba(255,255,255,0.07);--accent:#0a84ff;--accent2:#5e5ce6;--green:#30d158;--red:#ff453a;--amber:#ff9f0a;--purple:#bf5af2;--text:#f5f5f7;--muted:#6e6e73;--syne:'Syne',sans-serif;--dm:'DM Sans',sans-serif}
[data-theme='light'].ap-root{--bg:#f3f6fb;--surface:#ffffff;--surface2:#eef3f9;--border:rgba(16,24,40,0.08);--accent:#0b6bcb;--accent2:#2d8cff;--green:#0f9f63;--red:#d64545;--amber:#d88900;--purple:#8557d9;--text:#162033;--muted:#667085}
*{box-sizing:border-box;margin:0;padding:0}
.ap-root{display:flex;height:100vh;width:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--dm);font-size:14px}
.ap-sidebar{width:220px;min-width:220px;height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.ap-brand{padding:20px 18px 14px;border-bottom:1px solid var(--border)}
.ap-brand-logo{font-family:var(--syne);font-size:22px;font-weight:800;letter-spacing:-0.5px}
.ap-brand-logo span{color:var(--accent)}
.ap-brand-sub{font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:1px;text-transform:uppercase}
.ap-profile{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.ap-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--syne);font-weight:700;font-size:14px;flex-shrink:0}
.ap-profile-info{flex:1;min-width:0}
.ap-profile-name{font-family:var(--syne);font-weight:600;font-size:13px}
.ap-profile-role{font-size:11px;color:var(--muted)}
.ap-online-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);flex-shrink:0}
.ap-nav{flex:1;overflow-y:auto;padding:10px}
.ap-nav::-webkit-scrollbar{width:0}
.ap-nav-label{font-size:10px;color:var(--muted);letter-spacing:1.2px;text-transform:uppercase;padding:10px 8px 6px}
.ap-nav-btn{width:100%;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;border:none;cursor:pointer;background:transparent;color:var(--muted);font-family:var(--dm);font-size:13px;text-align:left;transition:all 0.15s;margin-bottom:2px}
.ap-nav-btn:hover{background:var(--surface2);color:var(--text)}
.ap-nav-btn.active{background:rgba(10,132,255,0.15);color:var(--accent);font-weight:500}
.ap-sidebar-bottom{padding:14px 10px;border-top:1px solid var(--border)}
.ap-export-btn{width:100%;padding:9px 12px;border-radius:8px;border:none;cursor:pointer;font-family:var(--dm);font-size:12px;font-weight:500;display:flex;align-items:center;gap:8px;margin-bottom:6px;transition:all 0.15s}
.ap-export-btn.pdf{background:rgba(255,69,58,0.15);color:var(--red)}
.ap-export-btn.pdf:hover{background:rgba(255,69,58,0.25)}
.ap-export-btn.excel{background:rgba(48,209,88,0.12);color:var(--green)}
.ap-export-btn.excel:hover{background:rgba(48,209,88,0.22)}
.ap-logout-btn{width:100%;padding:9px 12px;border-radius:8px;border:1px solid rgba(255,69,58,0.28);cursor:pointer;font-family:var(--dm);font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;margin-top:4px;background:rgba(255,69,58,0.08);color:var(--red);transition:all 0.15s}
.ap-logout-btn:hover{background:rgba(255,69,58,0.2);border-color:var(--red)}
.ap-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.ap-topbar{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface);flex-shrink:0}
.ap-topbar-title{font-family:var(--syne);font-weight:700;font-size:18px}
.ap-topbar-right{display:flex;align-items:center;gap:10px}
.ap-theme-btn{border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:999px;padding:8px 14px;cursor:pointer;font-family:var(--dm);font-size:12px;font-weight:600;transition:all 0.15s}
.ap-theme-btn:hover{border-color:var(--accent);color:var(--accent)}
.ap-search{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 12px;color:var(--text);font-family:var(--dm);font-size:13px;outline:none;width:200px}
.ap-search::placeholder{color:var(--muted)}
.ap-search:focus{border-color:var(--accent)}
.ap-content{flex:1;overflow-y:auto;padding:20px 24px}
.ap-content::-webkit-scrollbar{width:4px}
.ap-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.ap-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.ap-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
.ap-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px}
.ap-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden}
.ap-stat-card:hover{border-color:rgba(255,255,255,0.14);transform:translateY(-1px)}
.ap-stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.ap-stat-card.blue::before{background:var(--accent)}.ap-stat-card.green::before{background:var(--green)}.ap-stat-card.red::before{background:var(--red)}.ap-stat-card.amber::before{background:var(--amber)}.ap-stat-card.purple::before{background:var(--purple)}
.ap-stat-label{font-size:11px;color:var(--muted);letter-spacing:0.5px;margin-bottom:8px;text-transform:uppercase}
.ap-stat-value{font-family:var(--syne);font-size:24px;font-weight:700;margin-bottom:4px}
.ap-stat-sub{font-size:11px;color:var(--muted)}
.ap-stat-icon{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px}
.ap-stat-icon.blue{background:rgba(10,132,255,0.15);color:var(--accent)}.ap-stat-icon.green{background:rgba(48,209,88,0.15);color:var(--green)}.ap-stat-icon.red{background:rgba(255,69,58,0.15);color:var(--red)}.ap-stat-icon.amber{background:rgba(255,159,10,0.15);color:var(--amber)}.ap-stat-icon.purple{background:rgba(191,90,242,0.15);color:var(--purple)}
.ap-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px}
.ap-panel-title{font-family:var(--syne);font-size:14px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
.ap-panel-sub{font-size:11px;color:var(--muted);font-weight:400;font-family:var(--dm)}
.ap-gauge-wrap{display:flex;flex-direction:column;align-items:center}
.ap-gauge-label{font-size:11px;color:var(--muted);margin-top:4px;text-align:center}
.ap-gauge-val{font-family:var(--syne);font-size:15px;font-weight:700;text-align:center}
.ap-table-wrap{overflow-x:auto}
.ap-table{width:100%;border-collapse:collapse;font-size:13px}
.ap-table th{text-align:left;padding:10px 12px;color:var(--muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);white-space:nowrap}
.ap-table td{padding:11px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.ap-table tr:last-child td{border-bottom:none}
.ap-table tr.data-row{cursor:pointer;transition:background 0.1s}
.ap-table tr.data-row:hover td{background:rgba(255,255,255,0.03)}
[data-theme='light'].ap-root .ap-table tr.data-row:hover td{background:rgba(11,107,203,0.06)}
.ap-eff-bar{height:6px;border-radius:3px;background:var(--surface2);overflow:hidden;width:80px}
.ap-eff-fill{height:100%;border-radius:3px;transition:width 0.5s}
.ap-eff-text{font-family:var(--syne);font-size:12px;font-weight:600}
.ap-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:500}
.ap-badge.optimal{background:rgba(48,209,88,0.15);color:var(--green)}.ap-badge.stable{background:rgba(255,159,10,0.15);color:var(--amber)}.ap-badge.critical{background:rgba(255,69,58,0.15);color:var(--red)}
.ap-action-btn{background:transparent;border:1px solid var(--border);border-radius:6px;padding:5px 8px;cursor:pointer;color:var(--muted);font-size:12px;transition:all 0.15s;margin-right:4px;display:inline-flex;align-items:center;gap:4px}
.ap-action-btn:hover{border-color:var(--accent);color:var(--accent)}
.ap-action-btn.del:hover{border-color:var(--red);color:var(--red)}
.ap-expanded-row td{background:var(--surface2) !important;padding:16px 20px !important;border-bottom:1px solid var(--border) !important}
.ap-expanded-inner{display:flex;gap:20px;align-items:flex-start}
.ap-detail-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;flex:1}
.ap-detail-tile{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
.ap-detail-tile-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.ap-detail-tile-val{font-family:var(--syne);font-size:16px;font-weight:600}
.ap-filter-bar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.ap-filter-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);cursor:pointer;background:transparent;color:var(--muted);font-family:var(--dm);font-size:12px;font-weight:500;transition:all 0.15s}
.ap-filter-btn:hover{border-color:var(--accent);color:var(--accent)}
.ap-filter-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.ap-filter-btn.green.active{background:var(--green);border-color:var(--green);color:#000}
.ap-filter-btn.amber.active{background:var(--amber);border-color:var(--amber);color:#000}
.ap-filter-btn.red.active{background:var(--red);border-color:var(--red);color:#fff}
.ap-filter-spacer{flex:1}
.ap-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);animation:fadeIn 0.15s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.ap-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;min-width:480px;max-width:680px;width:90vw;max-height:85vh;overflow-y:auto;animation:slideUp 0.2s ease}
.ap-modal::-webkit-scrollbar{width:4px}
.ap-modal::-webkit-scrollbar-thumb{background:var(--border)}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.ap-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.ap-modal-title{font-family:var(--syne);font-size:18px;font-weight:700}
.ap-modal-close{background:var(--surface2);border:1px solid var(--border);width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:18px;transition:all 0.15s}
.ap-modal-close:hover{background:rgba(255,69,58,0.15);color:var(--red);border-color:var(--red)}
.ap-form-group{margin-bottom:16px}
.ap-form-label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.ap-form-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-family:var(--dm);font-size:14px;outline:none;transition:border-color 0.15s}
.ap-form-input:focus{border-color:var(--accent)}
.ap-form-preview{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-top:14px}
.ap-form-preview-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.ap-form-preview-row:last-child{margin-bottom:0}
.ap-form-preview-key{font-size:12px;color:var(--muted)}
.ap-form-preview-val{font-family:var(--syne);font-weight:600;font-size:14px}
.ap-submit-btn{width:100%;padding:12px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-family:var(--syne);font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.15s;margin-top:8px}
.ap-submit-btn:hover{opacity:0.85}
.ap-group-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);margin-bottom:8px}
.ap-group-rank{width:28px;height:28px;border-radius:50%;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--syne);font-size:12px;font-weight:700;flex-shrink:0}
.ap-group-info{flex:1;min-width:0}
.ap-group-id{font-family:var(--syne);font-weight:600;font-size:13px}
.ap-group-meta{font-size:11px;color:var(--muted);margin-top:2px}
.ap-group-eff{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.ap-group-eff-val{font-family:var(--syne);font-weight:700;font-size:14px}
.ap-group-eff-bar{width:60px;height:4px;background:var(--border);border-radius:2px;overflow:hidden}
.ap-group-eff-fill{height:100%;border-radius:2px}
.ap-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:var(--muted);gap:12px}
.ap-placeholder-icon{font-size:40px;opacity:0.3}
.ap-placeholder-text{font-family:var(--syne);font-size:16px;font-weight:600}
.ap-section-title{font-family:var(--syne);font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;margin-top:4px}
.ap-chart-tip{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px}
.ap-chart-tip-label{color:var(--muted);margin-bottom:2px}
.ap-chart-tip-val{font-family:var(--syne);font-weight:600}
.ap-add-btn{padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-family:var(--dm);font-size:13px;font-weight:500;cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;gap:6px}
.ap-add-btn:hover{opacity:0.85}
.ap-settings-section{margin-bottom:24px}
.ap-settings-title{font-family:var(--syne);font-size:15px;font-weight:700;margin-bottom:4px}
.ap-settings-sub{font-size:12px;color:var(--muted);margin-bottom:16px}
.ap-threshold-row{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px}
.ap-threshold-label{width:80px;flex-shrink:0}
.ap-threshold-label-name{font-size:13px;font-weight:600}
.ap-threshold-label-range{font-size:11px;color:var(--muted);margin-top:2px}
.ap-threshold-slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
.ap-threshold-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;border:2px solid #090a0f}
.ap-threshold-val{font-family:var(--syne);font-size:16px;font-weight:700;min-width:44px;text-align:right}
.ap-settings-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
.ap-settings-metric{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;text-align:center}
.ap-settings-metric-val{font-family:var(--syne);font-size:22px;font-weight:700}
.ap-settings-metric-label{font-size:11px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
.ap-settings-apply{padding:10px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-family:var(--dm);font-size:13px;font-weight:600;cursor:pointer;margin-top:16px;transition:opacity 0.15s}
.ap-settings-apply:hover{opacity:0.85}
.ap-settings-reset{padding:10px 16px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:var(--dm);font-size:13px;cursor:pointer;margin-top:16px;margin-left:8px;transition:all 0.15s}
.ap-settings-reset:hover{color:var(--text);border-color:var(--text)}
.ap-request-list{display:grid;gap:14px}
.ap-request-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px}
.ap-request-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
.ap-request-name{font-family:var(--syne);font-size:18px;font-weight:700}
.ap-request-email{font-size:12px;color:var(--muted);margin-top:4px}
.ap-request-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.ap-request-meta-card{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px}
.ap-request-meta-card span{display:block;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.ap-request-meta-card strong{font-family:var(--syne);font-size:14px}
.ap-request-actions{display:flex;gap:10px;flex-wrap:wrap}
.ap-request-btn{padding:10px 16px;border:none;border-radius:10px;cursor:pointer;font-family:var(--dm);font-size:13px;font-weight:600;transition:opacity 0.15s}
.ap-request-btn:hover{opacity:0.88}
.ap-request-btn.approve{background:rgba(48,209,88,0.16);color:var(--green)}
.ap-request-btn.reject{background:rgba(255,69,58,0.14);color:var(--red)}
.ap-request-btn.pending{background:rgba(255,159,10,0.16);color:var(--amber)}
.ap-request-empty{padding:28px;border:1px dashed var(--border);border-radius:14px;background:var(--surface);text-align:center;color:var(--muted)}
.ap-request-badge{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
.ap-request-badge.pending{background:rgba(255,159,10,0.16);color:var(--amber)}
.ap-request-badge.approved{background:rgba(48,209,88,0.16);color:var(--green)}
.ap-request-badge.rejected{background:rgba(255,69,58,0.14);color:var(--red)}
.ap-request-code{margin-top:12px;padding:12px 14px;border:1px dashed var(--border);border-radius:10px;background:var(--surface2)}
.ap-request-code span{display:block;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.ap-request-code strong{font-family:var(--syne);font-size:18px;letter-spacing:1px}
.ap-settings-inline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ap-settings-input{min-width:280px;flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-family:var(--dm);font-size:14px;outline:none}
.ap-settings-input:focus{border-color:var(--accent)}
`;

/* ─── THRESHOLD CONFIG ─────────────────────────────────────── */
export const THRESHOLDS = { optimal: 75, stable: 45 };

/* ─── HELPERS ──────────────────────────────────────────────── */
const getStatus = (eff, t = THRESHOLDS) => eff >= t.optimal ? 'optimal' : eff >= t.stable ? 'stable' : 'critical';
const calcEff = (h, r) => { const s = h * r; if (s <= 0) return 0; return Math.min(100, Math.round((s / (300 * 80)) * 300)); };
const statusColor = (s) => ({ optimal: 'var(--green)', stable: 'var(--amber)', critical: 'var(--red)' }[s] || 'var(--muted)');
const statusLabel = (s) => ({ optimal: 'Optimal', stable: 'Stable', critical: 'Critical' }[s] || '—');
const statusIcon  = (s) => ({ optimal: '✓', stable: '⚠', critical: '✕' }[s] || '');
const fmt = (n) => 'Rs ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

/* ─── FIRESTORE MAPPERS ────────────────────────────────────── */
const fromFirestore = (d) => {
  const h = Number(d.work_hour) || 0, r = Number(d.base_salary_rate) || 0;
  const eff = calcEff(h, r);
  return { id: d.id, staffId: d.emp_id || '—', hours: h, rate: r, salary: h * r, efficiency: eff, status: getStatus(eff) };
};
const toFirestore = (rec) => ({ emp_id: rec.staffId, work_hour: Number(rec.hours), base_salary_rate: Number(rec.rate), timestamp: new Date().toISOString() });
async function fbGetAll() { return (await fbGetAllRaw()).map(fromFirestore); }
async function fbAdd(rec) { const ref = await fbAddRaw(rec.staffId, rec.hours, rec.rate); return { ...rec, id: ref.id }; }
async function fbUpdate(id, rec) { await fbUpdateRaw(id, toFirestore(rec)); }

/* ─── SVG GAUGE ────────────────────────────────────────────── */
function Gauge({ value, color, size = 80 }) {
  const r = size / 2 - 8, circ = Math.PI * r, prog = (value / 100) * circ;
  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
      <path d={`M 8 ${size/2} A ${r} ${r} 0 0 1 ${size-8} ${size/2}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${prog} ${circ}`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2 + 2} textAnchor="middle" fill={color} fontSize="13" fontFamily="Syne,sans-serif" fontWeight="700">{value}%</text>
    </svg>
  );
}

/* ─── TOOLTIP ──────────────────────────────────────────────── */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ap-chart-tip">
      <div className="ap-chart-tip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ap-chart-tip-val" style={{ color: p.color }}>
          {p.name}: {p.value > 1000 ? fmt(p.value) : p.value}{p.name === 'efficiency' || p.name === 'eff' ? '%' : ''}
        </div>
      ))}
    </div>
  );
}

/* ─── CANVAS CHART FOR PDF ─────────────────────────────────── */
function buildChart(type, opts = {}) {
  const canvas = document.createElement('canvas');
  const W = opts.width || 520, H = opts.height || 190;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111318'; ctx.fillRect(0, 0, W, H);
  if (type === 'bar') {
    const { labels, values, color = '#0a84ff' } = opts;
    const pad = { t:20, r:16, b:32, l:52 }, cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;
    const max = Math.max(...values)*1.15||1, barW = Math.min(28,(cW/values.length)*0.55), step = cW/values.length;
    for (let i=0;i<=4;i++){const y=pad.t+cH-(i/4)*cH;ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle='#6e6e73';ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillText(Math.round((i/4)*max/1000)+'k',pad.l-5,y+3);}
    values.forEach((v,i)=>{const bH=Math.max(2,(v/max)*cH),x=pad.l+i*step+step/2-barW/2,y=pad.t+cH-bH;const g=ctx.createLinearGradient(0,y,0,y+bH);g.addColorStop(0,color);g.addColorStop(1,color+'44');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,barW,bH,3);ctx.fill();if(labels){ctx.fillStyle='#6e6e73';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(String(labels[i]||'').slice(0,6),pad.l+i*step+step/2,H-6);}});
  }
  if (type === 'area') {
    const { labels, values, color = '#0a84ff' } = opts;
    const pad = { t:20, r:16, b:32, l:52 }, cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;
    const max = Math.max(...values)*1.15||1;
    const pts = values.map((v,i)=>({x:pad.l+(values.length>1?(i/(values.length-1))*cW:cW/2),y:pad.t+cH-(v/max)*cH}));
    for(let i=0;i<=4;i++){const y=pad.t+cH-(i/4)*cH;ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle='#6e6e73';ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillText(Math.round((i/4)*max),pad.l-5,y+3);}
    const g=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);g.addColorStop(0,color+'55');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(pts[0].x,pad.t+cH);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pad.t+cH);ctx.closePath();ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});
    if(labels)labels.forEach((l,i)=>{ctx.fillStyle='#6e6e73';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(String(l||'').slice(0,6),pts[i].x,H-6);});
  }
  if (type === 'donut') {
    const { slices } = opts;
    const cx=W*0.33,cy=H/2,outerR=Math.min(cy-12,72),innerR=outerR*0.55,total=slices.reduce((s,x)=>s+x.value,0)||1;
    let angle=-Math.PI/2;
    slices.forEach(sl=>{const sw=(sl.value/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,outerR,angle,angle+sw);ctx.closePath();ctx.fillStyle=sl.color;ctx.fill();angle+=sw;});
    ctx.beginPath();ctx.arc(cx,cy,innerR,0,Math.PI*2);ctx.fillStyle='#111318';ctx.fill();
    ctx.fillStyle='#f5f5f7';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(String(slices.reduce((s,x)=>s+x.value,0)),cx,cy+5);ctx.fillStyle='#6e6e73';ctx.font='9px sans-serif';ctx.fillText('Total',cx,cy+18);
    let ly=24;slices.forEach(sl=>{const pct=Math.round((sl.value/total)*100);ctx.fillStyle=sl.color;ctx.fillRect(W*0.66,ly,10,10);ctx.fillStyle='#f5f5f7';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(`${sl.label}: ${sl.value} (${pct}%)`,W*0.66+14,ly+9);ly+=28;});
  }
  return canvas.toDataURL('image/png');
}

/* ─── PDF EXPORT ───────────────────────────────────────────── */
async function exportPDF(records) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W=210,M=14;
  const optimal=records.filter(r=>r.status==='optimal'),stable=records.filter(r=>r.status==='stable'),critical=records.filter(r=>r.status==='critical');
  const totalPayout=records.reduce((s,r)=>s+r.salary,0),avgEff=records.length?Math.round(records.reduce((s,r)=>s+r.efficiency,0)/records.length):0;
  doc.setFillColor(9,10,15);doc.rect(0,0,W,297,'F');doc.setFillColor(10,132,255);doc.rect(0,0,W,1.5,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(245,245,247);doc.text('iconX',M,18);
  doc.setFontSize(10);doc.setTextColor(110,110,115);doc.text('Admin Performance Report',M,25);doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),W-M,18,{align:'right'});doc.text(`Staff count: ${records.length}`,W-M,25,{align:'right'});
  let y=34;
  const kpis=[{label:'Total Payout',val:fmt(totalPayout),c:[10,132,255]},{label:'Optimal',val:optimal.length,c:[48,209,88]},{label:'Critical',val:critical.length,c:[255,69,58]},{label:'Avg Efficiency',val:avgEff+'%',c:[191,90,242]}];
  const bW=(W-M*2-9)/4;
  kpis.forEach((k,i)=>{const x=M+i*(bW+3);doc.setFillColor(17,19,24);doc.roundedRect(x,y,bW,20,2,2,'F');doc.setFillColor(...k.c);doc.rect(x,y,bW,1.2,'F');doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110,110,115);doc.text(k.label,x+bW/2,y+8,{align:'center'});doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(245,245,247);doc.text(String(k.val),x+bW/2,y+16,{align:'center'});});
  y+=28;
  const addChart=(title,imgData,h=42)=>{if(y+h+12>275){doc.addPage();doc.setFillColor(9,10,15);doc.rect(0,0,W,297,'F');y=20;}doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(245,245,247);doc.text(title,M,y+5);doc.addImage(imgData,'PNG',M,y+8,W-M*2,h);y+=h+14;};
  const sl=records.slice(0,12);
  addChart('Salary Distribution',buildChart('bar',{labels:sl.map(r=>r.staffId.slice(-4)),values:sl.map(r=>r.salary),color:'#0a84ff',width:540,height:190}),44);
  addChart('Work Hours Trend',buildChart('area',{labels:sl.map(r=>r.staffId.slice(-4)),values:sl.map(r=>r.hours),color:'#bf5af2',width:540,height:190}),44);
  addChart('Efficiency Trend',buildChart('area',{labels:sl.map(r=>r.staffId.slice(-4)),values:sl.map(r=>r.efficiency),color:'#30d158',width:540,height:190}),44);
  addChart('Status Breakdown',buildChart('donut',{slices:[{label:'Optimal',value:optimal.length,color:'#30d158'},{label:'Stable',value:stable.length,color:'#ff9f0a'},{label:'Critical',value:critical.length,color:'#ff453a'}],width:540,height:200}),48);
  if(y>200){doc.addPage();doc.setFillColor(9,10,15);doc.rect(0,0,W,297,'F');y=20;}
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(245,245,247);doc.text('Staff Records Table',M,y+5);y+=10;
  autoTable(doc,{startY:y,head:[['Staff ID','Hours','Rate','Net Salary','Efficiency','Status']],body:records.map(r=>[r.staffId,r.hours+'h','Rs '+r.rate,fmt(r.salary),r.efficiency+'%',r.status.toUpperCase()]),theme:'plain',headStyles:{fillColor:[17,19,24],textColor:[110,110,115],fontSize:9,fontStyle:'bold'},bodyStyles:{fillColor:[9,10,15],textColor:[245,245,247],fontSize:9},alternateRowStyles:{fillColor:[17,19,24]},didParseCell:(d)=>{if(d.section==='body'&&d.column.index===5){const s=String(d.cell.raw).toLowerCase();d.cell.styles.textColor=s==='optimal'?[48,209,88]:s==='stable'?[255,159,10]:[255,69,58];d.cell.styles.fontStyle='bold';}},margin:{left:M,right:M}});
  const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setFillColor(9,10,15);doc.rect(0,285,W,12,'F');doc.setFillColor(10,132,255);doc.rect(0,295,W,2,'F');doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110,110,115);doc.text(`Page ${i} of ${total}`,W/2,291,{align:'center'});doc.text('iconX Admin System',M,291);}
  doc.save('iconX_performance_report.pdf');
}

/* ─── EXCEL EXPORT ─────────────────────────────────────────── */
function exportExcel(records) {
  const rows=[['Staff ID','Hours','Rate (Rs/hr)','Net Salary','Efficiency %','Status'],...records.map(r=>[r.staffId,r.hours,r.rate,r.salary,r.efficiency,r.status])];
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'iconX_staff_data.csv'});
  a.click();URL.revokeObjectURL(a.href);
}

/* ─── MOCK DATA ────────────────────────────────────────────── */
const MOCK=[
  {id:'1',staffId:'STF-001',hours:220,rate:45,salary:9900,efficiency:82,status:'optimal'},
  {id:'2',staffId:'STF-002',hours:180,rate:38,salary:6840,efficiency:57,status:'stable'},
  {id:'3',staffId:'STF-003',hours:240,rate:52,salary:12480,efficiency:91,status:'optimal'},
  {id:'4',staffId:'STF-004',hours:120,rate:28,salary:3360,efficiency:25,status:'critical'},
  {id:'5',staffId:'STF-005',hours:200,rate:41,salary:8200,efficiency:68,status:'stable'},
  {id:'6',staffId:'STF-006',hours:90,rate:25,salary:2250,efficiency:17,status:'critical'},
  {id:'7',staffId:'STF-007',hours:235,rate:55,salary:12925,efficiency:95,status:'optimal'},
  {id:'8',staffId:'STF-008',hours:160,rate:35,salary:5600,efficiency:42,status:'stable'},
  {id:'9',staffId:'STF-009',hours:100,rate:22,salary:2200,efficiency:16,status:'critical'},
  {id:'10',staffId:'STF-010',hours:210,rate:48,salary:10080,efficiency:78,status:'optimal'},
];

/* ─── NAV ICONS ────────────────────────────────────────────── */
const I={
  dashboard:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  product:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  customer:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  select:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  vendor:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  reviews:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  orders:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2l3 7h9l3-7"/><path d="M3 9h18l-1.5 9a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 9z"/><circle cx="9" cy="21" r="1"/><circle cx="15" cy="21" r="1"/></svg>,
  tradeIn:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  attendance:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  employeeAccess:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M17 11h6"/></svg>,
  settings:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

/* ─── GROUP MODAL — view only, NO edit button ──────────────── */
function GroupModal({ type, records, onClose }) {
  const list = records.filter(r => r.status === type).sort((a, b) => b.efficiency - a.efficiency);
  const color = statusColor(type);
  const avg = list.length ? Math.round(list.reduce((s, r) => s + r.efficiency, 0) / list.length) : 0;
  const barData = list.map(r => ({ name: r.staffId.slice(-4), eff: r.efficiency }));
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div>
            <div className="ap-modal-title" style={{ color }}>{type.charAt(0).toUpperCase() + type.slice(1)} Staff Group</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{list.length} members &middot; Avg: <span style={{ color, fontWeight: 600 }}>{avg}%</span></div>
          </div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div className="ap-gauge-wrap">
            <Gauge value={avg} color={color} size={110} />
            <div className="ap-gauge-label">Group Average Efficiency</div>
          </div>
        </div>
        {list.length > 0 && (
          <div className="ap-panel" style={{ marginBottom: 16 }}>
            <div className="ap-panel-title">Efficiency per Member <span className="ap-panel-sub">{type} group</span></div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6e6e73' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6e6e73' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="eff" name="efficiency" radius={[3, 3, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="ap-section-title">Ranked Members</div>
        <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {list.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No {type} staff found</div>}
          {list.map((r, i) => (
            <div key={r.id} className="ap-group-item">
              <div className="ap-group-rank" style={{ color, borderColor: color + '44' }}>#{i + 1}</div>
              <div className="ap-group-info">
                <div className="ap-group-id">{r.staffId}</div>
                <div className="ap-group-meta">{r.hours}h &middot; Rs {r.rate}/hr &middot; {fmt(r.salary)}</div>
              </div>
              <div className="ap-group-eff">
                <div className="ap-group-eff-val" style={{ color }}>{r.efficiency}%</div>
                <div className="ap-group-eff-bar"><div className="ap-group-eff-fill" style={{ width: r.efficiency + '%', background: color }} /></div>
              </div>
              {/* NO edit button — view only in charts/modals */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── RECORD MODAL — view only, NO edit button ─────────────── */
function RecordModal({ record, onClose }) {
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div className="ap-modal-title">Staff Record: {record.staffId}</div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 8 }}>
          <div className="ap-gauge-wrap">
            <Gauge value={record.efficiency} color={statusColor(record.status)} size={100} />
            <div className="ap-gauge-val" style={{ color: statusColor(record.status) }}>{record.status.toUpperCase()}</div>
          </div>
          <div className="ap-detail-tiles" style={{ flex: 1 }}>
            {[['Staff ID',record.staffId],['Work Hours',record.hours+'h'],['Hourly Rate','Rs '+record.rate],['Net Payout',fmt(record.salary)],['Efficiency',record.efficiency+'%'],['Status',record.status.toUpperCase()]].map(([k,v],i)=>(
              <div key={i} className="ap-detail-tile">
                <div className="ap-detail-tile-label">{k}</div>
                <div className="ap-detail-tile-val" style={i===5?{color:statusColor(record.status)}:{}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* NO Edit Record button — use the ✏️ button in the Attendance table to edit */}
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', paddingTop: 12 }}>
          To edit this record, use the ✏️ edit button in the Attendance table.
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT/ADD MODAL ───────────────────────────────────────── */
function EditModal({ record, onClose, onSave }) {
  const [f, setF] = useState({ staffId: record?.staffId || '', hours: record?.hours || '', rate: record?.rate || '' });
  const h = parseFloat(f.hours) || 0, r = parseFloat(f.rate) || 0;
  const salary = h * r, eff = calcEff(h, r), status = getStatus(eff);
  const up = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!f.staffId.trim() || !f.hours || !f.rate) return;
    onSave({ ...(record||{}), id: record?.id||Date.now().toString(), staffId: f.staffId.trim().toUpperCase(), hours: h, rate: r, salary, efficiency: eff, status });
  };
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div className="ap-modal-title">{record ? 'Edit Record' : 'Add Staff'}</div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        {[['staffId','Staff ID','STF-011','text'],['hours','Work Hours','200','number'],['rate','Hourly Rate (Rs)','45','number']].map(([k,l,ph,t])=>(
          <div key={k} className="ap-form-group">
            <label className="ap-form-label">{l}</label>
            <input className="ap-form-input" type={t} value={f[k]} onChange={up(k)} placeholder={ph} />
          </div>
        ))}
        {h > 0 && r > 0 && (
          <div className="ap-form-preview">
            {[['Estimated Payout',fmt(salary)],['Efficiency',eff+'%'],['Status',status.toUpperCase()]].map(([k,v],i)=>(
              <div key={i} className="ap-form-preview-row">
                <span className="ap-form-preview-key">{k}</span>
                <span className="ap-form-preview-val" style={i>0?{color:statusColor(status)}:{}}>{v}</span>
              </div>
            ))}
          </div>
        )}
        <button className="ap-submit-btn" onClick={save}>{record ? 'Save Changes' : 'Add Record'}</button>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ────────────────────────────────────────────── */
function Dashboard({ records, onGroup }) {
  const opt=records.filter(r=>r.status==='optimal'),stb=records.filter(r=>r.status==='stable'),crt=records.filter(r=>r.status==='critical');
  const totalPayout=records.reduce((s,r)=>s+r.salary,0);
  const avgEff=records.length?Math.round(records.reduce((s,r)=>s+r.efficiency,0)/records.length):0;
  const pct=(n)=>records.length?Math.round((n/records.length)*100):0;
  const salaryData=records.slice(0,8).map(r=>({name:r.staffId.slice(-3),salary:r.salary}));
  const hoursData=records.slice(0,8).map(r=>({name:r.staffId.slice(-3),hours:r.hours}));
  const statusData=[{name:'Optimal',value:opt.length,color:'var(--green)'},{name:'Stable',value:stb.length,color:'var(--amber)'},{name:'Critical',value:crt.length,color:'var(--red)'}];
  const radialData=records.slice(0,5).map((r,i)=>({name:r.staffId.slice(-3),eff:r.efficiency,fill:['var(--green)','var(--accent)','var(--purple)','var(--amber)','var(--red)'][i]}));
  const corrData=records.map(r=>({name:r.staffId.slice(-3),efficiency:r.efficiency,salary:Math.round(r.salary/100)}));
  return (
    <>
      <div className="ap-grid-4">
        {[
          {color:'blue',icon:'💰',label:'Total Payout',val:fmt(totalPayout),sub:records.length+' staff',fn:null},
          {color:'green',icon:'✓',label:'Optimal Staff',val:opt.length,sub:pct(opt.length)+'% of workforce',fn:()=>onGroup('optimal')},
          {color:'red',icon:'✕',label:'Critical Staff',val:crt.length,sub:pct(crt.length)+'% of workforce',fn:()=>onGroup('critical')},
          {color:'purple',icon:'⚡',label:'Avg Efficiency',val:avgEff+'%',sub:'across all staff',fn:null},
        ].map((k,i)=>(
          <div key={i} className={`ap-stat-card ${k.color}`} onClick={k.fn||undefined} style={k.fn?{cursor:'pointer'}:{}}>
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={i>0?{color:['','var(--green)','var(--red)','var(--purple)'][i]}:{fontSize:20}}>{k.val}</div>
            <div className="ap-stat-sub">{k.sub}{k.fn?' · click to view':''}</div>
          </div>
        ))}
      </div>
      <div className="ap-grid-3">
        {[{label:'Optimal Group',g:'optimal',list:opt},{label:'Stable Group',g:'stable',list:stb},{label:'Critical Group',g:'critical',list:crt}].map((item,i)=>{
          const avg2=item.list.length?Math.round(item.list.reduce((s,r)=>s+r.efficiency,0)/item.list.length):0;
          return (
            <div key={i} className="ap-panel" style={{textAlign:'center',cursor:'pointer'}} onClick={()=>onGroup(item.g)}>
              <div className="ap-panel-title">{item.label} Avg <span className="ap-panel-sub">{item.list.length} members</span></div>
              <Gauge value={avg2} color={statusColor(item.g)} size={110} />
              <div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Click to view members →</div>
            </div>
          );
        })}
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Salary Distribution <span className="ap-panel-sub">top 8</span></div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={salaryData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis tick={{fontSize:10,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="salary" name="salary" radius={[3,3,0,0]} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Status Breakdown <span className="ap-panel-sub">by count</span></div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" nameKey="name" label={({name,percent})=>name+' '+Math.round(percent*100)+'%'} labelLine={false} fontSize={10}>
                {statusData.map((s,i)=><Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Work Hours Trend <span className="ap-panel-sub">per staff</span></div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={hoursData} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs><linearGradient id="purp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis tick={{fontSize:10,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="hours" name="hours" stroke="var(--purple)" fill="url(#purp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Top Efficiency Radial <span className="ap-panel-sub">top 5</span></div>
          <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
              <RadialBar dataKey="eff" cornerRadius={4} />
              <Tooltip content={<Tip />} />
              <Legend iconSize={8} wrapperStyle={{fontSize:10}} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-panel" style={{marginTop:14}}>
        <div className="ap-panel-title">Efficiency vs Salary Correlation <span className="ap-panel-sub">all staff</span></div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={corrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} />
            <YAxis yAxisId="l" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:'#6e6e73'}} />
            <Tooltip content={<Tip />} /><Legend wrapperStyle={{fontSize:10}} />
            <Line yAxisId="l" type="monotone" dataKey="efficiency" stroke="var(--green)" strokeWidth={2} dot={{r:3}} />
            <Line yAxisId="r" type="monotone" dataKey="salary" stroke="var(--accent)" strokeWidth={2} dot={{r:3}} name="salary ×100" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ─── ATTENDANCE ───────────────────────────────────────────── */
function Attendance({ records, setRecords, onGroup, fbAdd, fbUpdate, fbDelete }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const opt=records.filter(r=>r.status==='optimal'),stb=records.filter(r=>r.status==='stable'),crt=records.filter(r=>r.status==='critical');
  const pct=(n)=>records.length?Math.round((n/records.length)*100):0;
  const shown=records.filter(r=>(filter==='all'||r.status===filter)&&(!search||r.staffId.toLowerCase().includes(search.toLowerCase())));
  const effData=records.map(r=>({name:r.staffId.slice(-3),eff:r.efficiency,fill:statusColor(r.status)}));
  const payData=records.map(r=>({name:r.staffId.slice(-3),payout:r.salary}));

  const save=async(rec)=>{
    setSaving(true);
    try{const isNew=!records.find(r=>r.id===rec.id);if(isNew){const saved=await fbAdd(rec);setRecords(prev=>[...prev,saved]);}else{await fbUpdate(rec.id,rec);setRecords(prev=>prev.map(r=>r.id===rec.id?rec:r));}}
    catch(err){console.error('Save failed:',err);const isNew=!records.find(r=>r.id===rec.id);setRecords(prev=>isNew?[...prev,rec]:prev.map(r=>r.id===rec.id?rec:r));}
    finally{setSaving(false);setEditing(null);setAdding(false);}
  };
  const remove=async(id)=>{
    setSaving(true);
    try{await fbDelete(id);setRecords(prev=>prev.filter(x=>x.id!==id));}
    catch(err){console.error('Delete failed:',err);setRecords(prev=>prev.filter(x=>x.id!==id));}
    finally{setSaving(false);}
  };

  return (
    <>
      {saving&&(
        <div style={{position:'fixed',top:16,right:24,background:'var(--accent)',color:'#fff',padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:600,zIndex:2000,display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(10,132,255,0.4)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Syncing with Firebase...
        </div>
      )}
      <div className="ap-grid-3">
        {[{color:'green',icon:'✓',label:'Optimal Staff',list:opt,g:'optimal'},{color:'amber',icon:'⚠',label:'Stable Staff',list:stb,g:'stable'},{color:'red',icon:'✕',label:'Critical Staff',list:crt,g:'critical'}].map((k,i)=>(
          <div key={i} className={`ap-stat-card ${k.color}`} style={{cursor:'pointer'}} onClick={()=>onGroup(k.g)}>
            <div className={`ap-stat-icon ${k.color}`}>{k.icon}</div>
            <div className="ap-stat-label">{k.label}</div>
            <div className="ap-stat-value" style={{color:statusColor(k.g)}}>{k.list.length}</div>
            <div className="ap-stat-sub">{pct(k.list.length)}% of workforce · click to view</div>
          </div>
        ))}
      </div>
      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Efficiency by Staff <span className="ap-panel-sub">color coded</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={effData} margin={{top:0,right:0,left:-24,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:9,fill:'#6e6e73'}} /><YAxis domain={[0,100]} tick={{fontSize:9,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="eff" name="efficiency" radius={[3,3,0,0]}>{effData.map((d,i)=><Cell key={i} fill={d.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Payout Distribution <span className="ap-panel-sub">all staff</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={payData} margin={{top:4,right:4,left:-24,bottom:0}}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" tick={{fontSize:9,fill:'#6e6e73'}} /><YAxis tick={{fontSize:9,fill:'#6e6e73'}} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="payout" name="payout" stroke="var(--purple)" fill="url(#pg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="ap-filter-bar">
        {[{val:'all',label:'All',cls:''},{val:'optimal',label:'Optimal',cls:'green'},{val:'stable',label:'Stable',cls:'amber'},{val:'critical',label:'Critical',cls:'red'}].map(f=>(
          <button key={f.val} className={`ap-filter-btn ${f.cls} ${filter===f.val?'active':''}`} onClick={()=>setFilter(f.val)}>
            {f.label} ({f.val==='all'?records.length:records.filter(r=>r.status===f.val).length})
          </button>
        ))}
        <div className="ap-filter-spacer" />
        <button className="ap-add-btn" onClick={()=>setAdding(true)}>+ Add Staff</button>
      </div>
      <div className="ap-panel">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Staff ID</th><th>Hours</th><th>Rate</th><th>Net Salary</th><th>Efficiency</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map(r=>(
                <>
                  <tr key={r.id} className="data-row" onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                    <td style={{fontFamily:'var(--syne)',fontWeight:600}}>{r.staffId}</td>
                    <td>{r.hours}h</td><td>Rs {r.rate}</td>
                    <td style={{fontFamily:'var(--syne)',fontWeight:600}}>{fmt(r.salary)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="ap-eff-bar"><div className="ap-eff-fill" style={{width:r.efficiency+'%',background:statusColor(r.status)}} /></div>
                        <span className="ap-eff-text" style={{color:statusColor(r.status)}}>{r.efficiency}%</span>
                      </div>
                    </td>
                    <td><span className={`ap-badge ${r.status}`}>{statusIcon(r.status)} {statusLabel(r.status)}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      {/* 👁 View */}
                      <button className="ap-action-btn" title="View details" onClick={()=>setViewRecord(r)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {/* ✏️ Edit — ONLY available here in the table */}
                      <button className="ap-action-btn" title="Edit record" onClick={()=>setEditing(r)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {/* 🗑 Delete */}
                      <button className="ap-action-btn del" title="Delete record" onClick={()=>remove(r.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                  {expanded===r.id&&(
                    <tr key={r.id+'-x'} className="ap-expanded-row">
                      <td colSpan={7}>
                        <div className="ap-expanded-inner">
                          <div className="ap-gauge-wrap">
                            <Gauge value={r.efficiency} color={statusColor(r.status)} size={90} />
                            <div className="ap-gauge-val" style={{color:statusColor(r.status)}}>{r.status.toUpperCase()}</div>
                            <div className="ap-gauge-label">Efficiency</div>
                          </div>
                          <div className="ap-detail-tiles">
                            {[['Staff ID',r.staffId],['Hours',r.hours+'h'],['Rate','Rs '+r.rate],['Net Payout',fmt(r.salary)],['Efficiency',r.efficiency+'%'],['Status',r.status.toUpperCase()]].map(([k,v],i)=>(
                              <div key={i} className="ap-detail-tile">
                                <div className="ap-detail-tile-label">{k}</div>
                                <div className="ap-detail-tile-val" style={i===5?{color:statusColor(r.status)}:{}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {shown.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:24,color:'var(--muted)'}}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {/* View modal — NO edit button inside */}
      {viewRecord&&<RecordModal record={viewRecord} onClose={()=>setViewRecord(null)} />}
      {(editing||adding)&&<EditModal record={editing} onClose={()=>{setEditing(null);setAdding(false);}} onSave={save} />}
    </>
  );
}

/* ─── SETTINGS ─────────────────────────────────────────────── */
function Settings({ records, thresholds, setThresholds, adminPortalCode, setAdminPortalCode, onSaveAdminPortalCode, portalCodeSaving }) {
  const [local, setLocal] = useState({ ...thresholds });
  const [nextAdminCode, setNextAdminCode] = useState(adminPortalCode || DEFAULT_ADMIN_PORTAL_CODE);
  const recomputed=records.map(r=>({...r,status:getStatus(r.efficiency,local)}));
  const opt=recomputed.filter(r=>r.status==='optimal'),stb=recomputed.filter(r=>r.status==='stable'),crt=recomputed.filter(r=>r.status==='critical');
  const apply=()=>{THRESHOLDS.optimal=local.optimal;THRESHOLDS.stable=local.stable;setThresholds({...local});};
  const reset=()=>setLocal({optimal:75,stable:45});
  const critPct=local.stable,stbPct=local.optimal-local.stable,optPct=100-local.optimal;

  useEffect(() => {
    setNextAdminCode(adminPortalCode || DEFAULT_ADMIN_PORTAL_CODE);
  }, [adminPortalCode]);

  return (
    <div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Admin Security Code</div>
        <div className="ap-settings-sub">This static admin code is used only for admin portal login and can be changed here anytime.</div>
        <div className="ap-settings-inline">
          <input
            className="ap-settings-input"
            type="text"
            value={nextAdminCode}
            placeholder="Enter admin security code"
            onChange={(e) => setNextAdminCode(e.target.value)}
          />
          <button
            className="ap-settings-apply"
            onClick={() => {
              const trimmed = nextAdminCode.trim();
              if (!trimmed) return;
              setAdminPortalCode(trimmed);
              onSaveAdminPortalCode(trimmed);
            }}
            disabled={portalCodeSaving}
          >
            {portalCodeSaving ? "Saving..." : "Save Admin Code"}
          </button>
          <button
            className="ap-settings-reset"
            onClick={() => {
              setNextAdminCode(DEFAULT_ADMIN_PORTAL_CODE);
              setAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE);
              onSaveAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE);
            }}
            disabled={portalCodeSaving}
          >
            Reset Admin Code
          </button>
        </div>
      </div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Efficiency Thresholds</div>
        <div className="ap-settings-sub">Define boundary values for Optimal, Stable, and Critical classifications.</div>
        <div style={{height:28,borderRadius:8,overflow:'hidden',display:'flex',marginBottom:20,border:'1px solid var(--border)'}}>
          <div style={{width:critPct+'%',background:'rgba(255,69,58,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{critPct>10?'Critical 0\u2013'+local.stable+'%':''}</div>
          <div style={{width:stbPct+'%',background:'rgba(255,159,10,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{stbPct>12?'Stable '+local.stable+'\u2013'+local.optimal+'%':''}</div>
          <div style={{width:optPct+'%',background:'rgba(48,209,88,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:600,transition:'width 0.2s'}}>{optPct>10?'Optimal \u2265'+local.optimal+'%':''}</div>
        </div>
        {[['optimal','var(--green)','≥ threshold',local.stable+5,95,local.optimal,'optimal'],['stable','var(--amber)','≥ threshold',5,local.optimal-5,local.stable,'stable']].map(([key,color,range,min,max,val])=>(
          <div key={key} className="ap-threshold-row">
            <div className="ap-threshold-label">
              <div className="ap-threshold-label-name" style={{color}}>{key.charAt(0).toUpperCase()+key.slice(1)}</div>
              <div className="ap-threshold-label-range">{range}</div>
            </div>
            <input type="range" min={min} max={max} value={val} className="ap-threshold-slider"
              style={{background:`linear-gradient(to right, ${color} 0%, ${color} ${key==='stable'?(val/(local.optimal-5))*100:val}%, rgba(255,255,255,0.1) ${key==='stable'?(val/(local.optimal-5))*100:val}%, rgba(255,255,255,0.1) 100%)`}}
              onChange={e=>setLocal(p=>({...p,[key]:parseInt(e.target.value)}))} />
            <div className="ap-threshold-val" style={{color}}>{val}%</div>
          </div>
        ))}
        <div className="ap-threshold-row" style={{opacity:0.7}}>
          <div className="ap-threshold-label"><div className="ap-threshold-label-name" style={{color:'var(--red)'}}>Critical</div><div className="ap-threshold-label-range">&lt; stable</div></div>
          <div style={{flex:1,fontSize:12,color:'var(--muted)'}}>Automatically assigned when efficiency is below Stable threshold ({local.stable}%)</div>
          <div className="ap-threshold-val" style={{color:'var(--red)'}}>&lt;{local.stable}%</div>
        </div>
        <div style={{display:'flex'}}>
          <button className="ap-settings-apply" onClick={apply}>Apply Thresholds</button>
          <button className="ap-settings-reset" onClick={reset}>Reset to Default</button>
        </div>
      </div>
      <div className="ap-settings-section">
        <div className="ap-settings-title">Live Preview</div>
        <div className="ap-settings-sub">Staff classification with current threshold settings ({records.length} total records)</div>
        <div className="ap-settings-grid">
          {[{label:'Optimal Staff',val:opt.length,pct:records.length?Math.round(opt.length/records.length*100):0,color:'var(--green)',icon:'✓'},{label:'Stable Staff',val:stb.length,pct:records.length?Math.round(stb.length/records.length*100):0,color:'var(--amber)',icon:'⚠'},{label:'Critical Staff',val:crt.length,pct:records.length?Math.round(crt.length/records.length*100):0,color:'var(--red)',icon:'✕'}].map(({label,val,pct,color,icon})=>(
            <div key={label} className="ap-settings-metric" style={{borderColor:color+'44'}}>
              <div className="ap-settings-metric-val" style={{color}}>{icon} {val}</div>
              <div className="ap-settings-metric-label">{label}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pct}% of workforce</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ap-panel">
        <div className="ap-panel-title">Staff Efficiency Distribution <span className="ap-panel-sub">colored by thresholds</span></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={recomputed.map(r=>({name:r.staffId.slice(-3),eff:r.efficiency,status:r.status}))} margin={{top:4,right:4,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{fontSize:10,fill:'#6e6e73'}} /><YAxis domain={[0,100]} tick={{fontSize:10,fill:'#6e6e73'}} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="eff" radius={[4,4,0,0]}>{recomputed.map((r,i)=><Cell key={i} fill={statusColor(r.status)} opacity={0.85} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:'flex',gap:16,marginTop:10,justifyContent:'center'}}>
          {[
            {c:'var(--green)', t:'Optimal \u2265' + local.optimal + '%'},
            {c:'var(--amber)', t:'Stable \u2265' + local.stable + '%'},
            {c:'var(--red)',   t:'Critical <' + local.stable + '%'},
          ].map(({c,t})=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:c}}>
              <div style={{width:20,height:2,background:c}}/> {t}
            </div>
          ))}
        </div>
      </div>
      <div className="ap-panel" style={{marginTop:14}}>
        <div className="ap-panel-title">Hours vs Efficiency Scatter <span className="ap-panel-sub">each dot = 1 staff member</span></div>
        <div style={{position:'relative',height:200,padding:'0 8px'}}>
          <svg width="100%" height="200" viewBox="0 0 500 180">
            {[0,25,50,75,100].map(v=><g key={v}><line x1="40" y1={160-v*1.4} x2="500" y2={160-v*1.4} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x="34" y={163-v*1.4} textAnchor="end" fontSize="9" fill="#6e6e73">{v}</text></g>)}
            {[50,100,150,200,250].map(v=><g key={v}><line x1={40+v*1.7} y1="0" x2={40+v*1.7} y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x={40+v*1.7} y="172" textAnchor="middle" fontSize="9" fill="#6e6e73">{v}h</text></g>)}
            <line x1="40" y1={160-local.optimal*1.4} x2="500" y2={160-local.optimal*1.4} stroke="rgba(48,209,88,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
            <line x1="40" y1={160-local.stable*1.4} x2="500" y2={160-local.stable*1.4} stroke="rgba(255,159,10,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
            {recomputed.map((r,i)=>{const cx=40+Math.min(r.hours,250)*1.7,cy=160-r.efficiency*1.4,c=statusColor(r.status);return(<g key={i}><circle cx={cx} cy={cy} r="6" fill={c} opacity="0.8"/><circle cx={cx} cy={cy} r="6" fill="none" stroke={c} strokeWidth="2" opacity="0.3"/></g>);})}
            <text x="270" y="185" textAnchor="middle" fontSize="10" fill="#6e6e73">Work Hours</text>
            <text x="12" y="90" textAnchor="middle" fontSize="10" fill="#6e6e73" transform="rotate(-90,12,90)">Efficiency %</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT COMPONENT ───────────────────────────────────────── */
const CUSTOMER_FIELDS = [
  { key: "fullName", label: "Full Name", placeholder: "Kasun Perera", required: true },
  { key: "email", label: "Email", placeholder: "customer@iconx.lk", required: true, type: "email" },
  { key: "phone", label: "Phone", placeholder: "077 123 4567", required: true },
  { key: "role", label: "Role", placeholder: "customer", required: true },
  { key: "status", label: "Status", placeholder: "active", required: true },
];

const SELECT_CUSTOMER_FIELDS = [
  { key: "customerName", label: "Customer Name", placeholder: "Dilini Fernando", required: true },
  { key: "phone", label: "Phone", placeholder: "077 456 7890", required: true },
  { key: "interest", label: "Interested Product", placeholder: "iPhone 17 Pro Max", required: true },
  { key: "budget", label: "Budget", placeholder: "250000", required: true, type: "number" },
  { key: "status", label: "Status", placeholder: "follow-up", required: true },
];

const VENDOR_FIELDS = [
  { key: "vendorName", label: "Vendor Name", placeholder: "ABC Distributors", required: true },
  { key: "company", label: "Company", placeholder: "ABC Lanka (Pvt) Ltd", required: true },
  { key: "email", label: "Email", placeholder: "sales@vendor.lk", required: true, type: "email" },
  { key: "phone", label: "Phone", placeholder: "011 222 3344", required: true },
  { key: "category", label: "Category", placeholder: "Accessories", required: true },
  { key: "status", label: "Status", placeholder: "active", required: true },
];

const REVIEW_FIELDS = [
  { key: "name", label: "Name", placeholder: "Kasun Perera", required: true },
  { key: "phone", label: "Phone", placeholder: "077 123 4567", required: true },
  { key: "subject", label: "Subject", placeholder: "Need product support", required: true },
  { key: "message", label: "Message", placeholder: "Tell us what you need", required: true },
  { key: "status", label: "Status", placeholder: "new", required: true },
];

function normalizeCrudRecord(id, data) {
  return {
    id,
    ...data,
    fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "—",
    customerName: data.customerName || data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "—",
  };
}

function getDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const date = getDateValue(value);
  return date
    ? date.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function formatShortDate(value) {
  const date = getDateValue(value);
  return date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : "—";
}

function normalizeLabel(value, fallback = "Unknown") {
  return String(value || fallback).trim() || fallback;
}

function getTradeInValue(item) {
  return Number(item.trade_value ?? item.estimate) || 0;
}

function getTradeInCustomerName(item) {
  return item.customer_name || item.customerName || "—";
}

function getTradeInPhone(item) {
  return item.customer_phone || item.phone || "—";
}

function getTradeInModel(item) {
  return item.device_model || item.model || "—";
}

function getTradeInImei(item) {
  return item.IMEI || item.imei || "—";
}

function getTradeInStorage(item) {
  return item.storage || "—";
}

function getTradeInConditionSummary(item) {
  if (typeof item.condition === "string") return item.condition;

  if (item.condition && typeof item.condition === "object") {
    const flags = [];
    if (item.condition.powersOn) flags.push("Powers On");
    if (item.condition.screenCracked) flags.push("Screen Cracked");
    if (item.condition.backCracked) flags.push("Back Cracked");
    if (item.condition.buttonsWorking) flags.push("Buttons OK");
    if (item.condition.cameraWorking) flags.push("Camera OK");
    if (item.condition.batteryHealthy) flags.push("Battery OK");
    if (item.condition.waterDamage) flags.push("Water Damage");
    return flags.length ? flags.join(", ") : "—";
  }

  return "—";
}

function isMobileTradeIn(item) {
  const type = String(item.trade_type || item.deviceType || "").toLowerCase();
  return type.includes("mobile") || type.includes("smartphone") || (!type && (item.device_model || item.IMEI));
}

function groupCounts(items, getKey, limit = 6) {
  return Object.entries(
    items.reduce((acc, item) => {
      const key = normalizeLabel(getKey(item));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function buildTimeline(items, getValue) {
  return Object.values(
    items.reduce((acc, item) => {
      const date = getDateValue(item.createdAt || item.updatedAt);
      const key = date ? date.toISOString().slice(0, 10) : "undated";
      if (!acc[key]) {
        acc[key] = { label: date ? formatShortDate(date) : "No date", sortKey: key, value: 0 };
      }
      acc[key].value += getValue ? getValue(item) : 1;
      return acc;
    }, {})
  )
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-7);
}

function exportCrudCsv(title, items, fields) {
  const rows = [
    [...fields.map((field) => field.label), "Created At", "Updated At"],
    ...items.map((item) => [
      ...fields.map((field) => String(item[field.key] ?? "—").replace(/,/g, " ")),
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: `${title.toLowerCase().replace(/\s+/g, "_")}_report.csv`,
  });
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildCrudInsights(collectionName, items) {
  const lowerStatus = (item) => String(item.status || "").toLowerCase();

  if (collectionName === "products") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    const inactive = items.filter((item) => lowerStatus(item) === "inactive").length;
    const stockTotal = items.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const inventoryValue = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock_in) || 0), 0);
    return {
      metrics: [
        { label: "Products", value: items.length, tone: "blue", accent: "#0a84ff" },
        { label: "Active", value: active, tone: "green", accent: "#30d158" },
        { label: "Units In Stock", value: stockTotal, tone: "amber", accent: "#ff9f0a" },
        { label: "Inventory Value", value: fmt(inventoryValue), tone: "purple", accent: "#bf5af2" },
      ],
      donutTitle: "Product Status",
      donut: [
        { label: "Active", value: active, color: "#30d158" },
        { label: "Inactive", value: inactive, color: "#ff453a" },
      ].filter((item) => item.value > 0),
      barTitle: "Top Categories",
      bars: groupCounts(items, (item) => item.category),
      trendTitle: "Inventory Value Trend",
      trend: buildTimeline(items, (item) => (Number(item.price) || 0) * (Number(item.stock_in) || 0)),
      filename: "product_report.pdf",
    };
  }

  if (collectionName === "customers") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    const roleCount = groupCounts(items, (item) => item.role);
    return {
      metrics: [
        { label: "Customers", value: items.length, tone: "blue", accent: "#0a84ff" },
        { label: "Active", value: active, tone: "green", accent: "#30d158" },
        { label: "Inactive", value: Math.max(items.length - active, 0), tone: "red", accent: "#ff453a" },
        { label: "With Email", value: items.filter((item) => item.email).length, tone: "purple", accent: "#bf5af2" },
      ],
      donutTitle: "Customer Status",
      donut: groupCounts(items, (item) => item.status).map((item, index) => ({
        ...item,
        color: ["#30d158", "#ff9f0a", "#ff453a", "#bf5af2"][index % 4],
      })),
      barTitle: "Roles",
      bars: roleCount,
      trendTitle: "Customer Additions",
      trend: buildTimeline(items),
      filename: "customer_report.pdf",
    };
  }

  if (collectionName === "selectedCustomers") {
    const totalBudget = items.reduce((sum, item) => sum + (Number(item.budget) || 0), 0);
    return {
      metrics: [
        { label: "Leads", value: items.length, tone: "blue", accent: "#0a84ff" },
        { label: "Follow Ups", value: items.filter((item) => lowerStatus(item).includes("follow")).length, tone: "amber", accent: "#ff9f0a" },
        { label: "Hot Interest", value: items.filter((item) => item.interest).length, tone: "green", accent: "#30d158" },
        { label: "Budget Sum", value: fmt(totalBudget), tone: "purple", accent: "#bf5af2" },
      ],
      donutTitle: "Lead Status",
      donut: groupCounts(items, (item) => item.status).map((item, index) => ({
        ...item,
        color: ["#0a84ff", "#ff9f0a", "#30d158", "#ff453a"][index % 4],
      })),
      barTitle: "Interested Products",
      bars: groupCounts(items, (item) => item.interest),
      trendTitle: "Lead Creation Trend",
      trend: buildTimeline(items),
      filename: "selected_customer_report.pdf",
    };
  }

  if (collectionName === "vendors") {
    const active = items.filter((item) => lowerStatus(item) === "active").length;
    return {
      metrics: [
        { label: "Vendors", value: items.length, tone: "blue", accent: "#0a84ff" },
        { label: "Active", value: active, tone: "green", accent: "#30d158" },
        { label: "Categories", value: new Set(items.map((item) => normalizeLabel(item.category))).size, tone: "amber", accent: "#ff9f0a" },
        { label: "With Email", value: items.filter((item) => item.email).length, tone: "purple", accent: "#bf5af2" },
      ],
      donutTitle: "Vendor Status",
      donut: groupCounts(items, (item) => item.status).map((item, index) => ({
        ...item,
        color: ["#30d158", "#ff453a", "#ff9f0a", "#bf5af2"][index % 4],
      })),
      barTitle: "Vendor Categories",
      bars: groupCounts(items, (item) => item.category),
      trendTitle: "Vendor Creation Trend",
      trend: buildTimeline(items),
      filename: "vendor_report.pdf",
    };
  }

  if (collectionName === "customerReviews") {
    return {
      metrics: [
        { label: "Reviews", value: items.length, tone: "blue", accent: "#0a84ff" },
        { label: "New", value: items.filter((item) => lowerStatus(item) === "new").length, tone: "green", accent: "#30d158" },
        { label: "Resolved", value: items.filter((item) => ["closed", "resolved", "done"].includes(lowerStatus(item))).length, tone: "amber", accent: "#ff9f0a" },
        { label: "Open", value: items.filter((item) => !["closed", "resolved", "done"].includes(lowerStatus(item))).length, tone: "red", accent: "#ff453a" },
      ],
      donutTitle: "Review Status",
      donut: groupCounts(items, (item) => item.status).map((item, index) => ({
        ...item,
        color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
      })),
      barTitle: "Top Subjects",
      bars: groupCounts(items, (item) => item.subject),
      trendTitle: "Review Intake Trend",
      trend: buildTimeline(items),
      filename: "reviews_report.pdf",
    };
  }

  return {
    metrics: [
      { label: "Records", value: items.length, tone: "blue", accent: "#0a84ff" },
      { label: "With Status", value: items.filter((item) => item.status).length, tone: "green", accent: "#30d158" },
      { label: "Created", value: items.filter((item) => item.createdAt).length, tone: "amber", accent: "#ff9f0a" },
      { label: "Updated", value: items.filter((item) => item.updatedAt).length, tone: "purple", accent: "#bf5af2" },
    ],
    donutTitle: "Status Breakdown",
    donut: groupCounts(items, (item) => item.status).map((item, index) => ({
      ...item,
      color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
    })),
    barTitle: "Top Groups",
    bars: groupCounts(items, (item) => item.category || item.type || item.role || item.subject),
    trendTitle: "Creation Trend",
    trend: buildTimeline(items),
    filename: "crud_report.pdf",
  };
}

function exportCrudPdf({ title, items, fields, collectionName }) {
  const insights = buildCrudInsights(collectionName, items);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;

  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(10, 132, 255);
  doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 166, 176);
  doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  insights.metrics.slice(0, 4).forEach((item, index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24);
    doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setFillColor(...(item.accent === "#30d158" ? [48, 209, 88] : item.accent === "#ff453a" ? [255, 69, 58] : item.accent === "#ff9f0a" ? [255, 159, 10] : item.accent === "#bf5af2" ? [191, 90, 242] : [10, 132, 255]));
    doc.rect(x, 28, cardWidth, 1.2, "F");
    doc.setTextColor(160, 166, 176);
    doc.text(item.label, x + 4, 36);
    doc.setTextColor(245, 245, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(item.value), x + 4, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  });

  let y = 56;
  const addChart = (chartTitle, imgData, height = 42) => {
    if (y + height + 14 > 275) {
      doc.addPage();
      doc.setFillColor(9, 10, 15);
      doc.rect(0, 0, pageWidth, 297, "F");
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 245, 247);
    doc.text(chartTitle, margin, y + 5);
    doc.addImage(imgData, "PNG", margin, y + 8, pageWidth - margin * 2, height);
    y += height + 14;
  };

  if (insights.bars.length) {
    addChart(
      insights.barTitle,
      buildChart("bar", {
        labels: insights.bars.map((item) => item.label.slice(0, 10)),
        values: insights.bars.map((item) => item.value),
        color: "#0a84ff",
        width: 540,
        height: 190,
      }),
      44
    );
  }

  if (insights.trend.length) {
    addChart(
      insights.trendTitle,
      buildChart("area", {
        labels: insights.trend.map((item) => item.label),
        values: insights.trend.map((item) => item.value),
        color: "#bf5af2",
        width: 540,
        height: 190,
      }),
      44
    );
  }

  if (insights.donut.length) {
    addChart(
      insights.donutTitle,
      buildChart("donut", { slices: insights.donut, width: 540, height: 200 }),
      48
    );
  }

  autoTable(doc, {
    startY: y,
    head: [[...fields.map((field) => field.label), "Created", "Updated"]],
    body: items.slice(0, 24).map((item) => [
      ...fields.map((field) => item[field.key] || "—"),
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
    ]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  const totalPages = doc.getNumberOfPages();
  for (let index = 1; index <= totalPages; index += 1) {
    doc.setPage(index);
    doc.setFillColor(9, 10, 15);
    doc.rect(0, 285, pageWidth, 12, "F");
    doc.setFillColor(10, 132, 255);
    doc.rect(0, 295, pageWidth, 2, "F");
    doc.setTextColor(160, 166, 176);
    doc.setFontSize(8);
    doc.text(`Page ${index} of ${totalPages}`, pageWidth / 2, 291, { align: "center" });
    doc.text("iconX Admin Reports", margin, 291);
  }

  doc.save(insights.filename);
}

function CrudEntityModal({ title, fields, initialData, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    const next = {};
    fields.forEach((field) => {
      next[field.key] = initialData?.[field.key] ?? "";
    });
    return next;
  });

  const up = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-header">
          <div className="ap-modal-title">{title}</div>
          <button className="ap-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          {fields.map((field) => (
            <div className="ap-form-group" key={field.key}>
              <label className="ap-form-label">{field.label}</label>
              <input
                className="ap-form-input"
                type={field.type || "text"}
                value={form[field.key]}
                onChange={up(field.key)}
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}
          <button className="ap-submit-btn" type="submit">
            {initialData?.id ? "Update Record" : "Create Record"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CrudPanel({ title, collectionName, fields, search, primaryKey, description }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        setItems(snapshot.docs.map((d) => normalizeCrudRecord(d.id, d.data())));
        setBusy(false);
      },
      (err) => {
        console.error(`Failed loading ${collectionName}:`, err);
        setItems([]);
        setBusy(false);
      }
    );

    return unsub;
  }, [collectionName]);

  const filtered = items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes((search || "").toLowerCase())
  );
  const insights = buildCrudInsights(collectionName, filtered);

  const saveRecord = async (payload) => {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    );

    if (modal?.id) {
      await updateDoc(doc(db, collectionName, modal.id), {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, collectionName), {
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setModal(null);
  };

  const removeRecord = async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return (
    <>
      <div className="ap-filter-bar">
        <div>
          <div className="ap-settings-title">{title}</div>
          <div className="ap-settings-sub">{description}</div>
        </div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportCrudPdf({ title, items: filtered, fields, collectionName })}>
          Export PDF
        </button>
        <button className="ap-export-btn excel" onClick={() => exportCrudCsv(title, filtered, fields)}>
          Export CSV
        </button>
        <button className="ap-add-btn" onClick={() => setModal({})}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New
        </button>
      </div>

      <div className="ap-grid-4">
        {insights.metrics.map((item) => (
          <div key={item.label} className={`ap-stat-card ${item.tone}`}>
            <div className={`ap-stat-icon ${item.tone}`}>{item.label.charAt(0)}</div>
            <div className="ap-stat-label">{item.label}</div>
            <div className="ap-stat-value" style={{ color: item.accent }}>{item.value}</div>
            <div className="ap-stat-sub">Filtered {primaryKey.toLowerCase()} insights</div>
          </div>
        ))}
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">{insights.barTitle}<span className="ap-panel-sub">Grouped from current results</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={insights.bars.map((item) => ({ name: item.label, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" fill="#0a84ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">{insights.donutTitle}<span className="ap-panel-sub">Live status distribution</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={insights.donut} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {insights.donut.map((item) => <Cell key={item.label} fill={item.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">{insights.trendTitle}<span className="ap-panel-sub">Recent activity across saved records</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={insights.trend.map((item) => ({ name: item.label, value: item.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="value" stroke="#bf5af2" fill="rgba(191,90,242,0.25)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ap-panel">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                {fields.map((field) => <th key={field.key}>{field.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {busy && <tr><td colSpan={fields.length + 1} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading...</td></tr>}
              {!busy && filtered.map((item) => (
                <tr key={item.id} className="data-row">
                  {fields.map((field, idx) => (
                    <td key={field.key} style={idx === 0 ? { fontFamily: "var(--syne)", fontWeight: 600 } : {}}>
                      {item[field.key] || "—"}
                    </td>
                  ))}
                  <td>
                    <button className="ap-action-btn" onClick={() => setModal(item)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button className="ap-action-btn del" onClick={() => removeRecord(item.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!busy && filtered.length === 0 && (
                <tr><td colSpan={fields.length + 1} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No {primaryKey.toLowerCase()} records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudEntityModal
          title={`${modal.id ? "Edit" : "Add"} ${primaryKey}`}
          fields={fields}
          initialData={modal}
          onClose={() => setModal(null)}
          onSave={saveRecord}
        />
      )}
    </>
  );
}

function exportCommercePdf(orders, cartItems) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const orderStatus = groupCounts(orders, (order) => order.status);
  const topProducts = groupCounts(
    orders.flatMap((order) => order.items || []),
    (item) => item.name
  );
  const revenueTrend = buildTimeline(orders, (order) => Number(order.total) || 0);

  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(10, 132, 255);
  doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Commerce Report", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 166, 176);
  doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });

  const cards = [
    ["Orders", orders.length],
    ["Revenue", fmt(totalRevenue)],
    ["Cart Items", cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)],
    ["Pending", orders.filter((order) => String(order.status || "").toLowerCase() === "pending").length],
  ];
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24);
    doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setTextColor(160, 166, 176);
    doc.text(String(label), x + 4, 36);
    doc.setTextColor(245, 245, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(value), x + 4, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  });

  let y = 56;
  const addChart = (title, imgData, height = 44) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 245, 247);
    doc.text(title, margin, y + 5);
    doc.addImage(imgData, "PNG", margin, y + 8, pageWidth - margin * 2, height);
    y += height + 14;
  };

  if (topProducts.length) {
    addChart("Top Ordered Products", buildChart("bar", {
      labels: topProducts.map((item) => item.label.slice(0, 10)),
      values: topProducts.map((item) => item.value),
      color: "#0a84ff",
      width: 540,
      height: 190,
    }));
  }

  if (revenueTrend.length) {
    addChart("Revenue Trend", buildChart("area", {
      labels: revenueTrend.map((item) => item.label),
      values: revenueTrend.map((item) => item.value),
      color: "#30d158",
      width: 540,
      height: 190,
    }));
  }

  if (orderStatus.length) {
    addChart("Order Status Mix", buildChart("donut", {
      slices: orderStatus.map((item, index) => ({
        ...item,
        color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
      })),
      width: 540,
      height: 200,
    }), 48);
  }

  autoTable(doc, {
    startY: y,
    head: [["Order ID", "Customer", "Items", "Total", "Status", "Created"]],
    body: orders.slice(0, 20).map((order) => [
      order.id,
      order.customer?.fullName || "—",
      (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
      fmt(order.total),
      order.status || "—",
      formatDateTime(order.createdAt),
    ]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Cart Item", "Price", "Qty", "Subtotal"]],
    body: cartItems.map((item) => [
      item.name || "—",
      fmt(item.price),
      item.quantity || 1,
      fmt((Number(item.price) || 0) * (item.quantity || 1)),
    ]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  doc.save("commerce_report.pdf");
}

function CommercePanel({ search }) {
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const syncCart = () => setCartItems(getCartItems());
    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    const unsub = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setBusy(false);
      },
      (error) => {
        console.error("Failed loading orders:", error);
        setOrders([]);
        setBusy(false);
      }
    );

    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
      unsub();
    };
  }, []);

  const filteredOrders = orders.filter((order) =>
    JSON.stringify(order).toLowerCase().includes((search || "").toLowerCase())
  );
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const pendingCount = filteredOrders.filter((order) => String(order.status || "").toLowerCase() === "pending").length;
  const fulfilledCount = filteredOrders.filter((order) => ["paid", "completed", "delivered"].includes(String(order.status || "").toLowerCase())).length;
  const cartQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const statusData = groupCounts(filteredOrders, (order) => order.status).map((item, index) => ({
    ...item,
    color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
  }));
  const topProducts = groupCounts(filteredOrders.flatMap((order) => order.items || []), (item) => item.name);
  const revenueTrend = buildTimeline(filteredOrders, (order) => Number(order.total) || 0);

  return (
    <>
      <div className="ap-filter-bar">
        <div>
          <div className="ap-settings-title">Commerce Report</div>
          <div className="ap-settings-sub">Combine live cart state with placed orders for a single admin report.</div>
        </div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportCommercePdf(filteredOrders, cartItems)}>
          Export Commerce PDF
        </button>
      </div>

      <div className="ap-grid-4">
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">O</div><div className="ap-stat-label">Orders</div><div className="ap-stat-value">{filteredOrders.length}</div><div className="ap-stat-sub">Orders in current view</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">R</div><div className="ap-stat-label">Revenue</div><div className="ap-stat-value" style={{ color: "var(--green)" }}>{fmt(totalRevenue)}</div><div className="ap-stat-sub">Total order value</div></div>
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">C</div><div className="ap-stat-label">Cart Qty</div><div className="ap-stat-value" style={{ color: "var(--amber)" }}>{cartQty}</div><div className="ap-stat-sub">Live local cart snapshot</div></div>
        <div className="ap-stat-card purple"><div className="ap-stat-icon purple">P</div><div className="ap-stat-label">Pending</div><div className="ap-stat-value" style={{ color: "var(--purple)" }}>{pendingCount}</div><div className="ap-stat-sub">{fulfilledCount} fulfilled or completed</div></div>
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Top Ordered Products <span className="ap-panel-sub">Across filtered orders</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts.map((item) => ({ name: item.label, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" fill="#0a84ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Order Status <span className="ap-panel-sub">Live distribution</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusData.map((item) => <Cell key={item.label} fill={item.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">Revenue Trend <span className="ap-panel-sub">Most recent order activity</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueTrend.map((item) => ({ name: item.label, value: item.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="value" stroke="#30d158" fill="rgba(48,209,88,0.25)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Orders <span className="ap-panel-sub">{busy ? "Loading..." : `${filteredOrders.length} records`}</span></div>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {busy && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading orders...</td></tr>}
                {!busy && filteredOrders.map((order) => (
                  <tr key={order.id} className="data-row">
                    <td>{order.customer?.fullName || "—"}</td>
                    <td>{(order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)}</td>
                    <td>{fmt(order.total)}</td>
                    <td>{order.status || "—"}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
                {!busy && filteredOrders.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-title">Live Cart Snapshot <span className="ap-panel-sub">{cartItems.length} line items in browser cart</span></div>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="data-row">
                    <td>{item.name || "—"}</td>
                    <td>{fmt(item.price)}</td>
                    <td>{item.quantity || 1}</td>
                    <td>{fmt((Number(item.price) || 0) * (item.quantity || 1))}</td>
                  </tr>
                ))}
                {cartItems.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Cart is empty in this browser session</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function exportTradeInPdf(items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const mobileOnly = items.filter(isMobileTradeIn);
  const brandMix = groupCounts(mobileOnly, (item) => item.brand);
  const statusMix = groupCounts(mobileOnly, (item) => item.status).map((item, index) => ({
    ...item,
    color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
  }));
  const estimateTrend = buildTimeline(mobileOnly, (item) => getTradeInValue(item));

  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(10, 132, 255);
  doc.rect(0, 0, pageWidth, 2, "F");
  doc.setTextColor(245, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Mobile Trade-In Report", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 166, 176);
  doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - margin, 18, { align: "right" });

  const cards = [
    ["Mobile Leads", mobileOnly.length],
    ["Avg Estimate", fmt(mobileOnly.length ? Math.round(mobileOnly.reduce((sum, item) => sum + getTradeInValue(item), 0) / mobileOnly.length) : 0)],
    ["Pending", mobileOnly.filter((item) => String(item.status || "").toLowerCase() === "pending").length],
    ["Brands", new Set(mobileOnly.map((item) => item.brand || "Unknown")).size],
  ];
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  cards.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setFillColor(17, 19, 24);
    doc.roundedRect(x, 28, cardWidth, 20, 2, 2, "F");
    doc.setTextColor(160, 166, 176);
    doc.text(String(label), x + 4, 36);
    doc.setTextColor(245, 245, 247);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(value), x + 4, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  });

  doc.text("Brand Mix", margin, 60);
  doc.addImage(buildChart("bar", {
    labels: brandMix.map((item) => item.label.slice(0, 10)),
    values: brandMix.map((item) => item.value),
    color: "#0a84ff",
    width: 540,
    height: 190,
  }), "PNG", margin, 64, pageWidth - margin * 2, 44);

  doc.text("Estimate Trend", margin, 116);
  doc.addImage(buildChart("area", {
    labels: estimateTrend.map((item) => item.label),
    values: estimateTrend.map((item) => item.value),
    color: "#30d158",
    width: 540,
    height: 190,
  }), "PNG", margin, 120, pageWidth - margin * 2, 44);

  if (statusMix.length) {
    doc.text("Status Mix", margin, 176);
    doc.addImage(buildChart("donut", {
      slices: statusMix,
      width: 540,
      height: 200,
    }), "PNG", margin, 180, pageWidth - margin * 2, 48);
  }

  doc.addPage();
  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, pageWidth, 297, "F");
  autoTable(doc, {
    startY: 16,
    head: [["Customer", "Phone", "Brand", "Model", "IMEI", "Estimate", "Status", "Created"]],
    body: mobileOnly.map((item) => [
      getTradeInCustomerName(item),
      getTradeInPhone(item),
      item.brand || "—",
      getTradeInModel(item),
      getTradeInImei(item),
      fmt(getTradeInValue(item)),
      item.status || "—",
      formatDateTime(item.createdAt),
    ]),
    theme: "plain",
    headStyles: { fillColor: [17, 19, 24], textColor: [160, 166, 176], fontSize: 8 },
    bodyStyles: { fillColor: [9, 10, 15], textColor: [245, 245, 247], fontSize: 8 },
    alternateRowStyles: { fillColor: [17, 19, 24] },
    margin: { left: margin, right: margin },
  });

  doc.save("mobile_trade_in_report.pdf");
}

function TradeInPanel({ search }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "tradeIns"),
      (snapshot) => {
        setItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setBusy(false);
      },
      (error) => {
        console.error("Failed loading trade-ins:", error);
        setItems([]);
        setBusy(false);
      }
    );

    return unsub;
  }, []);

  const filtered = items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes((search || "").toLowerCase())
  );
  const mobileOnly = filtered.filter(isMobileTradeIn);
  const avgEstimate = mobileOnly.length ? Math.round(mobileOnly.reduce((sum, item) => sum + getTradeInValue(item), 0) / mobileOnly.length) : 0;
  const brandMix = groupCounts(mobileOnly, (item) => item.brand);
  const statusMix = groupCounts(mobileOnly, (item) => item.status).map((item, index) => ({
    ...item,
    color: ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a"][index % 4],
  }));
  const estimateTrend = buildTimeline(mobileOnly, (item) => getTradeInValue(item));

  return (
    <>
      <div className="ap-filter-bar">
        <div>
          <div className="ap-settings-title">Mobile Trade-In</div>
          <div className="ap-settings-sub">Visual report for mobile trade-in requests saved from the trade-in calculator.</div>
        </div>
        <div className="ap-filter-spacer" />
        <button className="ap-export-btn pdf" onClick={() => exportTradeInPdf(filtered)}>
          Export Trade-In PDF
        </button>
      </div>

      <div className="ap-grid-4">
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">M</div><div className="ap-stat-label">Mobile Leads</div><div className="ap-stat-value">{mobileOnly.length}</div><div className="ap-stat-sub">Smartphone trade-ins in current view</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">A</div><div className="ap-stat-label">Avg Estimate</div><div className="ap-stat-value" style={{ color: "var(--green)" }}>{fmt(avgEstimate)}</div><div className="ap-stat-sub">Average expected value</div></div>
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">P</div><div className="ap-stat-label">Pending Requests</div><div className="ap-stat-value" style={{ color: "var(--amber)" }}>{mobileOnly.filter((item) => String(item.status || "").toLowerCase() === "pending").length}</div><div className="ap-stat-sub">Awaiting staff follow-up</div></div>
        <div className="ap-stat-card purple"><div className="ap-stat-icon purple">B</div><div className="ap-stat-label">Brands</div><div className="ap-stat-value" style={{ color: "var(--purple)" }}>{new Set(mobileOnly.map((item) => item.brand || "Unknown")).size}</div><div className="ap-stat-sub">Distinct mobile brands</div></div>
      </div>

      <div className="ap-grid-2">
        <div className="ap-panel">
          <div className="ap-panel-title">Brand Demand <span className="ap-panel-sub">Saved mobile trade-ins</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandMix.map((item) => ({ name: item.label, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" fill="#0a84ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="ap-panel">
          <div className="ap-panel-title">Status Breakdown <span className="ap-panel-sub">Trade-in pipeline health</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusMix} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusMix.map((item) => <Cell key={item.label} fill={item.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">Estimate Trend <span className="ap-panel-sub">Recent mobile valuation movement</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={estimateTrend.map((item) => ({ name: item.label, value: item.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6e6e73" }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="value" stroke="#30d158" fill="rgba(48,209,88,0.25)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ap-panel">
        <div className="ap-panel-title">Mobile Trade-In Requests <span className="ap-panel-sub">{busy ? "Loading..." : `${mobileOnly.length} mobile entries`}</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Brand</th>
                <th>Model</th>
                <th>IMEI</th>
                <th>Storage</th>
                <th>Estimate</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {busy && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading trade-in requests...</td></tr>}
              {!busy && mobileOnly.map((item) => (
                <tr key={item.id} className="data-row">
                  <td>{getTradeInCustomerName(item)}</td>
                  <td>{getTradeInPhone(item)}</td>
                  <td>{item.brand || "—"}</td>
                  <td>{getTradeInModel(item)}</td>
                  <td>{getTradeInImei(item)}</td>
                  <td>{getTradeInStorage(item)}</td>
                  <td>{fmt(getTradeInValue(item))}</td>
                  <td>{item.status || "—"}</td>
                  <td>{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!busy && mobileOnly.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No mobile trade-in requests found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ap-panel" style={{ marginTop: 16 }}>
        <div className="ap-panel-title">Condition Summary <span className="ap-panel-sub">Submitted exactly from the trade-in form</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Model</th>
                <th>Condition Details</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {mobileOnly.map((item) => (
                <tr key={`${item.id}-condition`} className="data-row">
                  <td>{getTradeInCustomerName(item)}</td>
                  <td>{getTradeInModel(item)}</td>
                  <td>{getTradeInConditionSummary(item)}</td>
                  <td>{item.notes || "—"}</td>
                </tr>
              ))}
              {mobileOnly.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No condition details found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function formatRequestDate(value) {
  const parsed = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmployeeAccessPanel({ requests, search, onUpdateStatus, savingId }) {
  const term = (search || "").trim().toLowerCase();
  const filtered = requests.filter((item) =>
    !term || [item.fullName, item.firstName, item.lastName, item.email, item.phone, item.accessStatus]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  );
  const pendingCount = requests.filter((item) => item.accessStatus === "pending").length;
  const approvedCount = requests.filter((item) => item.accessStatus === "approved").length;
  const rejectedCount = requests.filter((item) => item.accessStatus === "rejected").length;

  return (
    <>
      <div className="ap-grid-4">
        <div className="ap-stat-card amber"><div className="ap-stat-icon amber">P</div><div className="ap-stat-label">Pending Requests</div><div className="ap-stat-value" style={{ color: "var(--amber)" }}>{pendingCount}</div><div className="ap-stat-sub">Awaiting admin approval</div></div>
        <div className="ap-stat-card green"><div className="ap-stat-icon green">A</div><div className="ap-stat-label">Approved Staff</div><div className="ap-stat-value" style={{ color: "var(--green)" }}>{approvedCount}</div><div className="ap-stat-sub">Employees cleared for portal access</div></div>
        <div className="ap-stat-card red"><div className="ap-stat-icon red">R</div><div className="ap-stat-label">Rejected Requests</div><div className="ap-stat-value" style={{ color: "var(--red)" }}>{rejectedCount}</div><div className="ap-stat-sub">Blocked from staff portal</div></div>
        <div className="ap-stat-card blue"><div className="ap-stat-icon blue">T</div><div className="ap-stat-label">Total Requests</div><div className="ap-stat-value">{requests.length}</div><div className="ap-stat-sub">Employee signup records in users collection</div></div>
      </div>

      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-title">Employee Access Requests <span className="ap-panel-sub">Approve staff only after verifying their real identity</span></div>
        {filtered.length === 0 ? (
          <div className="ap-request-empty">No employee access requests match the current search.</div>
        ) : (
          <div className="ap-request-list">
            {filtered.map((item) => (
              <div key={item.uid} className="ap-request-card">
                <div className="ap-request-head">
                  <div>
                    <div className="ap-request-name">{item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed Employee"}</div>
                    <div className="ap-request-email">{item.email || "No email"} {item.phone ? `• ${item.phone}` : ""}</div>
                  </div>
                  <span className={`ap-request-badge ${item.accessStatus || "pending"}`}>{item.accessStatus || "pending"}</span>
                </div>

                <div className="ap-request-meta">
                  <div className="ap-request-meta-card"><span>Requested</span><strong>{formatRequestDate(item.requestedAt || item.createdAt)}</strong></div>
                  <div className="ap-request-meta-card"><span>Role</span><strong>{item.role || "employee"}</strong></div>
                  <div className="ap-request-meta-card"><span>Approved By</span><strong>{item.approvedByName || item.approvedBy || "-"}</strong></div>
                  <div className="ap-request-meta-card"><span>Approved At</span><strong>{formatRequestDate(item.approvedAt)}</strong></div>
                </div>

                <div className="ap-request-actions">
                  <button className="ap-request-btn approve" onClick={() => onUpdateStatus(item.uid, "approved")} disabled={savingId === item.uid}>Approve Access</button>
                  <button className="ap-request-btn reject" onClick={() => onUpdateStatus(item.uid, "rejected")} disabled={savingId === item.uid}>Reject Request</button>
                  <button className="ap-request-btn pending" onClick={() => onUpdateStatus(item.uid, "pending")} disabled={savingId === item.uid}>Mark Pending</button>
                </div>
                {item.employeeSecurityCode && (
                  <div className="ap-request-code">
                    <span>Employee Security Code</span>
                    <strong>{item.employeeSecurityCode}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('iconx_admin_theme') || 'dark');
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [thresholds, setThresholds] = useState({ optimal: 75, stable: 45 });
  const [loading, setLoading] = useState(true);
  const [employeeMetrics, setEmployeeMetrics] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [requestSavingId, setRequestSavingId] = useState("");
  const [adminPortalCode, setAdminPortalCode] = useState(DEFAULT_ADMIN_PORTAL_CODE);
  const [portalCodeSaving, setPortalCodeSaving] = useState(false);
  const injected = useRef(false);

  const liveRecords = records.map(r => ({ ...r, status: getStatus(r.efficiency, thresholds) }));

  useEffect(() => {
    if (injected.current) return; injected.current = true;
    const s = document.createElement('style'); s.textContent = STYLES; document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  useEffect(() => {
    localStorage.setItem('iconx_admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    setLoading(true);
    fbGetAll()
      .then(data => setRecords(data.length ? data : MOCK))
      .catch(err => { console.error('Firebase load error:', err); setRecords(MOCK); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "employeeAttendance"),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data(), salesCount: Number(item.data().salesCount) || 0 }))
          .sort((a, b) => `${b.date || ""}${b.checkIn || ""}`.localeCompare(`${a.date || ""}${a.checkIn || ""}`));

        setEmployeeMetrics(rows);
      },
      (error) => {
        console.error("Employee attendance metrics load error:", error);
        setEmployeeMetrics([]);
      }
    );

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => ({ uid: item.id, ...item.data() }))
          .filter((item) => String(item.role || "").toLowerCase() === "employee")
          .sort((a, b) => {
            const aTime = a.requestedAt?.seconds || a.createdAt?.seconds || 0;
            const bTime = b.requestedAt?.seconds || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setEmployeeRequests(rows);
      },
      (error) => {
        console.error("Employee request load error:", error);
        setEmployeeRequests([]);
      }
    );

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC),
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        setAdminPortalCode(String(data.adminCode || DEFAULT_ADMIN_PORTAL_CODE));
      },
      (error) => {
        console.error("Portal code load error:", error);
        setAdminPortalCode(DEFAULT_ADMIN_PORTAL_CODE);
      }
    );

    return unsub;
  }, []);

  const openGroup = useCallback((g) => setModal({ type: 'group', group: g }), []);

  /* ── Logout: signs out and redirects to /login ── */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateEmployeeAccess = async (uid, accessStatus) => {
    setRequestSavingId(uid);
    try {
      const target = employeeRequests.find((item) => item.uid === uid);
      const nextEmployeeSecurityCode = accessStatus === "approved"
        ? String(target?.employeeSecurityCode || generateEmployeePortalCode(target?.fullName || target?.email || uid))
        : "";
      await updateDoc(doc(db, "users", uid), {
        accessStatus,
        status: accessStatus,
        approvedAt: accessStatus === "approved" ? serverTimestamp() : null,
        approvedBy: auth.currentUser?.uid || "",
        approvedByName: auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
        employeeSecurityCode: nextEmployeeSecurityCode,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update employee access:", error);
    } finally {
      setRequestSavingId("");
    }
  };

  const saveAdminPortalCode = async (nextCode) => {
    setPortalCodeSaving(true);
    try {
      await setDoc(
        doc(db, PORTAL_SETTINGS_COLLECTION, PORTAL_SETTINGS_DOC),
        {
          adminCode: String(nextCode || DEFAULT_ADMIN_PORTAL_CODE),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || "",
          updatedByName: auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Failed to save admin portal code:", error);
    } finally {
      setPortalCodeSaving(false);
    }
  };

  const NAV = [
    { k: 'dashboard', l: 'Dashboard' }, { k: 'product', l: 'Product Details' },
    { k: 'customer', l: 'Customer Details' }, { k: 'select', l: 'Select Customer' },
    { k: 'vendor', l: 'Vendor' }, { k: 'reviews', l: 'Customer Reviews' }, { k: 'orders', l: 'Cart & Orders' }, { k: 'tradeIn', l: 'Mobile Trade-In' },
    { k: 'attendance', l: 'Salary' }, { k: 'employeePerformance', l: 'Employee Insights' }, { k: 'employeeAccess', l: 'Employee Access' }, { k: 'settings', l: 'Settings' },
  ];

  return (
    <div className="ap-root" data-theme={theme}>
      <div className="ap-sidebar">
        <div className="ap-brand">
          <div className="ap-brand-logo">icon<span>X</span></div>
          <div className="ap-brand-sub">Admin System</div>
        </div>
        <div className="ap-profile">
          <div className="ap-avatar">RA</div>
          <div className="ap-profile-info">
            <div className="ap-profile-name">Root Admin</div>
            <div className="ap-profile-role">Super Administrator</div>
          </div>
          <div className="ap-online-dot" />
        </div>
        <div className="ap-nav">
          <div className="ap-nav-label">Navigation</div>
          {NAV.map(n => (
            <button key={n.k} className={`ap-nav-btn ${tab === n.k ? 'active' : ''}`} onClick={() => setTab(n.k)}>
              {I[n.k] || I.dashboard}
              {n.l}
            </button>
          ))}
        </div>
        <div className="ap-sidebar-bottom">
          <button className="ap-export-btn excel" onClick={() => navigate('/employee-admin')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Employee Attendance
          </button>
          {/* ── LOGOUT BUTTON ── */}
          <button className="ap-logout-btn" onClick={handleLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="ap-main">
        <div className="ap-topbar">
          <div className="ap-topbar-title">{NAV.find(n => n.k === tab)?.l}</div>
          <div className="ap-topbar-right">
            <button className="ap-theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <input className="ap-search" placeholder={tab === 'employeePerformance' ? 'Search attendance or sales...' : tab === 'employeeAccess' ? 'Search employee requests...' : 'Search staff...'} value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px' }}>
              {loading ? 'Loading...' : (tab === 'employeePerformance' ? employeeMetrics.length : tab === 'employeeAccess' ? employeeRequests.length : records.length) + ' records'}
            </div>
          </div>
        </div>
        <div className="ap-content">
          {loading ? (
            <div className="ap-placeholder">
              <div style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}>⟳</div>
              <div className="ap-placeholder-text">Loading from Firebase...</div>
            </div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard records={liveRecords} onGroup={openGroup} />}
              {tab === 'attendance' && (
                <AttendancePanel
                  records={liveRecords}
                  setRecords={setRecords}
                  onGroup={openGroup}
                  fbAdd={fbAdd}
                  fbUpdate={fbUpdate}
                  fbDelete={fbDelete}
                  statusColor={statusColor}
                  statusLabel={statusLabel}
                  statusIcon={statusIcon}
                  fmt={fmt}
                  calcEff={calcEff}
                  getStatus={getStatus}
                  Gauge={Gauge}
                  Tip={Tip}
                  onExportPdf={() => exportPDF(liveRecords)}
                  onExportCsv={() => exportExcel(liveRecords)}
                />
              )}
              {tab === 'employeePerformance' && <EmployeeAnalyticsPanel records={employeeMetrics} search={search} />}
              {tab === 'employeeAccess' && <EmployeeAccessPanel requests={employeeRequests} search={search} onUpdateStatus={updateEmployeeAccess} savingId={requestSavingId} />}
              {tab === 'settings' && <Settings records={liveRecords} thresholds={thresholds} setThresholds={setThresholds} adminPortalCode={adminPortalCode} setAdminPortalCode={setAdminPortalCode} onSaveAdminPortalCode={saveAdminPortalCode} portalCodeSaving={portalCodeSaving} />}
              {tab === 'product' && <ProductAdmin />}
              {tab === 'customer' && (
                <CrudPanel
                  title="Customer Details"
                  collectionName="customers"
                  fields={CUSTOMER_FIELDS}
                  primaryKey="Customer"
                  description="Manage customer profiles stored in Firebase."
                  search={search}
                />
              )}
              {tab === 'select' && (
                <CrudPanel
                  title="Select Customer"
                  collectionName="selectedCustomers"
                  fields={SELECT_CUSTOMER_FIELDS}
                  primaryKey="Selected Customer"
                  description="Track follow-ups, product interest, and conversion-ready customers."
                  search={search}
                />
              )}
              {tab === 'vendor' && (
                <CrudPanel
                  title="Vendor"
                  collectionName="vendors"
                  fields={VENDOR_FIELDS}
                  primaryKey="Vendor"
                  description="Add, update, and remove your supplier and vendor records."
                  search={search}
                />
              )}
              {tab === 'reviews' && (
                <CrudPanel
                  title="Customer Reviews"
                  collectionName="customerReviews"
                  fields={REVIEW_FIELDS}
                  primaryKey="Review"
                  description="Messages submitted from the Contact Us page."
                  search={search}
                />
              )}
              {tab === 'orders' && <CommercePanel search={search} />}
              {tab === 'tradeIn' && <TradeInPanel search={search} />}
              {!['dashboard','attendance','employeePerformance','employeeAccess','settings','product','customer','select','vendor','reviews','orders','tradeIn'].includes(tab) && (
                <div className="ap-placeholder">
                  <div className="ap-placeholder-icon">🚧</div>
                  <div className="ap-placeholder-text">{NAV.find(n => n.k === tab)?.l}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>This section is under development</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal?.type === 'group' && (
        <GroupModal type={modal.group} records={liveRecords} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
