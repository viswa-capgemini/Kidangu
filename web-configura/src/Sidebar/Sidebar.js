// import React, { useState } from 'react';

// /** 
//  * A helper component that draws a simplified front & side view of the rack 
//  * using an SVG.
//  *
//  * Props:
//  *  - rackWidthMm (e.g., 2890)
//  *  - rackDepthMm (e.g., 1000)
//  *  - rackHeightMm (e.g., 5100)
//  *  - numberOfLevels (e.g., 5)
//  *  - levelsAreSame (boolean)
//  *  - clearAvailableHeightMm (e.g., 11800) // if you want to show total space
//  */
// const RackDiagram = ({
//   rackWidthMm,
//   rackDepthMm,
//   rackHeightMm,
//   numberOfLevels,
//   clearAvailableHeightMm,
//   // just to show how we might pass them in:
//   showBracing,
//   bracingType,
// }) => {
//   // For the diagram, we’ll pick a scale factor so the rack fits nicely in ~ 300px tall
//   // If rackHeightMm = 5100, we can pick scale = 300 / 5100 = ~0.0588
//   // We’ll do a dynamic scale so it adjusts for any input:
//   const maxSvgHeight = 300; // px
//   const scale = rackHeightMm ? maxSvgHeight / rackHeightMm : 0.05;

//   // Convert real measurements to “SVG px” by multiplying them by scale
//   const rackWidthPx = rackWidthMm * scale;
//   const rackHeightPx = rackHeightMm * scale;
//   const rackDepthPx = rackDepthMm * scale;

//   // We’ll just assume each level is an evenly spaced horizontal beam if “all levels same.”
//   // But if you have more detail per level, you can calculate each level’s offset individually.
//   const levelSpacingPx = numberOfLevels > 0 ? rackHeightPx / (numberOfLevels + 1) : 0;

//   // We’ll define an SVG “viewBox” that is wide enough for front + side views side by side
//   // Then we’ll draw the front view at x=0, side view at x= (some offset).
//   // For clarity, we’ll put them about 1.5 * rackWidthPx apart horizontally.
//   const frontViewX = 0;
//   const sideViewX = rackWidthPx + 50; // 50 px gap

//   // The total width of the SVG will be the sideViewX plus the side view’s width
//   const svgWidth = sideViewX + rackDepthPx + 20;
//   // The height we use is at least rackHeightPx, plus a little padding
//   const svgHeight = rackHeightPx + 20;

//   // We’ll build the rectangles and lines as plain SVG elements
//   // FRONT VIEW:
//   //  - A rectangle for the upright
//   //  - Horizontal orange bars for each level
//   // SIDE VIEW:
//   //  - A narrower rectangle
//   //  - X bracing if “showBracing” is true

//   // Generate horizontal beams for each level in front view
//   const frontLevels = [];
//   for (let i = 1; i <= numberOfLevels; i++) {
//     const y = rackHeightPx - i * levelSpacingPx; 
//     frontLevels.push(
//       <rect
//         key={`front-level-${i}`}
//         x={frontViewX}
//         y={y}
//         width={rackWidthPx}
//         height={5} // beam thickness in px
//         fill="orange"
//       />
//     );
//   }

//   // Generate X bracing lines for side view if needed
//   // Just do a simple line from top-left to bottom-right, etc.
//   let sideBracing = null;
//   if (showBracing && bracingType === 'X Bracing') {
//     sideBracing = (
//       <>
//         {/* diagonal left-top to right-bottom */}
//         <line
//           x1={sideViewX}
//           y1={0}
//           x2={sideViewX + rackDepthPx}
//           y2={rackHeightPx}
//           stroke="black"
//           strokeWidth={2}
//         />
//         {/* diagonal left-bottom to right-top */}
//         <line
//           x1={sideViewX}
//           y1={rackHeightPx}
//           x2={sideViewX + rackDepthPx}
//           y2={0}
//           stroke="black"
//           strokeWidth={2}
//         />
//       </>
//     );
//   }

//   return (
//     <svg
//       width={svgWidth}
//       height={svgHeight}
//       style={{ border: '1px solid #ccc', background: '#fafafa' }}
//     >
//       {/* FRONT VIEW */}
//       {/* Outer rectangle representing front upright */}
//       <rect
//         x={frontViewX}
//         y={0}
//         width={rackWidthPx}
//         height={rackHeightPx}
//         fill="none"
//         stroke="#2c5ca9" // a bluish color
//         strokeWidth={3}
//       />
//       {frontLevels}

//       {/* SIDE VIEW */}
//       {/* Outer rectangle representing side upright */}
//       <rect
//         x={sideViewX}
//         y={0}
//         width={rackDepthPx}
//         height={rackHeightPx}
//         fill="none"
//         stroke="#2c5ca9"
//         strokeWidth={3}
//       />

