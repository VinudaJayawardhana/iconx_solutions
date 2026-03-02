import React from "react";
import "../components/Header.css";

const Header = () => {
  return (
    <header className="header">
      {/* Logo */}
      <div className="logo">IconX</div>

      {/* Navigation */}
      <nav className="nav">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/trade-in">Trade In</a></li>
          <li><a href="/service">Service</a></li>
          <li><a href="/about">About Us</a></li>
        </ul>
      </nav>

      {/* Sign In button */}
      <button className="signin-btn">Sign In</button>
    </header>
  );
};

export default Header;