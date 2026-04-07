from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.services.sumo_simulator import get_simulator, TRACI_AVAILABLE
import asyncio
import json

app = FastAPI(
    title="CityLens API",
    description="Digital Twin Platform for Smart City - Backend API",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api")

# Global simulator instance
simulator = None

@app.get("/")
async def root():
    return {
        "message": "CityLens Digital Twin API",
        "status": "running",
        "docs": "/docs",
        "sumo_available": TRACI_AVAILABLE
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "sumo_available": TRACI_AVAILABLE,
        "simulation_running": simulator is not None and simulator.connected
    }

@app.websocket("/ws/simulation")
async def simulation_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time traffic simulation
    
    Client sends:
    - { "action": "start", "speed": 10, "use_gui": false }
    - { "action": "stop" }
    - { "action": "pause" }
    - { "action": "resume" }
    
    Server sends:
    - { "type": "vehicle_update", "time": 123.4, "vehicles": [...], "metrics": {...} }
    - { "type": "simulation_complete", ... }
    - { "type": "status", "message": "..." }
    """
    await websocket.accept()
    
    global simulator
    simulator = None
    running = False
    paused = False
    
    async def send_status(message: str, status: str = "info"):
        await websocket.send_json({
            "type": "status",
            "status": status,
            "message": message
        })
    
    async def send_vehicles(data: dict):
        """Callback for simulation stream"""
        if not paused:
            await websocket.send_json(data)
    
    try:
        while True:
            # Receive command with timeout (to allow simulation to run)
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.1
                )
                data = json.loads(message)
                action = data.get("action")
                
                if action == "start":
                    speed = data.get("speed", 10)
                    use_gui = data.get("use_gui", False)
                    use_mock = data.get("use_mock", not TRACI_AVAILABLE)
                    
                    # Stop existing simulation
                    if simulator and simulator.connected:
                        simulator.stop()
                    
                    # Create new simulator
                    simulator = get_simulator(use_mock=use_mock)
                    
                    if simulator.start(gui=use_gui, speed_factor=speed):
                        await send_status(f"Simulation started at {speed}x speed", "success")
                        running = True
                        paused = False
                        
                        # Start streaming in background
                        asyncio.create_task(
                            simulator.run_simulation_stream(
                                callback=send_vehicles,
                                duration=3600,
                                update_interval=0.3
                            )
                        )
                    else:
                        await send_status("Failed to start simulation", "error")
                        
                elif action == "stop":
                    if simulator:
                        simulator.stop()
                        simulator = None
                    running = False
                    await send_status("Simulation stopped", "success")
                    
                elif action == "pause":
                    paused = True
                    await send_status("Simulation paused", "info")
                    
                elif action == "resume":
                    paused = False
                    await send_status("Simulation resumed", "info")
                    
                elif action == "get_state":
                    if simulator and simulator.connected:
                        await websocket.send_json({
                            "type": "state",
                            "vehicles": simulator.get_vehicles_json(),
                            "metrics": simulator.get_metrics()
                        })
                    
            except asyncio.TimeoutError:
                # No message received, continue
                pass
                
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if simulator:
            simulator.stop()
            simulator = None


@app.post("/api/simulation/start")
async def start_simulation_http(speed: int = 10, use_mock: bool = True):
    """HTTP endpoint to start simulation (for testing)"""
    global simulator
    
    if simulator and simulator.connected:
        return {"status": "error", "message": "Simulation already running"}
    
    simulator = get_simulator(use_mock=use_mock)
    if simulator.start(speed_factor=speed):
        return {"status": "success", "message": f"Simulation started at {speed}x"}
    return {"status": "error", "message": "Failed to start simulation"}


@app.post("/api/simulation/stop")
async def stop_simulation_http():
    """HTTP endpoint to stop simulation"""
    global simulator
    
    if simulator:
        simulator.stop()
        simulator = None
        return {"status": "success", "message": "Simulation stopped"}
    return {"status": "info", "message": "No simulation running"}


@app.get("/api/simulation/state")
async def get_simulation_state():
    """HTTP endpoint to get current simulation state"""
    global simulator
    
    if not simulator or not simulator.connected:
        return {"status": "not_running", "vehicles": [], "metrics": {}}
    
    return {
        "status": "running",
        "vehicles": simulator.get_vehicles_json(),
        "metrics": simulator.get_metrics()
    }
