# CityLens Digital Twin - Quick Start Guide

## 🚀 Starting the Application

### 1. Frontend (React + Vite + Mapbox + Deck.gl)
```bash
cd frontend
npm run dev
```
**URL**: http://localhost:5174

### 2. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
**URL**: http://localhost:8000
**API Docs**: http://localhost:8000/docs

---

## 🎯 Key Features (Ready to Demo)

| Feature | Status | Location |
|---------|--------|----------|
| **3D City Map** | ✅ | `components/CityMap.jsx` |
| **Traffic Visualization** | ✅ | Color-coded roads by congestion |
| **Traffic Simulation** | ✅ | Animated vehicles on roads |
| **Scenario Builder** | ✅ | Draw bridges/flyovers/tunnels |
| **Before/After Compare** | ✅ | `components/CompareView.jsx` |
| **AI Bridge Score** | ✅ | `/api/ai/bridge-necessity-score` |
| **Analytics Dashboard** | ✅ | KPI cards, trends |
| **Govt Services Layer** | ✅ | PWD, Traffic, MSRDC data |

---

## 📊 Demo Scenario: "Should Pune Build a Flyover at Wakad Junction?"

### Step 1: Show Current Situation
- **Sidebar** → Toggle "Traffic Flow" layer
- Show **Wakad Junction (Hinjewadi junction)** with RED congestion
- **Metrics**: 22 min average travel time, 78% congestion index

### Step 2: Draw Proposed Flyover
- **Scenario Panel** → Click "Flyover"
- Click on map at Wakad junction, then at Hinjewadi
- Click "Finish"
- Proposed flyover appears on map (PURPLE line)

### Step 3: See AI Recommendation
- **Analytics Panel** (bottom right)
- AI gives **Score: 87/100** - "Highly Recommended"
- Show impact: -59% travel time, -42% congestion

### Step 4: Compare Before vs After
- **Top bar** → Click "Compare"
- Split-screen shows:
  - **LEFT**: Current state (RED roads, high congestion)
  - **RIGHT**: With flyover (GREEN roads, low congestion)
  - **STATS**: Travel time 22 → 9 min, Congestion 78 → 45%

### Step 5: Cost-Benefit Analysis
- Show at bottom of compare view:
  - Cost: ₹450 Cr
  - Annual savings: ₹120 Cr
  - Payback period: 3.75 years

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CityMap.jsx          # Main 3D map with Mapbox+Deck.gl
│   │   ├── Sidebar.jsx          # Layer controls, stats, govt data
│   │   ├── TopBar.jsx           # Navigation
│   │   ├── ScenarioPanel.jsx    # Draw scenarios
│   │   ├── AnalyticsPanel.jsx   # AI insights & KPIs
│   │   ├── CompareView.jsx      # Before/After comparison
│   │   └── DrawingToolbar.jsx   # Drawing controls
│   ├── data/
│   │   └── puneData.js          # Wakad-Hinjewadi roads, junctions, etc.
│   ├── store/
│   │   └── useStore.js          # Zustand state management
│   └── App.jsx                  # Main app
├── .env                         # Add Mapbox token here
└── vite.config.js

