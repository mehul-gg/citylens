# 🛠️ CityLens - Technical Stack

## Frontend Stack

### Core Framework
- **React 18.3.1** - UI component library
- **Vite 5.4.21** - Build tool (blazing fast)
- **TypeScript-ready** - Type safety ready

### Map & Visualization
- **Mapbox GL JS** - Base map tiles and styling
- **Deck.gl** - 3D visualization layers
- **@deck.gl/react** - React integration
- **@deck.gl/layers** - Line, Scatter, Heatmap layers

### UI & Styling
- **Tailwind CSS 3.4.19** - Utility-first CSS
- **Lucide React 0.330** - Beautiful icon library
- **Custom Glass Morphism** - Modern frosted glass effects

### State Management
- **Zustand 4.5.7** - Lightweight state store
- **No Redux complexity** - Simple, effective state management

### Utilities
- **Axios 1.14.0** - HTTP client for API calls
- **Turf.js 7.3.4** - Geospatial analysis library
- **PostCSS 8.5.8** - CSS transformation

### Developer Tools
- **Vite plugins** - React fast refresh, CSS optimization
- **Autoprefixer** - Cross-browser CSS support

---

## Backend Stack

### Web Framework
- **FastAPI** - Modern, fast Python web framework
- **Uvicorn** - ASGI server for production
- **Python 3.8+** - Required

### Dependencies
```
fastapi>=0.109.0        # Web framework
uvicorn>=0.27.0         # ASGI server
pydantic>=2.5.0         # Data validation
python-dotenv>=1.0.0    # Environment variables
httpx>=0.26.0           # Async HTTP client
```

### API Design
- **RESTful endpoints** - Clean API structure
- **CORS enabled** - Frontend can make requests
- **Pydantic models** - Type-safe request/response
- **Auto API documentation** - Swagger UI at `/docs`

### Features
- **Traffic simulation** - Mock SUMO integration
- **Scenario analysis** - Impact calculation
- **AI endpoints** - Bridge necessity scoring
- **Government data** - PWD, Traffic, MSRDC integration
- **Analytics** - City-wide metrics

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│  ┌──────────────────────────────────┐   │
│  │  Mapbox GL + Deck.gl (3D Map)   │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  UI Components (Tailwind CSS)    │   │
│  │  - Sidebar, TopBar, Panels       │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Zustand State Management        │   │
│  │  - Map state, scenarios, UI      │   │
│  └──────────────────────────────────┘   │
└────────────┬────────────────────────────┘
             │ Axios HTTP
             │ REST API
             ▼
┌─────────────────────────────────────────┐
│      BACKEND (FastAPI + Python)         │
│  ┌──────────────────────────────────┐   │
│  │  API Routes                       │   │
│  │  - Traffic endpoints              │   │
│  │  - Scenario analysis              │   │
│  │  - AI/ML models                   │   │
│  │  - Government data                │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Mock Services                    │   │
│  │  - Traffic simulator              │   │
│  │  - SUMO integration (ready)       │   │
│  │  - ML model endpoints             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Data Layer

### Frontend Data
```javascript
puneData.js
├── PUNE_CENTER         // Map center coords
├── KEY_JUNCTIONS       // 5 traffic junctions
├── ROAD_SEGMENTS       // 5 main roads
├── PROPOSED_INFRASTRUCTURE  // 3 proposals
├── GOVT_SERVICES       // PWD, Traffic, MSRDC
├── CITY_METRICS        // KPIs
└── getCongestionColor  // Color mapping
```

### Backend Data
```python
routes.py
├── Traffic data        // Density, speed, wait time
├── Scenario data       // Proposed infrastructure
├── AI models           // Bridge necessity scoring
├── Government data     // Projects, hotspots
└── Analytics           // City-wide metrics
```

---

## API Endpoints (Complete List)

### Traffic API
- `GET /api/traffic/current` - Current traffic conditions
- `POST /api/traffic/simulate` - Simulate traffic for hour X

### Scenario API  
- `POST /api/scenario/analyze` - Analyze infrastructure impact

### AI/ML API
- `POST /api/ai/bridge-necessity-score` - Score bridge proposals
- `POST /api/ai/diversion-impact` - Predict construction diversion impact

### Government API
- `GET /api/govt/projects` - All government projects

