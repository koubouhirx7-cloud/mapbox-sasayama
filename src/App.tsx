import { useState } from 'react'
import Map from './components/Map'
import NavigationPopup from './components/NavigationPopup'
import RouteSelector from './components/RouteSelector'

type RouteType = 'recommended' | 'gpx';

function App() {
    const [activeRoute, setActiveRoute] = useState<RouteType>('gpx')
    const [proximityAlert, setProximityAlert] = useState<{ step: any, distance: number } | null>(null)

    return (
        <div className="flex flex-col w-screen h-screen bg-satoyama-mist font-sans">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #879166; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2D5A27; }
                
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
                        Tanba-Sasayama Cycling
                    </div>
                    <RouteSelector
                        activeRoute={activeRoute}
                        onRouteSelect={setActiveRoute}
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
