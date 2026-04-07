/**
 * WebSocket hook for real-time SUMO simulation data
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import useStore from '../store/useStore';

const WS_URL = 'ws://localhost:8000/ws/simulation';

export const useSimulationSocket = () => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const {
    setSimulationVehicles,
    setSimulationMetrics,
    setSimulationStatus,
    setSumoConnected
  } = useStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(WS_URL);
      setConnectionStatus('connecting');

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setSumoConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'vehicle_update':
              setSimulationVehicles(data.vehicles);
              setSimulationMetrics(data.metrics);
              break;
              
            case 'simulation_complete':
              setSimulationStatus('completed');
              setSimulationMetrics(data.metrics);
              break;
              
            case 'status':
              console.log('Simulation status:', data.message);
              setSimulationStatus(data.status === 'error' ? 'error' : 'running');
              break;
              
            case 'state':
              setSimulationVehicles(data.vehicles);
              setSimulationMetrics(data.metrics);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setSumoConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [setSimulationVehicles, setSimulationMetrics, setSimulationStatus, setSumoConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const startSimulation = useCallback((options = {}) => {
    const { speed = 10, useGui = false, useMock = true } = options;
    sendMessage({
      action: 'start',
      speed,
      use_gui: useGui,
      use_mock: useMock
    });
    setSimulationStatus('running');
  }, [sendMessage, setSimulationStatus]);

  const stopSimulation = useCallback(() => {
    sendMessage({ action: 'stop' });
    setSimulationStatus('stopped');
    setSimulationVehicles([]);
  }, [sendMessage, setSimulationStatus, setSimulationVehicles]);

  const pauseSimulation = useCallback(() => {
    sendMessage({ action: 'pause' });
    setSimulationStatus('paused');
  }, [sendMessage, setSimulationStatus]);

  const resumeSimulation = useCallback(() => {
    sendMessage({ action: 'resume' });
    setSimulationStatus('running');
  }, [sendMessage, setSimulationStatus]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation
  };
};

export default useSimulationSocket;
