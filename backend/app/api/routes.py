from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
from app.services.network_updater import get_network_updater

router = APIRouter()

# ============ Models ============

class Coordinates(BaseModel):
    latitude: float
    longitude: float

class ScenarioInput(BaseModel):
    name: str
    type: str  # 'bridge', 'flyover', 'tunnel', 'road'
    coordinates: List[List[float]]  # [[lng, lat], [lng, lat], ...]
    
class TrafficSimulationInput(BaseModel):
    hour: int  # 0-23
    scenario_id: Optional[str] = None

class ScenarioSimulationInput(BaseModel):
    userScenarios: Optional[List[dict]] = []
    activeInfrastructure: Optional[List[dict]] = []
    timestamp: Optional[str] = None

class BridgeAnalysisInput(BaseModel):
    start_coords: List[float]  # [lng, lat]
    end_coords: List[float]    # [lng, lat]
    bridge_type: str           # 'bridge', 'flyover', 'tunnel'

# ============ Traffic Data ============

@router.get("/traffic/current")
async def get_current_traffic():
    """Get current traffic data for all road segments"""
    return {
        "timestamp": "2026-04-07T11:00:00",
        "segments": [
            {
                "id": "road-1",
                "name": "Mumbai-Bangalore Highway (NH48)",
                "trafficDensity": 0.85,
                "currentSpeed": 25,
                "avgWaitTime": 12
            },
            {
                "id": "road-2", 
                "name": "Wakad-Hinjewadi Road",
                "trafficDensity": 0.92,
                "currentSpeed": 15,
                "avgWaitTime": 22
            },
            {
                "id": "road-3",
                "name": "Dange Chowk Road",
                "trafficDensity": 0.65,
                "currentSpeed": 30,
                "avgWaitTime": 8
            }
        ],
        "overallCongestionIndex": 78
    }

@router.post("/traffic/simulate")
async def simulate_traffic(input: TrafficSimulationInput):
    """Simulate traffic for a specific hour"""
    # Peak hour multipliers
    multiplier = 1.0
    if 8 <= input.hour <= 11:
        multiplier = 2.5
    elif 17 <= input.hour <= 21:
        multiplier = 2.8
    
    base_density = 0.35
    simulated_density = min(1.0, base_density * multiplier)
    
    return {
        "hour": input.hour,
        "isPeakHour": 8 <= input.hour <= 11 or 17 <= input.hour <= 21,
        "trafficMultiplier": multiplier,
        "estimatedDensity": simulated_density,
        "estimatedVehicles": int(3500 * multiplier),
        "avgTravelTime": int(10 * multiplier),
    }

# ============ Scenario Analysis ============

@router.post("/scenarios/simulate")
async def simulate_scenarios(input: ScenarioSimulationInput):
    """Run traffic simulation with user scenarios and proposed infrastructure"""
    
    # Calculate impact based on scenarios
    total_time_reduction = 0
    total_congestion_reduction = 0
    
    # Impact from proposed infrastructure
    infra_impact = {
        'flyover': {'time': 35, 'congestion': 25},
        'bridge': {'time': 20, 'congestion': 15},
        'tunnel': {'time': 45, 'congestion': 35},
        'road': {'time': 10, 'congestion': 8}
    }
    
    for infra in (input.activeInfrastructure or []):
        impact = infra_impact.get(infra.get('type', 'road'), infra_impact['road'])
        total_time_reduction += impact['time'] * random.uniform(0.8, 1.2)
        total_congestion_reduction += impact['congestion'] * random.uniform(0.8, 1.2)
    
    # Impact from user-drawn scenarios
    for scenario in (input.userScenarios or []):
        impact = infra_impact.get(scenario.get('type', 'road'), infra_impact['road'])
        total_time_reduction += impact['time'] * 0.5 * random.uniform(0.7, 1.1)
        total_congestion_reduction += impact['congestion'] * 0.5 * random.uniform(0.7, 1.1)
    
    # Cap reductions
    total_time_reduction = min(total_time_reduction, 65)
    total_congestion_reduction = min(total_congestion_reduction, 55)
    
    return {
        "success": True,
        "metrics": {
            "travelTimeReduction": round(total_time_reduction, 1),
            "congestionReduction": round(total_congestion_reduction, 1),
            "costBenefit": round(2.0 + random.random() * 2, 2)
        },
        "beforeMetrics": {
            "avgTravelTime": 22,
            "congestionIndex": 78,
            "dailyVehicles": 285000
        },
        "afterMetrics": {
            "avgTravelTime": round(22 * (1 - total_time_reduction/100), 1),
            "congestionIndex": round(78 * (1 - total_congestion_reduction/100)),
            "dailyVehicles": 285000
        },
        "message": "Simulation completed successfully"
    }