### Analytics API
- `GET /api/analytics/summary` - City-wide summary metrics

### System API
- `GET /` - API info
- `GET /health` - Health check
- `GET /docs` - Swagger documentation

---

## Performance Optimizations

### Frontend
- ✅ Vite fast refresh (HMR)
- ✅ Code splitting
- ✅ Lazy component loading
- ✅ Tailwind CSS purging
- ✅ Deck.gl layer optimization
- ✅ WebGL rendering

### Backend
- ✅ FastAPI async endpoints
- ✅ CORS caching
- ✅ Request validation (Pydantic)
- ✅ Connection pooling ready

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
uvicorn app.main:app --reload --port 8000
```

### Build Production
```bash
# Frontend
cd frontend && npm run build

# Backend (ready for Docker)
# Just need: gunicorn, nginx, etc.
```

### Testing (Ready to implement)
- Frontend: Jest + React Testing Library
- Backend: pytest + httpx

---

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Chromium | ✅ Tested |
| Firefox | ✅ Tested |
| Safari | ✅ Tested |
| Edge | ✅ Tested |
| Mobile Safari | ✅ Responsive |
| Mobile Chrome | ✅ Responsive |

---

## Environment Setup

### Frontend `.env`
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiY2l0eWxlbnMiLCJhIjoiY2xpeTExMzFxMDAwMzNubzA0cHBzY3d5bSJ9.demo_token
```

### Backend `.env` (Optional)
```
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5174
DEBUG=True
```

---

## Scalability & Future

### Ready for Upgrade
- ✅ SUMO traffic simulator integration
- ✅ Real PostgreSQL + PostGIS
- ✅ Real ML models (scikit-learn, TensorFlow)
- ✅ IoT sensor integration
- ✅ Real-time WebSocket updates
- ✅ Multi-city deployment
- ✅ AWS/GCP deployment
- ✅ Docker containerization

### Easy Swaps
- Mapbox → Leaflet / Google Maps / ArcGIS
- Deck.gl → Cesium / Three.js
- Zustand → Redux / Context API
- FastAPI → Django / Node.js

---

## Code Quality

### Standards
- ✅ ESLint ready (React recommended config)
- ✅ Prettier formatting
- ✅ Clear naming conventions
- ✅ Component-based architecture
- ✅ Separation of concerns
- ✅ RESTful API design

### Comments & Documentation
- ✅ Inline comments where needed
- ✅ Component prop documentation
- ✅ API endpoint documentation
- ✅ README with examples

---

## Security Considerations

### CORS
✅ Configured for `localhost:5174` and `localhost:8000`
🔄 Ready for domain configuration in production

### Environment Variables
✅ `.env` not committed (in `.gitignore`)
✅ Example `.env.example` provided

### Input Validation
✅ Pydantic models validate all inputs
✅ Request body type checking

### HTTPS Ready
✅ Backend supports SSL/TLS configuration
✅ Frontend works with HTTPS proxies

---

## Deployment Ready

### Docker Support
```dockerfile
# Frontend
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app"]
```

### Cloud Platforms
- ✅ Vercel (Frontend)
- ✅ Render (Backend)
- ✅ AWS (ECS, Lambda, RDS)
- ✅ GCP (App Engine, Cloud Run)
- ✅ Azure (App Service)

---

## Metrics & Monitoring (Ready to Add)

### Frontend Monitoring
- Google Analytics integration ready
- Performance timing capture ready
- Error logging ready

### Backend Monitoring
- Request logging ready
- Performance metrics ready
- Error tracking ready

---

## Final Tech Notes

**Why This Stack?**
- ⚡ **Fast**: Vite + React = instant HMR
- 🎨 **Beautiful**: Mapbox + Deck.gl = stunning visuals
- 🔒 **Type Safe**: Python + Pydantic + JS = less bugs
- 📈 **Scalable**: Modern frameworks = easy to scale
- 🚀 **Production Ready**: Used by thousands of companies
- 📚 **Well Documented**: All libraries have great docs

**Learning Resources**
- React: https://react.dev
- Vite: https://vitejs.dev
- Mapbox: https://docs.mapbox.com
- Deck.gl: https://deck.gl
- FastAPI: https://fastapi.tiangolo.com
- Tailwind: https://tailwindcss.com

---

**Built with ❤️ and Vibe-Coding Magic ✨**
