import ezdxf
import json
import os

def extract_dxf_to_json(dxf_file_path, output_json_path):
    """
    Extract detailed information from DXF files including component names,
    properties, coordinates, and dimensions.
    
    Args:
        dxf_file_path (str): Path to the DXF file
        output_json_path (str): Path to save the output JSON file
        
    Returns:
        dict: Extracted layout data
    """
    # Read the DXF file
    try:
        doc = ezdxf.readfile(dxf_file_path)
        print(f"Successfully opened DXF file: {dxf_file_path}")
    except IOError:
        print(f"Error: Cannot open {dxf_file_path}")
        return None
    except ezdxf.DXFStructureError:
        print(f"Error: Invalid or corrupted DXF file: {dxf_file_path}")
        return None
    
    # Get the model space
    msp = doc.modelspace()
    
    # Initialize dictionary to store all elements
    layout_data = {
        "elements": [],
        "dimensions": []  # New section specifically for dimensions
    }
    
    # Process all entities in the model space
    for entity in msp.query('*'):
        if entity.dxftype() == "DIMENSION":
            # Extract dimension data
            dim_data = extract_dimension_data(entity)
            if dim_data:
                layout_data["dimensions"].append(dim_data)
        else:
            # Extract other entity data
            element_data = extract_entity_data(entity)
            if element_data:
                layout_data["elements"].append(element_data)
    
    # Write to JSON file
    with open(output_json_path, 'w') as json_file:
        json.dump(layout_data, json_file, indent=4)
    
    # Generate summary statistics
    element_types = {}
    component_types = {}
    
    for element in layout_data["elements"]:
        # Count by entity type
        element_type = element.get("type", "unknown")
        if element_type in element_types:
            element_types[element_type] += 1
        else:
            element_types[element_type] = 1
        
        # Count by component type if available
        if "component_type" in element:
            comp_type = element["component_type"]
            if comp_type in component_types:
                component_types[comp_type] += 1
            else:
                component_types[comp_type] = 1
    
    print("\nExtraction summary by entity type:")
    for element_type, count in element_types.items():
        print(f"  - {element_type}: {count} elements")
    
    if component_types:
        print("\nExtraction summary by component type:")
        for comp_type, count in component_types.items():
            print(f"  - {comp_type}: {count} elements")
    
    print(f"\nExtracted {len(layout_data['dimensions'])} dimensions")
    
    return layout_data

def extract_dimension_data(entity):
    """
    Extract detailed data from a DXF dimension entity
    
    Args:
        entity: DXF dimension entity object
        
    Returns:
        dict: Dimension data including type, measurement, and coordinates
    """
    if entity.dxftype() != "DIMENSION":
        return None
    
    print(f"Processing dimension entity: {entity.dxf.handle}{entity.dxf}")
    
    # Base data structure for dimension entities
    dim_data = {
        "type": "DIMENSION",
        "handle": entity.dxf.handle,
        "layer": getattr(entity.dxf, "layer", "0"),
        "dimension_type": get_dimension_type(entity),
        "properties": {}
    }
    
    # Extract dimension-specific properties
    dim_properties = [
        "dimstyle", "dimtype", "text", "text_rotation", 
        "measurement", "actual_measurement"
    ]
    
    for prop in dim_properties:
        if hasattr(entity.dxf, prop):
            value = getattr(entity.dxf, prop)
            # Convert to simple types for JSON serialization
            if hasattr(value, "__float__"):
                value = float(value)
            elif hasattr(value, "__int__"):
                value = int(value)
            elif hasattr(value, "__str__"):
                value = str(value)
            dim_data["properties"][prop] = value
    
    # Extract dimension geometry
    dim_data["geometry"] = {}
    
    # Get dimension definition points
    if hasattr(entity.dxf, "defpoint"):
        dim_data["geometry"]["defpoint"] = {
            "x": entity.dxf.defpoint.x,
            "y": entity.dxf.defpoint.y,
            "z": entity.dxf.defpoint.z
        }
    
    if hasattr(entity.dxf, "defpoint2"):
        dim_data["geometry"]["defpoint2"] = {
            "x": entity.dxf.defpoint2.x,
            "y": entity.dxf.defpoint2.y,
            "z": entity.dxf.defpoint2.z
        }
    
    if hasattr(entity.dxf, "defpoint3"):
        dim_data["geometry"]["defpoint3"] = {
            "x": entity.dxf.defpoint3.x,
            "y": entity.dxf.defpoint3.y,
            "z": entity.dxf.defpoint3.z
        }
    
    # Get dimension text midpoint
    if hasattr(entity.dxf, "text_midpoint"):
        dim_data["geometry"]["text_midpoint"] = {
            "x": entity.dxf.text_midpoint.x,
            "y": entity.dxf.text_midpoint.y,
            "z": entity.dxf.text_midpoint.z
        }
    
    # Try to get the actual measurement value
    try:
        # For newer DXF versions
        if hasattr(entity.dxf, "actual_measurement"):
            dim_data["measurement"] = entity.dxf.actual_measurement
        # For older DXF versions
        elif hasattr(entity, "measurement"):
            try:
                dim_data["measurement"] = entity.measurement()
            except:
                pass
        # If text is available and looks like a measurement
        elif hasattr(entity.dxf, "text") and entity.dxf.text:
            text = entity.dxf.text
            # Try to extract numeric value from text
            import re
            numeric_match = re.search(r'(\d+\.?\d*)', text)
            if numeric_match:
                dim_data["measurement"] = float(numeric_match.group(1))
            else:
                dim_data["measurement_text"] = text
    except Exception as e:
        dim_data["measurement_error"] = str(e)
    
    # Extract color information
    if hasattr(entity.dxf, "color"):
        color_index = entity.dxf.color
        dim_data["color"] = {
            "index": color_index
        }
    
    return dim_data

