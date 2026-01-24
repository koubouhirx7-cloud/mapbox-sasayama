import Map from './components/Map'

function App() {
    return (
        <div className="flex flex-col w-screen h-screen bg-satoyama-mist">
            <header className="bg-satoyama-forest text-satoyama-mist py-4 px-6 shadow-lg z-20 flex items-center justify-between">
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
                <Map />
            </main>
        </div>
    )
}

export default App
