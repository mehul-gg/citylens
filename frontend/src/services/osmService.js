/**
 * OSM Overpass API Service
 * Fetches building data for the Wakad-Hinjewadi corridor
 */

import { CORRIDOR_BOUNDS } from '../data/puneData';

const OVERPASS_API_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter'
];
const LOCAL_SNAPSHOT_URL = '/data/osm-buildings.json';
const CACHE_KEY = 'citylens_osm_buildings';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Build Overpass QL query for buildings in area
 */
const buildBuildingQuery = (bounds) => {
  const { southwest, northeast } = bounds;
  const [south, west] = southwest;
  const [north, east] = northeast;

  return `
    [out:json][timeout:25];
    (
      way["building"](${south},${west},${north},${east});
      relation["building"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;
};

/**
 * Parse OSM way to building object
 */
const parseBuilding = (way, nodes) => {
  const coordinates = way.nodes
    .map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node ? [node.lon, node.lat] : null;
    })
    .filter(Boolean);

  // Close polygon if not closed
  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }
  }

  // Extract metadata
  const tags = way.tags || {};
  const levels = parseInt(tags['building:levels'] || tags.levels || '2');
  const height = tags.height 
    ? parseFloat(tags.height.replace(/[^0-9.]/g, ''))
    : levels * 3.5; // Estimate 3.5m per floor

  // Determine building type
  let type = 'residential'; // default
  if (tags.building === 'commercial' || tags.shop || tags.amenity === 'restaurant') {
    type = 'commercial';
  } else if (tags.building === 'industrial' || tags.industrial) {
    type = 'industrial';
  } else if (tags.building === 'retail' || tags.building === 'supermarket') {
    type = 'commercial';
  } else if (tags.building === 'apartments' || tags.building === 'residential') {
    type = 'residential';
  } else if (tags.office) {
    type = 'office';
  }

  // Calculate approximate area (simple polygon area)
  const area = calculatePolygonArea(coordinates);

  // Estimate value based on area and type
  const valuePerSqM = {
    residential: 50000, // ₹50k per sq.m
    commercial: 80000,  // ₹80k per sq.m
    industrial: 30000,  // ₹30k per sq.m
    office: 70000       // ₹70k per sq.m
  };

  const estimatedValue = area * (valuePerSqM[type] || 50000);

  // Estimate capacity (residents/businesses)
  const capacity = type === 'residential' 
    ? Math.floor(levels * (area / 100)) // ~100 sq.m per household
    : Math.floor(area / 50); // ~50 sq.m per business unit

  return {
    id: `osm-${way.id}`,
    osmId: way.id,
    type,
    coordinates,
    levels,
    height,
    area,
    estimatedValue,
    capacity,
    name: tags.name || tags['addr:housename'] || null,
    street: tags['addr:street'] || null,
    houseNumber: tags['addr:housenumber'] || null,
    tags
  };
};

/**
 * Calculate polygon area in square meters (approximate)
 */
const calculatePolygonArea = (coords) => {
  if (coords.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    area += (lon1 * lat2) - (lon2 * lat1);
  }
  area = Math.abs(area) / 2;

  // Convert to square meters (rough approximation for India)
  // 1 degree ≈ 111km at equator, varies by latitude
  const metersPerDegree = 111000;
  return area * metersPerDegree * metersPerDegree;
};

/**
 * Get buildings from cache (if not expired)
 */
const getCachedBuildings = (forceReturn = false) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CACHE_DURATION || forceReturn) {
      console.log('✅ Using cached building data', { ageHours: (age / (1000 * 60 * 60)).toFixed(1) });
      return data;
    } else {
      console.log('⚠️ Cache expired, fetching fresh data');
      return null;
    }
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

/**
 * Save buildings to cache
 */
const cacheBuildings = (buildings) => {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data: buildings
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`✅ Cached ${buildings.length} buildings`);
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

/**
 * Try to load pre-downloaded building snapshot from local file
 */
const fetchLocalSnapshot = async () => {
  try {
    const response = await fetch(LOCAL_SNAPSHOT_URL, { cache: 'no-cache' });
    if (!response.ok) return null;
    const payload = await response.json();
    const buildings = Array.isArray(payload) ? payload : payload?.buildings;
    if (!Array.isArray(buildings) || buildings.length === 0) return null;
    console.log(`✅ Loaded ${buildings.length} buildings from local snapshot`);
    cacheBuildings(buildings);
    return buildings;
  } catch {
    return null;
  }
};

const fetchFromOverpass = async (query, url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetch buildings from Overpass API
 */
export const fetchBuildings = async (bounds = CORRIDOR_BOUNDS) => {
  // Check cache first
  const cached = getCachedBuildings();
  if (cached) return cached;

  console.log('🔄 Fetching buildings from Overpass API...');

  const query = buildBuildingQuery(bounds);

  for (const url of OVERPASS_API_URLS) {
    try {
      console.log(`🔄 Trying Overpass endpoint: ${url}`);
      const data = await fetchFromOverpass(query, url);

      const nodes = data.elements.filter(el => el.type === 'node');
      const ways = data.elements.filter(el => el.type === 'way' && el.tags?.building);

      const buildings = ways
        .map(way => parseBuilding(way, nodes))
        .filter(b => b.coordinates.length >= 3);

      if (buildings.length > 0) {
        console.log(`✅ Fetched ${buildings.length} buildings from OSM (${url})`);
        cacheBuildings(buildings);
        return buildings;
      }
    } catch (error) {
      console.warn(`⚠️ Overpass endpoint failed: ${url}`, error.message);
    }
  }

  const snapshotBuildings = await fetchLocalSnapshot();
  if (snapshotBuildings) {
    return snapshotBuildings;
  }

  const fallback = getCachedBuildings(true);
  if (fallback) {
    console.log('⚠️ Using expired cache as fallback');
    return fallback;
  }

  throw new Error('All OSM sources failed (endpoints + local snapshot + cache)');
};

/**
 * Clear building cache (for manual refresh)
 */
export const clearBuildingCache = () => {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Building cache cleared');
};

/**
 * Get cache status
 */
export const getCacheStatus = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { cached: false };

    const { timestamp, data } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
    const isExpired = age >= CACHE_DURATION;

    return {
      cached: true,
      buildingCount: data.length,
      ageHours,
      isExpired,
      timestamp: new Date(timestamp).toLocaleString()
    };
  } catch {
    return { cached: false };
  }
};

export default { fetchBuildings, clearBuildingCache, getCacheStatus };
