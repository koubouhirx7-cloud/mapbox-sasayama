import { useState, useMemo, useEffect, useRef } from 'react'
import Map from './components/Map'
import NavigationBanner from './components/NavigationPopup' // Still using the same file but renamed component inside
import CourseInfoPanel from './components/CourseInfoPanel'
import { explorationRoutes } from './data/explorationRoutes'
import { useNavigation } from './hooks/useNavigation'
import { useSimulation } from './hooks/useSimulation'
import WelcomeGuide from './components/WelcomeGuide'
import { getDistance } from './utils/distance'

type RouteType = 'sasayama-main' | string;

function App() {
    const [activeRoute, setActiveRoute] = useState<RouteType>('sasayama-main')

    // Debug: Trace route changes
    useEffect(() => {
        console.log('[App] Action Route Changed:', activeRoute);
    }, [activeRoute]);

    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    // Navigation State
    const [routeSteps, setRouteSteps] = useState<any[]>([]);
    const [routeGeometry, setRouteGeometry] = useState<any>(null); // New: Store geometry for simulation
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    // ... (rest of hooks)

    const {
        isPlaying: isSimulating,
        toggleSimulation,
        simulatedLocation,
        setSpeed,
        speed: simSpeed
    } = useSimulation(routeGeometry);

    // Derived state for active route info
    // Derived state for active route info
    const selectedRoute = useMemo(() => explorationRoutes.find(r => r.id === activeRoute), [activeRoute]);

    const {
        currentStep,
        distanceToNext,
        currentSpeed,
        updateLocation,
        startNavigation,
        stopNavigation
    } = useNavigation(routeSteps, isVoiceEnabled);

    const handleToggleSimulation = () => {
        // Unlock audio context explicitly on user interaction
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);

        if (!isSimulating) {
            startNavigation();
        } else {
            stopNavigation();
        }

        toggleSimulation();
    };

    const handleTestVoice = () => {
        const utterance = new SpeechSynthesisUtterance('音声案内のテストです');
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    };

    // ... (rest of useEffects)

    // Feed simulated location to navigation logic
    useEffect(() => {
        if (isSimulating && simulatedLocation) {
            updateLocation(simulatedLocation.lat, simulatedLocation.lng);
        }
    }, [isSimulating, simulatedLocation, updateLocation]);

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
                    {/* Cycling Courses Section */}
                    <div className="mb-8">
                        <h2 className="text-xs uppercase tracking-widest text-satoyama-leaf font-bold mb-3 px-2 flex items-center gap-2">
                            <span className="text-lg">🚲</span> サイクリングコース
                        </h2>
                        <div className="space-y-3">
                            {explorationRoutes.filter(r => r.category === 'route').map((route) => (
                                <button
                                    key={route.id}
                                    onClick={() => {
                                        setActiveRoute(route.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-lg transition-all duration-200 flex items-center gap-3 group min-h-[50px]
                                        ${activeRoute === route.id
                                            ? 'bg-white text-satoyama-forest shadow-md font-bold ring-1 ring-white'
                                            : 'hover:bg-satoyama-leaf/20 text-satoyama-mist'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${activeRoute === route.id ? 'bg-satoyama-forest' : 'bg-satoyama-leaf'}`}></span>
                                    <span className="text-base leading-tight">{route.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Area Guides Section */}
                    <div>
                        <h2 className="text-xs uppercase tracking-widest text-satoyama-leaf font-bold mb-3 px-2 flex items-center gap-2">
                            <span className="text-lg">🗺️</span> エリアガイド
                        </h2>
                        <div className="space-y-3">
                            {explorationRoutes.filter(r => r.category === 'area').map((route) => (
                                <button
                                    key={route.id}
                                    onClick={() => {
                                        setActiveRoute(route.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-lg transition-all duration-200 flex items-center gap-3 group min-h-[50px]
                                        ${activeRoute === route.id
                                            ? 'bg-white text-satoyama-forest shadow-md font-bold ring-1 ring-white'
                                            : 'hover:bg-satoyama-leaf/20 text-satoyama-mist'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${activeRoute === route.id ? 'bg-satoyama-forest' : 'bg-satoyama-leaf'}`}></span>
                                    <span className="text-base leading-tight">{route.name}</span>
                                </button>
                            ))}
                        </div>
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

                {selectedRoute && (
                    <CourseInfoPanel
                        route={selectedRoute}
                        isSimulating={isSimulating}
                        onStartSimulation={handleToggleSimulation}
                        speed={simSpeed}
                        onSpeedChange={setSpeed}
                        isVoiceEnabled={isVoiceEnabled}
                        onVoiceChange={setIsVoiceEnabled}
                        onTestVoice={handleTestVoice}
                        className="absolute bottom-6 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-30"
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

                {showWelcome && (
                    <WelcomeGuide
                        userLocation={userLocation}
                        routes={explorationRoutes}
                        onSelectRoute={(id) => {
                            setActiveRoute(id);
                            setShowWelcome(false);
                        }}
                        onClose={() => setShowWelcome(false)}
                    />
                )}
            </main>
        </div>
    )
}

export default App
