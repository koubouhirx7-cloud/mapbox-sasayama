import { useState, useMemo, useEffect, useRef } from 'react'
import Map from './components/Map'
import NavigationBanner from './components/NavigationPopup' // Still using the same file but renamed component inside
import { explorationRoutes } from './data/explorationRoutes'
import { useNavigation } from './hooks/useNavigation'
import { useSimulation } from './hooks/useSimulation'

type RouteType = 'sasayama-main' | string;

// Helper to calculate distance in meters (Haversine formula approximation for small distances)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371e3; // meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function App() {
    const [activeRoute, setActiveRoute] = useState<RouteType>('sasayama-main')
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Navigation State
    const [routeSteps, setRouteSteps] = useState<any[]>([]);
    const [routeGeometry, setRouteGeometry] = useState<any>(null); // New: Store geometry for simulation

    // ... (rest of hooks)

    const {
        isPlaying: isSimulating,
        toggleSimulation,
        simulatedLocation,
        setSpeed,
        speed: simSpeed
    } = useSimulation(routeGeometry);

    const {
        currentStep,
        distanceToNext,
        currentSpeed,
        updateLocation,
        startNavigation
    } = useNavigation(routeSteps);

    // ... (rest of useEffects)

    // Feed simulated location to navigation logic
    useEffect(() => {
        if (isSimulating && simulatedLocation) {
            updateLocation(simulatedLocation.lat, simulatedLocation.lng);
        }
    }, [isSimulating, simulatedLocation]);

    // ... (sortedRoutes memo)

    return (
        <div className="flex w-screen h-screen bg-satoyama-mist font-sans relative overflow-hidden">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #879166; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2D5A27; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes slide-down {
                    0% { transform: translate(-50%, -100%); opacity: 0; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slide-down 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                `}
            </style>

            {/* Mobile Menu Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute top-4 left-4 z-[60] p-2 bg-satoyama-forest text-white rounded-md shadow-lg md:hidden border border-white/20"
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="absolute inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar */}
            <aside className={`
                absolute md:relative z-50 h-full w-64 
                bg-satoyama-forest text-satoyama-mist flex-shrink-0 flex flex-col shadow-2xl 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-white/10 mt-12 md:mt-0 bg-[#2D5A27]">
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white font-outfit">
                        Green-Gear
                    </h1>
                    <p className="text-sm text-white/90 mt-1 font-medium tracking-widest uppercase border-l-2 border-white pl-2 ml-1">
                        satoyama-ride
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <h2 className="text-xs uppercase tracking-widest text-satoyama-leaf font-bold mb-4 px-2">エリア選択</h2>
                    <div className="space-y-3">
                        {explorationRoutes.map((route) => (
                            <button
                                key={route.id}
                                onClick={() => {
                                    setActiveRoute(route.id);
                                    setIsSidebarOpen(false); // Auto-close on mobile
                                }}
                                className={`w-full text-left px-4 py-4 rounded-lg transition-all duration-200 flex items-center gap-3 group min-h-[50px]
                                    ${activeRoute === route.id
                                        ? 'bg-white text-satoyama-forest shadow-md font-bold ring-1 ring-white'
                                        : 'hover:bg-satoyama-leaf/20 text-satoyama-mist'}`}
                            >
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${activeRoute === route.id ? 'bg-satoyama-forest' : 'bg-satoyama-leaf'}`}></span>
                                <span className="text-base">{route.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Simulation Control Panel */}
                <div className="p-4 bg-white/5 border-t border-white/10">
                    <h3 className="text-[10px] uppercase font-bold text-satoyama-leaf mb-2">Simulation</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                            <span>Speed: {simSpeed} km/h</span>
                            <input
                                type="range"
                                min="5" max="60" step="5"
                                value={simSpeed}
                                onChange={(e) => setSpeed(parseInt(e.target.value))}
                                className="w-24 accent-satoyama-leaf"
                            />
                        </div>
                        <button
                            onClick={() => {
                                // Unlock audio context
                                const utterance = new SpeechSynthesisUtterance('');
                                window.speechSynthesis.speak(utterance);
                                toggleSimulation();
                                if (!isSimulating) setIsSidebarOpen(false); // Close menu when starting sim
                            }}
                            className={`w-full py-2 rounded text-xs font-bold transition-colors ${isSimulating
                                ? 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30'
                                : 'bg-satoyama-leaf/20 text-satoyama-leaf border border-satoyama-leaf/30 hover:bg-satoyama-leaf/30'
                                }`}
                        >
                            {isSimulating ? '⏹ Stop Simulation' : '▶️ Start Simulation'}
                        </button>
                        <button
                            onClick={() => {
                                const utterance = new SpeechSynthesisUtterance("音声案内のテストです。聞こえますか？");
                                utterance.lang = 'ja-JP';
                                window.speechSynthesis.speak(utterance);
                            }}
                            className="w-full py-2 rounded text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            🔊 Test Voice
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 text-[10px] text-center text-satoyama-leaf opacity-60">
                    &copy; 2026 Green-Gear Project
                </div>
            </aside>

            {/* Main Map Area */}
            <main className="flex-grow relative h-full">
                {currentStep && (
                    <NavigationBanner
                        step={currentStep}
                        distance={distanceToNext}
                        speed={isSimulating ? simSpeed : currentSpeed}
                    />
                )}

                <Map
                    activeRoute={activeRoute}
                    simulatedLocation={simulatedLocation}
                    onUserLocationChange={(lat, lng) => {
                        // Only update real location if not simulating
                        if (!isSimulating) {
                            setUserLocation({ lat, lng });
                            updateLocation(lat, lng);
                        }
                    }}
                    onStepsChange={(steps) => {
                        setRouteSteps(steps);
                        // Hacky way to get geometry: Map component should probably expose it better
                        // But for now, we rely on the fact that Map fetches it.
                        // Ideally we pass a callback for full route data.
                    }}
                    // Enhanced prop to capture geometry
                    onRouteLoaded={(route) => setRouteGeometry(route)}
                    onProximityChange={() => { }}
                />
            </main>
        </div>
    )
}

export default App
