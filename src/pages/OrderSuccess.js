import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Download } from "lucide-react";
import jsPDF from "jspdf";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./OrderSuccess.css";

function formatLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function OrderSuccess() {
  const { state } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();

    const customerName = state?.customerName || "Customer";
    const orderId = state?.orderId || "Pending confirmation";
    const total = formatLkr(state?.total || 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ICONX MOBILE STORE", 20, 25);

    doc.setFontSize(16);
    doc.text("Order Receipt", 20, 40);

    doc.setDrawColor(220);
    doc.line(20, 48, 190, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Order Status: Successful", 20, 65);
    doc.text(`Customer Name: ${customerName}`, 20, 80);
    doc.text(`Order ID: ${orderId}`, 20, 95);
    doc.text(`Total: ${total}`, 20, 110);

    doc.line(20, 120, 190, 120);

    doc.setFontSize(11);
    doc.text("Thank you for your purchase.", 20, 138);
    doc.text(
      "Our team will contact you soon to confirm your order and delivery details.",
      20,
      150
    );

    doc.save(`IconX-Receipt-${state?.orderId || "order"}.pdf`);
  };

  return (
    <>
      <Header />

      <main className="order-success-page">
        <section className="order-success-card">
          <div className="order-success-icon">
            <Check size={46} strokeWidth={2.4} />
          </div>

          <h1>Order Confirmed!</h1>

          <p className="order-success-message">
            We have received your order and our team will contact you soon.
            <br />
            Your order number is{" "}
            <strong className="order">
              {state?.orderId || "Pending confirmation"}
            </strong>
          </p>

          <div className="order-summary-box">
            <h2>Order Summary</h2>

            <div className="order-summary-row">
              <span>Customer</span>
              <strong className="order">
                {state?.customerName || "Customer"}
              </strong>
            </div>

            <div className="order-summary-row">
              <span>Order ID</span>
              <strong className="order">
                {state?.orderId || "Pending confirmation"}
              </strong>
            </div>

            <div className="order-summary-total">
              <span>Total</span>
              <strong className="order">
                {formatLkr(state?.total || 0)}
              </strong>
            </div>
          </div>

          <div className="order-success-actions">
            <button
              type="button"
              className="order-success-download"
              onClick={handleDownloadReceipt}
            >
              <Download size={18} />
              Download Receipt
            </button>

            <Link to="/products" className="order-success-secondary">
              Continue Shopping
            </Link>

            <Link to="/home" className="order-success-primary">
              Back to Home
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}