import { useState, useMemo } from 'react'
import Map from './components/Map'
import NavigationPopup from './components/NavigationPopup'
import RouteSelector from './components/RouteSelector'
import { explorationRoutes } from './data/explorationRoutes'

type RouteType = 'recommended' | string;

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
    const [activeRoute, setActiveRoute] = useState<RouteType>('sasayama-main') // Default to the main exploration route
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [proximityAlert, setProximityAlert] = useState<{ step: any, distance: number } | null>(null)

    // Sort routes by proximity to user
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
        <div className="flex flex-col w-screen h-screen bg-satoyama-mist font-sans">
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
            <header className="bg-satoyama-forest text-satoyama-mist py-3 px-4 md:px-6 shadow-lg z-50 flex items-center justify-between">
                <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 bg-satoyama-mist rounded-lg flex items-center justify-center text-satoyama-forest">🚲</span>
                        Green-Gear
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:block text-xs font-medium opacity-60">
                        自転車散策ルート
                    </div>
                    <RouteSelector
                        activeRoute={activeRoute}
                        onRouteSelect={setActiveRoute}
                        sortedExplorationRoutes={sortedRoutes}
                    />
                </div>
            </header>
            <main className="relative flex-grow">
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
