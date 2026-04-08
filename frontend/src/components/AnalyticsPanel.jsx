import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Gauge,
  Leaf,
  Activity,
  BarChart3
} from 'lucide-react';
import { ROAD_SEGMENTS, HOURLY_TRAFFIC_PATTERNS } from '../data/puneData';
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

  // AI analysis based on current conditions - updates with infrastructure
  const aiAnalysis = useMemo(() => {
    // Base necessity score from congestion
    const baseCongestion = ROAD_SEGMENTS.reduce((sum, road) => sum + road.trafficDensity, 0) / ROAD_SEGMENTS.length * 100;
    const baseNecessityScore = Math.min(99, Math.round(50 + (baseCongestion * 0.5)));
    
    // If infrastructure is active, show improved score
    if (!showBefore && scenarios.length > 0) {
      // Calculate improvement
      const improvementFactor = improvement ? (improvement.congestionReduction / 100) : 0;
      
      // Network Health Score (higher = better, opposite of necessity)
      const healthScore = Math.min(99, Math.round(40 + (100 - metrics.congestionIndex) * 0.5 + (improvementFactor * 30)));
      
      return {
        bridgeNecessityScore: healthScore,
        isHealthScore: true, // Flag to indicate this is now a health score
        recommendation: healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Moderate' : 'Needs Work',
        expectedImpact: {
          travelTimeReduction: improvement?.travelTimeReduction || 0,
          congestionReduction: improvement?.congestionReduction || 0,
          fuelSaved: improvement?.fuelSaved || 0,
          co2Reduced: improvement?.co2Reduced || 0
        },
        reasoning: [
          `Infrastructure added: ${scenarios.length} project(s)`,
          `Congestion reduced by ${improvement?.congestionReduction || 0}%`,
          `Travel time improved by ${improvement?.travelTimeReduction || 0}%`,
          `CO₂ emissions reduced: ${improvement?.co2Reduced || 0} kg/hr`
        ]
      };
    }
    
    // No infrastructure - show necessity score
    return {
      bridgeNecessityScore: baseNecessityScore,
      isHealthScore: false,
      recommendation: baseNecessityScore > 85 ? 'Critical Priority' : baseNecessityScore > 70 ? 'Highly Recommended' : baseNecessityScore > 50 ? 'Recommended' : 'Low Priority',
      expectedImpact: {
        travelTimeReduction: Math.round(30 + (metrics.congestionIndex * 0.3)),
        congestionReduction: Math.round(25 + (metrics.congestionIndex * 0.2)),
        costBenefit: (2.5 + (baseNecessityScore / 50)).toFixed(2),
        paybackPeriod: (6 - (baseNecessityScore / 25)).toFixed(1)
      },
      reasoning: [
        `Current congestion: ${metrics.congestionIndex}% of capacity`,
        `Travel time: ${metrics.avgTravelTime} min (${metrics.isPeakHour ? 'peak' : 'off-peak'} hour)`,
        `Productivity loss: ₹${metrics.productivityLoss} Lakhs/hour`,
        `Add infrastructure to improve network`
      ]
    };
  }, [metrics, scenarios, showBefore, improvement]);

  const getCongestionColor = (index) => {
    if (index < 30) return 'text-green-400';
    if (index < 60) return 'text-yellow-400';
    if (index < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-6 right-6 w-85 glass rounded-[32px] overflow-hidden z-20 transition-all duration-500">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center shadow-inner">
            <BarChart3 size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white text-base font-black tracking-tight leading-none mb-1.5">Network Analytics</h3>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${metrics.dataSource === 'sumo' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${metrics.dataSource === 'sumo' ? 'text-blue-500' : 'text-green-500'}`}>
                {metrics.dataSource === 'sumo' ? 'SUMO Engine' : 'Live Calculations'}
              </span>
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
          {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* Improvement banner when infrastructure is active */}
          {improvement && (
            <div className="bg-gradient-to-br from-green-600/30 via-emerald-600/20 to-teal-600/10 border border-green-500/30 rounded-[24px] p-5 animate-in fade-in zoom-in duration-700 shadow-2xl shadow-green-900/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/20">
                  <Sparkles size={16} className="text-green-400" />
                </div>
                <span className="text-green-400 font-black text-[11px] uppercase tracking-[0.2em]">Efficiency Gains</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                  <span className="text-slate-500 text-[9px] font-black uppercase block mb-1.5 tracking-widest">Travel Time</span>
                  <div className="flex items-baseline gap-1">
                    <p className="text-green-400 text-2xl font-black leading-none tracking-tighter">-{improvement.travelTimeReduction}</p>
                    <span className="text-green-400/60 text-[10px] font-bold">%</span>
                  </div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                  <span className="text-slate-500 text-[9px] font-black uppercase block mb-1.5 tracking-widest">Congestion</span>
                  <div className="flex items-baseline gap-1">
                    <p className="text-green-400 text-2xl font-black leading-none tracking-tighter">-{improvement.congestionReduction}</p>
                    <span className="text-green-400/60 text-[10px] font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Travel Time', value: metrics.avgTravelTime, unit: 'min', icon: Clock, color: 'text-white', sub: metrics.avgTravelTime > 20 ? <TrendingUp size={12} className="text-red-500" /> : <TrendingDown size={12} className="text-green-500" /> },
              { label: 'Congestion', value: `${metrics.congestionIndex}%`, unit: '', icon: Gauge, color: getCongestionColor(metrics.congestionIndex) },
            ].map((kpi, i) => (
              <div key={i} className="glass-card p-5 group hover-glow border border-white/5 transition-all duration-500">
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                  {kpi.sub}
                </div>
                <p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest leading-none">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</p>
                  {kpi.unit && <span className="text-[10px] text-slate-500 font-bold uppercase">{kpi.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Eco Analysis - Sleek Progress Style */}
          <div className="bg-white/5 border border-white/5 rounded-[24px] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Leaf size={16} className="text-green-500" />
                </div>
                <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Eco Footprint</span>
              </div>
              <Activity size={14} className="text-slate-600" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Fuel Waste/hr</span>
                  <span className="text-orange-400 font-mono">{metrics.fuelWasted.toLocaleString()} L</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-orange-500/50 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">CO₂ Output</span>
                  <span className="text-red-500 font-mono">{metrics.co2Emissions.toLocaleString()} KG</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-red-500/50 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategy - Premium Glass Style */}
          <div className={`bg-gradient-to-br ${aiAnalysis.isHealthScore ? 'from-green-600/20 via-emerald-600/10' : 'from-indigo-600/20 via-purple-600/10'} to-transparent rounded-[28px] p-6 border border-white/10 relative overflow-hidden group shadow-2xl`}>
            <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000 rotate-12 group-hover:rotate-45">
              <Sparkles size={100} className="text-white" />
            </div>
            
            <div 
              className="flex items-center justify-between cursor-pointer relative z-10"
              onClick={() => setShowAIRecommendation(!showAIRecommendation)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl ${aiAnalysis.isHealthScore ? 'bg-green-500/20 border-green-500/20' : 'bg-indigo-500/20 border-indigo-500/20'} flex items-center justify-center border shadow-lg`}>
                  <Sparkles size={18} className={aiAnalysis.isHealthScore ? 'text-green-400' : 'text-indigo-400'} />
                </div>
                <div>
                  <span className="text-white text-xs font-black uppercase tracking-[0.2em]">
                    {aiAnalysis.isHealthScore ? 'Network Health' : 'CityAI™ Advisor'}
                  </span>
                  <p className={`${aiAnalysis.isHealthScore ? 'text-green-400/60' : 'text-indigo-400/60'} text-[9px] font-bold uppercase tracking-widest mt-0.5`}>
                    {aiAnalysis.isHealthScore ? 'Infrastructure Impact' : 'Strategy Optimization'}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                {showAIRecommendation ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            <div className="flex items-center gap-5 mt-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-xl border-t border-white/20 ${
                aiAnalysis.isHealthScore 
                  ? (aiAnalysis.bridgeNecessityScore > 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : aiAnalysis.bridgeNecessityScore > 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-orange-500 to-red-500')
                  : (aiAnalysis.bridgeNecessityScore > 85 ? 'bg-gradient-to-br from-red-500 to-red-600' : aiAnalysis.bridgeNecessityScore > 70 ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600')
              }`}>
                <span className="text-2xl font-black text-white leading-none tracking-tighter">{aiAnalysis.bridgeNecessityScore}</span>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-black uppercase leading-none mb-1.5 tracking-tight ${
                  aiAnalysis.isHealthScore
                    ? (aiAnalysis.bridgeNecessityScore > 70 ? 'text-green-400' : aiAnalysis.bridgeNecessityScore > 50 ? 'text-yellow-400' : 'text-orange-400')
                    : (aiAnalysis.bridgeNecessityScore > 85 ? 'text-red-400' : aiAnalysis.bridgeNecessityScore > 70 ? 'text-orange-400' : 'text-indigo-400')
                }`}>
                  {aiAnalysis.recommendation}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      aiAnalysis.isHealthScore 
                        ? 'bg-green-500' 
                        : (aiAnalysis.bridgeNecessityScore > 70 ? 'bg-red-500' : 'bg-indigo-500')
                    }`} style={{ width: `${aiAnalysis.bridgeNecessityScore}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                    {aiAnalysis.isHealthScore ? 'Health' : 'Priority'}
                  </span>
                </div>
              </div>
            </div>

            {showAIRecommendation && (
              <div className="mt-8 space-y-5 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-2 gap-3">
                  {aiAnalysis.isHealthScore ? (
                    // Show actual improvements when infrastructure is built
                    <>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Travel Time</p>
                        <p className="text-green-400 text-sm font-black tracking-tight">-{aiAnalysis.expectedImpact.travelTimeReduction}%</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Congestion</p>
                        <p className="text-green-400 text-sm font-black tracking-tight">-{aiAnalysis.expectedImpact.congestionReduction}%</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">Fuel Saved</p>
                        <p className="text-blue-400 text-sm font-black tracking-tight">{aiAnalysis.expectedImpact.fuelSaved} L/hr</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">CO₂ Reduced</p>
                        <p className="text-blue-400 text-sm font-black tracking-tight">{aiAnalysis.expectedImpact.co2Reduced} kg</p>
                      </div>
                    </>
                  ) : (
                    // Show expected impact when no infrastructure
                    [
                      { label: 'Travel Impact', value: `-${aiAnalysis.expectedImpact.travelTimeReduction}%`, color: 'text-green-400' },
                      { label: 'Flow Gain', value: `+${aiAnalysis.expectedImpact.congestionReduction}%`, color: 'text-green-400' },
                      { label: 'ROI Scale', value: `${aiAnalysis.expectedImpact.costBenefit}x`, color: 'text-blue-400' },
                      { label: 'Payback', value: `${aiAnalysis.expectedImpact.paybackPeriod}yr`, color: 'text-blue-400' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 leading-none">{item.label}</p>
                        <p className={`${item.color} text-sm font-black tracking-tight`}>{item.value}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {aiAnalysis.reasoning.map((reason, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <CheckCircle2 size={12} className={`${aiAnalysis.isHealthScore ? 'text-green-400' : 'text-indigo-400'} mt-0.5 flex-shrink-0`} />
                      <span className="text-slate-300 text-[10px] leading-relaxed font-bold uppercase tracking-tight opacity-80">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