//       {sideBracing}
//     </svg>
//   );
// };

// const Sidebar = () => {
//   // ========== FORM STATES ==========
//   const [showPallet, setShowPallet] = useState(true);
//   const [levelWise, setLevelWise] = useState(false);
//   const [underpass, setUnderpass] = useState(false);
//   const [materialOnGround, setMaterialOnGround] = useState(false);

//   const [underpassValue, setUnderpassValue] = useState(2900);
//   const [numberOfLevels, setNumberOfLevels] = useState(5);

//   const [allLevelsAreSame, setAllLevelsAreSame] = useState(true);
//   const [palletsAreEqual, setPalletsAreEqual] = useState(true);
//   const [numberOfPallets, setNumberOfPallets] = useState(2);

//   // Pallet dimension rows
//   const [palletDimensions, setPalletDimensions] = useState([
//     { w: '1200', d: '1200', h: '740', cap: '1000', pc: '2' }
//   ]);

//   // Hide options
//   const [hideBeamShelfName, setHideBeamShelfName] = useState(false);
//   const [hideDeckingPanelThickness, setHideDeckingPanelThickness] = useState(false);

//   // Rack info
//   const [rackLoad, setRackLoad] = useState(10000);
//   const [clearAvailableHeight, setClearAvailableHeight] = useState(11800);

//   // “A(M) 2890x1000x5100” => presumably 2890 mm wide, 1000 mm deep, 5100 mm high
//   // We'll keep these as separate states in case you want them user‐editable:
//   const [rackWidthMm, setRackWidthMm] = useState(2890);
//   const [rackDepthMm, setRackDepthMm] = useState(1000);
//   const [rackHeightMm, setRackHeightMm] = useState(5100);

//   const [upright, setUpright] = useState('GXL 90-1.6');
//   const [bracing, setBracing] = useState('X Bracing');
//   const [bracingMaterial, setBracingMaterial] = useState('GI');

//   // ========== HANDLERS ==========
//   const handleToggleShowPallet = () => setShowPallet(prev => !prev);
//   const handleToggleLevelWise = () => setLevelWise(prev => !prev);
//   const handleToggleUnderpass = () => setUnderpass(prev => !prev);
//   const handleToggleMaterialOnGround = () => setMaterialOnGround(prev => !prev);

//   const handleUnderpassValue = (e) => setUnderpassValue(e.target.value);
//   const handleNumberOfLevels = (e) => setNumberOfLevels(e.target.value);

//   const handleToggleAllLevelsAreSame = () => setAllLevelsAreSame(prev => !prev);
//   const handleTogglePalletsAreEqual = () => setPalletsAreEqual(prev => !prev);
//   const handleNumberOfPallets = (e) => setNumberOfPallets(e.target.value);

//   const handlePalletDimensionChange = (index, field, value) => {
//     const updated = [...palletDimensions];
//     updated[index] = { ...updated[index], [field]: value };
//     setPalletDimensions(updated);
//   };

//   const handleHideBeamShelfName = () => setHideBeamShelfName(prev => !prev);
//   const handleHideDeckingPanelThickness = () =>
//     setHideDeckingPanelThickness(prev => !prev);

//   const handleRackLoad = (e) => setRackLoad(e.target.value);
//   const handleClearAvailableHeight = (e) => setClearAvailableHeight(e.target.value);

//   // If you want to make the base rack dimension user‐editable:
//   const handleRackWidthMm = (e) => setRackWidthMm(e.target.value);
//   const handleRackDepthMm = (e) => setRackDepthMm(e.target.value);
//   const handleRackHeightMm = (e) => setRackHeightMm(e.target.value);

//   const handleUpright = (e) => setUpright(e.target.value);
//   const handleBracing = (e) => setBracing(e.target.value);
//   const handleBracingMaterial = (e) => setBracingMaterial(e.target.value);

//   const handleLevelAccessoriesClick = () => {
//     alert('Level Accessories Clicked');
//   };

//   const handleRackAccessoriesClick = () => {
//     alert('Rack Accessories Clicked');
//   };

//   const handleSave = () => {
//     console.log('Saving form...', {
//       showPallet,
//       levelWise,
//       underpass,
//       materialOnGround,
//       underpassValue,
//       numberOfLevels,
//       allLevelsAreSame,
//       palletsAreEqual,
//       numberOfPallets,
//       palletDimensions,
//       hideBeamShelfName,
//       hideDeckingPanelThickness,
//       rackLoad,
//       clearAvailableHeight,
//       rackWidthMm,
//       rackDepthMm,
//       rackHeightMm,
//       upright,
//       bracing,
//       bracingMaterial,
//     });
//     alert('Saved! (Check console for data)');
//   };

