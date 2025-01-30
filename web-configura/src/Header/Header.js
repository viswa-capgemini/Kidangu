import React, { useState } from "react";
import "./styles.css";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="navbar-sidebar-container">
      {/* Header / Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          {/* Sidebar Toggle Button & Logo (both trigger sidebar) */}
          <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
            ☰
          </button>
          <a href="#" className="logo" onClick={() => setIsOpen(!isOpen)}>
            Godrej
          </a>
        </div>

        <div className="navbar-center">
          <ul className="nav-links">
            <li><a href="/products">Products</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="navbar-right">
          <a href="/cart" className="cart-icon">
            <i className="fas fa-shopping-cart"></i>
            <span className="cart-count">0</span>
          </a>
          <a href="/account" className="user-icon">
            <i className="fas fa-user"></i>
          </a>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Close Button */}
        <button className="close-button" onClick={() => setIsOpen(false)}>
          ✖
        </button>
        <ul>
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Orders</a></li>
          <li><a href="#">Settings</a></li>
          <li><a href="#">Logout</a></li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