backend/
├── app/
│   ├── main.py                  # FastAPI app
│   ├── api/
│   │   └── routes.py            # All API endpoints
│   └── __init__.py
└── requirements.txt
```

---

## 🎛️ UI Components

### Sidebar (Left)
- **Overview**: Quick stats, traffic simulation controls
- **Layers**: Toggle traffic/infrastructure/govt layers
- **Analytics**: Road-by-road congestion data
- **Govt Services**: PWD projects, traffic hotspots, etc.

### Top Bar
- **3D/2D Toggle**: Switch view modes
- **Compare Button**: Activate before/after mode
- **City Info**: Shows "Pune | Wakad-Hinjewadi"

### Scenario Panel (Top Right)
- **Add Infrastructure**: Draw bridges, flyovers, tunnels, roads
- **Your Scenarios**: List of drawn scenarios
- **Proposed Infrastructure**: Government plans
- **Run Simulation**: (Will integrate with backend)

### Analytics Panel (Bottom Right)
- **KPI Cards**: Travel time, congestion, accidents, air quality
- **AI Analysis**: Bridge necessity score with reasoning
- **Impact Metrics**: Expected improvements

---

## 🔌 API Endpoints

### Traffic
- `GET /api/traffic/current` - Current traffic data
- `POST /api/traffic/simulate` - Simulate traffic for a given hour

### Scenarios
- `POST /api/scenario/analyze` - Analyze impact of proposed infrastructure

### AI
- `POST /api/ai/bridge-necessity-score` - Get AI score for bridge
- `POST /api/ai/diversion-impact` - Predict diversion impact

### Government
- `GET /api/govt/projects` - List all govt projects

### Analytics
- `GET /api/analytics/summary` - City-wide metrics

---

## 🎨 Color Coding

| Feature | Color | Meaning |
|---------|-------|---------|
| Low Congestion | 🟢 Green | 0-30% capacity |
| Medium Congestion | 🟡 Yellow | 30-60% capacity |
| High Congestion | 🟠 Orange | 60-80% capacity |
| Critical Congestion | 🔴 Red | 80%+ capacity |
| Flyover | 🟣 Purple | Proposed infrastructure |
| Bridge | 🔵 Cyan | Proposed bridge |
| Tunnel | 🟠 Orange | Proposed tunnel |
| Vehicles | 🟡 Yellow | Animated traffic |

---

## 🚨 Common Issues & Fixes

### Issue: Map not loading
- **Check**: Mapbox token in `.env`
- **Fix**: Get free token at https://account.mapbox.com

### Issue: Frontend won't start
- **Check**: Port 5174 is free (or it will use next available)
- **Fix**: Kill existing processes or use `npm run dev -- --port 3000`

### Issue: Backend errors
- **Check**: Python 3.8+ installed
- **Fix**: `pip install -r requirements.txt` again

---

## 📝 For ML Team (Juniors)

### Bridge Necessity Score Model
**Mock endpoint currently at**: `/api/ai/bridge-necessity-score`

**Expected Input**:
```json
{
  "start_coords": [73.7625, 18.5987],
  "end_coords": [73.7245, 18.5913],
  "bridge_type": "flyover"
}
```

**Expected Output**:
```json
{
  "score": 87,
  "recommendation": "Highly Recommended",
  "confidence": 0.91,
  "factors": { ... },
  "expectedImpact": {
    "travelTimeReduction": 58,
    "congestionReduction": 42,
    ...
  }
}
```

**How to integrate your model**:
1. Train your model on traffic/congestion data
2. Create a Python function that takes those inputs
3. Replace the mock logic in `backend/app/api/routes.py` (line ~160)
4. Deploy!

---

## ⏱️ 24-Hour Hackathon Timeline

| Time | Tasks |
|------|-------|
| **0-2h** | ✅ DONE - Setup + Frontend + Backend skeleton |
| **2-6h** | ✅ DONE - 3D map + traffic visualization |
| **6-10h** | ✅ DONE - Scenario builder UI + drawing |
| **10-14h** | ✅ DONE - Before/After compare view |
| **14-18h** | ⏳ IN PROGRESS - ML integration + final polish |
| **18-22h** | ⏳ TO DO - Bug fixes + demo prep |
| **22-24h** | ⏳ TO DO - Presentation + rehearsal |

---

## 🎤 Presentation Tips

1. **Start with the problem**: Show current traffic chaos
2. **Show the solution visually**: Draw flyover on map
3. **Wow with the AI**: Show 87/100 score with reasoning
4. **Close with impact**: 22 → 9 min travel time, ₹120 Cr annual savings
5. **End strong**: "This is what smart city planning looks like"

---

## 📞 Quick Reference

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 3: Optional - Check frontend builds
cd frontend && npm run build
```

**Remember**: You have a fully functional demo ready NOW. Just rehearse, polish, and wow the judges! 🚀
