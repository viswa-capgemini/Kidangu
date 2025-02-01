import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import "./styles.css";
import sprs from "../assets/productimages/sprs-image.avif";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

const GRID_SIZE = 50; // Cell size

const Stand = ({ position }) => {
    return (
      <group position={position}>
        {/* Vertical Poles */}
        <mesh position={[-3, 0.7, 0]}>
          <planeGeometry args={[0.1, 3]} />
          <meshStandardMaterial color="#556879" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <planeGeometry args={[0.1, 3]} />
          <meshStandardMaterial color="#556879" />
        </mesh>
  
        {/* Top Bars */}
        <mesh position={[-1.5, 0.5, 0]}>
          <planeGeometry args={[2.9, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-1.5, 1.5, 0]}>
          <planeGeometry args={[2.9, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
    );
  };

  const CameraController = ({ stands }) => {
    const { camera } = useThree();
    useEffect(() => {
      // Adjust camera to fit all stands dynamically
      const lastStandX = stands.length * 1;
      camera.position.x = lastStandX / 4; // Center the camera
      camera.updateProjectionMatrix();
    }, [stands, camera]);
  
    return null;
  };

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [image] = useImage(sprs);
  const centerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ width: 7000, height: 7000 });
  const [stands, setStands] = useState([{ id: 1, position: [0, 0, 0] }]);

  const addStand = () => {
    const newStand = {
      id: stands.length + 1,
      position: [stands.length * 3, 0, 0], // Shift each new stand by 4 units
    };
    setStands([...stands, newStand]);
  };

  useEffect(() => {
    const updateSize = () => {
      if (centerRef.current) {
        setGridSize({
          width: centerRef.current.clientWidth,
          height: centerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const COLUMNS = Math.floor(gridSize.width / GRID_SIZE);
  const ROWS = Math.floor(gridSize.height / GRID_SIZE);

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
            {/* <div className="image-grid">
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
            </div> */}
          </div>
          <div className="product-accessories">
            <h4>Rack Protection</h4>
            <select name="rack-protection" id="rack-protection">
                <option value="40-high">40 cm high</option>
                <option value="80-high">80 cm high</option>
            </select><br />
            <button onClick={addStand} style={{ marginBottom: "10px" }}>Add Stand</button>
          </div>
        </div>

        {/* Center Half with Full-Sized Grid */}
        <div className="center-half" style={{overflowY: "auto"}} ref={centerRef}>
                  <Canvas style={{overflow: "auto"}}>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 10]} intensity={1} />
                      {/* Dynamic Camera Adjustment */}
        <CameraController stands={stands} />
                      <mesh rotation={[-Math.PI / 2, 0, 0]}>
                          <gridHelper args={[20, 100]} />
                      </mesh>

                      {/* Render Multiple Stands */}
        {stands.map((stand) => (
          <Stand key={stand.id} position={stand.position} />
        ))}
                  </Canvas>
          {/* <Stage width={gridSize.width} height={gridSize.height} className="konva-stage">
            <Layer>
              {[...Array(COLUMNS)].map((_, col) =>
                [...Array(ROWS)].map((_, row) => (
                  <Rect
                    key={`${col}-${row}`}
                    x={col * GRID_SIZE}
                    y={row * GRID_SIZE}
                    width={GRID_SIZE}
                    height={GRID_SIZE}
                    stroke="gray"
                    strokeWidth={1}
                  />
                ))
              )}
            </Layer>
          </Stage> */}
        </div>

        <div className="right-half">
            <div className="product-details">
                <h1>Product Details</h1>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
