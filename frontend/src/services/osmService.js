/**
 * OSM Building Data Service
 * Loads pre-downloaded building data from local file
 * 
 * Building data is pre-downloaded from OpenStreetMap for the 
 * Wakad-Hinjewadi corridor and stored in public/data/osm-buildings.json
 * 
 * To update building data:
 *   npm run download-buildings
 */

const LOCAL_BUILDINGS_URL = '/data/osm-buildings.json';

/**
 * Load buildings from local pre-downloaded file
 */
export const fetchBuildings = async () => {
  console.log('📦 Loading buildings from local file...');
  
  try {
    const response = await fetch(LOCAL_BUILDINGS_URL, { cache: 'no-cache' });
    
    if (!response.ok) {
      throw new Error(`Failed to load buildings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty buildings data');
    }
    
    console.log(`✅ Loaded ${data.length} buildings from local file`);
    return data;
  } catch (error) {
    console.error('❌ Error loading buildings:', error.message);
    throw error;
  }
};

/**
 * Clear any cached building data (not needed with local file approach)
 */
export const clearBuildingCache = () => {
  console.log('ℹ️ No cache to clear (using local file only)');
};

/**
 * Get cache status (informational only)
 */
export const getCacheStatus = () => {
  return {
    method: 'local-file',
    file: LOCAL_BUILDINGS_URL,
    description: 'Buildings loaded from pre-downloaded local file'
  };
};

export default { fetchBuildings, clearBuildingCache, getCacheStatus };
