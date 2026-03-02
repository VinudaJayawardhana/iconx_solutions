import React from "react";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import Slider from "../components/Slider.js"; // import your slider component
import "./home.css";

const Home = () => {
  return (
    <div className="home-container">
      <Header />

      {/* Hero Slider */}
      <section className="hero">
        <Slider />
      </section>

      {/* Products Section */}
      <section className="products">
        <h2>Our Products</h2>
        <div className="product-grid">
          <div className="product-card">
            <h3>MacBook Air 13" & 15"</h3>
            <p>Powered by the next-gen M4 chip.</p>
            <div className="button-group">
              <button>Learn More</button>
              <button className="btn-buy">Buy Now</button>
            </div>
          </div>
          <div className="product-card">
            <h3>iPad Pro 11" & 13"</h3>
            <p>Powered by the next-gen M4 chip.</p>
            <div className="button-group">
              <button>Learn More</button>
              <button className="btn-buy">Buy Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>Our Services</h2>
        <p>
          End-to-end support for your mobile purchase, including warranty
          assistance, device setup, data transfer, software support,
          diagnostics, and after-sales guidance.
        </p>
      </section>

      {/* Trade-In Section */}
      <section className="trade-in">
        <h2>Trade In</h2>
        <p>
          Apple Trade-In allows customers to exchange their used Apple devices
          for instant value toward a new purchase.
        </p>
        <p><strong>Value:</strong> LKR 20,000 - LKR 180,000</p>
        <button className="btn-secondary">Find Your Trade-in Value</button>
      </section>

      <Footer />
    </div>
  );
};

export default Home;