@router.post("/scenario/analyze")
async def analyze_scenario(scenario: ScenarioInput):
    """Analyze impact of a proposed infrastructure scenario"""
    # Mock analysis - in production, this would run SUMO or similar
    
    # Calculate mock impact based on scenario type
    impact_factors = {
        'flyover': {'time_reduction': 0.58, 'cost_per_km': 150},  # Crores per km
        'bridge': {'time_reduction': 0.35, 'cost_per_km': 80},
        'tunnel': {'time_reduction': 0.72, 'cost_per_km': 300},
        'road': {'time_reduction': 0.20, 'cost_per_km': 25}
    }
    
    factors = impact_factors.get(scenario.type, impact_factors['road'])
    
    # Calculate distance (simplified)
    coords = scenario.coordinates
    if len(coords) >= 2:
        # Simple distance calculation
        dist = sum(
            ((coords[i+1][0] - coords[i][0])**2 + (coords[i+1][1] - coords[i][1])**2)**0.5 
            for i in range(len(coords)-1)
        ) * 111  # Rough conversion to km
    else:
        dist = 1.0
    
    estimated_cost = dist * factors['cost_per_km']
    time_reduction = factors['time_reduction'] * 100
    
    return {
        "scenario_id": f"scenario_{random.randint(1000, 9999)}",
        "name": scenario.name,
        "type": scenario.type,
        "analysis": {
            "estimatedLength": round(dist, 2),
            "estimatedCost": round(estimated_cost, 2),  # Crores
            "travelTimeReduction": round(time_reduction, 1),  # Percentage
            "congestionReduction": round(time_reduction * 0.7, 1),
            "constructionTime": int(dist * 6),  # Months
            "vehiclesPerDayBenefit": int(285000 * factors['time_reduction'])
        },
        "beforeMetrics": {
            "avgTravelTime": 22,
            "congestionIndex": 78
        },
        "afterMetrics": {
            "avgTravelTime": round(22 * (1 - factors['time_reduction']), 1),
            "congestionIndex": round(78 * (1 - factors['time_reduction'] * 0.7))
        }
    }

# ============ AI/ML Endpoints ============

@router.post("/ai/bridge-necessity-score")
async def calculate_bridge_necessity(input: BridgeAnalysisInput):
    """
    Calculate AI-based Bridge Necessity Score
    This would integrate with your ML model trained by juniors
    """
    # Mock AI scoring - replace with actual ML model
    
    # Factors that would influence the score
    # - Current traffic density at the location
    # - Number of alternate routes
    # - Population density in the area
    # - Economic activity in connected zones
    # - Historical accident data
    
    base_score = 75
    
    # Simulate different scores based on bridge type
    type_bonus = {
        'flyover': 12,
        'bridge': 8,
        'tunnel': 5
    }.get(input.bridge_type, 0)
    
    # Add some randomness to simulate ML prediction
    variation = random.randint(-5, 10)
    
    final_score = min(100, max(0, base_score + type_bonus + variation))
    
    return {
        "score": final_score,
        "recommendation": "Highly Recommended" if final_score >= 80 else "Recommended" if final_score >= 60 else "Review Required",
        "confidence": round(0.85 + random.random() * 0.1, 2),
        "factors": {
            "trafficDensity": {"value": 0.92, "impact": "high", "contribution": 25},
            "alternateRoutes": {"value": 2, "impact": "medium", "contribution": 15},
            "economicActivity": {"value": "high", "impact": "high", "contribution": 20},
            "accidentHistory": {"value": 23, "impact": "medium", "contribution": 12},
            "populationDensity": {"value": 15000, "impact": "high", "contribution": 18}
        },
        "expectedImpact": {
            "travelTimeReduction": 58,
            "congestionReduction": 42,
            "costBenefitRatio": 2.67,
            "paybackPeriodYears": 4.2,
            "annualProductivitySavings": 120  # Crores
        },
        "reasoning": [
            "Current junction handles 285K vehicles/day - 40% over optimal capacity",
            "Average peak hour wait time of 22 minutes significantly impacts productivity",
            "Only 2 alternate routes available, both at 85%+ capacity",
            "High IT park employment (500K+ employees) in connected zone",
            "ROI positive within 5 years based on productivity gains"
        ]
    }

