/**
 * RoadNetwork3D - Renders all road segments as 3D geometry
 * Updates congestion colors based on infrastructure impact
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_SEGMENTS } from '../../data/puneData';
import { geoTo3D, getRoadWidth, getCongestionColor3D } from '../../utils/geoTo3D';
import { calculateInfrastructureImpact } from '../../utils/roadGraph';
import useStore from '../../store/useStore';

// Road segment component
const RoadSegment = ({ road, animate = true }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  
  // Convert coordinates to 3D points
  const points3D = useMemo(() => {
    const elevation = road.type === 'flyover' ? 3 : 0;
    return road.coordinates.map(([lng, lat]) => {
      const [x, y, z] = geoTo3D(lng, lat, elevation);
      return new THREE.Vector3(x, y, z);
    });
  }, [road]);

  // Create smooth curve through points
  const curve = useMemo(() => {
    if (points3D.length < 2) return null;
    return new THREE.CatmullRomCurve3(points3D, false, 'catmullrom', 0.5);
  }, [points3D]);

  const roadWidth = getRoadWidth(road);

  // Road surface geometry
  const surfaceGeometry = useMemo(() => {
    if (!curve) return null;
    
    const segments = Math.max(64, points3D.length * 12);
    const curvePoints = curve.getPoints(segments);
    
    const positions = [];
    const uvs = [];
    const indices = [];
    
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const tangent = curve.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const left = point.clone().add(normal.clone().multiplyScalar(roadWidth / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-roadWidth / 2));
      
      const surfaceY = road.type === 'flyover' ? 3.05 : 0.05;
      
      positions.push(left.x, surfaceY, left.z);
      positions.push(right.x, surfaceY, right.z);
      
      uvs.push(0, i / segments);
      uvs.push(1, i / segments);
      
      if (i < curvePoints.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }, [curve, roadWidth, points3D.length, road.type]);

  // Flyover pillars
  const pillars = useMemo(() => {
    if (road.type !== 'flyover' || !curve) return [];
    
    const pillarPositions = [];
    const pillarSpacing = 6;
    const totalLength = curve.getLength();
    const numPillars = Math.floor(totalLength / pillarSpacing);
    
    for (let i = 1; i < numPillars; i++) {
      const t = i / numPillars;
      const point = curve.getPointAt(t);
      pillarPositions.push([point.x, point.z]);
    }
    
    return pillarPositions;
  }, [road.type, curve]);

  // Get congestion color - uses current density (may be reduced by infrastructure)
  const congestionColor = getCongestionColor3D(road.trafficDensity);
  const glowIntensity = road.trafficDensity;
  
  // Animate glow based on traffic
  useFrame((state) => {
    if (glowRef.current && animate) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + road.trafficDensity * 10) * 0.1 + 0.9;
      glowRef.current.material.opacity = glowIntensity * 0.5 * pulse;
      glowRef.current.material.color.set(congestionColor);
    }
  });

  if (!curve) return null;

  return (
    <group>
      {/* Road surface */}
      {surfaceGeometry && (
        <mesh geometry={surfaceGeometry} receiveShadow>
          <meshStandardMaterial
            color="#2d3748"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      )}
      
      {/* Traffic congestion glow overlay */}
      {surfaceGeometry && (
        <mesh ref={glowRef} geometry={surfaceGeometry} position={[0, 0.02, 0]}>
          <meshBasicMaterial
            color={congestionColor}
            transparent
            opacity={glowIntensity * 0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* Center line markings for multi-lane roads */}
      {road.lanes >= 2 && (
        <mesh>
          <tubeGeometry args={[curve, 32, 0.02, 4, false]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Flyover pillars */}
      {pillars.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
            <meshStandardMaterial color="#374151" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.95, 0]}>
            <boxGeometry args={[0.5, 0.1, roadWidth * 1.2]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* Flyover side barriers */}
      {road.type === 'flyover' && curve && (
        <mesh position={[0, 3.2, 0]}>
          <tubeGeometry args={[curve, 32, 0.05, 4, false]} />
          <meshStandardMaterial color="#6b7280" roughness={0.5} metalness={0.3} />
        </mesh>
      )}

      {/* Show improvement indicator if road has infrastructure impact */}
      {road.hasInfrastructureImpact && (
        <mesh position={[points3D[0].x, 1, points3D[0].z]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
};

// Road label marker
const RoadLabel = ({ road }) => {
  const midpoint = useMemo(() => {
    const midIdx = Math.floor(road.coordinates.length / 2);
    const [lng, lat] = road.coordinates[midIdx];
    const elevation = road.type === 'flyover' ? 5 : 2;
    return geoTo3D(lng, lat, elevation);
  }, [road]);

  if (road.type === 'local') return null;

  return (
    <mesh position={midpoint}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshBasicMaterial 
        color={road.type === 'highway' ? '#3b82f6' : road.type === 'flyover' ? '#8b5cf6' : '#10b981'} 
      />
    </mesh>
  );
};

// Junction connectors - visual bridges between nearby road endpoints
const JunctionConnectors = ({ roads }) => {
  const connectors = useMemo(() => {
    const result = [];
    const threshold = 0.003; // Connection threshold
    
    for (let i = 0; i < roads.length; i++) {
      for (let j = i + 1; j < roads.length; j++) {
        const road1 = roads[i];
        const road2 = roads[j];
        
        if (!road1.coordinates || !road2.coordinates) continue;
        
        const endpoints1 = [road1.coordinates[0], road1.coordinates[road1.coordinates.length - 1]];
        const endpoints2 = [road2.coordinates[0], road2.coordinates[road2.coordinates.length - 1]];
        
        for (const ep1 of endpoints1) {
          for (const ep2 of endpoints2) {
            const dx = ep1[0] - ep2[0];
            const dy = ep1[1] - ep2[1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < threshold && dist > 0.0001) {
              const p1 = geoTo3D(ep1[0], ep1[1], 0.06);
              const p2 = geoTo3D(ep2[0], ep2[1], 0.06);
              const mid = [(p1[0] + p2[0]) / 2, 0.06, (p1[2] + p2[2]) / 2];
              
              result.push({ p1, p2, mid, key: `${i}-${j}-${ep1[0]}-${ep2[0]}` });
            }
          }
        }
      }
    }
    
    return result;
  }, [roads]);

  return (
    <group>
      {connectors.map(({ p1, p2, mid, key }) => (
        <mesh key={key} position={mid} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshStandardMaterial color="#374151" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Main component
const RoadNetwork3D = () => {
  const { showBefore, scenarios } = useStore();
  
  // Calculate roads with infrastructure impact
  const roads = useMemo(() => {
    if (showBefore || !scenarios || scenarios.length === 0) {
      return ROAD_SEGMENTS;
    }
    return calculateInfrastructureImpact(scenarios, ROAD_SEGMENTS);
  }, [showBefore, scenarios]);

  return (
    <group>
      {/* Junction connectors for visual continuity */}
      <JunctionConnectors roads={roads} />
      
      {/* Road segments */}
      {roads.map((road) => (
        <group key={road.id}>
          <RoadSegment road={road} />
          <RoadLabel road={road} />
        </group>
      ))}
    </group>
  );
};

export default RoadNetwork3D;
