import React, { useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import "./styles.css";
import sprs from "../assets/productimages/sprs-image.avif";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [image] = useImage(sprs);

  return (
    <div className="navbar-sidebar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <a href="#" className="logo">
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

      {/* Main Content Area */}
      <div className="main-content">
        <div className="left-half">
          <div className="product-group">
            <h1>Product Group</h1>
            <div className="image-grid">
              <div className="image-box">
                <img src={sprs} alt="Shuttle Pallet Racking" />
              </div>
              <div className="image-box">
                <img src="image2.jpg" alt="Cantilever" />
              </div>
              <div className="image-box">
                <img src="image3.jpg" alt="Multi-Tier Racking" />
              </div>
              <div className="image-box">
                <img src="image4.jpg" alt="Mobile Pallet Racking" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Half with Konva Stage */}
        <div className="right-half">
          <Stage width={500} height={400} className="konva-stage">
            <Layer>
              {/* <Rect
                x={40}
                y={40}
                width={200}
                height={200}
                stroke="black"
                strokeWidth={2}
              />
              <KonvaImage
                image={image}
                x={imagePosition.x}
                y={imagePosition.y}
                width={100}
                height={100}
                draggable
                onDragEnd={(e) => {
                  setImagePosition({ x: e.target.x(), y: e.target.y() });
                }}
              /> */}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default Header;
