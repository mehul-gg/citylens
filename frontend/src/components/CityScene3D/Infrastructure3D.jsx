/**
 * Infrastructure3D - Renders user-drawn infrastructure scenarios
 * Procedurally generates flyovers, bridges, and tunnels
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geoTo3D } from '../../utils/geoTo3D';

// Flyover mesh generator
const FlyoverMesh = ({ coordinates, name }) => {
  const glowRef = useRef();
  
  // Convert coordinates to 3D path
  const path = useMemo(() => {
    const points = coordinates.map(([lng, lat]) => {
      const [x, _, z] = geoTo3D(lng, lat, 0);
      return new THREE.Vector3(x, 5, z); // Elevated at 5 units
    });
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [coordinates]);

  // Generate deck geometry
  const deckGeometry = useMemo(() => {
    if (coordinates.length < 2) return null;
    
    const segments = 64;
    const curvePoints = path.getPoints(segments);
    const deckWidth = 1.5;
    
    const positions = [];
    const indices = [];
    
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const tangent = path.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const left = point.clone().add(normal.clone().multiplyScalar(deckWidth / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-deckWidth / 2));
      
      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);
      
      if (i < curvePoints.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }, [coordinates, path]);

  // Generate pillars
  const pillars = useMemo(() => {
    const pillarPositions = [];
    const totalLength = path.getLength();
    const pillarSpacing = 5;
    const numPillars = Math.floor(totalLength / pillarSpacing);
    
    for (let i = 1; i < numPillars; i++) {
      const t = i / numPillars;
      const point = path.getPointAt(t);
      pillarPositions.push([point.x, point.z]);
    }
    
    return pillarPositions;
  }, [path]);

  // Ramp geometry (start and end)
  const ramps = useMemo(() => {
    const rampLength = 3;
    const startPoint = path.getPointAt(0);
    const endPoint = path.getPointAt(1);
    const startTangent = path.getTangentAt(0);
    const endTangent = path.getTangentAt(1);
    
    return [
      { position: startPoint, direction: startTangent.clone().negate() },
      { position: endPoint, direction: endTangent }
    ];
  }, [path]);

  // Animate glow
  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  if (!deckGeometry) return null;

  return (
    <group>
      {/* Main deck */}
      <mesh geometry={deckGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#1e40af"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      
      {/* Deck glow effect */}
      <mesh ref={glowRef} geometry={deckGeometry} position={[0, 0.05, 0]}>
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Side barriers */}
      <mesh>
        <tubeGeometry args={[path, 32, 0.08, 4, false]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Pillars */}
      {pillars.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 5, 8]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.9, 0]}>
            <boxGeometry args={[0.6, 0.2, 2]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* Ramps */}
      {ramps.map((ramp, idx) => {
        const rampPos = ramp.position.clone().add(ramp.direction.clone().multiplyScalar(1.5));
        const rotation = Math.atan2(ramp.direction.x, ramp.direction.z);
        return (
          <mesh 
            key={idx} 
            position={[rampPos.x, 2.5, rampPos.z]}
            rotation={[Math.PI / 6 * (idx === 0 ? 1 : -1), rotation, 0]}
          >
            <boxGeometry args={[1.5, 0.15, 3]} />
            <meshStandardMaterial color="#1e40af" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

// Bridge mesh generator
const BridgeMesh = ({ coordinates, name }) => {
  const glowRef = useRef();
  
  const path = useMemo(() => {
    const points = coordinates.map(([lng, lat]) => {
      const [x, _, z] = geoTo3D(lng, lat, 0);
      return new THREE.Vector3(x, 4, z);
    });
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [coordinates]);

  const deckGeometry = useMemo(() => {
    if (coordinates.length < 2) return null;
    
    const segments = 32;
    const curvePoints = path.getPoints(segments);
    const deckWidth = 1.2;
    
    const positions = [];
    const indices = [];
    
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const tangent = path.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const left = point.clone().add(normal.clone().multiplyScalar(deckWidth / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-deckWidth / 2));
      
      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);
      
      if (i < curvePoints.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }, [coordinates, path]);

  // Arch supports
  const arches = useMemo(() => {
    const archPositions = [];
    const numArches = Math.max(2, Math.floor(path.getLength() / 8));
    
    for (let i = 0; i <= numArches; i++) {
      const t = i / numArches;
      const point = path.getPointAt(t);
      archPositions.push([point.x, point.z]);
    }
    
    return archPositions;
  }, [path]);

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  if (!deckGeometry) return null;

  return (
    <group>
      {/* Bridge deck */}
      <mesh geometry={deckGeometry} castShadow>
        <meshStandardMaterial color="#166534" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Glow */}
      <mesh ref={glowRef} geometry={deckGeometry} position={[0, 0.03, 0]}>
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Arch supports */}
      {arches.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          {/* Stone pillar */}
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[0.5, 4, 0.5]} />
            <meshStandardMaterial color="#1f4d38" roughness={0.9} />
          </mesh>
          {/* Decorative top */}
          <mesh position={[0, 3.9, 0]}>
            <boxGeometry args={[0.7, 0.2, 1.4]} />
            <meshStandardMaterial color="#1f4d38" roughness={0.8} />
          </mesh>
        </group>
      ))}
      
      {/* Side cables (suspension look) */}
      <mesh>
        <tubeGeometry args={[path, 24, 0.04, 4, false]} />
        <meshStandardMaterial color="#4ade80" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
};

// Tunnel mesh generator
const TunnelMesh = ({ coordinates, name }) => {
  const glowRef = useRef();
  
  const path = useMemo(() => {
    const points = coordinates.map(([lng, lat]) => {
      const [x, _, z] = geoTo3D(lng, lat, 0);
      return new THREE.Vector3(x, -2, z); // Underground
    });
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [coordinates]);

  // Tunnel entrance portals
  const portals = useMemo(() => {
    const startPoint = path.getPointAt(0);
    const endPoint = path.getPointAt(1);
    const startTangent = path.getTangentAt(0);
    const endTangent = path.getTangentAt(1);
    
    return [
      { position: [startPoint.x, 0, startPoint.z], rotation: Math.atan2(startTangent.x, startTangent.z) },
      { position: [endPoint.x, 0, endPoint.z], rotation: Math.atan2(endTangent.x, endTangent.z) + Math.PI }
    ];
  }, [path]);

  // Ground cut (trench visualization)
  const trenchGeometry = useMemo(() => {
    if (coordinates.length < 2) return null;
    
    const segments = 32;
    const curvePoints = path.getPoints(segments);
    const trenchWidth = 1.5;
    
    const positions = [];
    const indices = [];
    
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const tangent = path.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      
      const left = point.clone().add(normal.clone().multiplyScalar(trenchWidth / 2));
      const right = point.clone().add(normal.clone().multiplyScalar(-trenchWidth / 2));
      
      // Surface level for trench outline
      positions.push(left.x, 0.1, left.z);
      positions.push(right.x, 0.1, right.z);
      
      if (i < curvePoints.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }, [coordinates, path]);

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group>
      {/* Trench outline on ground */}
      {trenchGeometry && (
        <mesh ref={glowRef} geometry={trenchGeometry}>
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* Dashed line showing tunnel path */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={coordinates.length}
            array={new Float32Array(coordinates.flatMap(([lng, lat]) => {
              const [x, _, z] = geoTo3D(lng, lat, 0);
              return [x, 0.15, z];
            }))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineDashedMaterial color="#f59e0b" dashSize={0.5} gapSize={0.3} linewidth={2} />
      </line>
      
      {/* Tunnel entrance portals */}
      {portals.map((portal, idx) => (
        <group key={idx} position={portal.position} rotation={[0, portal.rotation, 0]}>
          {/* Portal arch */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[2, 1.6, 0.3]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          
          {/* Portal opening (dark) */}
          <mesh position={[0, 0.7, 0.1]}>
            <boxGeometry args={[1.4, 1.2, 0.2]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
          
          {/* Entrance lights */}
          <pointLight position={[0, 1, 0.5]} color="#fbbf24" intensity={0.5} distance={3} />
          
          {/* Sign */}
          <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.1]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Main component that renders all user scenarios
const Infrastructure3D = ({ scenarios = [] }) => {
  return (
    <group>
      {scenarios.map((scenario) => {
        if (!scenario.coordinates || scenario.coordinates.length < 2) {
          return null;
        }
        
        switch (scenario.type) {
          case 'flyover':
            return <FlyoverMesh key={scenario.id} {...scenario} />;
          case 'bridge':
            return <BridgeMesh key={scenario.id} {...scenario} />;
          case 'tunnel':
            return <TunnelMesh key={scenario.id} {...scenario} />;
          default:
            // Default to flyover for unknown types
            return <FlyoverMesh key={scenario.id} {...scenario} />;
        }
      })}
    </group>
  );
};

export default Infrastructure3D;