@router.post("/ai/diversion-impact")
async def predict_diversion_impact(scenario: ScenarioInput):
    """Predict impact of road diversions during construction"""
    
    return {
        "scenario": scenario.name,
        "constructionPhase": {
            "duration": "18 months",
            "phases": [
                {"name": "Phase 1", "duration": "6 months", "trafficImpact": "30%"},
                {"name": "Phase 2", "duration": "8 months", "trafficImpact": "50%"},
                {"name": "Phase 3", "duration": "4 months", "trafficImpact": "20%"}
            ]
        },
        "diversionRoutes": [
            {
                "route": "Via Baner Road",
                "additionalTime": 15,  # minutes
                "capacity": "adequate"
            },
            {
                "route": "Via Pimple Saudagar",
                "additionalTime": 20,
                "capacity": "limited"
            }
        ],
        "recommendations": {
            "bestConstructionWindow": "10 PM - 6 AM",
            "recommendedStartMonth": "October",
            "alternateRoutePreparation": "Widen Baner junction by 2 lanes before starting"
        }
    }

# ============ Government Data ============

@router.get("/govt/projects")
async def get_govt_projects():
    """Get ongoing government infrastructure projects"""
    return {
        "pwd": {
            "name": "Public Works Department",
            "projects": [
                {"id": "pwd-1", "name": "Road widening near Wakad", "status": "ongoing", "completion": 65},
                {"id": "pwd-2", "name": "Drainage repair Hinjewadi", "status": "planned", "completion": 0},
                {"id": "pwd-3", "name": "Footpath construction", "status": "completed", "completion": 100}
            ]
        },
        "traffic": {
            "name": "Traffic Police",
            "accidentHotspots": [
                {"location": [73.7625, 18.5987], "severity": "high", "incidents": 23},
                {"location": [73.7168, 18.5913], "severity": "medium", "incidents": 12}
            ],
            "signalTimings": [
                {"junction": "Wakad Chowk", "greenTime": 45, "redTime": 90},
                {"junction": "Hinjewadi Phase 1", "greenTime": 60, "redTime": 120}
            ]
        },
        "msrdc": {
            "name": "MSRDC",
            "projects": [
                {"id": "msrdc-1", "name": "NH48 Expansion", "status": "ongoing", "completion": 40}
            ]
        }
    }

@router.post("/infrastructure/add-to-sumo")
async def add_infrastructure_to_sumo(scenario: ScenarioInput):
    """
    Add user-drawn infrastructure to SUMO network
    This will regenerate the network and allow SUMO to route vehicles through it
    """
    try:
        updater = get_network_updater()
        
        infrastructure = {
            'type': scenario.type,
            'coordinates': scenario.coordinates,
            'name': scenario.name.replace(' ', '_'),
            'lanes': 2 if scenario.type in ['road', 'tunnel'] else 3
        }
        
        success = updater.add_infrastructure(infrastructure)
        
        if success:
            return {
                "success": True,
                "message": f"{scenario.type.capitalize()} added to SUMO network successfully",
                "infrastructure_id": infrastructure['name'],
                "next_steps": "Restart SUMO simulation to see vehicles using the new infrastructure"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to add infrastructure to SUMO network")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Analytics ============

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get city-wide analytics summary"""
    return {
        "currentMetrics": {
            "avgTravelTime": 22,
            "congestionIndex": 78,
            "accidentRate": 2.3,
            "airQualityIndex": 156,
            "dailyVehicles": 285000,
            "publicTransportShare": 18
        },
        "trends": {
            "travelTime": {"direction": "increasing", "change": 8},
            "congestion": {"direction": "increasing", "change": 12},
            "accidents": {"direction": "decreasing", "change": -5}
        },
        "peakHours": {
            "morning": {"start": 8, "end": 11, "severity": "high"},
            "evening": {"start": 17, "end": 21, "severity": "critical"}
        }
    }
