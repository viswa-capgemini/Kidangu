import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo  } from "react";
import { Stage, Layer, Rect, Image, Text, Group, Arrow, Transformer } from "react-konva";
import { useLocation, useNavigate } from "react-router-dom";
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, FormHelperText, Grid, Paper, Typography } from '@mui/material';
import { useImage} from "react-konva-utils";
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
import logWriter from "../logWriter"
// import imageAI from "../assets/canvas_image.svg"

// svg image of the converted png
// import rightView from "../assets/viewer-right-view.svg"
import plusIcon from "../assets/icons/plus.png";
import closeIcon from "../assets/icons/close-icon.jpg"
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

// For Redux store
import { useSelector, useDispatch } from 'react-redux';
import { incrementIdsInRow, decrementIdsInRow, setHeight, setNoOfLevels, setRects } from '../store';

const GRID_SIZE = 50; // Cell size

const Stand = forwardRef(({ position, selectedHeight, selectedWidth, selectedRackLoad, selectedNoOfLevels, selectedSecuring, selectedRect }, ref) => {
  const instancedMeshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const editIcon = useLoader(TextureLoader, edit);
  const [showDropdownId, setShowDropdownId] = useState(null);
  const [height, setHeight] = useState({});
  const [width, setWidth] = useState({});
  const [levels, setLevels] = useState({});
  const idsInRow = useSelector(state => state.global.idsInRow);
  const [underPass, setUnderPass] = useState({});
  const rects = useSelector(state => state.global.rects);
  const dispatch = useDispatch();
  logWriter("rects, selectedRect", rects, selectedRect, false);

  // height placement for the frames
  const [adjustment, setAdjustment]= useState(0);

  // Calculate the center position of all frames for camera positioning
  const totalWidth = (idsInRow + 1) * 4.1;
  const centerX = (totalWidth / 2) ;

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
    channel: null,
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

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // Check if click was outside any dropdown
  //     if (showDropdown.current && !event.target.closest('.edit-beam-compact')) {
  //       // setActiveDropdown(null);
  //       showDropdown.current = false;
  //     }
  //   };
  
  //   // Add event listener
  //   document.addEventListener('mousedown', handleClickOutside);
    
  //   // Clean up
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [showDropdown.current]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click was outside any dropdown
      if (showDropdownId && !event.target.closest('.edit-beam-compact')) {
        setShowDropdownId(null);
      }
    };
  
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownId]);

  useEffect(() => {
    if (modelParts.frame1) {
      // Create a bounding box to measure the model
      const boundingBox = new THREE.Box3().setFromObject(modelParts.frame1);
      const height = boundingBox.max.y - boundingBox.min.y;
      logWriter("Frame1 height", height, true);
      logWriter("Adjustment value changed:", adjustment, false);
    }
  }, [modelParts.frame1, adjustment]);

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
      logWriter("Model loaded", model, true);
  
      const frame1 = model.getObjectByName("FRAME_ASSY_1000D-7M1");
      const frame2 = model.getObjectByName("FRAME_ASSY_1000D-7M2");
      const beam1 = model.getObjectByName("BEAM_ASSEMBLY1");
      const beam2 = model.getObjectByName("BEAM_ASSEMBLY3");
      const channel = model.getObjectByName("C_-_CHANNEL2");
  
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
      if (channel) channel.rotation.set(Math.PI / 2, Math.PI / 2, 0);
  
      setModelParts({
        frame1,
        frame2,
        beam1,
        beam2,
        channel,
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

  useEffect(() => {
    rects.forEach((rect) => {
      if (rect.id === selectedRect) {
        setHeight(rect.height);
        setWidth(rect.width);
        setLevels(rect.levels);
        setUnderPass(rect.underPass);
      }
    });
  }, [rects, selectedRect]);

  const editPallet = (idsInRow, levelIndex, rowIndex) => {
    logWriter("Edit Pallet", `Level: ${levelIndex}, Row: ${rowIndex}, ID in Row: ${idsInRow}`, true);
  }

  const addNewFrame = (rowIndex) => {
    // Logic to add a new frame or row
    idsInRow += 1;
    console.log("Plus icon clicked for row:", rowIndex, idsInRow);
  }

  const handleHeightChange = (id, value) => {
    const rectObj = rects.find(rect => rect.id === selectedRect);

    let updatedHeight = { ...(rectObj?.height || { 0: 1, 1: 1 }) };

    // If changing either of the first two frames, update both to the same value
    if (id === 0 || id === 1) {
      updatedHeight[0] = value;
      updatedHeight[1] = value;
    } else {
      updatedHeight[id] = value;
    }

    // Update the local state
    setHeight(updatedHeight);

    logWriter("height", updatedHeight);

    // Use the updatedHeight object directly when updating Redux
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        return { ...rect, height: updatedHeight };
      }
      return rect;
    });

    dispatch(setRects(updatedRects));

    // Log the updated rect
    const updatedRect = updatedRects.find(rect => rect.id === selectedRect);
    if (updatedRect) {
      console.log("Updated rect:", updatedRect);
    }
  };

  const handleLevelDropDownChange = (rowIndex, value) => {

    const rectObj = rects.find(rect => rect.id === selectedRect);

    let updatedLevels = { ...(rectObj?.levels || { 0: 1 }) };

    // If changing either of the first two frames, update both to the same value
    if (rowIndex === 0) {
      updatedLevels[0] = value;
    } else {
      updatedLevels[rowIndex] = value;
    }

    setLevels(updatedLevels);
    
    logWriter("levels", levels, value);
    
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        return { ...rect, levels: updatedLevels };
      }
      return rect;
    });

    dispatch(setRects(updatedRects));

    // Log the updated rect
    const updatedRect = updatedRects.find(rect => rect.id === selectedRect);
    if (updatedRect) {
      console.log("Updated rect in levels:", updatedRect);
    }
  };

  const handleIncrementIdsInRow = () => {
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        // Get current addOn value or default to 0
        const currentAddOn = rect.addOn || 0;
        
        return {
          ...rect,
          addOn: currentAddOn + 1,
        };
      }
      return rect;
    });
    
    dispatch(setRects(updatedRects));
  };

  const handleDecrementIdsInRow = (rowIndex) => {
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        const currentAddOn = rect.addOn || 0;
        return {
          ...rect,
          addOn: currentAddOn - 1,
        };
      }
      return rect;
    });
    dispatch(setRects(updatedRects));
  };

  const handleUnderPassChange = (index, value) => {

    const rectObj = rects.find(rect => rect.id === selectedRect);

    let updatedUnderPass = { ...(rectObj?.underPass || { 0: 1 }) };

    if (index === 0) {
      updatedUnderPass[0] = value;
    } else {
      updatedUnderPass[index] = value
    }

    setUnderPass(updatedUnderPass);    
    
    logWriter("underPass", underPass);
    
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        return { ...rect, underPass: updatedUnderPass };
      }
      return rect;
    });

    dispatch(setRects(updatedRects));

    // Log the updated rect
    const updatedRect = updatedRects.find(rect => rect.id === selectedRect);
    if (updatedRect) {
      logWriter("Updated rect in updatedUnderPass:", updatedRect);
    }
  };

  const handleWidthChange = (index, value) => {
    const rectObj = rects.find(rect => rect.id === selectedRect);

    let updatedWidth = { ...(rectObj?.width || { 0: 1}) };
    if (index === 0) {
      updatedWidth[0] = value;
    } else {
      updatedWidth[index] = value;
    }
    
    setWidth(updatedWidth);
    logWriter("width", width);
    
    const updatedRects = rects.map((rect) => {
      if (selectedRect === rect.id) {
        return { ...rect, width: updatedWidth };
      }
      return rect;
    });

    dispatch(setRects(updatedRects));

    // Log the updated rect
    const updatedRect = updatedRects.find(rect => rect.id === selectedRect);
    if (updatedRect) {
      logWriter("Updated rect in width:", updatedRect);
    }

  };

  // Function for reusing the clone method for deep cloning
  const clone = (object) => object?.clone(true);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[centerX, -1, 10]}
        near={0.1}
        far={1000}
        zoom={90}
      />

      <ambientLight intensity={1} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

      <group position={[0, -2, 0]}>
        {modelParts.frame1 && (() => {
  // Find the selected rectangle to get its addOn value
  const selectedRectObj = rects.find(rect => rect.id === selectedRect);

  // Use the addOn value from the selected rectangle, or default to 0 if not found
  const addOnValue = selectedRectObj?.addOn || 0;

  // Calculate positions based on widths of previous frames
  const positions = [];
  let currentPosition = -2; // Starting position of first frame
  
  // Calculate positions for each frame based on previous frame widths
  for (let i = 0; i <= addOnValue + 1; i++) {
    positions.push(currentPosition);
    
    // Get width of current frame
    let currentWidth = 1; // Default width
    if (selectedRectObj?.width && selectedRectObj.width[i] !== undefined) {
      currentWidth = selectedRectObj.width[i];
    } else if (width[i] !== undefined) {
      currentWidth = width[i];
    }
    
    // Calculate spacing based on width
    // The base spacing is 4.1, but we adjust it based on the width
    const widthAdjustment = (currentWidth - 1) * 4.1; // Scale the adjustment based on width difference
    const spacing = 4.1 + widthAdjustment;
    
    // Update position for next frame
    currentPosition += spacing;
  }

  // Render frames based on the addOn value of the selected rectangle
  return Array.from({ length: addOnValue + 2 }).map((_, index) => {
    let heightValue = selectedHeight; // Default height

    // Look for a matching height value in the selected rect
    if (selectedRectObj?.height && selectedRectObj.height[index] !== undefined) {
      heightValue = selectedRectObj.height[index];
    } else if (height[index] !== undefined) {
      heightValue = height[index];
    }

    // Use the pre-calculated position
    const xPosition = positions[index];

    return (
      <primitive
        key={`frame-${index}`}
        object={clone(modelParts.frame1)}
        scale={[1, heightValue, 1]}
        position={[xPosition, 0, 0]}
        onUpdate={(self) => {
          // Get the original bounding box dimensions (before scaling)
          const originalObject = modelParts.frame1.clone();
          const originalBox = new THREE.Box3().setFromObject(originalObject);
          const originalHeight = originalBox.max.y - originalBox.min.y;

          const heightDifference = originalHeight * (heightValue - 1);

          self.position.set(
            xPosition,
            heightDifference / 3, // 1/3 is for the fixed height in the ground
            0
          );
          self.updateMatrixWorld();
        }}
      />
    );
  });
})()}
{modelParts.beam1 && (() => {
  // Find the selected rectangle to get its addOn value
  const selectedRectObj = rects.find(rect => rect.id === selectedRect);

  // Use the addOn value from the selected rectangle, or default to 0 if not found
  const addOnValue = selectedRectObj?.addOn || 0;

  // Calculate positions based on widths of previous frames
  const positions = [];
  let currentPosition = -2; // Starting position of first frame
  
  // Calculate positions for each frame based on previous frame widths
  for (let i = 0; i <= addOnValue; i++) {
    positions.push(currentPosition);
    
    // Get width of current frame
    let currentWidth = 1; // Default width
    if (selectedRectObj?.width && selectedRectObj.width[i] !== undefined) {
      currentWidth = selectedRectObj.width[i];
    } else if (width[i] !== undefined) {
      currentWidth = width[i];
    }
    
    // Calculate spacing based on width
    const widthAdjustment = (currentWidth - 1) * 4.1;
    const spacing = 4.1 + widthAdjustment;
    
    // Update position for next frame
    currentPosition += spacing;
  }

  return Array.from({ length: addOnValue + 1 }).map((_, rowIndex) => {
    let widthValue = selectedWidth;

    // Check if the selected rectangle has specific width for this row
    if (selectedRectObj?.width && selectedRectObj.width[rowIndex] !== undefined) {
      widthValue = selectedRectObj.width[rowIndex];
    }
    // Fallback to width array if available
    else if (width[rowIndex] !== undefined) {
      widthValue = width[rowIndex];
    }

    // Determine number of levels for this frame
    const frameLevels = selectedRectObj.levels?.[rowIndex] !== undefined
      ? selectedRectObj.levels[rowIndex]
      : (rowIndex <= 1 ? (selectedRectObj.levels?.[0] || selectedNoOfLevels) : selectedNoOfLevels);

    // Use the pre-calculated position, but adjust for beams (they're offset by 0.5 from frames)
    const xPosition = positions[rowIndex] + 0.5;

    return Array.from({ length: frameLevels }).map((_, levelIndex) => {
      // Skip first level if underpass is enabled for this row
      if (underPass[rowIndex] === 1 && levelIndex === 0) {
        return null;
      }

      return (
        <primitive
          key={`beam-${rowIndex}-${levelIndex}`}
          object={clone(modelParts.beam1)}
          scale={[1, widthValue, 1]} // Assuming beam scales along X-axis
          position={[xPosition, levelIndex - 1, 0.5]}
          onUpdate={(self) => {
            // Get the original bounding box dimensions (before scaling)
            const originalObject = modelParts.beam1.clone();
            const originalBox = new THREE.Box3().setFromObject(originalObject);
            const originalWidth = originalBox.max.x - originalBox.min.x;

            // Calculate how much the object has grown
            const widthDifference = originalWidth * (widthValue - 1);

            const fixLeftEnd = true;

            const xAdjustment = fixLeftEnd
              ? widthDifference / 10
              : -widthDifference / 4;

            setAdjustment(xAdjustment);

            self.position.set(
              xPosition + xAdjustment,
              levelIndex - 1,
              0.5
            );

            self.updateMatrixWorld();
          }}
        />
      );
    }).filter(Boolean); // Remove null entries (from underpass)
  });
})()}
        {selectedSecuring == 1 && modelParts.channel &&
          Array.from({ length: selectedNoOfLevels }).map((_, levelIndex) => {
            if (underPass[levelIndex] && levelIndex === 0) {
              return null;
            }

            return Array.from({ length: idsInRow + 1 }).map((_, rowIndex) => (
              <primitive
                key={`${levelIndex}-${rowIndex}`}
                object={clone(modelParts.channel)}
                position={[-2 + rowIndex * 4.1, levelIndex - 1, 1]}
                onUpdate={(self) => {
                  self.position.set(-2 + rowIndex * 4.1, levelIndex - 1, 1);
                  self.updateMatrixWorld();
                }}
              />
            ));
          }).filter(Boolean)}
        {modelParts.frame1 && (() => {
          // Find the selected rectangle to get its addOn value
          const selectedRectObj = rects.find(rect => rect.id === selectedRect);

          // Use the addOn value from the selected rectangle, or default to 0 if not found
          const addOnValue = selectedRectObj?.addOn || 0;

          return Array.from({ length: addOnValue + 1 }).map((_, rowIndex) => {
            if (rowIndex === addOnValue) {
              return (
                <Html
                  key={`plus-icon-${rowIndex}`}
                  position={[rowIndex * 4.1 + 2.5 + (adjustment * 10), 1, 1.5]} // Position after the last frame
                  transform
                  occlude
                  style={{
                    pointerEvents: 'auto',
                  }}
                >
                  <div
                    className="plus-icon"
                    onClick={() => {
                      handleIncrementIdsInRow();
                    }}
                  >
                    <img src={plusIcon} alt="Add" width="20" height="20" />
                  </div>
                </Html>
              );
            }

            // Get height value for this specific frame
            let heightValue = selectedHeight; // Default height

            // Use rect-specific height if available
            if (selectedRectObj?.height && selectedRectObj.height[rowIndex] !== undefined) {
              heightValue = selectedRectObj.height[rowIndex];
            }

            return (
              <primitive
                key={`frame-${rowIndex}`}
                object={clone(modelParts.frame1)}
                scale={[1, heightValue, 1]}
                position={[-2 + rowIndex * 4.1, 0, 0]}
                onUpdate={(self) => {
                  const boundingBox = new THREE.Box3().setFromObject(self);
                  const heightOffset = boundingBox.max.y - boundingBox.min.y;

                  self.position.set(-2 + rowIndex * 4.1, heightOffset * (heightValue - 1) / 2, 0);
                  self.updateMatrixWorld();
                }}
              />
            );
          });
        })()}
        {modelParts.frame1 && (() => {
          const selectedRectObj = rects.find(rect => rect.id === selectedRect);
          const addOnValue = selectedRectObj?.addOn || 0;

          return Array.from({ length: addOnValue + 1 }).map((_, rowIndex) => {
            // Only show remove icon for the last frame and if there's at least one add-on
            if (rowIndex === addOnValue && addOnValue > 0) {
              return (
                <Html
                  key={`remove-icon-${rowIndex}`}
                  position={[rowIndex * 4.1 + 2.5, 3.5, 1.5]} // Position after the last frame
                  transform
                  occlude
                  style={{
                    pointerEvents: 'auto',
                  }}
                >
                  <div
                    className="remove-icon"
                    onClick={() => {
                      handleDecrementIdsInRow(rowIndex);
                    }}
                  >
                    <img src={closeIcon} alt="Remove" width="20" height="20" />
                  </div>
                </Html>
              );
            }

            // No need to render frames again since they're already rendered in the first block
            return null;
          }).filter(Boolean); // Filter out null values
        })()}
        {modelParts.frame1 && (() => {
          // Find the selected rectangle to get its addOn value
          const selectedRectObj = rects.find(rect => rect.id === selectedRect);

          // Use the addOn value from the selected rectangle, or default to 0 if not found
          const addOnValue = selectedRectObj?.addOn || 0;

          return Array.from({ length: Math.max(1, addOnValue + 1) }).map((_, index) => {
            const rowIndex = index === 0 ? 0 : index + 1;
            const dropdownLabel = index === 0 ? "Edit Shelf 1" : `Edit Add-On Shelf ${rowIndex - 1}`;
            const positionX = index === 0 ? 0 : (index) * 4.1;

            return (
              <Html
                key={`edit-icon-${index}`}
                position={[positionX, 4, 1.5]} // Position above each frame
                transform
                occlude
                style={{
                  pointerEvents: 'auto',
                  width: '80px',
                }}
              >
                <div className="edit-beam-compact">
                  <div
                    className="edit-icon"
                    onClick={() => {
                      setShowDropdownId(prev => prev === rowIndex ? null : rowIndex);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </div>

                  {showDropdownId === rowIndex && (
                    <div className="dropdown-container compact-dropdown">
                      <div className="dropdown-label">{dropdownLabel}</div>

                      <div style={{ marginBottom: '8px' }}>
                        <select
                          name="heightValue"
                          id="heightValue"
                          className="frame-dropdown"
                          value={height?.[rowIndex] || 1}
                          onChange={(e) => {
                            handleHeightChange(rowIndex, parseFloat(e.target.value));
                          }}
                          style={{
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                            fontSize: '12px',
                            width: '100%',
                            marginBottom: '8px',
                          }}
                        >
                          <option value="">Select</option>
                          <option value="1">1000 cm</option>
                          <option value="1.1">1100 cm</option>
                          <option value="1.2">1200 cm</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <select
                          name="levelsValue"
                          id="levelsValue"
                          className="level-dropdown"
                          value={levels?.[index] !== undefined ? levels[index] : selectedNoOfLevels}
                          onChange={(e) => {
                            handleLevelDropDownChange(index, parseInt(e.target.value, 10));
                          }}
                          style={{
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                            fontSize: '12px',
                            width: '100%',
                          }}
                        >
                          {/* <label>No of Levels</label> */}
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <select
                          name="underpass"
                          id="underpass"
                          className="underpass-dropdown"
                          value={(() => {
                            const selectedRectObj = rects.find(rect => rect.id === selectedRect);
                            if (selectedRectObj?.underPass && selectedRectObj.underPass[index] !== undefined) {
                              return selectedRectObj.underPass[index];
                            }
                            return underPass?.[index] !== undefined ? underPass[index] : "2";
                          })()}
                          style={{
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                            fontSize: '12px',
                            width: '100%',
                            marginBottom: '8px',
                          }}
                          onChange={(e) => {
                            handleUnderPassChange(index, parseInt(e.target.value, 10));
                          }}
                        >
                          <label>UnderPass</label>
                          <option value="2">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <select
                          name="widthValue"
                          id="widthValue"
                          className="widthValue-dropdown"
                          value={width?.[index] !== undefined ? width[index] : 1}
                          style={{
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                            fontSize: '12px',
                            width: '100%',
                            marginBottom: '8px',
                          }}
                          onChange={(e) => {
                            handleWidthChange(index, parseFloat(e.target.value));
                          }}
                        >
                          <option value="">Select an option</option>
                          <option value="1">400 cm</option>
                          <option value="1.1">500 cm</option>
                          <option value="1.2">600 cm</option>
                        </select>
                      </div>

                      <div className="dropdown-actions">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setShowDropdownId(null);
                          }}
                        >
                          Apply
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowDropdownId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Html>
            );
          });
        })()}
      </group>
    </>
  );
});