//   return (
//     <div style={{ display: 'flex', gap: '2rem' }}>
//       {/* ===== LEFT COLUMN: The form ===== */}
//       <div style={{ padding: '1rem', maxWidth: '400px', border: '1px solid #ddd' }}>
//         <h3>Advanced properties</h3>
//         <p><strong>A(M) {rackWidthMm}x{rackDepthMm}x{rackHeightMm}</strong></p>

//         {/* If you want these dimension inputs to be user‐editable, show them: */}
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label style={{ display: 'block', marginBottom: 4 }}>
//             Rack Width (mm):
//           </label>
//           <input
//             type="number"
//             value={rackWidthMm}
//             onChange={handleRackWidthMm}
//             style={{ width: '100%' }}
//           />
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label style={{ display: 'block', marginBottom: 4 }}>
//             Rack Depth (mm):
//           </label>
//           <input
//             type="number"
//             value={rackDepthMm}
//             onChange={handleRackDepthMm}
//             style={{ width: '100%' }}
//           />
//         </div>
//         <div style={{ marginBottom: '1rem' }}>
//           <label style={{ display: 'block', marginBottom: 4 }}>
//             Rack Height (mm):
//           </label>
//           <input
//             type="number"
//             value={rackHeightMm}
//             onChange={handleRackHeightMm}
//             style={{ width: '100%' }}
//           />
//         </div>

//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={showPallet} 
//               onChange={handleToggleShowPallet} 
//             /> 
//             Show pallet
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={levelWise} 
//               onChange={handleToggleLevelWise} 
//             /> 
//             Level Wise
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={underpass} 
//               onChange={handleToggleUnderpass} 
//             /> 
//             Underpass
//           </label>
//           {underpass && (
//             <input
//               type="number"
//               style={{ marginLeft: '0.5rem', width: '80px' }}
//               value={underpassValue}
//               onChange={handleUnderpassValue}
//             />
//           )}
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={materialOnGround} 
//               onChange={handleToggleMaterialOnGround} 
//             /> 
//             Material on ground
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={allLevelsAreSame} 
//               onChange={handleToggleAllLevelsAreSame} 
//             /> 
//             All levels are same
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Number of levels: </label>
//           <input
//             type="number"
//             value={numberOfLevels}
//             onChange={handleNumberOfLevels}
//             style={{ width: '60px', marginLeft: '0.5rem' }}
//           />
//         </div>

//         <hr />

//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={palletsAreEqual} 
//               onChange={handleTogglePalletsAreEqual} 
//             /> 
//             Pallets are equal
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Number of pallets: </label>
//           <input 
//             type="number"
//             value={numberOfPallets}
//             onChange={handleNumberOfPallets}
//             style={{ width: '60px', marginLeft: '0.5rem' }}
//           />
//         </div>

//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr>
//               <th>W(mm)</th>
//               <th>D(mm)</th>
//               <th>H(mm)</th>
//               <th>Cap(kg)</th>
//               <th>PC</th>
//             </tr>
//           </thead>
//           <tbody>
//             {palletDimensions.map((dim, idx) => (
//               <tr key={idx}>
//                 <td>
//                   <input
//                     type="text"
//                     value={dim.w}
//                     onChange={(e) => handlePalletDimensionChange(idx, 'w', e.target.value)}
//                     style={{ width: '60px' }}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={dim.d}
//                     onChange={(e) => handlePalletDimensionChange(idx, 'd', e.target.value)}
//                     style={{ width: '60px' }}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={dim.h}
//                     onChange={(e) => handlePalletDimensionChange(idx, 'h', e.target.value)}
//                     style={{ width: '60px' }}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={dim.cap}
//                     onChange={(e) => handlePalletDimensionChange(idx, 'cap', e.target.value)}
//                     style={{ width: '60px' }}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={dim.pc}
//                     onChange={(e) => handlePalletDimensionChange(idx, 'pc', e.target.value)}
//                     style={{ width: '40px' }}
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <hr />

//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={hideBeamShelfName} 
//               onChange={handleHideBeamShelfName} 
//             /> 
//             Hide Beam/Shelf name in PDF
//           </label>
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>
//             <input 
//               type="checkbox" 
//               checked={hideDeckingPanelThickness} 
//               onChange={handleHideDeckingPanelThickness} 
//             /> 
//             Hide Decking Panel Thickness in PDF
//           </label>
//         </div>

//         <button onClick={handleLevelAccessoriesClick}>
//           Level Accessories
//         </button>

//         <hr />

//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Rack load (kg): </label>
//           <input
//             type="number"
//             value={rackLoad}
//             onChange={handleRackLoad}
//             style={{ width: '80px', marginLeft: '0.5rem' }}
//           />
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Clear available height: </label>
//           <input
//             type="number"
//             value={clearAvailableHeight}
//             onChange={handleClearAvailableHeight}
//             style={{ width: '80px', marginLeft: '0.5rem' }}
//           />
//         </div>

