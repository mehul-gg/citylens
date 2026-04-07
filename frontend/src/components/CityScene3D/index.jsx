/**
 * CityScene3D - Main 3D visualization component
 * Uses React Three Fiber to render the Wakad-Hinjewadi corridor
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Grid, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState } from 'react';
import RoadNetwork3D from './RoadNetwork3D';
import Junctions3D from './Junctions3D';
import Infrastructure3D from './Infrastructure3D';
import VehicleSystem from './VehicleSystem';
import useStore from '../../store/useStore';

// Loading fallback
const Loader = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#666" wireframe />
  </mesh>
);

// Ground plane with dark theme
const Ground = () => {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Grid overlay */}
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#2a2a4a"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3a3a5a"
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  );
};

// Lighting setup
const Lighting = () => {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#4a5568" />
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={[50, 50, 25]}
        intensity={0.8}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-30, 20, -30]}
        intensity={0.3}
        color="#93c5fd"
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[0, 10, -50]}
        intensity={0.2}
        color="#c084fc"
      />
    </>
  );
};

// Camera controller with presets
const CameraController = ({ preset = 'overview' }) => {
  const presets = {
    overview: { position: [30, 40, 30], target: [0, 0, 0] },
    street: { position: [5, 3, 10], target: [0, 0, 0] },
    top: { position: [0, 60, 0], target: [0, 0, 0] },
    junction: { position: [15, 15, 15], target: [5, 0, 5] }
  };

  const { position, target } = presets[preset] || presets.overview;

  return (
    <>
      <PerspectiveCamera makeDefault position={position} fov={60} />
      <OrbitControls
        target={target}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={100}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

// Main scene content
const SceneContent = ({ showBefore }) => {
  const { scenarios } = useStore();

  return (
    <>
      <Lighting />
      <Ground />
      
      {/* Stars for atmosphere */}
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      
      {/* Road network */}
      <RoadNetwork3D />
      
      {/* Junctions */}
      <Junctions3D />
      
      {/* User-drawn infrastructure (only in "after" mode) */}
      {!showBefore && <Infrastructure3D scenarios={scenarios} />}
      
      {/* Vehicles */}
      <VehicleSystem showBefore={showBefore} />
    </>
  );
};

// Main component
const CityScene3D = () => {
  const [cameraPreset, setCameraPreset] = useState('overview');
  const { showBefore, setShowBefore } = useStore(state => ({
    showBefore: state.showBefore ?? true,
    setShowBefore: state.setShowBefore
  }));

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#0f0f1a' }}
      >
        <Suspense fallback={<Loader />}>
          <CameraController preset={cameraPreset} />
          <SceneContent showBefore={showBefore} />
          <fog attach="fog" args={['#0f0f1a', 50, 150]} />
        </Suspense>
      </Canvas>

      {/* Camera preset buttons */}
      <div className="absolute top-4 left-4 flex gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'street', label: 'Street' },
          { id: 'top', label: 'Top Down' },
          { id: 'junction', label: 'Junction' }
        ].map(preset => (
          <button
            key={preset.id}
            onClick={() => setCameraPreset(preset.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              cameraPreset === preset.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Before/After toggle */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-700">
        <span className={`text-sm font-medium ${showBefore ? 'text-white' : 'text-slate-500'}`}>
          Before
        </span>
        <button
          onClick={() => setShowBefore && setShowBefore(!showBefore)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            showBefore ? 'bg-slate-600' : 'bg-green-600'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
              showBefore ? 'translate-x-1' : 'translate-x-8'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${!showBefore ? 'text-white' : 'text-slate-500'}`}>
          After
        </span>
      </div>

      {/* Scene info */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded">
        Wakad-Hinjewadi Corridor • 3D View
      </div>
    </div>
  );
};

export default CityScene3D;
