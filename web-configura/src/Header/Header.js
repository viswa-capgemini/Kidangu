import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo  } from "react";
import { Stage, Layer, Rect, Image, Text, Group, Arrow, Transformer } from "react-konva";
import { useLocation, useNavigate } from "react-router-dom";
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
import { OrthographicCamera, Html, PerspectiveCamera, OrbitControls } from "@react-three/drei";
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
import topViewSPR from "../assets/racking/SPR_Top_View.png"
import topViewSPRAddOn from "../assets/racking/Addon.png"
import unitImage from "../assets/racking/UNIT.png"
// import imageAI from "../assets/canvas_image.svg"

// svg image of the converted png
// import rightView from "../assets/viewer-right-view.svg"
import rightView from "../assets/rightview.png"
import frontview1 from "../assets/frontview1.svg"
import box from "../assets/racking/box-front.png"
import CustomLoading from "../CustomStyles/CustomLoading";
import { PivotControls, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import axios from "axios";
import * as THREE from "three";
import { Object3D } from 'three';
import AxisHelper from "../Axis/AxisHelper";

const GRID_SIZE = 50; // Cell size

const Stand = forwardRef(({ position, selectedHeight, selectedWidth, selectedRackLoad, selectedNoOfLevels, idsInRow }, ref) => {
  const { scene } = useThree();
  const instancedMeshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);

  // References for exposing mesh positions
  const mesh1Ref = useRef();
  const mesh2Ref = useRef();
  const topBar1Ref = useRef();
  const topBar2Ref = useRef();
  const rackRefs = useRef([]);

  // GLTF model states
  const [modelParts, setModelParts] = useState({
    frame1: null,
    frame2: null,
    beam1: null,
    beam2: null,
  });

  const rackPositions = [
    [-2.45, 1.8],
    [-1.45, 1.8],
    [-0.45, 1.8],
    [-2.45, 0.3],
    [-1.45, 0.3],
    [-0.45, 0.3],
  ];

  useImperativeHandle(ref, () => ({
    getMeshPositions: () => ({
      mesh1: mesh1Ref.current?.position.toArray() || [0, 0, 0],
      mesh2: mesh2Ref.current?.position.toArray() || [0, 0, 0],
      topBar1: topBar1Ref.current?.position.toArray() || [0, 0, 0],
      topBar2: topBar2Ref.current?.position.toArray() || [0, 0, 0],
    }),
  }));

  useEffect(() => {
    if (modelParts.frame1) {
      // Create a bounding box to measure the model
      const boundingBox = new THREE.Box3().setFromObject(modelParts.frame1);
      const height = boundingBox.max.y - boundingBox.min.y;
      console.log("Frame1 height:", height);
    }
  }, [modelParts.frame1]);

  useEffect(() => {
    if (modelParts.frame1 && instancedMeshRef.current) {
      // Clone the geometry and material from the original model
      let geometry, material;
      modelParts.frame1.traverse((child) => {
        if (child.isMesh) {
          geometry = child.geometry;
          material = child.material;
        }
      });
      
      if (geometry && material) {
        // Create instances at different heights
        for (let i = 0; i < 1; i++) {
          tempObject.position.set(0, i * 1, 0);
          tempObject.updateMatrix();
          instancedMeshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, [modelParts.frame1]);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("/assets/UNIT.glb", (gltf) => {
      const model = gltf.scene;
      console.log("model", model);
  
      const frame1 = model.getObjectByName("FRAME_ASSY_1000D-7M1");
      const frame2 = model.getObjectByName("FRAME_ASSY_1000D-7M2");
      const beam1 = model.getObjectByName("BEAM_ASSEMBLY1");
      const beam2 = model.getObjectByName("BEAM_ASSEMBLY3");
  
      if (frame1) {
        frame1.rotation.set(0, -Math.PI / 2, 0);
        // Center the geometry for proper scaling
        new THREE.Box3().setFromObject(frame1).getCenter(frame1.position);
        frame1.position.multiplyScalar(-1);
      }
      if (frame2) {
        frame2.rotation.set(0, Math.PI / 2, 0);
        // Center the geometry for proper scaling
        new THREE.Box3().setFromObject(frame2).getCenter(frame2.position);
        frame2.position.multiplyScalar(-1);
      }
      if (beam1) beam1.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      if (beam2) beam2.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  
      setModelParts({
        frame1,
        frame2,
        beam1,
        beam2,
      });
    });
  }, []);

  useEffect(() => {
    rackRefs.current.forEach((ref, index) => {
      if (ref) {
        console.log(`Rack ${index} Position:`, ref.position);
      }
    });
  }, [selectedWidth]);

  // Function for reusing the clone method for deep cloning
  const clone = (object) => object?.clone(true);
  const totalWidth = (idsInRow + 2) * 4.1; // Calculate total width based on frames

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, -1, 10]}
        near={0.1}
        far={1000}
        zoom={90}
      />

      {/* Add OrbitControls with restricted functionality */}
    {/* <OrbitControls 
      enableRotate={false}  // Disable rotation
      enableZoom={true}     // Allow zooming
      enablePan={true}      // Enable panning
      panSpeed={1}          // Adjust pan speed
      screenSpacePanning={true}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 2}
    /> */}

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

      {/* <instancedMesh 
      ref={instancedMeshRef} 
      args={[null, null, 1]}
    /> */}

      {/* Frames */}
        <group position={[0, -2, 0]} >
        {modelParts.frame1 && 
          Array.from({ length: idsInRow + 2 }).map((_, index) => (
            <primitive
              key={index}
              object={clone(modelParts.frame1)}
              scale={[1, selectedHeight, 1]}
              position={[-2 + index * 4.1, 0, 0]}
              onUpdate={(self) => {
                self.position.set(-2 + index * 4.1, 0, 0);
                self.updateMatrixWorld();
              }}
            />
          ))
        }
          {modelParts.beam1 &&
            Array.from({ length: selectedNoOfLevels }).map((_, index) => (
          <primitive
            key={index}
            object={clone(modelParts.beam1)}
            position={[-1.5, index - 1, 1]} // Adjust the vertical spacing if needed
            // onUpdate={(self) => {
            //   self.position.set(self.position.x, index - 1, self.position.z); // Allow movement only in one direction (vertical)
            //   self.updateMatrixWorld();
            // }}
          />
            ))}
        </group>
        {/* Beams */}
      {/* <group >
        {modelParts.beam1 && (
          <primitive object={modelParts.beam1} position={[-1.5, 0, 0]} />
        )}
        {modelParts.beam2 && (
          <primitive object={modelParts.beam2} position={[1.5, 0, 0]} />
        )}
      </group> */}
    </>
  );
});

