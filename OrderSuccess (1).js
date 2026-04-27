import React from "react";
import { Link, useLocation } from "react-router-dom";
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

  return (
    <>
      <Header />

      <main className="order-success-page">
        <section className="order-success-card">
          <div className="order-success-badge">Order Successful</div>
          <h1>IconX received your order.</h1>
          <p>
            Thanks{state?.customerName ? `, ${state.customerName}` : ""}. Our team will contact you soon to confirm
            your order and delivery details.
          </p>

          <div className="order-success-details">
            <div>
              <span>Order ID</span>
              <strong>{state?.orderId || "Pending confirmation"}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatLkr(state?.total || 0)}</strong>
            </div>
          </div>

          <div className="order-success-actions">
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
