/**
 * Mock building data for Wakad-Hinjewadi corridor
 * Used as fallback when OSM API is unavailable
 */

/**
 * Generate mock buildings within the corridor bounds
 */
export const generateMockBuildings = (count = 50) => {
  // Wakad-Hinjewadi corridor bounds
  const minLng = 73.73;
  const maxLng = 73.77;
  const minLat = 18.58;
  const maxLat = 18.60;

  const buildings = [];
  const types = ['residential', 'commercial', 'industrial', 'office'];
  const typeWeights = [0.6, 0.2, 0.1, 0.1]; // 60% residential, 20% commercial, etc.

  for (let i = 0; i < count; i++) {
    // Random center point
    const centerLng = minLng + Math.random() * (maxLng - minLng);
    const centerLat = minLat + Math.random() * (maxLat - minLat);

    // Random building size (20-100m width/height)
    const width = 0.0002 + Math.random() * 0.0008; // ~20-100m
    const height = 0.0002 + Math.random() * 0.0008;

    // Create rectangular building
    const coordinates = [
      [centerLng - width/2, centerLat - height/2],
      [centerLng + width/2, centerLat - height/2],
      [centerLng + width/2, centerLat + height/2],
      [centerLng - width/2, centerLat + height/2],
      [centerLng - width/2, centerLat - height/2] // Close polygon
    ];

    // Select type based on weights
    const rand = Math.random();
    let type = 'residential';
    let cumulative = 0;
    for (let j = 0; j < types.length; j++) {
      cumulative += typeWeights[j];
      if (rand < cumulative) {
        type = types[j];
        break;
      }
    }

    // Random floors (1-10)
    const levels = Math.floor(1 + Math.random() * 10);
    const buildingHeight = levels * 3.5;

    // Calculate area (rough estimate in sq.m)
    const area = (width * 111000) * (height * 111000); // Convert degrees to meters

    // Value per sq.m based on type
    const valuePerSqM = {
      residential: 50000,
      commercial: 80000,
      industrial: 30000,
      office: 70000
    };

    const estimatedValue = area * (valuePerSqM[type] || 50000);

    // Capacity estimate
    const capacity = type === 'residential' 
      ? Math.floor(levels * (area / 100)) 
      : Math.floor(area / 50);

    buildings.push({
      id: `mock-${i}`,
      osmId: 9000000 + i,
      type,
      coordinates,
      levels,
      height: buildingHeight,
      area,
      estimatedValue,
      capacity,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Building ${i + 1}`,
      street: `Mock Street ${Math.floor(i / 5) + 1}`,
      houseNumber: String(i + 1)
    });
  }

  return buildings;
};

export default generateMockBuildings;
