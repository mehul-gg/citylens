// Analyze road network and find missing connections
import { ROAD_SEGMENTS } from './puneData.js';

console.log('=== ROAD ENDPOINTS ===\n');

ROAD_SEGMENTS.forEach((road, idx) => {
  const start = road.coordinates[0];
  const end = road.coordinates[road.coordinates.length - 1];
  console.log(`${idx+1}. ${road.name}`);
  console.log(`   Start: [${start[0].toFixed(5)}, ${start[1].toFixed(5)}]`);
  console.log(`   End:   [${end[0].toFixed(5)}, ${end[1].toFixed(5)}]`);
});

// Find gaps
console.log('\n=== GAPS (endpoints >200m apart) ===\n');
const threshold = 0.002;

for (let i = 0; i < ROAD_SEGMENTS.length; i++) {
  for (let j = i + 1; j < ROAD_SEGMENTS.length; j++) {
    const r1 = ROAD_SEGMENTS[i];
    const r2 = ROAD_SEGMENTS[j];
    
    const eps1 = [r1.coordinates[0], r1.coordinates[r1.coordinates.length - 1]];
    const eps2 = [r2.coordinates[0], r2.coordinates[r2.coordinates.length - 1]];
    
    eps1.forEach((ep1, idx1) => {
      eps2.forEach((ep2, idx2) => {
        const dist = Math.sqrt((ep1[0] - ep2[0])**2 + (ep1[1] - ep2[1])**2);
        if (dist < threshold && dist > 0.0001) {
          console.log(`${r1.name} (${idx1 === 0 ? 'START' : 'END'}) <-> ${r2.name} (${idx2 === 0 ? 'START' : 'END'})`);
          console.log(`   Distance: ${(dist * 111000).toFixed(0)}m`);
          console.log(`   [${ep1[0].toFixed(5)}, ${ep1[1].toFixed(5)}] -> [${ep2[0].toFixed(5)}, ${ep2[1].toFixed(5)}]`);
          console.log('');
        }
      });
    });
  }
}
