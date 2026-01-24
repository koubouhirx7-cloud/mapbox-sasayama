import React, { useEffect, useState } from 'react';
import { ExplorationRoute } from '../data/explorationRoutes';
import mapboxgl from 'mapbox-gl';

interface WelcomeGuideProps {
    userLocation: { lat: number, lng: number } | null;
    routes: ExplorationRoute[];
    onSelectRoute: (routeId: string) => void;
    onClose: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ userLocation, routes, onSelectRoute, onClose }) => {
    const [recommendedRoutes, setRecommendedRoutes] = useState<ExplorationRoute[]>([]);
    const [distances, setDistances] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (!userLocation || routes.length === 0) return;

        const userLngLat = new mapboxgl.LngLat(userLocation.lng, userLocation.lat);
        const routeDistances: { route: ExplorationRoute, dist: number }[] = [];

        routes.forEach(route => {
            if (route.category !== 'route') return; // Only suggest routes

            const startLngLat = new mapboxgl.LngLat(route.startPoint[0], route.startPoint[1]);
            const dist = userLngLat.distanceTo(startLngLat) / 1000; // km
            routeDistances.push({ route, dist });
        });

        // Sort by distance
        routeDistances.sort((a, b) => a.dist - b.dist);

        // Pick top 2
        setRecommendedRoutes(routeDistances.slice(0, 2).map(item => item.route));

        // Store formatted distances
        const distMap: { [key: string]: number } = {};
        routeDistances.forEach(item => {
            distMap[item.route.id] = parseFloat(item.dist.toFixed(1));
        });
        setDistances(distMap);

    }, [userLocation, routes]);

    if (!userLocation) {
        // Simple loading state or generic welcome if location not found yet
        return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mb-4 md:mb-0 animate-slide-up text-center">
                    <h2 className="text-2xl font-bold text-satoyama-forest mb-2 font-outfit">Welcome to Green-Gear</h2>
                    <p className="text-satoyama-soil animate-pulse">Locating you to find the best trails...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-4 md:mb-0 animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="bg-satoyama-forest p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <h2 className="text-3xl font-bold font-outfit relative z-10">Welcome!</h2>
                    <p className="text-white/80 text-sm mt-1 relative z-10">Based on your location, we recommend:</p>
                </div>

                {/* Recommendations */}
                <div className="p-6 space-y-4">
                    {recommendedRoutes.map((route, index) => (
                        <div
                            key={route.id}
                            onClick={() => {
                                onSelectRoute(route.id);
                                onClose();
                            }}
                            className="group cursor-pointer border border-gray-100 rounded-xl p-4 hover:border-satoyama-forest/30 hover:shadow-md transition-all duration-200 bg-gray-50 hover:bg-white relative overflow-hidden"
                        >
                            {index === 0 && (
                                <div className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-10">
                                    TOP PICK
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-satoyama-forest/10 flex items-center justify-center text-satoyama-forest font-bold text-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    {route.category === 'route' ? '🚲' : '🗺️'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-satoyama-forest transition-colors">
                                        {route.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            📍 <span className="font-bold text-satoyama-forest">{distances[route.id]} km</span> away
                                        </span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span>Length: {route.distance} km</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-satoyama-leaf text-sm font-bold hover:text-satoyama-forest transition-colors underline decoration-dotted underline-offset-4"
                    >
                        View all routes on map
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeGuide;
