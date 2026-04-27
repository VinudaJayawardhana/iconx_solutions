import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

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

import { db } from "../firebase";
import "./tradecalc.css";

export default function TradeInCalculator() {
  const navigate = useNavigate();

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

  const models = useMemo(() => Object.keys(modelBasePrices), [modelBasePrices]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [brand, setBrand] = useState("Apple");
  const [model, setModel] = useState("iPhone 16");
  const [imei, setImei] = useState("");

  const [powersOn, setPowersOn] = useState(true);
  const [screenCracked, setScreenCracked] = useState(false);
  const [backCracked, setBackCracked] = useState(false);
  const [buttonsWorking, setButtonsWorking] = useState(true);
  const [cameraWorking, setCameraWorking] = useState(true);
  const [batteryHealthy, setBatteryHealthy] = useState(true);
  const [waterDamage, setWaterDamage] = useState(false);

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [listening, setListening] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedTradeIn, setSubmittedTradeIn] = useState(null);

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

  function calculateEstimateLKR() {
    const base = modelBasePrices[model] ?? modelBasePrices.Other;

    if (!powersOn || waterDamage) return Math.round(base * 0.1);

    let multiplier = 1.0;

    if (screenCracked) multiplier -= 0.35;
    if (backCracked) multiplier -= 0.15;
    if (!buttonsWorking) multiplier -= 0.1;
    if (!cameraWorking) multiplier -= 0.1;
    if (!batteryHealthy) multiplier -= 0.1;

    if (multiplier < 0.2) multiplier = 0.2;

    return Math.round(base * multiplier);
  }

  const estimate = calculateEstimateLKR();

  const blockExtraDigits = (e, value, maxLength) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (value.length >= maxLength) {
      e.preventDefault();
    }
  };

  function validate() {
    if (!customerName.trim()) return "Customer name is required.";

    if (!customerPhone.trim()) return "Customer phone is required.";

    if (!/^\d{10}$/.test(customerPhone)) {
      return "Phone number must be exactly 10 digits.";
    }

    if (!(customerPhone.startsWith("0") || customerPhone.startsWith("94"))) {
      return "Phone number should start with 0 or 94.";
    }

    if (!imei.trim()) return "IMEI is required.";

    if (!/^\d{15}$/.test(imei)) {
      return "IMEI must be exactly 15 digits.";
    }

    return null;
  }

  function downloadTradeInPDF() {
    if (!submittedTradeIn) return;

    const docPDF = new jsPDF();

    docPDF.setFontSize(20);
    docPDF.text("Mobile Trade-In Request", 20, 20);

    docPDF.setFontSize(12);
    docPDF.text(`Customer Name: ${submittedTradeIn.customer_name}`, 20, 40);
    docPDF.text(`Customer Phone: ${submittedTradeIn.customer_phone}`, 20, 50);
    docPDF.text(`Brand: ${submittedTradeIn.brand}`, 20, 60);
    docPDF.text(`Model: ${submittedTradeIn.device_model}`, 20, 70);
    docPDF.text(`IMEI: ${submittedTradeIn.IMEI}`, 20, 80);
    docPDF.text(
      `Estimated Value: LKR ${submittedTradeIn.trade_value.toLocaleString()}`,
      20,
      90
    );
    docPDF.text(`Status: ${submittedTradeIn.status}`, 20, 100);

    docPDF.setFontSize(14);
    docPDF.text("Condition Check", 20, 120);

    docPDF.setFontSize(12);
    docPDF.text(
      `Powers On: ${submittedTradeIn.condition.powersOn ? "Yes" : "No"}`,
      20,
      135
    );
    docPDF.text(
      `Screen Cracked: ${submittedTradeIn.condition.screenCracked ? "Yes" : "No"}`,
      20,
      145
    );
    docPDF.text(
      `Back Glass Cracked: ${submittedTradeIn.condition.backCracked ? "Yes" : "No"}`,
      20,
      155
    );
    docPDF.text(
      `Buttons Working: ${submittedTradeIn.condition.buttonsWorking ? "Yes" : "No"}`,
      20,
      165
    );
    docPDF.text(
      `Camera Working: ${submittedTradeIn.condition.cameraWorking ? "Yes" : "No"}`,
      20,
      175
    );
    docPDF.text(
      `Battery Healthy: ${submittedTradeIn.condition.batteryHealthy ? "Yes" : "No"}`,
      20,
      185
    );
    docPDF.text(
      `Water Damage: ${submittedTradeIn.condition.waterDamage ? "Yes" : "No"}`,
      20,
      195
    );

    docPDF.text(`Notes: ${submittedTradeIn.notes || "No notes"}`, 20, 215);

    docPDF.save("trade-in-request.pdf");
  }

  async function handleSubmit() {
    const err = validate();

    if (err) {
      alert(err);
      return;
    }

    setSaving(true);

    try {
      const tradeInData = {
        trade_type: "Mobile",
        brand,
        device_model: model,
        IMEI: imei,
        customer_name: customerName.trim(),
        customer_phone: customerPhone,

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
      };

      await addDoc(collection(db, "tradeIns"), {
        ...tradeInData,
        createdAt: serverTimestamp(),
      });

      setSubmittedTradeIn(tradeInData);
      setShowSuccessPopup(true);

      setCustomerName("");
      setCustomerPhone("");
      setImei("");
      setNotes("");
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check Firebase rules / connection.");
    } finally {
      setSaving(false);
    }
  }

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
          <div className="card">
            <h2 className="card-title">Device details</h2>

            <div className="field">
              <label>Customer Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Customer Phone</label>
              <input
                type="text"
                inputMode="numeric"
                value={customerPhone}
                maxLength={10}
                onKeyDown={(e) => blockExtraDigits(e, customerPhone, 10)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  setCustomerPhone(pasted);
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setCustomerPhone(value);
                }}
              />
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
              <input
                type="text"
                inputMode="numeric"
                value={imei}
                maxLength={15}
                onKeyDown={(e) => blockExtraDigits(e, imei, 15)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 15);
                  setImei(pasted);
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 15);
                  setImei(value);
                }}
                placeholder="356938035643809"
              />
            </div>

            <h2 className="card-title" style={{ marginTop: 18 }}>
              Condition check
            </h2>

            <Toggle label="Powers on" value={powersOn} onChange={setPowersOn} />
            <Toggle label="Screen cracked" value={screenCracked} onChange={setScreenCracked} />
            <Toggle label="Back glass cracked" value={backCracked} onChange={setBackCracked} />
            <Toggle label="Buttons working" value={buttonsWorking} onChange={setButtonsWorking} />
            <Toggle label="Camera working" value={cameraWorking} onChange={setCameraWorking} />
            <Toggle label="Battery healthy" value={batteryHealthy} onChange={setBatteryHealthy} />
            <Toggle label="Water damage" value={waterDamage} onChange={setWaterDamage} />

            <div className="field" style={{ marginTop: 12 }}>
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
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

        
        </div>
      </div>

      {showSuccessPopup && (
        <div className="trade-popup-overlay">
          <div className="trade-popup-box">
            <h2>Thank You!</h2>
            <p>Your trade-in request has been submitted successfully.</p>

            <button className="primary" onClick={downloadTradeInPDF}>
              Download PDF
            </button>

            <button className="ghost" onClick={() => navigate("/")}>
              Go to Home
            </button>

            <button className="ghost" onClick={() => navigate("/products")}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}

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