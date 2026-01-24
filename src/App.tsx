import { useState } from 'react'
import Map from './components/Map'
import NavigationPanel from './components/NavigationPanel'
import RouteSelector from './components/RouteSelector'

type RouteType = 'recommended' | 'gpx';

function App() {
    const [steps, setSteps] = useState<any[]>([])
    const [activeRoute, setActiveRoute] = useState<RouteType>('recommended')

    return (
        <div className="flex flex-col w-screen h-screen bg-satoyama-mist font-sans">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #879166; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2D5A27; }
                `}
            </style>
            <header className="bg-satoyama-forest text-satoyama-mist py-4 px-6 shadow-lg z-50 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 bg-satoyama-mist rounded-lg flex items-center justify-center text-satoyama-forest">🚲</span>
                        Green-Gear Navigation
                    </h1>
                </div>
                <div className="hidden md:block text-sm font-medium opacity-80">
                    Cycle through Tanba-Sasayama
                </div>
            </header>
            <main className="relative flex-grow">
                <RouteSelector
                    activeRoute={activeRoute}
                    onRouteSelect={setActiveRoute}
                />

                {activeRoute === 'recommended' && (
                    <NavigationPanel steps={steps} />
                )}

                <Map
                    onStepsChange={setSteps}
                    activeRoute={activeRoute}
                />
            </main>
        </div>
    )
}

export default App
