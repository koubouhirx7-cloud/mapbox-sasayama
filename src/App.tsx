import { useState, useMemo } from 'react'
import Map from './components/Map'
import NavigationPopup from './components/NavigationPopup'
import { explorationRoutes } from './data/explorationRoutes'

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
    const [proximityAlert, setProximityAlert] = useState<{ step: any, distance: number } | null>(null)

    // Sort routes by proximity to user (optional logic kept if needed later, but simplified for now)
    const sortedRoutes = useMemo(() => {
        if (!userLocation) return explorationRoutes;
        return [...explorationRoutes]
            .map(route => ({
                ...route,
                distance: getDistance(userLocation.lat, userLocation.lng, route.startPoint[1], route.startPoint[0])
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }, [userLocation]);

    return (
        <div className="flex w-screen h-screen bg-satoyama-mist font-sans">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #879166; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2D5A27; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>

            {/* Left Sidebar */}
            <aside className="w-64 bg-satoyama-forest text-satoyama-mist flex-shrink-0 flex flex-col shadow-2xl z-50">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
                        <span className="text-3xl">🚲</span>
                        Green-Gear
                    </h1>
                    <p className="text-xs text-satoyama-leaf mt-2 font-medium tracking-wide">丹波篠山サイクリングナビ</p>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <h2 className="text-xs uppercase tracking-widest text-satoyama-leaf font-bold mb-4 px-2">エリア選択</h2>
                    <div className="space-y-2">
                        {explorationRoutes.map((route) => (
                            <button
                                key={route.id}
                                onClick={() => setActiveRoute(route.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 group
                                    ${activeRoute === route.id
                                        ? 'bg-white text-satoyama-forest shadow-md font-bold ring-1 ring-white'
                                        : 'hover:bg-satoyama-leaf/20 text-satoyama-mist'}`}
                            >
                                <span className={`w-2 h-2 rounded-full transition-colors ${activeRoute === route.id ? 'bg-satoyama-forest' : 'bg-satoyama-leaf'}`}></span>
                                <span>{route.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 text-[10px] text-center text-satoyama-leaf opacity-60">
                    &copy; 2026 Green-Gear Project
                </div>
            </aside>

            {/* Main Map Area */}
            <main className="flex-grow relative h-full">
                {proximityAlert && (
                    <NavigationPopup
                        step={proximityAlert.step}
                        distance={proximityAlert.distance}
                    />
                )}

                <Map
                    activeRoute={activeRoute}
                    onUserLocationChange={(lat, lng) => setUserLocation({ lat, lng })}
                    onProximityChange={(step, distance) => {
                        if (step && distance !== null) {
                            setProximityAlert({ step, distance });
                        } else {
                            setProximityAlert(null);
                        }
                    }}
                />
            </main>
        </div>
    )
}

export default App
