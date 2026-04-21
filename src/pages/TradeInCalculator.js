import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase"; // MUST export db from firebase.js
import "./tradecalc.css";

export default function TradeInCalculator() {
  const navigate = useNavigate();

  // --- Simple price table (edit later) ---
  const modelBasePrices = useMemo(
    () => ({
      "iPhone 16 Pro Max": 180000,
      "iPhone 16 Pro": 150000,
      "iPhone 16 Plus": 130000,
      "iPhone 16": 120000,
      "iPhone 15": 95000,
      "Samsung S24 Ultra": 160000,
      "Samsung S24": 120000,
      "Pixel 8 Pro": 125000,
      Other: 80000,
    }),
    []
  );

  const models = useMemo(
    () => Object.keys(modelBasePrices),
    [modelBasePrices]
  );

  // --- Form state ---
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [brand, setBrand] = useState("Apple");
  const [model, setModel] = useState("iPhone 16");
  const [imei, setImei] = useState("");

  // condition questions
  const [powersOn, setPowersOn] = useState(true);
  const [screenCracked, setScreenCracked] = useState(false);
  const [backCracked, setBackCracked] = useState(false);
  const [buttonsWorking, setButtonsWorking] = useState(true);
  const [cameraWorking, setCameraWorking] = useState(true);
  const [batteryHealthy, setBatteryHealthy] = useState(true);
  const [waterDamage, setWaterDamage] = useState(false);

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // --- CRUD list state ---
  const [items, setItems] = useState([]);
  const [listening, setListening] = useState(false);

  // Start realtime listener (READ)
  React.useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "tradeIns"), orderBy("createdAt", "desc"));
    setListening(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(arr);
        setListening(false);
      },
      () => setListening(false)
    );

    return () => unsub();
  }, []);

  // --- Estimation logic (edit anytime) ---
  function calculateEstimateLKR() {
    const base = modelBasePrices[model] ?? modelBasePrices.Other;

    // If phone doesn't power on OR water damaged => very low / reject
    if (!powersOn || waterDamage) return Math.round(base * 0.1);

    let multiplier = 1.0;

    if (screenCracked) multiplier -= 0.35;
    if (backCracked) multiplier -= 0.15;

    if (!buttonsWorking) multiplier -= 0.1;
    if (!cameraWorking) multiplier -= 0.1;
    if (!batteryHealthy) multiplier -= 0.1;

    // Keep minimum multiplier
    if (multiplier < 0.2) multiplier = 0.2;

    return Math.round(base * multiplier);
  }

  const estimate = calculateEstimateLKR();

  function validate() {
    if (!customerName.trim()) return "Customer name is required.";
    if (!customerPhone.trim()) return "Customer phone is required.";

    // Basic phone check (Sri Lanka style, allow +94 or 0)
    const cleaned = customerPhone.replace(/\s/g, "");
    if (!(cleaned.startsWith("0") || cleaned.startsWith("+94"))) {
      return "Phone should start with 0 or +94.";
    }

    // IMEI basic check (15 digits)
    const imeiClean = imei.replace(/\s/g, "");
    if (!/^\d{15}$/.test(imeiClean)) {
      return "IMEI must be exactly 15 digits.";
    }

    return null;
  }

  // CREATE
  async function handleSubmit() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "tradeIns"), {
        trade_type: "Mobile",
        brand,
        device_model: model,
        IMEI: imei.replace(/\s/g, ""),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),

        condition: {
          powersOn,
          screenCracked,
          backCracked,
          buttonsWorking,
          cameraWorking,
          batteryHealthy,
          waterDamage,
        },

        trade_value: estimate,
        status: "Pending",
        notes: notes.trim(),

        createdAt: serverTimestamp(),
      });

      // reset form (optional)
      setImei("");
      setNotes("");
      alert("Trade-in request submitted ✅");
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check Firebase rules / connection.");
    } finally {
      setSaving(false);
    }
  }

  // UPDATE (status + notes)
  async function updateItem(id, newStatus) {
    try {
      await updateDoc(doc(db, "tradeIns", id), {
        status: newStatus,
      });
    } catch (e) {
      console.error(e);
      alert("Update failed.");
    }
  }

  async function updateNotes(id, newNotes) {
    try {
      await updateDoc(doc(db, "tradeIns", id), {
        notes: newNotes,
      });
    } catch (e) {
      console.error(e);
      alert("Update notes failed.");
    }
  }

  // DELETE
  async function removeItem(id) {
    if (!window.confirm("Delete this trade-in request?")) return;
    try {
      await deleteDoc(doc(db, "tradeIns", id));
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  }

  return (
    <>
      <Header />

      <div className="calc-wrap">
        <div className="calc-top">
          <button className="calc-back" onClick={() => navigate("/trade-in")}>
            ← Back to Trade In
          </button>

          <div>
            <h1 className="calc-title">Mobile Trade-In Calculator</h1>
            <p className="calc-subtitle">
              Enter device details and condition to get an estimated value (LKR).
            </p>
          </div>
        </div>

        <div className="calc-grid">
          {/* Form */}
          <div className="card">
            <h2 className="card-title">Device details</h2>

            <div className="field">
              <label>Customer Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>

            <div className="field">
              <label>Customer Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>

            <div className="field">
              <label>Brand</label>
              <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option>Apple</option>
                <option>Samsung</option>
                <option>Google</option>
                <option>Other</option>
              </select>
            </div>

            <div className="field">
              <label>Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="hint">You can edit models in TradeInCalculator.js.</div>
            </div>

            <div className="field">
              <label>IMEI (15 digits)</label>
              <input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="356938035643809" />
            </div>

            <h2 className="card-title" style={{ marginTop: 18 }}>Condition check</h2>

            <Toggle label="Powers on" value={powersOn} onChange={setPowersOn} />
            <Toggle label="Screen cracked" value={screenCracked} onChange={setScreenCracked} />
            <Toggle label="Back glass cracked" value={backCracked} onChange={setBackCracked} />
            <Toggle label="Buttons working" value={buttonsWorking} onChange={setButtonsWorking} />
            <Toggle label="Camera working" value={cameraWorking} onChange={setCameraWorking} />
            <Toggle label="Battery healthy" value={batteryHealthy} onChange={setBatteryHealthy} />
            <Toggle label="Water damage" value={waterDamage} onChange={setWaterDamage} />

            <div className="field" style={{ marginTop: 12 }}>
              <label>Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="estimate">
              <div>
                <div className="estimate-label">Estimated trade-in value</div>
                <div className="estimate-value">LKR {estimate.toLocaleString()}</div>
              </div>

              <button className="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Submit trade-in request"}
              </button>
            </div>
          </div>

          {/* List / CRUD */}
          <div className="card">
            <h2 className="card-title">Submitted trade-ins</h2>
            <p className="hint">
              This is live data from Firestore collection: <b>tradeIns</b>.
            </p>

            {listening && <div className="hint">Loading...</div>}

            {items.length === 0 ? (
              <div className="hint">No trade-ins yet.</div>
            ) : (
              <div className="list">
                {items.map((t) => (
                  <div className="list-item" key={t.id}>
                    <div className="li-top">
                      <div>
                        <div className="li-title">{t.customer_name} • {t.device_model}</div>
                        <div className="li-sub">
                          IMEI: {t.IMEI} • Phone: {t.customer_phone}
                        </div>
                        <div className="li-sub">
                          Value: <b>LKR {Number(t.trade_value || 0).toLocaleString()}</b> • Status:{" "}
                          <span className={`badge ${String(t.status || "").toLowerCase()}`}>
                            {t.status || "Pending"}
                          </span>
                        </div>
                      </div>

                      <button className="danger" onClick={() => removeItem(t.id)}>
                        Delete
                      </button>
                    </div>

                    <div className="li-actions">
                      <button className="ghost" onClick={() => updateItem(t.id, "Pending")}>Pending</button>
                      <button className="ghost" onClick={() => updateItem(t.id, "Approved")}>Approved</button>
                      <button className="ghost" onClick={() => updateItem(t.id, "Rejected")}>Rejected</button>
                    </div>

                    <div className="field" style={{ marginTop: 10 }}>
                      <label>Admin Notes</label>
                      <input
                        defaultValue={t.notes || ""}
                        onBlur={(e) => updateNotes(t.id, e.target.value)}
                        placeholder="Write notes and click outside to save"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-label">{label}</div>
      <button
        className={`toggle-pill ${value ? "on" : "off"}`}
        onClick={() => onChange(!value)}
        type="button"
      >
        <span className="dot" />
        {value ? "Yes" : "No"}
      </button>
    </div>
  );
}