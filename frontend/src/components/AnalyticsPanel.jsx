import { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Car, 
  Wind,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CITY_METRICS, PROPOSED_INFRASTRUCTURE } from '../data/puneData';

const AnalyticsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);

  // Mock AI analysis
  const aiAnalysis = {
    bridgeNecessityScore: 87,
    recommendation: 'Highly Recommended',
    expectedImpact: {
      travelTimeReduction: 58,
      congestionReduction: 42,
      costBenefit: 2.67, // Ratio
      paybackPeriod: 4.2 // Years
    },
    reasoning: [
      'Current junction handles 285K vehicles/day - 40% over capacity',
      'Average wait time of 22 minutes during peak hours',
      'Alternate routes already at 85%+ capacity',
      'ROI positive within 5 years based on productivity gains'
    ]
  };

  return (
    <div className="absolute bottom-4 right-4 w-80 glass rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-white font-semibold">Analytics & AI Insights</h3>
        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Avg Travel Time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{CITY_METRICS.avgTravelTime}</span>
                <span className="text-slate-400 text-sm">min</span>
                <TrendingUp size={14} className="text-red-400" />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Car size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Congestion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-orange-400">{CITY_METRICS.congestionIndex}%</span>
                <TrendingUp size={14} className="text-red-400" />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Accidents/1K</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{CITY_METRICS.accidentRate}</span>
                <TrendingDown size={14} className="text-green-400" />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs">Air Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-red-400">{CITY_METRICS.airQualityIndex}</span>
                <span className="text-xs text-slate-500">AQI</span>
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
                <span className="text-white font-medium">AI Analysis: Wakad Flyover</span>
              </div>
              {showAIRecommendation ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-3 mt-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{aiAnalysis.bridgeNecessityScore}</span>
              </div>
              <div>
                <p className="text-green-400 font-semibold">{aiAnalysis.recommendation}</p>
                <p className="text-slate-400 text-sm">Bridge Necessity Score</p>
              </div>
            </div>

            {showAIRecommendation && (
              <div className="mt-4 space-y-3">
                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Travel Time</p>
                    <p className="text-green-400 font-semibold">-{aiAnalysis.expectedImpact.travelTimeReduction}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Congestion</p>
                    <p className="text-green-400 font-semibold">-{aiAnalysis.expectedImpact.congestionReduction}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Cost-Benefit Ratio</p>
                    <p className="text-blue-400 font-semibold">{aiAnalysis.expectedImpact.costBenefit}x</p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-slate-400">Payback Period</p>
                    <p className="text-blue-400 font-semibold">{aiAnalysis.expectedImpact.paybackPeriod} yrs</p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">AI Reasoning:</p>
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
          <div className="text-center pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              With proposed flyover: <span className="text-green-400 font-semibold">22 min → 9 min</span> avg travel time
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