const SideView = ({ position, selectedDepth }) => {

  const loader = new GLTFLoader();
  const [model, setModel] = useState(null);

  useEffect(() => {
    loader.load("/assets/UNIT.glb", (gltf) => {
      const model = gltf.scene;
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
  // const [rects, setRects] = useState([]);
  const rects = useSelector(state => state.global.rects);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [rectsByName, setRectsByName] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRect, setSelectedRect] = useState(null);
  const [selectedHeight, setSelectedHeight] = useState(1);
  const height = useSelector(state => state.global.height);
  const [selectedWidth, setSelectedWidth] = useState(1);
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [selectedUpright, setSelectedUpright] = useState(null);
  const [selectedBracing, setSelectedBracing] = useState(null);
  const [selectedRackLoad, setSelectedRackLoad] = useState(1);
  const [selectedView, setSelectedView] = useState("stand");
  const [selectedElevation, setSelectedElevation] = useState(1);
  const selectedNoOfLevels = useSelector(state => state.global.noOfLevels);
  const [selectedSecuring, setSelectedSecuring] = useState(0);
  const [draggingCoordinates, setDraggingCoordinates] = useState({ x: 0, y: 0 });
  const [activeDragId, setActiveDragId] = useState(null);
  // const [saveJSON, setSaveJSON] = useState(null);
  const saveJSON = useRef(null);
  const countsRef = useRef({ spr: 0, canti: 0, space: 0 });
  const standRef = useRef();
  const [topViewSPRImage] = useImage(topViewSPR); // Load image
  const [addOnSPRImage] = useImage(topViewSPRAddOn); // Load image
  const [plusIconImage] = useImage(plusIcon); // Load image
  const location = useLocation();
  const enquiryNumber = location.state?.enquiryNumber || "N/A";
  const navigate = useNavigate();
  const transformerRef = useRef(null);
  const groupRefs = useRef({});
  const [selectedShape, setSelectedShape] = useState(null);
  const idsInRow = useSelector(state => state.global.idsInRow);
  const canvasWrapperRef = useRef(null);
  const isAddOn = useRef(false);
  const dispatch = useDispatch();

  // drop and drop images
  const dragUrl = React.useRef();
  const [images, setImages] = React.useState([]);

  useEffect(() => {
    if(canvasWrapperRef.current) {
      canvasWrapperRef.current.scrollLeft = canvasWrapperRef.current.scrollWidth;
    }
    // window.addEventListener('DOMContentLoaded', () => {
    //   const div = document.querySelector('.canvas');
    //   const rect = div.getBoundingClientRect();
    //   console.log("rect", rect.width, rect.height);
    // })
  }, [idsInRow]);

  useEffect(() => {
    const container = canvasWrapperRef.current.container();
  
    const handleDragOver = (e) => {
      e.preventDefault(); // Necessary to allow drop
    };
  
    const handleDropEvent = (e) => {
      e.preventDefault();
      const draggedItem = JSON.parse(e.dataTransfer.getData('draggedItem'));
      const stage = canvasWrapperRef.current;
      const pointerPosition = stage.getPointerPosition();

      const newRects = [
        ...rects,
          {
          id: `${draggedItem.name}${rects.length + 1}`,
          x: pointerPosition.x,
          y: pointerPosition.y,
          width: rectSize,
          height: rectSize,
          color: draggedItem.color,
          name: draggedItem.name,
          fullName: draggedItem.fullName,
          imageUrl: draggedItem.imageUrl,
        },
      ]

      dispatch(setRects(newRects));
    };
  
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDropEvent);
  
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDropEvent);
    };
  }, []);

  const heightData = {
    1: { name: "1000", partNo: "GXL 90-1.6", fullName: "GXL 90-3m", cost: '10', scale: 1 },
    2: { name: "1100", partNo: "GXL 90-1.8", fullName: "GXL 90-4m", cost: '20', scale: 1.1 },
    3: { name: "1200", partNo: "GXL 90-2.0", fullName: "GXL 90-5m", cost: '30', scale: 1.2 },
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
        warehousedwg: `${enquiryNumber}.dwg`,
        work_parts_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts",
        total_racks: rects.filter(rect => rect.fullName === "Shuttle Pallet Rack").length,
        dimensions: {
          width: stageWidth,
          length: 100,
          height: stageHeight,
        },
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
  .map((rect, index) => {
    const rackId = index + 1;
    
    // Get the number of addon units from idsInRow property
    const totalAddonUnits = rect.idsInRow || 0;
    
    // Function to convert height from meters to millimeters and return as string
    const convertHeight = (heightInMeters) => {
      return Math.round(heightInMeters * 1000).toString();
    };
    
    // Get main unit height (index 0)
    const mainUnitHeight = rect.height && rect.height[0] ? 
      convertHeight(rect.height[0]) : "5100";
    
    // Get main unit levels (index 0)
    const mainUnitLevels = rect.levels && rect.levels[0] ? 
      rect.levels[0] : 4;
    
    // Generate shelf levels dynamically for main unit
    const createMainUnitShelfLevels = () => Array.from({ length: mainUnitLevels }, (_, i) => ({
      shelf: `${i + 1}`,
      Level_height: "1700",
      Pallet_height: "1500",
      Securing: "mesh"
    }));
    
    // Generate addon units dynamically
    const addonUnits = Array.from({ length: totalAddonUnits }, (_, i) => {
      // Get addon unit height (index 1, 2, 3, etc.)
      // If specific height not available, use the height at index 1 or default
      const addonUnitHeight = rect.height && rect.height[i + 1] ? 
        convertHeight(rect.height[i + 1]) : 
        (rect.height && rect.height[1] ? convertHeight(rect.height[1]) : "5100");
      
      // Get addon unit levels (index 1, 2, 3, etc.)
      // If specific levels not available, use the levels at index 1 or default
      const addonUnitLevels = rect.levels && rect.levels[i + 1] ? 
        rect.levels[i + 1] : 
        (rect.levels && rect.levels[1] ? rect.levels[1] : 4);
      
      // Generate shelf levels for this addon unit
      const addonShelfLevels = Array.from({ length: addonUnitLevels }, (_, j) => ({
        shelf: `${j + 1}`,
        Level_height: "1700",
        Pallet_height: "1500",
        Securing: "mesh"
      }));
      
      return {
        Unit: `${i + 2}`, // Unit numbers start from 2 for addon units
        Rack_Upright_total_Height: addonUnitHeight,
        Rack_beam_span: "2700+10",
        Rack_total_depth: "1000",
        Maximum_Material_Height: "5502",
        Maximum_loading_Height: "4762",
        Rackclear_Height: "12000",
        No_of_shelfLevels: addonUnitLevels.toString(),
        load_kg: "1000",
        decktype: "wooden",
        Material_on_Ground: "no",
        underpass: "no",
        Rack_protection_left: "no",
        Rack_protection_right: "no",
        All_level_same: "no",

        Safety: [
          {
            Upright_guard: "no",
            Rowguard: "no"
          }
        ],

        stability: [
          {
            "H/D Ratio =": " Height of the Last loading level / Depth of the unit",
            TIE_BEAM: "no"
          }
        ],

        parts: [
          {
            upright_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\IS HD S3 547 R2 - UPRIGHT GXL 90 LxT.ipt",
            beam_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\beam.ipt"
          }
        ],

        shelflevel: addonShelfLevels
      };
    });

    return {
      _comment1: `-----------------------------RACK ${rackId} ----------------------------`,
      productId: rect.id,
      productGroup: rect.fullName,
      sourceiamfile_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\UNIT.iam",
      Group_rule_sourcefile_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\SPR_Rule.txt",
      Group_ilogic_sourcefile_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\ilogic_source\\SPR_iLogic_source.txt",
      x_position: `${-rect.x}`,
      y_position: `${-rect.y}`,
      z_position: "0",
      sourceiamFileName: "UNIT.iam",
      rack_id: rackId,
      racksubAssembly: `${enquiryNumber}_Rack${rackId}.iam`,
      FaceUnitRow: "SingleFaceunitRow",
      SignatureBoard: "No",
      Safety: [
        {
          Rowguard: "No",
          Rowguard_Height: "0",
        }
      ],
      _comment2: `----------------------------RACK${rackId} UNITS ----------------------------`,
      main_unit: [
        {
          Unit: "1",
          Rack_Upright_total_Height: mainUnitHeight,
          Rack_beam_span: "2700+10",
          Rack_total_depth: "1000",
          Maximum_Material_Height: "5502",
          Maximum_loading_Height: "4762",
          Rackclear_Height: "12000",
          No_of_shelfLevels: mainUnitLevels.toString(),
          load_kg: "1000",
          decktype: "wooden",
          Material_on_Ground: "no",
          underpass: "no",
          Rack_protection_left: "no",
          Rack_protection_right: "no",
          Addon_units_same: "no",
          All_level_same: "no",
          total_addonunits: totalAddonUnits.toString(),

          Safety: [
            {
              Upright_guard: "no",
              Rowguard: "No"
            }
          ],

          stability: [
            {
              "H/D Ratio =": " Height of the Last loading level / Depth of the unit",
              TIE_BEAM: "no",
              ROW_CONNECTOR: "no"
            }
          ],

          parts: [
            {
              upright_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\IS HD S3 547 R2 - UPRIGHT GXL 90 LxT.ipt",
              beam_path: "C:\\Users\\reetts\\Desktop\\Godrej\\IPT_project\\3Dconfig\\parts\\beam.ipt"
            }
          ],

          shelflevel: createMainUnitShelfLevels()
        }
      ],
      addon_units: addonUnits
    };
  })
      }
    };

    logWriter("Generated JSON:", JSON.stringify(warehouseJson, null, 2), false);

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
    logWriter("Updated saveJSON", saveJSON.current, true);

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

  const handleChangeSecuring = (event) => {
    if(event.target.checked) {
      setSelectedSecuring(1);
    } else {
      setSelectedSecuring(0);
    }
  }

  const handleHeightChange = (event, id) => {
    const newSelectedHeight = (event.target.value);
    dispatch(setHeight(heightData[newSelectedHeight].scale));
    setSelectedHeight(newSelectedHeight);
    // setSelectedScale(heightData[newSelectedHeight].scale);
    selectedScale.current = heightData[newSelectedHeight].scale;
    logWriter("height", height)

    // Update the rect if it's the selected one
    const matchingRectIndex = rects.findIndex(rect => rect.id === id);
    if (matchingRectIndex !== -1) {
      const updatedRects = rects.map((rect, idx) => {
        if (idx === matchingRectIndex) {
          return {
            ...rect,
            height: heightData[newSelectedHeight].scale,
          };
        }
        return rect;
      });
      dispatch(setRects(updatedRects));
    }
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
    dispatch(setNoOfLevels(event.target.value));
  }

  const handleDragMove = (index, e) => {
    const newRects = [...rects];
    let newX = Math.max(0, Math.min(stageWidth - rects[index].rectSize, e.target.x()));
    let newY = Math.max(0, Math.min(stageHeight - rects[index].rectSize, e.target.y()));

    // Find the nearest available position if overlapping
    let { x: finalX, y: finalY } = findNearestNonOverlappingPosition(newX, newY, index);

    if (finalX !== newRects[index].x || finalY !== newRects[index].y) {
      newRects[index] = { ...newRects[index], x: finalX, y: finalY };
      dispatch(setRects(newRects));
    }
  };

  const handleImageClick = (color, name, fullName, imageUrl, addOnSPRImage, isAddOn) => {
      const margin = 10;
      const rowHeight = rectSize + margin;
      
      // Filter only for the current type
      let filteredRects = rects.filter(rect => rect.name.startsWith(name));
      let count = filteredRects.length;
      let newId = `${name}${count + 1}`;
      
      // Handle special case for space/aisles
      if (name === 'space') {
        countsRef.current.space = 3;
        const newRects = [
          ...rects,
          { 
            id: `aisle1`, 
            x: 0, 
            y: stageHeight * 0.2, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
          { 
            id: `aisle2`, 
            x: 0, 
            y: stageHeight * 0.5, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
          { 
            id: `aisle3`, 
            x: 0, 
            y: stageHeight * 0.8, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
        ];
        dispatch(setRects(newRects));
        return;
      }
      
      // Calculate position for new rectangle
      let lastRect = filteredRects.length > 0 ? filteredRects[filteredRects.length - 1] : null;
      let x = count === 0 ? 0 : lastRect.x + rectSize;
      let y = lastRect ? lastRect.y : 0;
      
      // Handle row overflow
      let isNewRow = x + rectSize > stageWidth;
      if (isNewRow) {
        x = 0;
        y += rectSize + margin;
      }
      
      // Update count for the specific type
      countsRef.current[name] = count + 1;
      
      // Determine the correct image URL based on conditions
      const rectImageUrl = isAddOn 
        ? (name === "spr" 
        ? (isNewRow || count === 0 ? imageUrl : addOnSPRImage) 
        : color) 
        : (name === "spr" 
        ? imageUrl 
        : color);
      
      // Create new rectangle and update state
      const newRect = {
        id: newId,
        x,
        y,
        width: {0: 1},
        height: {0: 1, 1: 1},
        color,
        name: newId,
        fullName: fullName,
        imageUrl: rectImageUrl,
        addOn: 0,
        levels: {0: 5},
        underPass: {0: 2},
        rectSize: rectSize,
      };
      
      dispatch(setRects([...rects, newRect]));
    };

  const handleDragStart = (e, color, name, fullName, imageUrl, addOnSPRImage) => {
    dragUrl.current = e.target.src;
    const margin = 10;
      const rowHeight = rectSize + margin;
      
      // Filter only for the current type
      let filteredRects = rects.filter(rect => rect.name.startsWith(name));
      let count = filteredRects.length;
      let newId = `${name}${count + 1}`;
      
      // Handle special case for space/aisles
      if (name === 'space') {
        countsRef.current.space = 3;
        const newRects = [
          ...rects,
          { 
            id: `aisle1`, 
            x: 0, 
            y: stageHeight * 0.2, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
          { 
            id: `aisle2`, 
            x: 0, 
            y: stageHeight * 0.5, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
          { 
            id: `aisle3`, 
            x: 0, 
            y: stageHeight * 0.8, 
            width: stageWidth, 
            height: 50, 
            color, 
            name: "Aisle Space" 
          },
        ];
        dispatch(setRects(newRects));
        return;
      }
      
      // Calculate position for new rectangle
      let lastRect = filteredRects.length > 0 ? filteredRects[filteredRects.length - 1] : null;
      let x = count === 0 ? 0 : lastRect.x + rectSize;
      let y = lastRect ? lastRect.y : 0;
      
      // Handle row overflow
      let isNewRow = x + rectSize > stageWidth;
      if (isNewRow) {
        x = 0;
        y += rectSize + margin;
      }
      
      // Update count for the specific type
      countsRef.current[name] = count + 1;
      
      // Determine the correct image URL based on conditions
      const rectImageUrl = isAddOn 
        ? (name === "spr" 
        ? (isNewRow || count === 0 ? topViewSPRImage : addOnSPRImage) 
        : color) 
        : (name === "spr" 
        ? topViewSPRImage 
        : color);
      
      // Create new rectangle and update state
      const newRect = {
        id: newId,
        x,
        y,
        width: rectSize,
        height: rectSize,
        color,
        name: newId,
        fullName: fullName,
        imageUrl: rectImageUrl,
      };
      
      dispatch(setRects([...rects, newRect]));
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

    logWriter("draggedItem", draggedItem, pointerPosition);

    const newRects = [
      ...rects,
      {
        id: `${draggedItem.name}${rects.length + 1}`,
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: rectSize,
        height: rectSize,
        color: draggedItem.color,
        name: draggedItem.name,
        fullName: draggedItem.fullName,
        imageUrl: draggedItem.imageUrl,
      },
    ]

    dispatch(setRects(newRects));
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
      x < rect.x + rectSize &&
      x + rectSize > rect.x &&
      y < rect.y + rectSize &&
      y + rectSize > rect.y
    ));
  };


  const isOverlapping = (x, y, index) => {
    return rects.some((rect, i) => {
      if (i !== index) {
        return (
          x < rect.x + rectSize &&
          x + rects[index].rectSize > rect.x &&
          y < rect.y + rectSize &&
          y + rects[index].rectSize > rect.y
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

        if (newX >= 0 && newX + rects[index].rectSize <= stageWidth &&
          newY >= 0 && newY + rects[index].rectSize <= stageHeight &&
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
      width: rectSize * scaleX,
      height: rectSize * scaleY,
    };

    node.scaleX(1);
    node.scaleY(1);

    // Update the state in your app
    // Assuming you have a setter:
    // setRects(updated);
  };

  const URLImage = ({ image }) => {
  const [img] = useImage(image.src);
  return (
    <Image
      image={img}
      x={image.x}
      y={image.y}
      // I will use offset to set origin to the center of the image
      offsetX={img ? img.width / 2 : 0}
      offsetY={img ? img.height / 2 : 0}
      draggable
    />
  );
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
            <h1 className="product-group-header">Product Group</h1>
            <div className="image-grid">
              <div className="image-box"
                // onDragStart={(e) => handleDragStart(e, 'blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage)}
                onClick={() => handleImageClick('blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage, isAddOn.current = false)}>
                <img src={sprs} draggable="true" onDragStart={(e) => handleDragStart(e, 'blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage)} alt="Shuttle Pallet Racking" />
              </div>
              <div className="image-box">
                <img src={canti} alt="Cantilever" />
              </div>
              <div className="image-box">
                <img src={mts} alt="Multi-Tier Racking" />
              </div>
              <div className="image-box">
                <img src="image4.jpg" alt="Mobile Pallet Racking" />
              </div>
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

          <div 
          className="konva-stage"
          onDrop={(e) => {
          e.preventDefault();
          // register event position
          canvasWrapperRef.current.setPointersPositions(e);
          // add image
          setImages(
            images.concat([
              {
                ...canvasWrapperRef.current.getPointerPosition(),
                src: dragUrl.current,
              },
            ])
          );
        }}
        onDragOver={(e) => e.preventDefault()}
          >
            <Stage
              width={stageWidth}
              height={stageHeight}
              className="konva-stage"
              // onMouseEnter={(e) => e.target.getStage().container().style.cursor = "pointer"}
              // onMouseLeave={(e) => e.target.getStage().container().style.cursor = "default"}
              ref={canvasWrapperRef}
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
                      let newX = Math.max(0, Math.min(stageWidth - rectSize, pos.x));
                      let newY = Math.max(0, Math.min(stageHeight - rectSize, pos.y));
                      return { x: newX, y: newY };
                    }}
                  >

                    {/* This code is for adding the plus icon in the Konva Stage */}
                    {/* {rect.name === "Shuttle Pallet Rack" ? (
                null
                ) : (
                <>
                {rect.name === `spr${countsRef.current.spr}` && rect.x + rect.width + 50 < stageWidth && (
                  <Image
                  image={plusIconImage}
                  x={rect.x + rect.width + 10} // Position the plus icon next to the spr image
                  y={rect.y + rect.height / 2 - 10} // Center the plus icon vertically
                  width={40}
                  height={40}
                  onClick={() => handleImageClick('blue', 'spr', 'Shuttle Pallet Rack', topViewSPRImage, addOnSPRImage, isAddOn.current = true)} // Add new spr on click
                  style={{ cursor: "pointer" }}
                  />
                )}
                </>
                )} */}
                    {rect.name === "Aisle Space" ? (
                      <>
                        <Rect
                          fill={rect.color}
                          x={rect.x}
                          y={rect.y}
                          width={rectSize}
                          height={rectSize}
                        />
                        <Text
                          x={rect.x + rectSize / 2 - 30}
                          y={rect.y + rectSize / 2 - 50}
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
                        <KonvaImage
                          image={rect.imageUrl}
                          x={rect.x}
                          y={rect.y}
                          width={rectSize}
                          height={rectSize}
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
          </div>

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
                      <select
                        name="height"
                        id="height"
                        onChange={(e) => {
                          const newValue = e.target.value;
                          handleHeightChange(e, selectedRect.id);
                        }}
                        value={selectedHeight}
                      >
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
                    <div style={{ display: "flex", marginBottom: "0.5rem", alignItems: "center", gap: "10px" }}>
                      <label htmlFor="securing">Pallet Securing</label>
                      <input type="checkbox" name="securing" id="securing" onChange={handleChangeSecuring} value={selectedSecuring}>
                        {/* <option value="">Select Bracing</option> */}
                        {/* {Object.entries(bracingMaterialData).map(([key, { name }]) => (
                          <option key={key} value={key}>
                            {name}
                          </option>
                        ))} */}
                      </input>
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
                {rects.map((rect, index) => {
                  if (rect.id === selectedRect.id) {
                    const addOn = rect.addOn;

                    return (
                      <div key={`canvas-container-${rect.id}`} className="canvas" style={{ whiteSpace: "nowrap" }}>
                        <div className="canvas-inner" style={{
                          width: `${Math.max(100, (addOn + 2) * 70)}px`,
                          height: '100%',
                        }}>
                          <Canvas
                            orthographic
                            camera={{ position: [0, 0, 5], zoom: 10, near: 0.1, far: 1000 }}
                            onCreated={({ gl }) => {
                              logWriter("Canvas Width:", gl.domElement.width, true);
                              logWriter("Canvas Height:", gl.domElement.height, true);
                            }}
                            style={{ overflow: "auto", width: `${(addOn + 5) * 120}%`, height: "100%" }} >
                            {selectedView === "stand" &&
                              <Stand
                                ref={standRef}
                                position={[0, 0, 0]}
                                selectedHeight={height}
                                selectedWidth={selectedWidth}
                                selectedRackLoad={selectedRackLoad}
                                selectedNoOfLevels={selectedNoOfLevels}
                                selectedSecuring={selectedSecuring}
                                selectedRect={selectedRect.id}
                              />}
                            {selectedView === "sideView" &&
                              <SideView position={[0, 0, 0]} selectedDepth={selectedDepth} />}
                          </Canvas>
                        </div>

                        <div className="button-container">
                          <button onClick={() => setModalVisible(false)}>Save and Close</button>
                          <button onClick={() => setModalVisible(false)}>Close</button>
                        </div>
                      </div>
                    );
                  }
                  return null; // Return null for non-matching rectangles
                })}
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

// Component to handle image loading
const KonvaImage = ({ imageUrl, x, y, width, height, ...props }) => {
  const [image] = useImage("https://image.made-in-china.com/2f0j00bewGHvAtQJqs/L2500xd900xh4500mm-Single-Deep-Selective-Pallet-Heavy-Duty-Racking.webp");
  
  // useEffect(() => {
  //   if (!imageUrl) return;
  // }, [imageUrl]);
  
  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
};

export default Header;
