import { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text, Box, Cylinder } from '@react-three/drei';
import { X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import useStore from '../store/useStore';
import { PROPOSED_INFRASTRUCTURE } from '../data/puneData';

// Flyover 3D Model
const Flyover3D = ({ length = 10, width = 2, height = 3 }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Road deck */}
      <Box args={[length, 0.3, width]} position={[0, height, 0]}>
        <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
      </Box>
      
      {/* Road surface marking */}
      <Box args={[length - 0.2, 0.05, 0.1]} position={[0, height + 0.18, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      
      {/* Pillars */}
      {[-length/3, 0, length/3].map((x, i) => (
        <group key={i}>
          <Cylinder args={[0.3, 0.4, height, 8]} position={[x, height/2, width/3]}>
            <meshStandardMaterial color="#666666" roughness={0.6} />
          </Cylinder>
          <Cylinder args={[0.3, 0.4, height, 8]} position={[x, height/2, -width/3]}>
            <meshStandardMaterial color="#666666" roughness={0.6} />
          </Cylinder>
        </group>
      ))}
      
      {/* Side barriers */}
      <Box args={[length, 0.5, 0.1]} position={[0, height + 0.4, width/2 - 0.05]}>
        <meshStandardMaterial color="#888888" />
      </Box>
      <Box args={[length, 0.5, 0.1]} position={[0, height + 0.4, -width/2 + 0.05]}>
        <meshStandardMaterial color="#888888" />
      </Box>
      
      {/* Ground road */}
      <Box args={[length + 4, 0.1, width * 1.5]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </Box>
      
      {/* Ground road markings */}
      <Box args={[length + 3.8, 0.02, 0.08]} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
    </group>
  );
};

// Bridge 3D Model  
const Bridge3D = ({ length = 8, width = 2, height = 2 }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bridge deck */}
      <Box args={[length, 0.25, width]} position={[0, height, 0]}>
        <meshStandardMaterial color="#5a5a5a" roughness={0.7} />
      </Box>
      
      {/* Arch supports */}
      {[-length/4, length/4].map((x, i) => (
        <group key={i}>
          {/* Main arch */}
          <Cylinder args={[0.15, 0.15, height * 1.5, 8]} position={[x, height/2, width/2.5]} rotation={[0, 0, 0.3 * (i === 0 ? 1 : -1)]}>
            <meshStandardMaterial color="#06b6d4" roughness={0.4} metalness={0.6} />
          </Cylinder>
          <Cylinder args={[0.15, 0.15, height * 1.5, 8]} position={[x, height/2, -width/2.5]} rotation={[0, 0, 0.3 * (i === 0 ? 1 : -1)]}>
            <meshStandardMaterial color="#06b6d4" roughness={0.4} metalness={0.6} />
          </Cylinder>
        </group>
      ))}
      
      {/* Cross cables */}
      {[...Array(6)].map((_, i) => (
        <Cylinder 
          key={i}
          args={[0.02, 0.02, height * 0.8, 4]} 
          position={[length/2 - 1 - i * 1.2, height * 0.6, 0]}
          rotation={[0, 0, 0.5]}
        >
          <meshStandardMaterial color="#06b6d4" metalness={0.8} />
        </Cylinder>
      ))}
      
      {/* Water below */}
      <Box args={[length + 4, 0.1, width * 2]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#1e40af" roughness={0.2} metalness={0.3} />
      </Box>
    </group>
  );
};

// Tunnel 3D Model
const Tunnel3D = ({ length = 10, radius = 1.5 }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ground/hill */}
      <Box args={[length * 0.6, 3, 4]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#4a5a3a" roughness={0.9} />
      </Box>
      
      {/* Tunnel entrance left */}
      <Cylinder args={[radius, radius, 0.5, 16, 1, false, 0, Math.PI]} position={[-length * 0.3, radius * 0.7, 0]} rotation={[0, Math.PI/2, Math.PI/2]}>
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </Cylinder>
      
      {/* Tunnel entrance right */}
      <Cylinder args={[radius, radius, 0.5, 16, 1, false, 0, Math.PI]} position={[length * 0.3, radius * 0.7, 0]} rotation={[0, -Math.PI/2, Math.PI/2]}>
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </Cylinder>
      
      {/* Road approaching tunnel */}
      <Box args={[length * 0.4, 0.1, radius * 1.5]} position={[-length * 0.5, 0, 0]}>
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </Box>
      <Box args={[length * 0.4, 0.1, radius * 1.5]} position={[length * 0.5, 0, 0]}>
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </Box>
      
      {/* Tunnel interior hint */}
      <Cylinder args={[radius * 0.9, radius * 0.9, length * 0.6, 16, 1, true]} position={[0, radius * 0.7, 0]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#1a1a1a" side={1} />
      </Cylinder>
    </group>
  );
};

// Road 3D Model
const Road3D = ({ length = 10, width = 2 }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Road surface */}
      <Box args={[length, 0.15, width]} position={[0, 0.075, 0]}>
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </Box>
      
      {/* Center line */}
      {[...Array(Math.floor(length/1.5))].map((_, i) => (
        <Box key={i} args={[0.8, 0.02, 0.1]} position={[-length/2 + 1 + i * 1.5, 0.16, 0]}>
          <meshStandardMaterial color="#ffffff" />
        </Box>
      ))}
      
      {/* Edge lines */}
      <Box args={[length - 0.2, 0.02, 0.1]} position={[0, 0.16, width/2 - 0.15]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      <Box args={[length - 0.2, 0.02, 0.1]} position={[0, 0.16, -width/2 + 0.15]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      
      {/* Grass sides */}
      <Box args={[length, 0.05, 1]} position={[0, 0.025, width/2 + 0.5]}>
        <meshStandardMaterial color="#4a7c3f" />
      </Box>
      <Box args={[length, 0.05, 1]} position={[0, 0.025, -width/2 - 0.5]}>
        <meshStandardMaterial color="#4a7c3f" />
      </Box>
    </group>
  );
};

// Animated vehicles in 3D
const AnimatedVehicle = ({ startX, speed, zPos }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = ((state.clock.elapsedTime * speed + startX) % 12) - 6;
    }
  });

  return (
    <Box ref={meshRef} args={[0.4, 0.2, 0.25]} position={[startX, 0.25, zPos]}>
      <meshStandardMaterial color="#fbbf24" />
    </Box>
  );
};

