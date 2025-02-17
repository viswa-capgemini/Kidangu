import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group } from "react-konva";
import useImage from "use-image";
import "./styles.css";
import sprs from "../assets/productimages/sprs-image.avif";
import mts from "../assets/productimages/mts-image.png"
import canti from "../assets/productimages/cantilever.webp"
import topView from "../assets/icons/top-view.png"
import sideViewIcon from "../assets/icons/side-view.png"
import edit from "../assets/icons/edit-icon.png"
import pillar from "../assets/icons/pillar.png"
import aisleSpace from "../assets/icons/aisle-space.webp"
import door from "../assets/icons/door.png"
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrthographicCamera, Html, Line } from "@react-three/drei";
import { TextureLoader } from "three";
import standFront30 from "../assets/racking/height/stand-front-30.png";
import standFront40 from "../assets/racking/height/stand-front-40.png";
import standFront50 from "../assets/racking/height/stand-front-50.png";
import beamFrontEmpty100 from "../assets/racking/width/beam-front-empty-18.png";
import beamFrontEmpty200 from "../assets/racking/width/beam-front-empty-27.png";
import beamFrontEmpty300 from "../assets/racking/width/beam-front-empty-36.png";
import sideStand80 from "../assets/racking/depth/stand-side-30-w8.png";
import sideStand100 from "../assets/racking/depth/stand-side-40-w11.png";
import sideStand120 from "../assets/racking/depth/stand-side-40-w11.png";

const GRID_SIZE = 50; // Cell size

const Stand = ({ position, selectedHeight, selectedWidth }) => {

  const [showDropdown, setShowDropdown] = useState(false);
  const selectedImageHeight = selectedHeight;
  const selectedImageWidth = selectedWidth;
  const standFront = {
    1: useLoader(TextureLoader, standFront30),
    2: useLoader(TextureLoader, standFront40),
    3: useLoader(TextureLoader, standFront50),
  };

  const beamFront = {
    1: useLoader(TextureLoader, beamFrontEmpty100),
    2: useLoader(TextureLoader, beamFrontEmpty200),
    3: useLoader(TextureLoader, beamFrontEmpty300),
  };

  const heights = {
    1: 3,  // Height for standFront30
    2: 4,  // Height for standFront40
    3: 5,  // Height for standFront50
  };

  const widths = {
    1: 0.1,  // Width for beamFrontEmpty100
    2: 0.3,  // Width for beamFrontEmpty200
    3: 0.5,  // Width for beamFrontEmpty300
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(true);
  };

  console.log(selectedHeight, selectedImageHeight, standFront[selectedImageHeight], heights[selectedImageHeight])

  return (
    <group position={position}>
      {/* Vertical Poles */}
      <mesh position={[-3, heights[selectedImageHeight] / 5, 0]}>
        <planeGeometry args={[0.1, heights[selectedImageHeight]]} />
        <meshBasicMaterial map={standFront[selectedImageHeight]} />
      </mesh>
      <mesh position={[widths[selectedWidth], heights[selectedImageHeight] / 5, 0]}>
        <planeGeometry args={[0.1, heights[selectedImageHeight]]} />
        <meshBasicMaterial map={standFront[selectedImageHeight]} />
      </mesh>

      {/* Top Bars */}
      <mesh position={[-1.5 + widths[selectedWidth] / 2, widths[selectedHeight], 0]}>
        <planeGeometry args={[2.9 + widths[selectedWidth], 0.2]} />
        <meshBasicMaterial map={beamFront[selectedImageWidth]} transparent={true} alphaTest={0.5} depthWrite={false} />
      </mesh>

      <mesh position={[-1.5 + widths[selectedWidth] / 2, widths[selectedHeight] + 1.5, 0]}>
        <planeGeometry args={[2.9 + widths[selectedWidth], 0.2]} />
        <meshBasicMaterial map={beamFront[selectedImageWidth]} transparent={true} alphaTest={0.5} depthWrite={false} />
      </mesh>


      {/* Centered Edit Label */}
      {/* <Html position={[-1.5, 2.7, 0]} center style={{ pointerEvents: "visible" }} onPointerDown={(e) => e.stopPropagation()}>
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
            </Html> */}
    </group>
  );
};

