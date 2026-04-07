/**
 * Coordinate conversion utilities for 3D scene
 * Converts geographic coordinates (lng, lat) to 3D scene coordinates
 */

// Center point of Wakad-Hinjewadi corridor
export const GEO_CENTER = {
  lng: 73.75,
  lat: 18.59
};

// Scale factor: higher = larger scene
// At this scale, 1 unit ≈ 10 meters
export const SCALE = 8000;

/**
 * Convert geographic coordinates to 3D scene position
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} elevation - Height above ground (default 0)
 * @returns {[number, number, number]} [x, y, z] position
 */
export function geoTo3D(lng, lat, elevation = 0) {
  const x = (lng - GEO_CENTER.lng) * SCALE;
  const z = -(lat - GEO_CENTER.lat) * SCALE; // Negative because Z is inverted
  const y = elevation;
  return [x, y, z];
}

/**
 * Convert array of [lng, lat] coordinates to 3D positions
 * @param {Array<[number, number]>} coords - Array of [lng, lat] pairs
 * @param {number} elevation - Height above ground
 * @returns {Array<[number, number, number]>} Array of [x, y, z] positions
 */
export function coordsTo3D(coords, elevation = 0) {
  return coords.map(([lng, lat]) => geoTo3D(lng, lat, elevation));
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate total path length
 */
export function pathLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance3D(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Get point along a path at a given progress (0-1)
 */
export function getPointOnPath(points, progress) {
  if (points.length < 2) return points[0] || [0, 0, 0];
  
  const totalLen = pathLength(points);
  const targetDist = progress * totalLen;
  
  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const segmentLen = distance3D(points[i], points[i + 1]);
    if (accumulated + segmentLen >= targetDist) {
      const segmentProgress = (targetDist - accumulated) / segmentLen;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * segmentProgress,
        points[i][1] + (points[i + 1][1] - points[i][1]) * segmentProgress,
        points[i][2] + (points[i + 1][2] - points[i][2]) * segmentProgress
      ];
    }
    accumulated += segmentLen;
  }
  
  return points[points.length - 1];
}

/**
 * Calculate angle (rotation) between two points on XZ plane
 */
export function getRotationY(from, to) {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

/**
 * Get road width based on type and lanes
 */
export function getRoadWidth(road) {
  const laneWidth = 0.35; // ~3.5m per lane at our scale
  if (road.type === 'highway') return road.lanes * laneWidth * 1.2;
  if (road.type === 'flyover') return road.lanes * laneWidth * 1.1;
  return road.lanes * laneWidth;
}

/**
 * Get road color based on congestion
 */
export function getCongestionColor3D(density) {
  if (density < 0.3) return '#22c55e';
  if (density < 0.6) return '#eab308';
  if (density < 0.8) return '#f97316';
  return '#ef4444';
}

/**
 * Interpolate between two colors based on value (0-1)
 */
export function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
