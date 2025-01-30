import React, { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sidebar-container">
      {/* Sidebar Toggle Button */}
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        ☰ Menu
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
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

export default Sidebar;
