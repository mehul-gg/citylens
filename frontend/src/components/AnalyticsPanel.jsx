import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Car, 
  Wind,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Gauge,
  Leaf,
  Activity
} from 'lucide-react';
import { ROAD_SEGMENTS, HOURLY_TRAFFIC_PATTERNS, AQI_PATTERNS } from '../data/puneData';
import { calculateInfrastructureImpact } from '../utils/roadGraph';
import useStore from '../store/useStore';

const AnalyticsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const { 
    currentHour, 
    scenarios, 
    showBefore,
    // SUMO real-time data
    sumoConnected,
    simulationStatus,
    simulationMetrics,
    useSumoVehicles
  } = useStore();

  // Determine if we should use SUMO data
  const useSumoData = sumoConnected && useSumoVehicles && simulationStatus === 'running';

  // Calculate real-time metrics based on actual state
  const metrics = useMemo(() => {
    // If SUMO is running, use real-time SUMO data
    if (useSumoData) {
      const now = new Date();
      const hour = currentHour;
      const dayOfWeek = now.getDay();
      const month = now.getMonth();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const pattern = isWeekend ? HOURLY_TRAFFIC_PATTERNS.weekend : HOURLY_TRAFFIC_PATTERNS.weekday;
      const trafficMultiplier = pattern[hour];
      
      // Use SUMO metrics
      const congestionIndex = simulationMetrics.congestionIndex || 0;
      const avgSpeed = simulationMetrics.avgSpeed || 40;
      const totalVehicles = simulationMetrics.totalVehicles || 0;
      const waitingVehicles = simulationMetrics.waitingVehicles || 0;
      
      // Calculate travel time based on SUMO speed
      const baseTravelTime = 8;
      const travelTime = Math.round(baseTravelTime * (60 / Math.max(avgSpeed, 20))); // Inverse of speed
      
      // AQI calculation
      const baseAQI = AQI_PATTERNS.monthly[month];
      const aqiMultiplier = AQI_PATTERNS.hourly[hour];
      const trafficAQIContribution = (congestionIndex / 100) * 30;
      const aqi = Math.round((baseAQI * aqiMultiplier) + trafficAQIContribution);
      
      // Environmental impact based on SUMO data
      const vehiclesPerHour = totalVehicles * 10; // Extrapolate
      const idleTimeFactor = (waitingVehicles / Math.max(totalVehicles, 1)) * 0.8;
      const fuelWasted = Math.round(vehiclesPerHour * idleTimeFactor * 0.08);
      const co2Emissions = Math.round(fuelWasted * 2.3);
      
      // Productivity loss
      const avgWagePerHour = 250;
      const extraTimeWasted = (travelTime - baseTravelTime) / 60;
      const productivityLoss = Math.round((vehiclesPerHour * 1.5 * extraTimeWasted * avgWagePerHour) / 100000);
      
      // Accident risk
      const accidentRisk = congestionIndex > 80 ? 'High' : congestionIndex > 50 ? 'Medium' : 'Low';
      
      return {
        hour,
        isWeekend,
        isPeakHour: trafficMultiplier > 0.85,
        trafficMultiplier,
        avgTravelTime: travelTime,
        congestionIndex,
        airQualityIndex: aqi,
        aqiCategory: aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : aqi < 150 ? 'Unhealthy for Sensitive' : aqi < 200 ? 'Unhealthy' : 'Very Unhealthy',
        vehiclesPerHour,
        avgSpeed: Math.round(avgSpeed),
        fuelWasted,
        co2Emissions,
        productivityLoss,
        accidentRisk,
        infrastructureActive: !showBefore && scenarios.length > 0,
        scenarioCount: scenarios.length,
        dataSource: 'sumo' // Indicator that we're using SUMO data
      };
    }
    
    // Otherwise use calculated data from road segments
    const now = new Date();
    const hour = currentHour;
    const dayOfWeek = now.getDay();
    const month = now.getMonth();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const pattern = isWeekend ? HOURLY_TRAFFIC_PATTERNS.weekend : HOURLY_TRAFFIC_PATTERNS.weekday;
    const trafficMultiplier = pattern[hour];
    
    // Get roads with infrastructure impact if applicable
    const activeRoads = (!showBefore && scenarios.length > 0) 
      ? calculateInfrastructureImpact(scenarios, ROAD_SEGMENTS)
      : ROAD_SEGMENTS;
    
    // Calculate average traffic density across all roads
    const avgDensity = activeRoads.reduce((sum, road) => sum + road.trafficDensity, 0) / activeRoads.length;
    const avgSpeed = activeRoads.reduce((sum, road) => sum + road.currentSpeed, 0) / activeRoads.length;
    
    // Adjust for time of day
    const adjustedDensity = Math.min(1, avgDensity * trafficMultiplier);
    
    // Calculate metrics based on actual road data
    const baseTravelTime = 8; // Base travel time in minutes at 0 congestion
    const travelTime = Math.round(baseTravelTime + (adjustedDensity * 27)); // Up to 35 min at full congestion
    
    const congestionIndex = Math.round(adjustedDensity * 100);
    
    // AQI calculation
    const baseAQI = AQI_PATTERNS.monthly[month];
    const aqiMultiplier = AQI_PATTERNS.hourly[hour];
    const trafficAQIContribution = adjustedDensity * 30; // Traffic contributes to AQI
    const aqi = Math.round((baseAQI * aqiMultiplier) + trafficAQIContribution);
    
    // Vehicle count based on density
    const baseVehiclesPerHour = 12000;
    const vehiclesPerHour = Math.round(baseVehiclesPerHour * trafficMultiplier);
    
    // Environmental impact
    const idleTimeFactor = adjustedDensity * 0.4; // Percentage of time idling
    const fuelWasted = Math.round(vehiclesPerHour * idleTimeFactor * 0.08); // Liters
    const co2Emissions = Math.round(fuelWasted * 2.3); // kg CO2 per liter
    
    // Productivity loss (simplified calculation)
    const avgWagePerHour = 250; // INR
    const extraTimeWasted = (travelTime - baseTravelTime) / 60; // Hours
    const productivityLoss = Math.round((vehiclesPerHour * 1.5 * extraTimeWasted * avgWagePerHour) / 100000); // Lakhs
    
    // Accident risk based on congestion
    const accidentRisk = congestionIndex > 80 ? 'High' : congestionIndex > 50 ? 'Medium' : 'Low';
    
    return {
      hour,
      isWeekend,
      isPeakHour: trafficMultiplier > 0.85,
      trafficMultiplier,
      avgTravelTime: travelTime,
      congestionIndex,
      airQualityIndex: aqi,
      aqiCategory: aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : aqi < 150 ? 'Unhealthy for Sensitive' : aqi < 200 ? 'Unhealthy' : 'Very Unhealthy',
      vehiclesPerHour,
      avgSpeed: Math.round(avgSpeed),
      fuelWasted,
      co2Emissions,
      productivityLoss,
      accidentRisk,
      infrastructureActive: !showBefore && scenarios.length > 0,
      scenarioCount: scenarios.length,
      dataSource: 'calculated' // Indicator that we're using calculated data
    };
  }, [currentHour, scenarios, showBefore, useSumoData, simulationMetrics]);

  // Calculate improvement when infrastructure is active
  const improvement = useMemo(() => {
    if (showBefore || scenarios.length === 0) return null;
    
    // Calculate baseline metrics (without infrastructure)
    const baseRoads = ROAD_SEGMENTS;
    const baseAvgDensity = baseRoads.reduce((sum, road) => sum + road.trafficDensity, 0) / baseRoads.length;
    const baseTravelTime = Math.round(8 + (baseAvgDensity * metrics.trafficMultiplier * 27));
    
    const travelTimeReduction = Math.round(((baseTravelTime - metrics.avgTravelTime) / baseTravelTime) * 100);
    const congestionReduction = Math.round(((baseAvgDensity * 100 - metrics.congestionIndex) / (baseAvgDensity * 100)) * 100);
    
    return {
      travelTimeReduction: Math.max(0, travelTimeReduction),
      congestionReduction: Math.max(0, congestionReduction),
      fuelSaved: Math.round(metrics.fuelWasted * (travelTimeReduction / 100)),
      co2Reduced: Math.round(metrics.co2Emissions * (travelTimeReduction / 100))
    };
  }, [metrics, showBefore, scenarios]);

  // AI analysis based on current conditions
  const aiAnalysis = useMemo(() => {
    const necessityScore = Math.min(99, Math.round(50 + (metrics.congestionIndex * 0.5)));
    
    return {
      bridgeNecessityScore: necessityScore,
      recommendation: necessityScore > 85 ? 'Critical Priority' : necessityScore > 70 ? 'Highly Recommended' : necessityScore > 50 ? 'Recommended' : 'Low Priority',
      expectedImpact: {
        travelTimeReduction: Math.round(30 + (metrics.congestionIndex * 0.3)),
        congestionReduction: Math.round(25 + (metrics.congestionIndex * 0.2)),
        costBenefit: (2.5 + (necessityScore / 50)).toFixed(2),
        paybackPeriod: (6 - (necessityScore / 25)).toFixed(1)
      },
      reasoning: [
        `Current congestion: ${metrics.congestionIndex}% of capacity`,
        `Travel time: ${metrics.avgTravelTime} min (${metrics.isPeakHour ? 'peak' : 'off-peak'} hour)`,
        `${metrics.vehiclesPerHour.toLocaleString()} vehicles/hour on corridor`,
        `Productivity loss: ₹${metrics.productivityLoss} Lakhs/hour`
      ]
    };
  }, [metrics]);

  const getAQIColor = (aqi) => {
    if (aqi < 50) return 'text-green-400';
    if (aqi < 100) return 'text-yellow-400';
    if (aqi < 150) return 'text-orange-400';
    if (aqi < 200) return 'text-red-400';
    return 'text-purple-400';
  };

  const getCongestionColor = (index) => {
    if (index < 30) return 'text-green-400';
    if (index < 60) return 'text-yellow-400';
    if (index < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-4 right-4 w-80 glass rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Live Analytics</h3>
          {metrics.isPeakHour && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
              Peak Hour
            </span>
          )}
          {metrics.infrastructureActive && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
              +{metrics.scenarioCount} Infra
            </span>
          )}
          {metrics.dataSource === 'sumo' && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
              <Activity size={10} className="animate-pulse" />
              SUMO
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Time indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{metrics.isWeekend ? 'Weekend' : 'Weekday'} • {metrics.hour}:00</span>
            <span className="flex items-center gap-1">
              <Activity size={10} className="text-green-400 animate-pulse" />
              Live
            </span>
          </div>

          {/* Improvement banner when infrastructure is active */}
          {improvement && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-green-400 font-medium text-sm">Infrastructure Impact</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Travel Time</span>
                  <p className="text-green-400 font-bold">-{improvement.travelTimeReduction}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Congestion</span>
                  <p className="text-green-400 font-bold">-{improvement.congestionReduction}%</p>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Travel Time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{metrics.avgTravelTime}</span>
                <span className="text-slate-400 text-sm">min</span>
                {metrics.avgTravelTime > 20 ? (
                  <TrendingUp size={14} className="text-red-400" />
                ) : (
                  <TrendingDown size={14} className="text-green-400" />
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">Wakad → Hinjewadi</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gauge size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Congestion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${getCongestionColor(metrics.congestionIndex)}`}>
                  {metrics.congestionIndex}%
                </span>
                {metrics.congestionIndex > 70 && <TrendingUp size={14} className="text-red-400" />}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg: {metrics.avgSpeed} km/h</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Air Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${getAQIColor(metrics.airQualityIndex)}`}>
                  {metrics.airQualityIndex}
                </span>
                <span className="text-xs text-slate-500">AQI</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{metrics.aqiCategory}</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Vehicles/hr</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">
                  {(metrics.vehiclesPerHour / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Risk: <span className={metrics.accidentRisk === 'High' ? 'text-red-400' : metrics.accidentRisk === 'Medium' ? 'text-yellow-400' : 'text-green-400'}>
                  {metrics.accidentRisk}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={14} className="text-green-400" />
              <span className="text-slate-300 text-sm font-medium">Environmental Impact (per hour)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Fuel Wasted</span>
                <p className="text-orange-400 font-semibold">{metrics.fuelWasted.toLocaleString()} L</p>
              </div>
              <div>
                <span className="text-slate-400">CO₂ Emissions</span>
                <p className="text-red-400 font-semibold">{metrics.co2Emissions.toLocaleString()} kg</p>
              </div>
            </div>
          </div>

          {/* AI Recommendation Section */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAIRecommendation(!showAIRecommendation)}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <span className="text-white font-medium">AI: Infrastructure Analysis</span>
              </div>
              {showAIRecommendation ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-3 mt-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                aiAnalysis.bridgeNecessityScore > 85 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                aiAnalysis.bridgeNecessityScore > 70 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                aiAnalysis.bridgeNecessityScore > 50 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                <span className="text-xl font-bold text-white">{aiAnalysis.bridgeNecessityScore}</span>
              </div>
              <div>
                <p className={`font-semibold ${
                  aiAnalysis.bridgeNecessityScore > 85 ? 'text-red-400' : 
                  aiAnalysis.bridgeNecessityScore > 70 ? 'text-orange-400' :
                  aiAnalysis.bridgeNecessityScore > 50 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {aiAnalysis.recommendation}
                </p>
                <p className="text-slate-400 text-sm">Infrastructure Necessity</p>
              </div>
            </div>

            {showAIRecommendation && (
              <div className="mt-4 space-y-3">
                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Est. Travel Time</p>
                    <p className="text-green-400 font-semibold">-{aiAnalysis.expectedImpact.travelTimeReduction}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Est. Congestion</p>
                    <p className="text-green-400 font-semibold">-{aiAnalysis.expectedImpact.congestionReduction}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Cost-Benefit</p>
                    <p className="text-blue-400 font-semibold">{aiAnalysis.expectedImpact.costBenefit}x</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Payback Period</p>
                    <p className="text-blue-400 font-semibold">{aiAnalysis.expectedImpact.paybackPeriod} yrs</p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Current Analysis:</p>
                  {aiAnalysis.reasoning.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scenario Impact Summary */}
          {!metrics.infrastructureActive && (
            <div className="text-center pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Draw infrastructure to see projected impact
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
