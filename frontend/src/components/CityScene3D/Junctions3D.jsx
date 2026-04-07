/**
 * Junctions3D - Renders key junctions as 3D markers
 * Shows congestion level with color and pulsing effects
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KEY_JUNCTIONS, CONGESTION_COLORS } from '../../data/puneData';
import { geoTo3D } from '../../utils/geoTo3D';
import { Html } from '@react-three/drei';

// Single junction marker
const JunctionMarker = ({ junction, showLabels = true }) => {
  const markerRef = useRef();
  const ringRef = useRef();
  const glowRef = useRef();
  
  // Convert to 3D position
  const position = useMemo(() => {
    const [lng, lat] = junction.coordinates;
    return geoTo3D(lng, lat, 0);
  }, [junction]);

  // Get color based on congestion level
  const color = useMemo(() => {
    const colorMap = {
      low: CONGESTION_COLORS.low,
      medium: CONGESTION_COLORS.medium,
      high: CONGESTION_COLORS.high,
      critical: CONGESTION_COLORS.critical
    };
    return colorMap[junction.congestionLevel] || CONGESTION_COLORS.medium;
  }, [junction.congestionLevel]);

  // Pulse animation speed based on congestion
  const pulseSpeed = useMemo(() => {
    const speeds = { low: 1, medium: 2, high: 3, critical: 4 };
    return speeds[junction.congestionLevel] || 2;
  }, [junction.congestionLevel]);

  // Animate the marker
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Pulse the marker
    if (markerRef.current) {
      const scale = 1 + Math.sin(time * pulseSpeed) * 0.1;
      markerRef.current.scale.setScalar(scale);
    }
    
    // Rotate and expand the ring
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.5;
      const ringScale = 1 + Math.sin(time * pulseSpeed) * 0.2;
      ringRef.current.scale.setScalar(ringScale);
    }
    
    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(time * pulseSpeed) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Ground circle (road surface marking) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial 
          color="#1f2937"
          roughness={0.9}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[1.2, 1.8, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Rotating ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.9, 1.1, 6]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Central marker */}
      <mesh ref={markerRef} position={[0, 0.5, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Vertical beam (light pillar effect) */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.02, 0.15, 4, 8]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Junction label (HTML overlay) */}
      {showLabels && (
        <Html
          position={[0, 4.5, 0]}
          center
          distanceFactor={20}
          occlude={false}
          style={{
            transition: 'all 0.2s',
            pointerEvents: 'none',
          }}
        >
          <div className="bg-slate-900/90 px-2 py-1 rounded border border-slate-700 whitespace-nowrap">
            <div className="text-xs font-semibold text-white">{junction.name}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              Wait: {junction.avgWaitTime} min
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Traffic signal post (decorative)
const TrafficSignal = ({ position, rotation = 0 }) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 3, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Signal box */}
      <mesh position={[0, 2.8, 0.15]}>
        <boxGeometry args={[0.15, 0.4, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      
      {/* Lights */}
      {[0.12, 0, -0.12].map((yOffset, idx) => (
        <mesh key={idx} position={[0, 2.8 + yOffset, 0.21]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial 
            color={idx === 0 ? '#ef4444' : idx === 1 ? '#eab308' : '#22c55e'}
            transparent
            opacity={idx === 0 ? 1 : 0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// Main component
const Junctions3D = ({ showLabels = true }) => {
  return (
    <group>
      {KEY_JUNCTIONS.map((junction) => (
        <JunctionMarker 
          key={junction.id} 
          junction={junction}
          showLabels={showLabels}
        />
      ))}
      
      {/* Add some traffic signals at key junctions */}
      {KEY_JUNCTIONS.filter(j => j.congestionLevel === 'critical' || j.congestionLevel === 'high')
        .map((junction) => {
          const [lng, lat] = junction.coordinates;
          const pos = geoTo3D(lng, lat, 0);
          return (
            <group key={`signal-${junction.id}`}>
              <TrafficSignal position={[pos[0] + 1.5, 0, pos[2]]} rotation={Math.PI / 4} />
              <TrafficSignal position={[pos[0] - 1.5, 0, pos[2]]} rotation={-Math.PI * 3/4} />
            </group>
          );
        })}
    </group>
  );
};

export default Junctions3D;
