/**
 * Hook for real-time traffic metrics based on actual Pune traffic patterns
 */

import { useState, useEffect } from 'react';
import { getRealtimeMetrics } from '../data/puneData';

export const useRealtimeMetrics = (updateInterval = 30000) => {
  const [metrics, setMetrics] = useState(() => getRealtimeMetrics());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Update immediately
    const updateMetrics = () => {
      const now = new Date();
      setMetrics(getRealtimeMetrics(now));
      setLastUpdate(now);
    };

    updateMetrics();

    // Update periodically
    const interval = setInterval(updateMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return { metrics, lastUpdate };
};

export default useRealtimeMetrics;