def get_dimension_type(entity):
    """
    Determine the specific type of dimension
    
    Args:
        entity: DXF dimension entity
        
    Returns:
        str: Dimension type description
    """
    if not hasattr(entity.dxf, "dimtype"):
        return "unknown"
    
    dimtype = entity.dxf.dimtype
    
    # Dimension type flags
    if dimtype & 1:
        return "linear"
    elif dimtype & 2:
        return "aligned"
    elif dimtype & 4:
        return "angular"
    elif dimtype & 8:
        return "diameter"
    elif dimtype & 16:
        return "radius"
    elif dimtype & 32:
        return "angular_3point"
    elif dimtype & 64:
        return "ordinate"
    else:
        return f"other_{dimtype}"

def extract_entity_data(entity):
    """
    Extract detailed data from a DXF entity
    
    Args:
        entity: DXF entity object
        
    Returns:
        dict: Entity data including type, color, properties, and coordinates
    """
    # Skip DIMENSION entities as they're handled separately
    if entity.dxftype() == "DIMENSION" or entity.dxftype() == "HATCH":
        return None
        
    # Base data structure for all entities
    entity_data = {
        "type": entity.dxftype(),
        "handle": entity.dxf.handle,
        "layer": getattr(entity.dxf, "layer", "0"),
        "properties": {}
    }
    
    # Extract color information
    if hasattr(entity.dxf, "color"):
        color_index = entity.dxf.color
        entity_data["color"] = {
            "index": color_index
        }
    
    # Extract common properties
    common_properties = ["linetype", "lineweight", "thickness", "ltscale", "invisible"]
    for prop in common_properties:
        if hasattr(entity.dxf, prop):
            value = getattr(entity.dxf, prop)
            # Convert ezdxf-specific objects to simple types for JSON serialization
            if hasattr(value, "__float__"):
                value = float(value)
            elif hasattr(value, "__int__"):
                value = int(value)
            elif hasattr(value, "__str__"):
                value = str(value)
            entity_data["properties"][prop] = value
    
    # Extract entity-specific data
    if entity.dxftype() == "LINE":
        entity_data["geometry"] = {
            "start": {"x": entity.dxf.start.x, "y": entity.dxf.start.y, "z": entity.dxf.start.z},
            "end": {"x": entity.dxf.end.x, "y": entity.dxf.end.y, "z": entity.dxf.end.z}
        }
        
    elif entity.dxftype() == "CIRCLE":
        entity_data["geometry"] = {
            "center": {"x": entity.dxf.center.x, "y": entity.dxf.center.y, "z": entity.dxf.center.z},
            "radius": entity.dxf.radius
        }
        
    elif entity.dxftype() == "ARC":
        entity_data["geometry"] = {
            "center": {"x": entity.dxf.center.x, "y": entity.dxf.center.y, "z": entity.dxf.center.z},
            "radius": entity.dxf.radius,
            "start_angle": entity.dxf.start_angle,
            "end_angle": entity.dxf.end_angle
        }
        
    elif entity.dxftype() == "LWPOLYLINE":
        points = []
        for point in entity.get_points():
            # LWPOLYLINE points can have bulge values for arcs
            if len(point) > 2:
                points.append({"x": point[0], "y": point[1], "bulge": point[4] if len(point) > 4 else 0})
            else:
                points.append({"x": point[0], "y": point[1]})
        
        entity_data["geometry"] = {
            "points": points,
            "closed": entity.closed
        }
        
    elif entity.dxftype() == "POLYLINE":
        points = []
        for vertex in entity.vertices:
            points.append({
                "x": vertex.dxf.location.x,
                "y": vertex.dxf.location.y,
                "z": vertex.dxf.location.z
            })
        
        entity_data["geometry"] = {
            "points": points,
            "closed": entity.is_closed
        }
        
    elif entity.dxftype() == "TEXT" or entity.dxftype() == "MTEXT":
        entity_data["geometry"] = {
            "insert": {"x": entity.dxf.insert.x, "y": entity.dxf.insert.y, "z": entity.dxf.insert.z},
            "text": entity.dxf.text if entity.dxftype() == "TEXT" else entity.text,
            "height": entity.dxf.height
        }
        if hasattr(entity.dxf, "rotation"):
            entity_data["geometry"]["rotation"] = entity.dxf.rotation
            
    elif entity.dxftype() == "INSERT":
        entity_data["geometry"] = {
            "insert": {"x": entity.dxf.insert.x, "y": entity.dxf.insert.y, "z": entity.dxf.insert.z},
            "block_name": entity.dxf.name
        }
        if hasattr(entity.dxf, "rotation"):
            entity_data["geometry"]["rotation"] = entity.dxf.rotation
        if hasattr(entity.dxf, "xscale"):
            entity_data["geometry"]["scale"] = {
                "x": entity.dxf.xscale,
                "y": entity.dxf.yscale,
                "z": entity.dxf.zscale
            }
    
    # Try to determine component type based on layer name or block name
    component_type = determine_component_type(entity)
    if component_type:
        entity_data["component_type"] = component_type
    
    # Extract any extended data (XDATA) if available
    try:
        if hasattr(entity, "get_xdata"):
            xdata = entity.get_xdata()
            if xdata:
                entity_data["xdata"] = {}
                for app_name, xdata_items in xdata.items():
                    entity_data["xdata"][app_name] = str(xdata_items)
    except Exception as e:
        # Just skip xdata if there's an error
        pass
    
    return entity_data