const SideView = ({ position, selectedDepth }) => {

  const depths = {
    1: 1,  // Height for standFront30
    2: 1.2,  // Height for standFront40
    3: 1.4,  // Height for standFront50
  };
  const sideViewImages = {
    1: useLoader(TextureLoader, sideStand100), //[0.7, 3]
    2: useLoader(TextureLoader, sideStand100), //[1.2, 3.6]
    3: useLoader(TextureLoader, sideStand120),
  };

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-1, 0, 0]}>
        <planeGeometry args={[depths[selectedDepth], 3.6]} />
        <meshBasicMaterial map={sideViewImages[selectedDepth]} transparent={true}
          alphaTest={0.5}
          depthWrite={false} />
      </mesh>
    </group>
  )
}

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
  const stageWidth = 1050;
  const stageHeight = 920;
  const rectSize = 90;
  const [rects, setRects] = useState([]);
  const [rectsByName, setRectsByName] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRect, setSelectedRect] = useState(null);
  const [selectedHeight, setSelectedHeight] = useState(1);
  const [selectedWidth, setSelectedWidth] = useState(1);
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [selectedUpright, setSelectedUpright] = useState(null);
  const [selectedBracing, setSelectedBracing] = useState(null);
  const [selectedRackLoad, setSelectedRackLoad] = useState(null);
  const [selectedView, setSelectedView] = useState("stand");
  // const [saveJSON, setSaveJSON] = useState(null);
  const saveJSON = useRef(null);
  const countsRef = useRef({ spr: 0, canti: 0, space: 0 });

  const heightData = {
    1: { name: "300", partNo: "GXL 90-1.6", fullName: "GXL 90-3m", cost: '10' },
    2: { name: "400", partNo: "GXL 90-1.8", fullName: "GXL 90-4m", cost: '20' },
    3: { name: "500", partNo: "GXL 90-2.0", fullName: "GXL 90-5m", cost: '30' },
  }

  const widthData = {
    1: { name: "100", partNo: "GB 100", fullName: "GB-1m", cost: '5' },
    2: { name: "200", partNo: "GB 200", fullName: "GB-2m", cost: '10' },
    3: { name: "300", partNo: "GB 300", fullName: "GB-3m", cost: '15' },
  }

  const depthData = {
    1: { name: "80", partNo: "GD 80", fullName: "GD-0.8m", cost: '12' },
    2: { name: "100", partNo: "GD 100", fullName: "GD-1m", cost: '24' },
    3: { name: "120", partNo: "GD 120", fullName: "GD-1.2m", cost: '36' },
  }

  const rackLoad = {
    1: { name: "500" },
    2: { name: "1000" },
    3: { name: "1500" },
  }

  const uprightData = {
    1: { name: "GXL 90-1.6", partNo: "GXL 90-1.6", load: "500", depth: "1000", span: "2700" },
    2: { name: "GXL 90-1.8", partNo: "GXL 90-1.8", load: "1000", depth: "1100", span: "2500" },
    3: { name: "GXL 90-2.0", partNo: "GXL 90-2.0", load: "1500", depth: "1200", span: "2600" },
  }

  const bracingMaterialData = {
    1: { name: "GI" },
    2: { name: "MS" },
    3: { name: "SS" },
    4: { name: "Aluminium" },
  }

  const handleRectClick = (rect) => {
    setSelectedRect(rect);
    setModalVisible(true);
  };

  const handleSaveAndClose = () => {
    const jsonData = {
      id: selectedRect.id,
      parts: [
        {
          partNo: heightData[selectedHeight]?.partNo || "N/A",
          partName: heightData[selectedHeight]?.fullName || "N/A",
          quantity: 4,
          price: heightData[selectedHeight]?.cost || 0
        },
        {
          partNo: widthData[selectedWidth]?.partNo || "N/A",
          partName: widthData[selectedWidth]?.fullName || "N/A",
          quantity: 1,
          price: widthData[selectedWidth]?.cost || 0
        },
        {
          partNo: depthData[selectedDepth]?.partNo || "N/A",
          partName: depthData[selectedDepth]?.fullName || "N/A",
          quantity: 7,
          price: depthData[selectedDepth]?.cost || 0
        }
      ],
      total: (
        (heightData[selectedHeight]?.cost || 0) * 4 +
        (widthData[selectedWidth]?.cost || 0) * 1 +
        (depthData[selectedDepth]?.cost || 0) * 7
      ).toFixed(2)
    };

    saveJSON.current = ((prevSaveJSON) => {
      const updatedSaveJSON = prevSaveJSON ? JSON.parse(prevSaveJSON) : [];
      const existingIndex = updatedSaveJSON.findIndex(item => item.id === selectedRect.id);

      if (existingIndex !== -1) {
        updatedSaveJSON[existingIndex] = jsonData;
      } else {
        updatedSaveJSON.push(jsonData);
      }

      return JSON.stringify(updatedSaveJSON.length > 0 ? updatedSaveJSON : [jsonData], null, 2);
    })(saveJSON.current);

    console.log("saveJSON", saveJSON.current)

    // Close modal
    setModalVisible(false);
    setSelectedRect(null);
  };

  const handleChangeUpright = (event) => {
    setSelectedUpright(event.target.value);
  };

  const handleRackLoad = (event) => {
    setSelectedRackLoad(event.target.value);
  };

  const handleChangeBracing = (event) => {
    setSelectedBracing(event.target.value);
  };

  const handleHeightChange = (event) => {
    setSelectedHeight(event.target.value);
  }

  const handleWidthChange = (event) => {
    setSelectedWidth(event.target.value);
  }

  const handleDepthChange = (event) => {
    setSelectedDepth(event.target.value);
  }

  const handleViewChange = (view) => {
    setSelectedView(view);
  };


  const handleDragMove = (index, e) => {
    const newRects = [...rects];
    const newX = Math.max(0, Math.min(stageWidth - rectSize, e.target.x()));
    const newY = Math.max(0, Math.min(stageHeight - rectSize, e.target.y()));

    // Check for overlap with the other rectangle
    const otherIndex = index === 0 ? 1 : 0;
    const otherRect = newRects[otherIndex];

    if (
      newX < otherRect.x + rectSize &&
      newX + rectSize > otherRect.x &&
      newY < otherRect.y + rectSize &&
      newY + rectSize > otherRect.y
    ) {
      return; // Prevent movement if overlapping
    }

    newRects[index] = { ...newRects[index], x: newX, y: newY };
    setRects(newRects);
  };

  const handleImageClick = (color, name, fullName) => {
    const margin = 10;
    setRects((prevRects) => {
      let count = prevRects.filter(rect => rect.name.startsWith(name)).length;
      let newId = `${name}${count + 1}`; // Ensure uniqueness like spr1, spr2, canti1, canti2

      if (name === 'space') {
        countsRef.current.space = 3;
        return [
          ...prevRects,
          { id: `aisle1`, x: 0, y: stageHeight * 0.2, width: stageWidth, height: 50, color, name: "Aisle Space" },
          { id: `aisle2`, x: 0, y: stageHeight * 0.5, width: stageWidth, height: 50, color, name: "Aisle Space" },
          { id: `aisle3`, x: 0, y: stageHeight * 0.8, width: stageWidth, height: 50, color, name: "Aisle Space" },
        ];
      }

      // First rectangle starts at (0,0)
      let x = count === 0 ? 0 : prevRects[prevRects.length - 1].x + rectSize + margin;
      let y = 0; // Keep y fixed at the top

      // Ensure it does not exceed the canvas width
      if (x + rectSize > stageWidth) {
        x = 0; // Move to the next row
        y += rectSize + margin; // Move down with spacing
      }

      // Update count for the specific type (spr, canti, etc.)
      countsRef.current[name] = count + 1;

      return [
        ...prevRects,
        {
          id: newId,  // Unique ID like spr1, spr2, canti1, canti2
          x,
          y,
          width: rectSize,
          height: rectSize,
          color,
          name: newId, // Ensure name is also unique
          fullName: fullName,
        },
      ];
    });
  };



  const isOverlapping = (x, y, index) => {
    return rects.some((rect, i) => {
      if (i !== index) {
        return (
          x < rect.x + rect.width &&
          x + rect.width > rect.x &&
          y < rect.y + rect.height &&
          y + rect.height > rect.y
        );
      }
      return false;
    });
  };


  // const fbx = useLoader(FBXLoader, "demo.fbx");
  // console.log("fbx", fbx, fbx.children[10].name)

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
              <div className="image-box" onClick={() => handleImageClick('blue', 'spr', 'Shuttle Pallet Rack')}>
                <img src={sprs} alt="Shuttle Pallet Racking" />
              </div>
              <div className="image-box" onClick={() => handleImageClick('red', 'canti', 'Cantilever')}>
                <img src={canti} alt="Cantilever" />
              </div>
              {/* <div className="image-box">
                <img src="{mts}" alt="Multi-Tier Racking" />
              </div>
              <div className="image-box">
                <img src="image4.jpg" alt="Mobile Pallet Racking" />
              </div> */}
            </div>
          </div>
          <div className="building-accessories">

            <div className="product-group">
              <h4>Building Accessories</h4>
              <div className="image-grid">
                <div className="image-box">
                  <img src={aisleSpace} alt="Aisle Space" onClick={() => handleImageClick('grey', 'space', 'Aisle Space')} />
                </div>
                <div className="image-box" onClick={() => handleImageClick('brown', 'door', 'Door')}>
                  <img src={door} alt="Door" />
                </div>
              </div>
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

          <Stage width={stageWidth} height={stageHeight} className="konva-stage">
            <Layer>
              {rects.map((rect, index) => (
                <Group
                  key={rect.id}
                  draggable
                  onDblClick={() => handleRectClick(rect)}
                  onDragMove={(e) => !rect.name === "Aisle Space" && handleDragMove(index, e)}
                  dragBoundFunc={(pos) => {
                    let newX = rect.name === "Aisle Space" ? rects[index].x : Math.max(0, Math.min(stageWidth - rect.width, pos.x));
                    let newY = Math.max(0, Math.min(stageHeight - rect.height, pos.y));

                    // Prevent overlapping before moving
                    if (isOverlapping(newX, newY, index)) {
                      return { x: rects[index].x, y: rects[index].y }; // Keep it at the last position
                    }

                    return { x: newX, y: newY };
                  }}
                >
                  <Rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={rect.color}
                  // onDragMove={(e) => !rect.name === "Aisle Space" && handleDragMove(index, e)}
                  //   dragBoundFunc={(pos) => {
                  //     let newX = rect.name === "Aisle Space" ? rects[index].x : Math.max(0, Math.min(stageWidth - rect.width, pos.x));
                  //     let newY = Math.max(0, Math.min(stageHeight - rect.height, pos.y));

                  //     if (isOverlapping(newX, newY, index)) {
                  // return { x: rects[index].x, y: rects[index].y };
                  //     }

                  //     return { x: newX, y: newY };
                  //   }}
                  />
                  <Text
                    x={rect.name === "Aisle Space" ? rect.x + rect.width / 2 - 30 : rect.x + rectSize / 4}
                    y={rect.name === "Aisle Space" ? rect.y + rect.height / 2 - 50 : rect.y + rectSize / 4}
                    text={rect.name}
                    fontSize={14}
                    fill="white"
                    fontStyle="bold"
                    align="center"
                    width={rectSize}
                    height={rectSize}
                    verticalAlign="middle"
                  />
                </Group>
              ))}
            </Layer>
          </Stage>

          {modalVisible && selectedRect && (
            <div className="modal">
              {/* <h2>Product Details</h2> */}
              <div className="modal-content">

                <div className="properties-panel">
                  <h3>Properties of {selectedRect.id}</h3>
                  <p><strong>A(M) {heightData[selectedHeight]?.name}x{widthData[selectedWidth]?.name}x{depthData[selectedDepth]?.name}</strong></p>
                  <div className="property-list">
                    <div>
                      <label>
                        ID:<input type="text" value={selectedRect.id} readOnly />
                      </label>
                    </div>
                    <div>
                      <label>
                        Name:<input type="text" value={selectedRect.fullName} />
                      </label>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="height">Height:</label>
                      <select name="height" id="height" onChange={handleHeightChange} value={selectedHeight}>
                        {Object.entries(heightData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name} cm
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="width">Width:</label>
                      <select name="width" id="width" onChange={handleWidthChange} value={selectedWidth}>
                        {Object.entries(widthData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name} cm
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="depth">Depth:</label>
                      <select name="depth" id="depth" onChange={handleDepthChange} value={selectedDepth}>
                        {Object.entries(depthData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name} cm
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="load">Rack Load:</label>
                      <select name="load" id="load" onChange={handleRackLoad} value={selectedRackLoad}>
                        {Object.entries(rackLoad).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="upright">Upright</label>
                      <select name="upright" id="upright" onChange={handleChangeUpright} value={selectedUpright}>
                        {/* <option value="">Select Upright</option> */}
                        {Object.entries(uprightData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="bracing">Bracing Material</label>
                      <select name="bracing" id="bracing" onChange={handleChangeBracing} value={selectedBracing}>
                        {/* <option value="">Select Bracing</option> */}
                        {Object.entries(bracingMaterialData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="cost">
                      <table style={{ borderCollapse: "collapse", width: "100%", border: "1px solid black" }}>
                        <thead>
                          <tr>
                            <th>Part No</th>
                            <th>Part Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{heightData[selectedHeight]?.partNo || "N/A"}</td>
                            <td>{heightData[selectedHeight]?.fullName || "N/A"}</td>
                            <td>4</td>
                            <td>${heightData[selectedHeight]?.cost || "N/A"}</td>
                          </tr>
                          <tr>
                            <td>{widthData[selectedWidth]?.partNo || "N/A"}</td>
                            <td>{widthData[selectedWidth]?.fullName || "N/A"}</td>
                            <td>1</td>
                            <td>${widthData[selectedWidth]?.cost || "N/A"}</td>
                          </tr>
                          <tr>
                            <td>{depthData[selectedDepth]?.partNo || "N/A"}</td>
                            <td>{depthData[selectedDepth]?.fullName || "N/A"}</td>
                            <td>7</td>
                            <td>${depthData[selectedDepth]?.cost || "N/A"}</td>
                          </tr>
                          {/* Total Calculation Row */}
                          <tr>
                            <td colSpan="2"></td> {/* Empty columns */}
                            <td><strong>Total:</strong></td>
                            <td>
                              ${(
                                (heightData[selectedHeight]?.cost || 0) * 4 +
                                (widthData[selectedWidth]?.cost || 0) * 1 +
                                (depthData[selectedDepth]?.cost || 0) * 7
                              ).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>


                    </div>
                    <div className="view-groups">
                      <div className="view-groups-grid">
                        <div
                          className={`view-groups-box ${selectedView === "stand" ? "active" : ""}`}
                          onClick={() => handleViewChange("stand")}
                        >
                          <img src={sideViewIcon} alt="Front View" />
                        </div>
                        <div
                          className={`view-groups-box ${selectedView === "sideView" ? "active" : ""}`}
                          onClick={() => handleViewChange("sideView")}
                        >
                          <img src={sideViewIcon} style={{ transform: "scaleX(-1)" }} alt="Side View" />
                        </div>
                        <div
                          className={`view-groups-box ${selectedView === "topView" ? "active" : ""}`}
                          onClick={() => handleViewChange("topView")}
                        >
                          <img src={topView} alt="Top View" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="canvas">
                  <Canvas>
                    {selectedView === "stand" && <Stand position={[0, 0, 0]} selectedHeight={selectedHeight} selectedWidth={selectedWidth} />}
                    {selectedView === "sideView" && <SideView position={[0, 0, 0]} selectedDepth={selectedDepth} />}
                  </Canvas>

                  <div className="button-container">
                    <button onClick={handleSaveAndClose}>Save and Close</button>
                    <button onClick={() => setModalVisible(false)}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="right-half">
          <div className="product-details">
            <h1>Product Details</h1>
            <label>Warehouse Dimensions</label>
            <p><strong>{stageWidth} ft x {stageHeight} ft</strong></p>
            <label>Total Aisle Space</label>
            <p><strong>{countsRef.current.space}</strong></p>
            {saveJSON.current ? (
              <>
                <p><strong>Total SPRs:</strong> {countsRef.current.spr}</p>
                <table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Part No</th>
      <th>Part Name</th>
      <th>Quantity</th>
      <th>Price</th>
      <th>Total Price</th>
    </tr>
  </thead>
  <tbody>
    {JSON.parse(saveJSON.current).map((item, index) => {
      // Calculate the total cost for the "Total Price" column for this item
      const totalItemPrice = item.parts.reduce((acc, part) => acc + (parseFloat(part.price) * parseInt(part.quantity)), 0);

      return (
        <React.Fragment key={index}>
          {item.parts.map((part, partIndex) => (
            <tr key={partIndex}>
              {partIndex === 0 && (
                <td rowSpan={item.parts.length}>{item.id}</td>
              )}
              <td>{part.partNo}</td>
              <td>{part.partName}</td>
              <td>{part.quantity}</td>
              <td>${part.price}</td>
              {partIndex === 0 && (
                <td rowSpan={item.parts.length}>${totalItemPrice.toFixed(2)}</td>
              )}
            </tr>
          ))}
        </React.Fragment>
      );
    })}
    {/* Row for the total cost of the last column */}
    <tr>
      <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Cost:</td>
      <td>
        ${
          // Calculate the grand total for all the items
          JSON.parse(saveJSON.current).reduce((total, item) => {
            const itemTotal = item.parts.reduce((acc, part) => acc + (parseFloat(part.price) * parseInt(part.quantity)), 0);
            return total + itemTotal;
          }, 0).toFixed(2)
        }
      </td>
    </tr>
  </tbody>
</table>




                {/* <p><strong>Total Cantilevers:</strong> { }</p> */}
              </>
            ) : (
              <p>No product data available</p>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Header;
