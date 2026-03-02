import React from "react";
import "./Footer.css";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      {/* Left Section: Logo + Description + Social */}
      <div>
        <div className="footer-logo">IconX</div>
        <p className="footer-description">
          A trusted mobile store offering the latest smartphones, accessories,
          and reliable after-sales support. We serve our customers with
          transparency, expertise, and care.
        </p>
        <div className="social-icons">
          <a href="#"><FaWhatsapp /></a>
          <a href="#"><FaFacebook /></a>
          <a href="#"><FaInstagram /></a>
          <a href="#"><FaTwitter /></a>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="footer-section">
        <h4>Quick Navigation</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
        </ul>
      </div>

      {/* Categories */}
      <div className="footer-section">
        <h4>Categories</h4>
        <ul>
          <li><a href="/apple">Apple</a></li>
          <li><a href="/samsung">Samsung</a></li>
          <li><a href="/pixel">Pixel</a></li>
          <li><a href="/nokia">Nokia</a></li>
          <li><a href="/oneplus">One Plus</a></li>
          <li><a href="/vivo">Vivo</a></li>
          <li><a href="/techno">Techno</a></li>
        </ul>
      </div>

      {/* Contact + Map */}
      <div className="footer-contact">
        <h4>Contact Us</h4>
        <p>958 Galle Rd,<br />Kalutara 12000</p>
        <p>Email: iconx@gmail.com</p>
        <p>Phone: 077 718 1818</p>

        {/* Google Map Embed */}
        <div className="footer-map">
          <iframe
            title="IconX Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63310.123456789!2d79.955!3d6.583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2f123456789ab%3A0xabcdef123456789!2s958%20Galle%20Rd%2C%20Kalutara%2012000!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="footer-bottom">
        © 2026 IconX. All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;