def determine_component_type(entity):
    """
    Try to determine the component type based on layer name, block name, or other properties
    
    Args:
        entity: DXF entity object
        
    Returns:
        str: Component type or None if undetermined
    """
    # Check layer name for clues
    if hasattr(entity.dxf, "layer") and not hasattr(entity.dxf, "type"):
        print("layer:", entity.dxf.layer, "type:", entity.dxftype())
        layer = entity.dxf.layer.upper()
        
        if "WALL" in layer or "PARTITION" in layer or "W-" in layer:
            return "wall"
        elif "DOOR" in layer or "D-" in layer:
            return "door"
        elif "WINDOWS" in layer:
            return "window"
        elif "PILLAR" in layer:
            return "pillar"
        elif "STAIR" in layer or "STEP" in layer:
            return "stairs"
        elif "ELEV" in layer or "LIFT" in layer:
            return "elevator"
        elif "EQUIP" in layer or "MACH" in layer:
            return "equipment"
        elif "FURN" in layer or "CHAIR" in layer or "TABLE" in layer:
            return "furniture"
        elif "RACK" in layer or "SHELF" in layer or "STORAGE" in layer:
            return "rack"
        elif "FLOOR" in layer or "GROUND" in layer:
            return "floor"
        elif "CEILING" in layer or "ROOF" in layer:
            return "ceiling"
        elif "DIM" in layer or "DIMENSION" in layer:
            return "dimension"
    
    # Check block name for INSERT entities
    if entity.dxftype() == "INSERT" and hasattr(entity.dxf, "name"):
        block_name = entity.dxf.name.upper()
        
        if "DOOR" in block_name or "D-" in block_name:
            return "door"
        elif "WINDOWS" in block_name: #or "WN-" in block_name:
            return "window"
        # elif "COLUMN" in block_name or "PILLAR" in block_name or "COL" in block_name:
        elif "PILLAR" in block_name:
            return "pillar"
        elif "STAIR" in block_name or "STEP" in block_name:
            return "stairs"
        elif "ELEV" in block_name or "LIFT" in block_name:
            return "elevator"
        elif "EQUIP" in block_name or "MACH" in block_name:
            return "equipment"
        elif "FURN" in block_name or "CHAIR" in block_name or "TABLE" in block_name:
            return "furniture"
        elif "RACK" in block_name or "SHELF" in block_name:
            return "rack"
    
    # For circles, they might be pillars
    if entity.dxftype() == "CIRCLE":
        return "pillar"
    
    return None

# Example usage
if __name__ == "__main__":
    dxf_file = "C:\\Users\\vissures\\Downloads\\GSS Sample Civil DXF\\Sample Civil 1.dxf"
    json_file = "C:\\Users\\vissures\\Downloads\\GSS Sample Civil DXF\\Sample Civil 1.json"
    
    layout_data = extract_dxf_to_json(dxf_file, json_file)
    if layout_data:
        print(f"\nData successfully extracted and saved to {json_file}")
        print(f"Total elements extracted: {len(layout_data['elements'])}")