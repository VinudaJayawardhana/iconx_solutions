import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../components/Header.css";
import logo from "../assets/iconx-logo.jpg";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { CART_EVENT, getCartCount } from "../utils/cart";

const Header = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount());
    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener(CART_EVENT, syncCartCount);
    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener(CART_EVENT, syncCartCount);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setSearchQuery("");
  };

  return (
    <>
      <header
        className={`header ${isHeaderVisible ? "header-visible" : "header-hidden"}`}
      >
        <div className="logo">
          <Link to="/home">
            <img src={logo} alt="Icon X Logo" />
          </Link>
        </div>

        <nav className="nav">
          <ul>
            <li>
              <Link to="/home">Discover</Link>
            </li>
            <li>
              <Link to="/products">Collection</Link>
            </li>
            <li>
              <Link to="/trade-in">Switch</Link>
            </li>
            <li>
              <Link to="/contact">Support</Link>
            </li>
            <li>
              <Link to="/about">Company</Link>
            </li>
          </ul>
        </nav>

        <div className="header-icons">
          <FiSearch
            className="icon"
            onClick={toggleSearch}
            style={{ cursor: "pointer" }}
          />

          <div
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu className="icon" />
          </div>

          <div className="desktop-icons">
            <Link to="/cart" className="header-icon-link" aria-label="Cart">
              <span className="header-cart-icon-wrap">
                <FiShoppingCart className="icon" />
                {cartCount > 0 && (
                  <span className="header-cart-badge">{cartCount}</span>
                )}
              </span>
            </Link>
            <Link to="/login" aria-label="Login">
              <FiUser className="icon" />
            </Link>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          style={{
            position: "fixed",
            top: "110px",
            left: 0,
            right: 0,
            background: "white",
            padding: "1rem 2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", width: "100%", gap: "0.5rem" }}
          >
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.75rem 1.5rem",
                background: "#000",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={toggleSearch}
              style={{
                padding: "0.75rem",
                background: "transparent",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              <FiX />
            </button>
          </form>
        </div>
      )}

      <div
        className={`mobile-sidebar-overlay ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      ></div>

      <aside className={`mobile-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <img src={logo} alt="Icon X Logo" className="mobile-sidebar-logo" />
          <button
            className="mobile-sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>
        <nav className="mobile-sidebar-nav">
          <Link to="/home" onClick={closeMenu}>
            Discover
          </Link>
          <Link to="/products" onClick={closeMenu}>
            Collection
          </Link>
          <Link to="/trade-in" onClick={closeMenu}>
            Switch
          </Link>
          <Link to="/contact" onClick={closeMenu}>
            Support
          </Link>
          <Link to="/about" onClick={closeMenu}>
            Company
          </Link>
        </nav>
        <div className="mobile-sidebar-icons">
          <Link
            to="/cart"
            className="mobile-sidebar-icon-link"
            onClick={closeMenu}
          >
            <span className="header-cart-icon-wrap">
              <FiShoppingCart className="icon" />
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </span>
            <span>Cart</span>
          </Link>
          <Link
            to="/login"
            className="mobile-sidebar-icon-link"
            onClick={closeMenu}
          >
            <FiUser className="icon" />
            <span>Profile</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Header;
