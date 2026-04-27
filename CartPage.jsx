import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { db } from "../firebase";
import {
  CART_EVENT,
  clearCart,
  getCartItems,
  getCartSubtotal,
  removeCartItem,
  updateCartItemQuantity,
} from "../utils/cart";
import "./CartPage.css";

function formatLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCartItems());
    };

    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const subtotal = getCartSubtotal();
  const deliveryFee = cartItems.length ? 1500 : 0;
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (id, nextQuantity) => {
    updateCartItemQuantity(id, nextQuantity);
    setCartItems(getCartItems());
  };

  const handleRemove = (id) => {
    removeCartItem(id);
    setCartItems(getCartItems());
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!customer.fullName || !customer.phone || !customer.email || !customer.address) {
      setError("Please fill in your customer details before placing the order.");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const orderPayload = {
        customer,
        items: cartItems,
        subtotal,
        deliveryFee,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderPayload);
      clearCart();
      navigate("/order-success", {
        state: {
          orderId: orderRef.id,
          total,
          customerName: customer.fullName,
        },
      });
    } catch (err) {
      setError("We couldn't place the order right now. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <Header />

      <main className="cart-page">
        <section className="cart-hero">
          <div>
            <p className="cart-kicker">Your Cart</p>
            <h1>Review your IconX order before checkout.</h1>
            <p>Keep your picks here, update quantities, then place the order with your customer details.</p>
          </div>
          <div className="cart-hero-total">
            <span>Current total</span>
            <strong>{formatLkr(total)}</strong>
          </div>
        </section>

        <section className="cart-layout">
          <div className="cart-items-panel">
            <div className="cart-panel-head">
              <h2>Cart Items</h2>
              {cartItems.length > 0 && (
                <button type="button" className="cart-clear-btn" onClick={() => { clearCart(); setCartItems([]); }}>
                  Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <h3>Your cart is empty</h3>
                <p>Add products from the collection page to start your order.</p>
                <Link to="/products" className="cart-shop-btn">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <article className="cart-item-card" key={item.id}>
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>{formatLkr(item.price)}</p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="cart-qty">
                        <button type="button" onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}>
                          -
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button type="button" onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}>
                          +
                        </button>
                      </div>
                      <strong>{formatLkr((item.price || 0) * (item.quantity || 1))}</strong>
                      <button type="button" className="cart-remove-btn" onClick={() => handleRemove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="cart-summary-panel">
            <div className="cart-summary-card">
              <p className="cart-kicker">Checkout</p>
              <h2>Buy Now</h2>
              <p className="cart-summary-copy">Fill in your details and IconX can handle the order directly for you.</p>

              <div className="cart-summary-rows">
                <div><span>Subtotal</span><strong>{formatLkr(subtotal)}</strong></div>
                <div><span>Delivery</span><strong>{formatLkr(deliveryFee)}</strong></div>
                <div className="cart-summary-total"><span>Total</span><strong>{formatLkr(total)}</strong></div>
              </div>

              <form className="cart-order-form" onSubmit={handlePlaceOrder}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={customer.fullName}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, fullName: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customer.phone}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={customer.email}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
                />
                <textarea
                  rows="4"
                  placeholder="Delivery address"
                  value={customer.address}
                  onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
                />

                {error && <div className="cart-error-msg">{error}</div>}

                <button type="submit" className="cart-buy-btn" disabled={placingOrder || !cartItems.length}>
                  {placingOrder ? "Placing Order..." : "Buy Now with IconX"}
                </button>
              </form>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </>
  );
}
