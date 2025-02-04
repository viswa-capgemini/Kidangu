import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import "./styles.css";
import sprs from "../assets/productimages/sprs-image.avif";
import mts from "../assets/productimages/mts-image.png"
import edit from "../assets/icons/edit-icon.png"
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrthographicCamera, Html } from "@react-three/drei";

const GRID_SIZE = 50; // Cell size

const Stand = ({ position }) => {

    const [showDropdown, setShowDropdown] = useState(false);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setShowDropdown(true);
    };

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

            {/* Centered Edit Label */}
            <Html position={[-1.5, 2.7, 0]} center style={{ pointerEvents: "visible" }} onPointerDown={(e) => e.stopPropagation()}>
                <div className="edit-pallet">
                    <img className="edit-pallet" id="edit-pallet" src={edit} style={{ width: "45px", height: "25px", cursor: "pointer" }} onClick={toggleDropdown} alt="Edit"></img>
                    <h6>Edit Shelf Unit</h6>
                    {showDropdown == true && (
                        <><select name="dropdown-menu" id="dropdown-menu">
                            <option value="height">Shelf Height</option>
                            <option value="width">Shelf Width</option>
                            <option value="levels">Levels</option>
                            <option value="deck">Deck</option>
                            <option value="rack-protect-left">Rack Protection Left</option>
                            <option value="rack-protect-right">Rack Protection Right</option>
                        </select></>
                )}
                    
                </div>
            </Html>
        </group>
    );
};

// const palletProperties = () => {
//     console.log("palletProperties")
//     return(
//         <div className="dropdown-menu">
//             <select>
//                 <option value="height">Shelf Height</option>
//                 <option value="width">Shelf Width</option>
//                 <option value="levels">Levels</option>
//             </select>
//         </div>
//     )
// }

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

//   const CameraController = () => {
//     const { camera } = useThree();

//     useEffect(() => {
//         // Move camera in front of the model
//         camera.position.set(0, 2, 10); // Adjust Z to move further if needed
//         camera.lookAt(0, 1, 0); // Make sure it looks at the center
//     }, [camera]);

//     return null;
// };

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [image] = useImage(sprs);
  const centerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ width: 7000, height: 7000 });
  const [stands, setStands] = useState([{ id: 1, position: [0, 0, 0] }]);

  const fbx = useLoader(FBXLoader, "demo.fbx");
  console.log("fbx", fbx, fbx.children[10].name)

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
            <div className="image-grid">
              <div className="image-box">
                <img src={sprs} alt="Shuttle Pallet Racking" />
              </div>
              <div className="image-box">
                <img src={mts} alt="Multi Tier Racking" />
              </div>
              {/* <div className="image-box">
                <img src="image3.jpg" alt="Multi-Tier Racking" />
              </div>
              <div className="image-box">
                <img src="image4.jpg" alt="Mobile Pallet Racking" />
              </div> */}
            </div>
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
        <div className="center-half" ref={centerRef}>
                  <div style={{ height: "100%", width: "100%", overflowX: "auto" }}>
                      <Canvas style={{  overflowX: "auto" }}>
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[10, 10, 10]} intensity={1} />
                          {/* Dynamic Camera Adjustment */}
                          <CameraController stands={stands} />
                          {/* <primitive object={fbx} scale={0.5} rotation={[-Math.PI / 2, 0, 0]} /> */}
                          <mesh rotation={[-Math.PI / 2, 0, 0]}>
                              <gridHelper args={[20, 100]} />
                          </mesh>
                          {stands.map((stand) => (
                              <Stand key={stand.id} position={stand.position} />
                          ))}
                      </Canvas>
                  </div>
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