const SideView = ({ position, selectedDepth }) => {

  const loader = new GLTFLoader();
  const [model, setModel] = useState(null);

  useEffect(() => {
    loader.load("/assets/UNIT.glb", (gltf) => {
      const model = gltf.scene;
      console.log("model", model)
      // model.position.set(2, 0, 0);
      model.scale.set(0.7, 0.7, 0.7);
      model.rotation.set(Math.PI, 0, 0);

      // model.traverse((children) => {
      //   if (children.isMesh) {
      //     children.castShadow = true;
      //     children.receiveShadow = true;
      //   }
      // });
      // scene.add(model);
      setModel(model);
    })
  }, [])

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

//     <>
//     <OrthographicCamera
//   makeDefault
//   position={[0, 0, 5]} // Right side view
//   zoom={100}
//   near={0.1}
//   far={1000}
// />

//       <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
//         {model && <primitive object={model} />}
//       </group>

//     <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
//       <ambientLight intensity={0.6} />
//       </>

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

const FrontView = () => {
  return (
    <svg height="1000" width="900" xmlns="http://www.w3.org/2000/svg">
      <image height="1000" width="900" href={rightView} />
    </svg>
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
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [image] = useImage(sprs);
  const centerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ width: 7000, height: 7000 });
  const [stands, setStands] = useState([{ id: 1, position: [0, 0, 0] }]);
  const stageWidth = 1050;
  const stageHeight = 720;
  const rectSize = 100;
  const [rects, setRects] = useState([]);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [rectsByName, setRectsByName] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRect, setSelectedRect] = useState(null);
  const [selectedHeight, setSelectedHeight] = useState(1);
  const [selectedWidth, setSelectedWidth] = useState(1);
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [selectedUpright, setSelectedUpright] = useState(null);
  const [selectedBracing, setSelectedBracing] = useState(null);
  const [selectedRackLoad, setSelectedRackLoad] = useState(1);
  const [selectedView, setSelectedView] = useState("stand");
  const [selectedElevation, setSelectedElevation] = useState(1);
  const [selectedNoOfLevels, setSelectedNoOfLevels] = useState(5);
  const [draggingCoordinates, setDraggingCoordinates] = useState({ x: 0, y: 0 });
  const [activeDragId, setActiveDragId] = useState(null);
  // const [saveJSON, setSaveJSON] = useState(null);
  const saveJSON = useRef(null);
  const countsRef = useRef({ spr: 0, canti: 0, space: 0 });
  const standRef = useRef();
  const [topViewSPRImage] = useImage(topViewSPR); // Load image
  const [addOnSPRImage] = useImage(topViewSPRAddOn); // Load image
  const [unit] = useImage(unitImage);
  const location = useLocation();
  const enquiryNumber = location.state?.enquiryNumber || "N/A";
  const navigate = useNavigate();
  const transformerRef = useRef(null);
  const groupRefs = useRef({});
  const [selectedShape, setSelectedShape] = useState(null);
  const idsInRow = useRef(0);

  useEffect(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const div = document.querySelector('.canvas');
      const rect = div.getBoundingClientRect();
      console.log("rect", rect.width, rect.height);
    })
  }, [])

  const heightData = {
    1: { name: "300", partNo: "GXL 90-1.6", fullName: "GXL 90-3m", cost: '10', scale: 1 },
    2: { name: "400", partNo: "GXL 90-1.8", fullName: "GXL 90-4m", cost: '20', scale: 1.1 },
    3: { name: "500", partNo: "GXL 90-2.0", fullName: "GXL 90-5m", cost: '30', scale: 1.2 },
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
    2: { name: "750" },
    3: { name: "1000" },
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

  const elevationData = {
    1: { name: "Custom" },
    2: { name: "SKU" },
    3: { name: "Pallet" },
    4: { name: "MHE" },
  }

  const noOfLevels = {
    1: { name: "1" },
    2: { name: "2" },
    3: { name: "3" },
    4: { name: "4" },
    5: { name: "5" },
  }
  // const [selectedScale, setSelectedScale] = useState(heightData[1].scale);
  const selectedScale = useRef(heightData[selectedHeight].scale);

  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  useEffect(() => {
    if (transformerRef.current && selectedShape) {
      const selectedNode = groupRefs.current[selectedShape];
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedShape]);

  const handleRectClick = (rect) => {
    setSelectedRect(rect);
    setModalVisible(true);
  };

  const handleSaveAndClose = () => {
    const meshPositions = standRef.current?.getMeshPositions() || {};

    // Construct jsonData dynamically for all present IDs
    const warehouseJson = {
      warehouse: {
        enquiry_id: enquiryNumber,
        warehousefile: `${enquiryNumber}.iam`,
        dimensions: {
          width: stageWidth,
          length: 100,
          height: stageHeight,
        },
        total_racks: rects.filter(rect => rect.fullName === "Shuttle Pallet Rack").length,
        total_doors: 0,
        total_windows: 0,
        total_pillars: 0,
        doors: [],
        windows: [],
        pillars: [],
        aisles: rects
        .filter(rect => rect.fullName === "Aisle Space")
        .map((rect, index) => ({
          aisleId: rect.id,
          productGroup: rect.fullName,
          x_position: `${rect.x}`,
          y_position: `${rect.y}`,
          z_position: "0",
          aisleIndex: index + 1,
        })),
        cross_aisles: [],
        aisle_spaces: [],
        products: rects
          .filter(rect => rect.fullName === "Shuttle Pallet Rack")
          .map((rect, index) => ({
            productId: rect.id,
            productGroup: rect.fullName,
            sourceiamfile_path: "C:\\Users\\reetts\\Downloads\\SPR FULL ASSY\\SPR FULL ASSY\\UNIT.iam",
            x_position: `${-rect.x}`,
            y_position: `${-rect.y}`,
            z_position: "0",
            sourceiamFileName: rect.name === "Aisle Space" ? "" : "UNIT.iam",
            rack_id: index + 1,
            racksubAssembly: `${enquiryNumber}_Rack${index + 1}.iam`
          }))
      }
    };

    console.log("Generated JSON:", JSON.stringify(warehouseJson, null, 2));

    // Save JSON dynamically into current context
    saveJSON.current = ((prevSaveJSON) => {
      let updatedSaveJSON = [];

      if (prevSaveJSON) {
        try {
          updatedSaveJSON = JSON.parse(prevSaveJSON);
        } catch (e) {
          console.error("Invalid previous JSON, resetting...", e);
          updatedSaveJSON = [];
        }
      }

      // Check if entry for this enquiry already exists
      const existingIndex = updatedSaveJSON.findIndex(
        entry => entry.warehouse?.enquiry_id === warehouseJson.warehouse.enquiry_id
      );

      if (existingIndex !== -1) {
        updatedSaveJSON[existingIndex] = warehouseJson; // Replace existing
      } else {
        updatedSaveJSON.push(warehouseJson); // Add new
      }

      return JSON.stringify(updatedSaveJSON, null, 2);
    })(saveJSON.current);

    // Debug output
    console.log("Updated saveJSON:", saveJSON.current);

    // Validate & trigger save + API call
    if (warehouseJson.warehouse.products.length <= 0) {
      alert("Please place any one of the Product Group");
    } else {
      downloadJSON(saveJSON.current).then((res) => {
        if (res === true) {
          axios.post("http://localhost:5133/api/metadataapi/RunILogic2")
            .then(() => {
              setTimeout(() => {
                setLoading(false);
                navigate('/');
              }, 10000);
            })
            .catch((err) => {
              console.log("err in api", err);
              setLoading(false);
            });
        }
      });
    }

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
    const newSelectedHeight = (event.target.value);
    setSelectedHeight(newSelectedHeight);
    // setSelectedScale(heightData[newSelectedHeight].scale);
    selectedScale.current = heightData[newSelectedHeight].scale;
  };

  const handleWidthChange = (event) => {
    setSelectedWidth(event.target.value);
  }

  const handleDepthChange = (event) => {
    setSelectedDepth(event.target.value);
  }

  const handleViewChange = (view) => {
    setSelectedView(view);
  };

  const handleElevationChange = (event) => {
    setSelectedElevation(event.target.value);
  }

  const handleLevelChange = (event) => {
    setSelectedNoOfLevels(event.target.value);
  }

  const handleDragMove = (index, e) => {
    const newRects = [...rects];
    let newX = Math.max(0, Math.min(stageWidth - rects[index].width, e.target.x()));
    let newY = Math.max(0, Math.min(stageHeight - rects[index].height, e.target.y()));

    // Find the nearest available position if overlapping
    let { x: finalX, y: finalY } = findNearestNonOverlappingPosition(newX, newY, index);

    if (finalX !== newRects[index].x || finalY !== newRects[index].y) {
      newRects[index] = { ...newRects[index], x: finalX, y: finalY };
      setRects(newRects);
    }
  };

  const handleImageClick = (color, name, fullName, imageUrl, addOnSPRImage) => {
    const margin = 10;
    const rowHeight = rectSize + margin; // Fixed row height
    const rowMap = { spr: 0, canti: 1, rack: 2, space: 3 }; // Define fixed row positions

    setRects((prevRects) => {
      // Filter only for the current type (spr, aisle, etc.)
      let filteredRects = prevRects.filter(rect => rect.name.startsWith(name));
      let count = filteredRects.length;
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

      let lastRect = filteredRects.length > 0 ? filteredRects[filteredRects.length - 1] : null;
      let x = count === 0 ? 0 : lastRect.x + rectSize;
      let y = lastRect ? lastRect.y : 0;

      let isNewRow = x + rectSize > stageWidth;
      if (isNewRow) {
        x = 0;
        y += rectSize + margin;
      }

      // Count the number of IDs in the current row
      idsInRow.current = filteredRects.filter(rect => rect.y === y).length;
      console.log(`Number of IDs in row ${y / rowHeight + 1}:`, idsInRow.current);

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
          imageUrl: name === "spr" ? (isNewRow || count === 0 ? imageUrl : addOnSPRImage) : color,
          // imageUrl
        },
      ];
    });
  };

  const handleDragStart = (e, color, name, fullName, imageUrl, addOnSPRImage) => {
    e.dataTransfer.setData(
      'draggedItem',
      JSON.stringify({ color, name, fullName, imageUrl, addOnSPRImage })
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedItem = JSON.parse(e.dataTransfer.getData('draggedItem'));
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    setRects((prevRects) => [
      ...prevRects,
      {
        id: `${draggedItem.name}${prevRects.length + 1}`,
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: rectSize,
        height: rectSize,
        color: draggedItem.color,
        name: draggedItem.name,
        fullName: draggedItem.fullName,
        imageUrl: draggedItem.imageUrl,
      },
    ]);
  };

  // Function to find the nearest available position that does not overlap
  const findNearestNonOverlappingPosition1 = (x, y, existingRects) => {
    let step = 5; // Move in small increments to find a valid spot
    let maxAttempts = 100;
    let attempts = 0;

    while (isOverlapping1(x, y, existingRects) && attempts < maxAttempts) {
      x += step;
      if (x + rectSize > stageWidth) {
        x = 0;
        y += step;
      }
      if (y + rectSize > stageHeight) {
        y = 0;
      }
      attempts++;
    }

    return { x, y };
  };

  // Check if a position is overlapping with any existing rectangle
  const isOverlapping1 = (x, y, existingRects) => {
    return existingRects.some(rect => (
      x < rect.x + rect.width &&
      x + rectSize > rect.x &&
      y < rect.y + rect.height &&
      y + rectSize > rect.y
    ));
  };


  const isOverlapping = (x, y, index) => {
    return rects.some((rect, i) => {
      if (i !== index) {
        return (
          x < rect.x + rect.width &&
          x + rects[index].width > rect.x &&
          y < rect.y + rect.height &&
          y + rects[index].height > rect.y
        );
      }
      return false;
    });
  };

  // Find the nearest available position that does not overlap
  const findNearestNonOverlappingPosition = (x, y, index) => {
    let step = 5;
    let maxAttempts = 100; // Increase attempts for a better search
    let attempts = 0;
    let found = false;

    while (attempts < maxAttempts) {
      if (!isOverlapping(x, y, index)) {
        found = true;
        break;
      }

      // Try moving in a spiral pattern
      let directions = [
        { dx: step, dy: 0 },   // Right
        { dx: -step, dy: 0 },  // Left
        { dx: 0, dy: step },   // Down
        { dx: 0, dy: -step },  // Up
      ];

      for (let dir of directions) {
        let newX = x + dir.dx;
        let newY = y + dir.dy;

        if (newX >= 0 && newX + rects[index].width <= stageWidth &&
          newY >= 0 && newY + rects[index].height <= stageHeight &&
          !isOverlapping(newX, newY, index)) {

          return { x: newX, y: newY };
        }
      }

      attempts++;
    }

    return found ? { x, y } : { x: rects[index].x, y: rects[index].y }; // Return last valid position
  };

  const downloadJSON = async (jsonString) => {
    setLoading(true);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "layoutdata.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await sleep(5000);
    return true;
  }

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

  const handleTransformEnd = (rect, index) => {
    const node = groupRefs.current[rect.id];
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Update dimensions
    const updated = [...rects];
    updated[index] = {
      ...rect,
      x: node.x(),
      y: node.y(),
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };

    node.scaleX(1);
    node.scaleY(1);

    // Update the state in your app
    // Assuming you have a setter:
    // setRects(updated);
  };

  const COLUMNS = Math.floor(gridSize.width / GRID_SIZE);
  const ROWS = Math.floor(gridSize.height / GRID_SIZE);

  return (
    <div className="navbar-sidebar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <a href="#" className="logo">
            StoreSphere
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
          <ul className="nav-links">
            <li><a href="/upload-dwg">Upload DWG</a></li>
          </ul>
          <a href="/cart" className="cart-icon">
            <i className="fas fa-shopping-cart"></i>
            <span className="cart-count">0</span>
          </a>
          <a href="/account" className="user-icon">
            <i className="fas fa-user"></i>
          </a>
        </div>
      </nav>

      {/* <svg height="1000" width="900" xmlns="http://www.w3.org/2000/svg">
  <image height="1000" width="900" href={rightView} />
</svg> */}

      {/* Main Content Area */}
      <div className="main-content">
        <div className="left-half">
          <div className="product-group">
            <h1>Product Group</h1>
            <div className="image-grid">
              <div className="image-box" draggable onDragStart={(e) => handleDragStart(e, 'blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage)} onClick={() => handleImageClick('blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage)}>
                <img src={sprs} alt="Shuttle Pallet Racking" />
              </div>
              {/* <div className="image-box" onClick={() => handleImageClick('red', 'canti', 'Cantilever')}>
                <img src={canti} alt="Cantilever" />
              </div> */}
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
                {/* <div className="image-box" onClick={() => handleImageClick('brown', 'door', 'Door')}>
                  <img src={door} alt="Door" />
                </div>
                <div className="image-box" onClick={() => handleImageClick('brown', 'pillar', 'Pillar')}>
                  <img src={pillar} alt="Pillar" />
                </div>
                <div className="image-box" onClick={() => handleImageClick('brown', 'door', 'Door')}>
                  <img src={door} alt="Door" />
                </div> */}
              </div>
            </div>
          </div>
          {/* <div className="product-accessories">
            <h4>Rack Protection</h4>
            <select name="rack-protection" id="rack-protection">
              <option value="40-high">40 cm high</option>
              <option value="80-high">80 cm high</option>
            </select><br />
            <button onClick={addStand} style={{ marginBottom: "10px" }}>Add Stand</button>
          </div> */}
        </div>


        {/* Center Half with Full-Sized Grid */}
        <div className="center-half" ref={centerRef}>

          <svg width={stageWidth} height="20" style={{ position: "absolute", top: "1%", left: "10%" }}>
            <line x1="0" y1="0" x2={stageWidth} y2="0" stroke="black" strokeWidth="5" />
            <text x={stageWidth / 2} y="18" fontWeight="bold" fontSize="16" textAnchor="middle" fill="black">
              {`Width: 100m`}
            </text>
          </svg>
          <svg width="20" height={stageHeight} style={{ position: "absolute", top: "12%", left: "2%" }}>
            <line x1="0" y1={stageHeight} x2="0" y2="0" stroke="black" strokeWidth="5" />
            <text x={-stageHeight / 2} y="18" fontWeight="bold" fontSize="16" textAnchor="middle" fill="black" transform={`rotate(-90, 10, 10)`}>
              {`Height: 100m`}
            </text>
          </svg>

          <Stage
      width={stageWidth}
      height={stageHeight}
      className="konva-stage"
      onDrop={(e) => handleDrop(e)}
      onDragOver={(e) => e.preventDefault()}
    >
      <Layer>
        {rects.map((rect, index) => (
          <Group
            key={rect.id}
            ref={(el) => (groupRefs.current[rect.id] = el)}
            draggable
            // onClick={() => setSelectedShape(rect.id)}
            onDblClick={() => rect.name !== "Aisle Space" ? handleRectClick(rect) : null}
            onDragStart={() => setActiveDragId(rect.id)}
            onTransformEnd={() => handleTransformEnd(rect, index)}
            onDragMove={(e) => {
              if (rect.name !== "Aisle Space") handleDragMove(index, e);

              if (activeDragId === rect.id) {
                const { x, y } = e.target.position();
                setDraggingCoordinates({ x, y });
              }
            }}
            onDragEnd={() => {
              setDraggingCoordinates(null);
              setActiveDragId(null);
            }}
            dragBoundFunc={(pos) => {
              let newX = Math.max(0, Math.min(stageWidth - rect.width, pos.x));
              let newY = Math.max(0, Math.min(stageHeight - rect.height, pos.y));
              return { x: newX, y: newY };
            }}
          >
            {rect.name === "Aisle Space" ? (
              <>
                <Rect
                  fill={rect.color}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                />
                <Text
                  x={rect.x + rect.width / 2 - 30}
                  y={rect.y + rect.height / 2 - 50}
                  text={rect.name}
                  fontSize={14}
                  fill="black"
                  fontStyle="bold"
                  align="center"
                  width={rectSize}
                  height={rectSize}
                  verticalAlign="middle"
                />
              </>
            ) : (
              <>
                <Image
                  image={rect.imageUrl}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                />
                <Text
                  x={rect.x + rectSize / 4}
                  y={rect.y + rectSize / 4}
                  text={rect.name}
                  fontSize={14}
                  fill="black"
                  fontStyle="bold"
                  align="center"
                  width={rectSize}
                  height={rectSize}
                  verticalAlign="middle"
                />
              </>
            )}

            {activeDragId === rect.id && draggingCoordinates && (
              <>
                <Text
                  x={draggingCoordinates.x + 10}
                  y={draggingCoordinates.y - 20}
                  text={`X: ${draggingCoordinates.x}, Y: ${draggingCoordinates.y}`}
                  fontSize={14}
                  fill="black"
                  fontStyle="bold"
                />
                <Group>
                  <Arrow
                    points={[0, draggingCoordinates.y, stageWidth, draggingCoordinates.y]}
                    stroke="red"
                    strokeWidth={2}
                    pointerLength={10}
                    pointerWidth={10}
                  />
                  <Text
                    x={60}
                    y={draggingCoordinates.y - 15}
                    text={`X: ${draggingCoordinates.x}`}
                    fontSize={14}
                    fill="red"
                    fontStyle="bold"
                  />
                  <Arrow
                    points={[draggingCoordinates.x, 0, draggingCoordinates.x, stageHeight]}
                    stroke="blue"
                    strokeWidth={2}
                    pointerLength={10}
                    pointerWidth={10}
                  />
                  <Text
                    x={draggingCoordinates.x + 5}
                    y={5}
                    text={`Y: ${draggingCoordinates.y}`}
                    fontSize={14}
                    fill="blue"
                    fontStyle="bold"
                    rotation={-90}
                  />
                </Group>
              </>
            )}
          </Group>
        ))}

<Transformer
          ref={transformerRef}
          rotateEnabled={true}
          resizeEnabled={true}
          anchorSize={8}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
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
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label>
                        ID:
                      </label>
                      <input type="text" value={selectedRect.id} readOnly />
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label>
                        Name:
                      </label>
                      <input type="text" value={selectedRect.fullName} />
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="elevation">Elevation type:</label>
                      <select name="elevation" id="elevation" onChange={handleElevationChange} value={selectedElevation}>
                        {Object.entries(elevationData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="level">Total No of Levels</label>
                      <select name="level" id="level" onChange={handleLevelChange} value={selectedNoOfLevels}>
                        {Object.entries(noOfLevels).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))}
                      </select>
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
                  <Canvas
                    orthographic
                    camera={{ position: [0, 0, 5], zoom: 10, near: 0.1, far: 1000 }}
                    onCreated={({ gl }) => {
                      console.log("Canvas Width:", gl.domElement.width);
                      console.log("Canvas Height:", gl.domElement.height);
                    }} style={{ width: "100%", height: "100%", overflowX: "auto" }}>
                    {selectedView === "stand" &&
                      <Stand ref={standRef} position={[0, 0, 0]} selectedHeight={selectedScale.current} selectedWidth={selectedWidth} selectedRackLoad={selectedRackLoad} selectedNoOfLevels={selectedNoOfLevels} idsInRow={idsInRow.current} />}
                    {selectedView === "sideView" &&
                      <SideView position={[0, 0, 0]} selectedDepth={selectedDepth} />}
                  </Canvas>

                  {/* {selectedView === "stand" && <FrontView />} */}

                  {/* <div className="button-container">
                    <button onClick={() => setModalVisible(false)}>Save and Close</button>
                    <button onClick={() => setModalVisible(false)}>Close</button>
                  </div> */}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="downloadJSON">
          <button onClick={handleSaveAndClose}>Upload BOM</button>
        </div>

        {loading && <CustomLoading />}

      </div>
    </div>
  );
};

export default Header;
