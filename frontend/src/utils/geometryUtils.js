/**
 * Geometry Utilities
 * Intersection detection, polygon operations, and spatial analysis
 */

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 */
export const pointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Calculate distance from point to line segment
 */
export const pointToSegmentDistance = (point, segmentStart, segmentEnd) => {
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (dx === 0 && dy === 0) {
    // Segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate projection parameter t
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Calculate closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
};

/**
 * Check if two line segments intersect
 */
export const segmentsIntersect = (seg1Start, seg1End, seg2Start, seg2End) => {
  const [x1, y1] = seg1Start;
  const [x2, y2] = seg1End;
  const [x3, y3] = seg2Start;
  const [x4, y4] = seg2End;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < 1e-10) {
    // Lines are parallel or coincident
    return false;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

/**
 * Check if a polyline intersects with a polygon
 * Returns intersection details if true
 */
export const polylineIntersectsPolygon = (polyline, polygon, threshold = 0) => {
  const intersections = [];
  const touchedSegments = [];

  for (let i = 0; i < polyline.length - 1; i++) {
    const lineStart = polyline[i];
    const lineEnd = polyline[i + 1];
    
    let segmentIntersects = false;

    // Check intersection with polygon edges
    for (let j = 0; j < polygon.length - 1; j++) {
      const polyStart = polygon[j];
      const polyEnd = polygon[j + 1];

      if (segmentsIntersect(lineStart, lineEnd, polyStart, polyEnd)) {
        segmentIntersects = true;
        intersections.push({
          lineSegmentIndex: i,
          polygonSegmentIndex: j,
          lineStart,
          lineEnd,
          polyStart,
          polyEnd
        });
      }
    }

    // Check if line segment is close to polygon (within threshold)
    if (threshold > 0 && !segmentIntersects) {
      for (const polyPoint of polygon) {
        const dist = pointToSegmentDistance(polyPoint, lineStart, lineEnd);
        if (dist <= threshold) {
          segmentIntersects = true;
          break;
        }
      }
    }

    // Check if line segment endpoints are inside polygon
    if (pointInPolygon(lineStart, polygon) || pointInPolygon(lineEnd, polygon)) {
      segmentIntersects = true;
    }

    if (segmentIntersects) {
      touchedSegments.push(i);
    }
  }

  return {
    intersects: intersections.length > 0 || touchedSegments.length > 0,
    intersectionCount: intersections.length,
    touchedSegmentCount: touchedSegments.length,
    intersectionPoints: intersections,
    touchedSegments
  };
};

/**
 * Calculate the overlap area between a route buffer and a building polygon
 * Simplified approximation - counts points inside polygon
 */
export const calculateOverlapArea = (routeCoords, buildingPolygon, routeWidth = 0.0001) => {
  // Create a buffer zone around the route
  const bufferPoints = [];
  
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [x1, y1] = routeCoords[i];
    const [x2, y2] = routeCoords[i + 1];
    
    // Calculate perpendicular vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) continue;
    
    const perpX = -dy / length * routeWidth;
    const perpY = dx / length * routeWidth;
    
    // Create rectangle points
    bufferPoints.push(
      [x1 + perpX, y1 + perpY],
      [x2 + perpX, y2 + perpY],
      [x2 - perpX, y2 - perpY],
      [x1 - perpX, y1 - perpY]
    );
  }

  // Count buffer points inside building polygon
  const pointsInside = bufferPoints.filter(point => pointInPolygon(point, buildingPolygon)).length;
  const overlapRatio = bufferPoints.length > 0 ? pointsInside / bufferPoints.length : 0;

  return {
    overlapRatio,
    severity: overlapRatio > 0.5 ? 'full' : overlapRatio > 0.1 ? 'partial' : 'minimal'
  };
};

/**
 * Calculate polygon area (Shoelace formula)
 */
export const calculatePolygonArea = (polygon) => {
  let area = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

/**
 * Calculate polygon centroid
 */
export const calculateCentroid = (polygon) => {
  let sumX = 0;
  let sumY = 0;
  
  for (const [x, y] of polygon) {
    sumX += x;
    sumY += y;
  }
  
  return [sumX / polygon.length, sumY / polygon.length];
};

/**
 * Calculate distance between two points
 */
export const distance = (p1, p2) => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find buildings affected by a route
 * Returns array of buildings with impact details
 */
export const findAffectedBuildings = (routeCoordinates, buildings, roadWidth = 0.0001) => {
  const affected = [];

  for (const building of buildings) {
    const intersection = polylineIntersectsPolygon(
      routeCoordinates,
      building.coordinates,
      roadWidth
    );

    if (intersection.intersects) {
      const overlap = calculateOverlapArea(routeCoordinates, building.coordinates, roadWidth);
      
      affected.push({
        building,
        ...intersection,
        ...overlap,
        demolitionRequired: overlap.severity === 'full',
        partialImpact: overlap.severity === 'partial'
      });
    }
  }

  return affected;
};

/**
 * Calculate bounding box for a set of coordinates
 */
export const getBoundingBox = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const [x, y] of coordinates) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    min: [minX, minY],
    max: [maxX, maxY],
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Check if two bounding boxes overlap (for quick rejection)
 */
export const boundingBoxesOverlap = (bbox1, bbox2) => {
  return !(
    bbox1.max[0] < bbox2.min[0] ||
    bbox1.min[0] > bbox2.max[0] ||
    bbox1.max[1] < bbox2.min[1] ||
    bbox1.min[1] > bbox2.max[1]
  );
};

export default {
  pointInPolygon,
  pointToSegmentDistance,
  segmentsIntersect,
  polylineIntersectsPolygon,
  calculateOverlapArea,
  calculatePolygonArea,
  calculateCentroid,
  distance,
  findAffectedBuildings,
  getBoundingBox,
  boundingBoxesOverlap
};