//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Upright: </label>
//           <input
//             type="text"
//             value={upright}
//             onChange={handleUpright}
//             style={{ marginLeft: '0.5rem' }}
//           />
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Bracing: </label>
//           <input
//             type="text"
//             value={bracing}
//             onChange={handleBracing}
//             style={{ marginLeft: '0.5rem' }}
//           />
//         </div>
//         <div style={{ marginBottom: '0.5rem' }}>
//           <label>Bracing Material: </label>
//           <input
//             type="text"
//             value={bracingMaterial}
//             onChange={handleBracingMaterial}
//             style={{ marginLeft: '0.5rem' }}
//           />
//         </div>

//         <button onClick={handleRackAccessoriesClick}>
//           Rack Accessories
//         </button>

//         <hr />

//         <button onClick={handleSave}>
//           Save
//         </button>
//       </div>

//       {/* ===== RIGHT COLUMN: The diagram ===== */}
//       <div style={{ flex: '1', padding: '1rem' }}>
//         <h4>Rack Diagram</h4>
//         <RackDiagram
//           rackWidthMm={rackWidthMm}
//           rackDepthMm={rackDepthMm}
//           rackHeightMm={rackHeightMm}
//           numberOfLevels={Number(numberOfLevels)}
//           clearAvailableHeightMm={clearAvailableHeight}
//           showBracing={true}
//           bracingType={bracing} 
//         />
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useState, useRef, useEffect } from "react";

const Sidebar = () => {
    const [showPallet, setShowPallet] = useState(true);
    const [levels, setLevels] = useState(1);
    const [selectedLevel, setSelectedLevel] = useState(null);

    const levelData = {
        1: { height: "852", load: "2000", depth: "1000", span: "2700" },
        2: { height: "900", load: "1800", depth: "1100", span: "2500" },
        3: { height: "950", load: "2200", depth: "1200", span: "2600" },
        4: { height: "800", load: "1900", depth: "1000", span: "2400" },
    };

    const handleLevelChange = (event) => {
        const level = event.target.value;
        setSelectedLevel(level ? parseInt(level, 10) : null);
    };

    const handleToggleShowPallet = () => setShowPallet(prev => !prev);

    const handleChange = (event) => {
        setLevels(parseInt(event.target.value, 10));
    };

    return (
        <div style={{display: 'flex'}}>
            <div style={{ padding: '1rem', maxWidth: '400px', border: '1px solid #ddd' }}>
            <h3>Advanced properties</h3>
            <p><strong>A(M) {}x{}x{}</strong></p>
            
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showPallet}
                            onChange={handleToggleShowPallet}
                        />
                        Show pallet
                    </label>
                </div>
                <div style={{ marginBottom: '0.5rem', marginLeft: '0.2rem' }}>
                    <label>
                        <input
                            type="radio"
                            checked={showPallet}
                            onChange={handleToggleShowPallet}
                        />
                        Level Wise
                    </label>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showPallet}
                            onChange={handleToggleShowPallet}
                        />
                        Underpass
                    </label>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showPallet}
                            onChange={handleToggleShowPallet}
                        />
                        Material on ground
                    </label>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showPallet}
                            onChange={handleToggleShowPallet}
                        />
                        All levels are same
                    </label>
                </div>
                {/* <div style={{ marginBottom: '0.5rem' }}>
                    <label>
                        Number of Levels
                    </label>
                    <select name="levels" id="levels" onChange={handleChange}>
                        <option value="volvo">1</option>
                        <option value="saab">2</option>
                        <option value="opel">3</option>
                        <option value="audi">4</option>
                    </select>
                </div> */}
                <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="levels" style={{ marginRight: "8px" }}>
                    Select Level:
                </label>
                <select
                    id="levels"
                    onChange={handleLevelChange}
                    defaultValue=""
                    style={{ padding: "8px", fontSize: "1rem" }}
                >
                    <option value="" disabled>
                        Choose a level
                    </option>
                    {Object.keys(levelData).map((level) => (
                        <option key={level} value={level}>
                            Level {level}
                        </option>
                    ))}
                </select>
            </div>
            {selectedLevel && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px", fontWeight: "bold" }}>
                                Level height
                            </td>
                            <td style={{ padding: "8px" }}>
                                {levelData[selectedLevel].height}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", fontWeight: "bold" }}>
                                Level load (kg)
                            </td>
                            <td style={{ padding: "8px" }}>
                                {levelData[selectedLevel].load}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", fontWeight: "bold" }}>
                                Rack Depth
                            </td>
                            <td style={{ padding: "8px" }}>
                                {levelData[selectedLevel].depth}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", fontWeight: "bold" }}>
                                Beam Span
                            </td>
                            <td style={{ padding: "8px" }}>
                                {levelData[selectedLevel].span}
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}
            </div>
        </div>
    )
}

export default Sidebar;