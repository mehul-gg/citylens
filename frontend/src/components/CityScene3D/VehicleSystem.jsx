/**
 * VehicleSystem - Renders animated vehicles in the 3D scene
 * Vehicles follow routes through connected road network (no U-turns)
 */

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_SEGMENTS } from '../../data/puneData';
import { geoTo3D, pathLength } from '../../utils/geoTo3D';
import { buildRoadGraph, generateRoutes, getRoutePath } from '../../utils/roadGraph';
import useStore from '../../store/useStore';

// Vehicle colors by type
const VEHICLE_COLORS = {
  car: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'],
  truck: ['#78716c', '#57534e', '#44403c'],
  bus: ['#dc2626', '#ea580c', '#16a34a'],
  bike: ['#0ea5e9', '#14b8a6', '#a855f7']
};

// Single vehicle mesh
const Vehicle = ({ position, rotation, type = 'car', color, speed = 1 }) => {
  const meshRef = useRef();
  
  const dimensions = useMemo(() => {
    switch (type) {
      case 'truck': return { width: 0.25, height: 0.3, length: 0.6 };
      case 'bus': return { width: 0.25, height: 0.35, length: 0.8 };
      case 'bike': return { width: 0.1, height: 0.15, length: 0.2 };
      default: return { width: 0.2, height: 0.15, length: 0.35 };
    }
  }, [type]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      {type === 'car' && (
        <mesh position={[0, dimensions.height * 0.4, -dimensions.length * 0.1]}>
          <boxGeometry args={[dimensions.width * 0.9, dimensions.height * 0.4, dimensions.length * 0.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
        </mesh>
      )}
      {/* Headlights */}
      <mesh position={[dimensions.width * 0.3, 0, dimensions.length * 0.45]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#fef3c7" />
      </mesh>
      <mesh position={[-dimensions.width * 0.3, 0, dimensions.length * 0.45]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#fef3c7" />
      </mesh>
    </group>
  );
};

// Get point along a 3D path at progress (0-1)
const getPointOnPath3D = (points, progress) => {
  if (points.length < 2) return points[0] || [0, 0, 0];
  
  // Calculate total length
  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    const dz = points[i + 1][2] - points[i][2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    segmentLengths.push(len);
    totalLength += len;
  }
  
  const targetDist = progress * totalLength;
  let accumulated = 0;
  
  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetDist) {
      const segmentProgress = (targetDist - accumulated) / segmentLengths[i];
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * segmentProgress,
        points[i][1] + (points[i + 1][1] - points[i][1]) * segmentProgress,
        points[i][2] + (points[i + 1][2] - points[i][2]) * segmentProgress
      ];
    }
    accumulated += segmentLengths[i];
  }
  
  return points[points.length - 1];
};

// Get rotation between two points
const getRotation = (from, to) => {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
};

// Animated vehicle that follows a route through the network
const RouteVehicle = ({ route, startOffset, speed, type, color, hourlyMultiplier }) => {
  const progressRef = useRef(startOffset);
  const positionRef = useRef([0, 0, 0]);
  const rotationRef = useRef(0);
  const groupRef = useRef();
  
  // Convert route to 3D path with proper elevation
  const path3D = useMemo(() => {
    const routePath = getRoutePath(route);
    return routePath.map(([lng, lat]) => {
      // Check if this segment is a flyover
      const segment = route.segments.find(s => 
        s.road.coordinates.some(c => c[0] === lng && c[1] === lat)
      );
      const elevation = segment?.road.type === 'flyover' ? 3.2 : 0.18;
      return geoTo3D(lng, lat, elevation);
    });
  }, [route]);

  const pathLen = useMemo(() => {
    let len = 0;
    for (let i = 0; i < path3D.length - 1; i++) {
      const dx = path3D[i + 1][0] - path3D[i][0];
      const dy = path3D[i + 1][1] - path3D[i][1];
      const dz = path3D[i + 1][2] - path3D[i][2];
      len += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return len || 1;
  }, [path3D]);

  // Calculate average congestion for the route
  const avgCongestion = useMemo(() => {
    if (route.segments.length === 0) return 0.5;
    const total = route.segments.reduce((sum, seg) => sum + (seg.road.trafficDensity || 0.5), 0);
    return total / route.segments.length;
  }, [route]);

  useFrame((state, delta) => {
    // Speed affected by congestion and time of day
    const congestionFactor = 1 - (avgCongestion * 0.6);
    const effectiveSpeed = speed * congestionFactor * hourlyMultiplier * 0.3;
    
    progressRef.current += (delta * effectiveSpeed) / pathLen;
    
    // Loop back to start when reaching end (continuous flow)
    if (progressRef.current > 1) {
      progressRef.current = 0;
    }
    
    const pos = getPointOnPath3D(path3D, progressRef.current);
    const nextPos = getPointOnPath3D(path3D, Math.min(1, progressRef.current + 0.02));
    const rot = getRotation(pos, nextPos);
    
    positionRef.current = pos;
    rotationRef.current = rot;
    
    if (groupRef.current) {
      groupRef.current.position.set(pos[0], pos[1], pos[2]);
      groupRef.current.rotation.y = rot;
    }
  });

  return (
    <group ref={groupRef}>
      <Vehicle type={type} color={color} position={[0, 0, 0]} rotation={0} speed={speed} />
    </group>
  );
};

// SUMO vehicle (position from backend)
const SumoVehicle = ({ vehicleData }) => {
  const { position: sumoPos, angle, type, speed } = vehicleData;
  
  const position = useMemo(() => geoTo3D(sumoPos[0], sumoPos[1], 0.15), [sumoPos]);
  const rotation = useMemo(() => (angle * Math.PI) / 180, [angle]);
  const color = useMemo(() => {
    const colors = VEHICLE_COLORS[type] || VEHICLE_COLORS.car;
    return colors[Math.floor(Math.random() * colors.length)];
  }, [type]);

  return <Vehicle position={position} rotation={rotation} type={type || 'car'} color={color} speed={speed} />;
};

// Get hourly traffic multiplier
const getHourlyMultiplier = (hour) => {
  const pattern = [
    0.15, 0.10, 0.08, 0.08, 0.12, 0.25,
    0.55, 0.85, 1.00, 0.95, 0.75, 0.60,
    0.55, 0.50, 0.55, 0.60, 0.75, 0.95,
    1.00, 0.98, 0.85, 0.65, 0.45, 0.25
  ];
  return pattern[hour] || 0.5;
};

// Main vehicle system component
const VehicleSystem = ({ showBefore = true }) => {
  const { 
    useSumoVehicles, 
    simulationVehicles, 
    trafficSimulationActive,
    currentHour,
    scenarios
  } = useStore();

  const hourlyMultiplier = getHourlyMultiplier(currentHour);

  // Build road graph including scenarios (only when showBefore is false)
  const roadGraph = useMemo(() => {
    const activeScenarios = showBefore ? [] : scenarios;
    return buildRoadGraph(ROAD_SEGMENTS, activeScenarios);
  }, [showBefore, scenarios]);

  // Generate routes through the network
  const routes = useMemo(() => {
    const baseRouteCount = Math.floor(25 * hourlyMultiplier);
    return generateRoutes(roadGraph, Math.max(10, baseRouteCount));
  }, [roadGraph, hourlyMultiplier]);

  // Generate vehicles for routes
  const vehicles = useMemo(() => {
    if (useSumoVehicles) return [];
    
    const vehicleList = [];
    
    routes.forEach((route, routeIdx) => {
      // Number of vehicles per route based on route length and congestion
      const routeLength = route.segments.length;
      const vehiclesPerRoute = Math.ceil(routeLength * hourlyMultiplier * 1.5);
      
      for (let i = 0; i < vehiclesPerRoute; i++) {
        const typeRand = Math.random();
        let type = 'car';
        if (typeRand > 0.95) type = 'bus';
        else if (typeRand > 0.88) type = 'truck';
        else if (typeRand > 0.75) type = 'bike';
        
        const colors = VEHICLE_COLORS[type];
        
        vehicleList.push({
          id: `v-${routeIdx}-${i}`,
          route,
          startOffset: (i / vehiclesPerRoute) + Math.random() * 0.1, // Stagger vehicles
          speed: 0.8 + Math.random() * 0.8,
          type,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    });
    
    return vehicleList;
  }, [routes, useSumoVehicles, hourlyMultiplier]);

  if (!trafficSimulationActive && !useSumoVehicles) {
    return null;
  }

  return (
    <group>
      {/* Route-based vehicles */}
      {!useSumoVehicles && vehicles.map((vehicle) => (
        <RouteVehicle
          key={vehicle.id}
          route={vehicle.route}
          startOffset={vehicle.startOffset}
          speed={vehicle.speed}
          type={vehicle.type}
          color={vehicle.color}
          hourlyMultiplier={hourlyMultiplier}
        />
      ))}
      
      {/* SUMO vehicles from backend */}
      {useSumoVehicles && simulationVehicles.map((vehicle) => (
        <SumoVehicle key={vehicle.id} vehicleData={vehicle} />
      ))}
      
      {/* Ambient particles */}
      <TrafficParticles showBefore={showBefore} />
    </group>
  );
};

// Particle effect for traffic density visualization
const TrafficParticles = ({ showBefore }) => {
  const particlesRef = useRef();
  const count = 150;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    ROAD_SEGMENTS.forEach((road, roadIdx) => {
      const particlesPerRoad = Math.floor(count / ROAD_SEGMENTS.length);
      for (let i = 0; i < particlesPerRoad; i++) {
        const idx = (roadIdx * particlesPerRoad + i) * 3;
        const coordIdx = Math.floor(Math.random() * road.coordinates.length);
        const [lng, lat] = road.coordinates[coordIdx];
        const [x, _, z] = geoTo3D(lng, lat, 0);
        pos[idx] = x + (Math.random() - 0.5) * 1.5;
        pos[idx + 1] = 0.3 + Math.random() * 1;
        pos[idx + 2] = z + (Math.random() - 0.5) * 1.5;
      }
    });
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        positions[idx + 1] += Math.sin(state.clock.elapsedTime * 1.5 + i * 0.1) * 0.001;
        if (positions[idx + 1] > 2) positions[idx + 1] = 0.3;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={showBefore ? '#f59e0b' : '#22c55e'}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

export default VehicleSystem;