const Infrastructure3DPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState('flyover');
  const { activeScenario } = useStore();

  // Determine type from active scenario
  const activeInfra = PROPOSED_INFRASTRUCTURE.find(i => i.id === activeScenario);
  const displayType = activeInfra?.type || selectedType;

  const infraTypes = [
    { id: 'flyover', label: 'Flyover', color: 'bg-purple-500' },
    { id: 'bridge', label: 'Bridge', color: 'bg-cyan-500' },
    { id: 'tunnel', label: 'Tunnel', color: 'bg-orange-500' },
    { id: 'road', label: 'Road', color: 'bg-lime-500' },
  ];

  const renderModel = () => {
    switch (displayType) {
      case 'flyover':
        return <Flyover3D />;
      case 'bridge':
        return <Bridge3D />;
      case 'tunnel':
        return <Tunnel3D />;
      case 'road':
        return <Road3D />;
      default:
        return <Flyover3D />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 glass rounded-lg px-4 py-2 text-white hover:bg-slate-700/50 transition-colors flex items-center gap-2"
      >
        <span className="text-lg">🏗️</span>
        <span>3D Preview</span>
      </button>
    );
  }

  return (
    <div 
      className={`absolute bottom-4 right-4 glass rounded-xl overflow-hidden transition-all ${
        isExpanded ? 'w-[600px] h-[500px]' : 'w-80 h-72'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">3D Infrastructure Preview</h3>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-1 p-2 border-b border-white/10">
        {infraTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
              displayType === type.id 
                ? `${type.color} text-white` 
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="h-[calc(100%-80px)]">
        <Canvas>
          <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
          <OrbitControls 
            enablePan={false}
            minDistance={5}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
          />
          
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          
          <Suspense fallback={null}>
            {renderModel()}
            
            {/* Animated vehicles */}
            {displayType !== 'tunnel' && (
              <>
                <AnimatedVehicle startX={-4} speed={1.5} zPos={displayType === 'flyover' ? 0 : 0.3} />
                <AnimatedVehicle startX={0} speed={1.2} zPos={displayType === 'flyover' ? 0 : -0.3} />
                <AnimatedVehicle startX={3} speed={1.8} zPos={displayType === 'flyover' ? 0 : 0.3} />
              </>
            )}
          </Suspense>
          
          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        </Canvas>
      </div>

      {/* Info footer */}
      <div className="absolute bottom-2 left-2 text-xs text-slate-400">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Infrastructure3DPreview;
