import React from 'react';

type RouteType = 'recommended' | 'gpx';

interface RouteSelectorProps {
    activeRoute: RouteType;
    onRouteSelect: (route: RouteType) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ activeRoute, onRouteSelect }) => {
    return (
        <div className="absolute top-20 right-4 z-40 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-satoyama-forest/20 flex gap-1">
            <button
                onClick={() => onRouteSelect('recommended')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeRoute === 'recommended'
                        ? 'bg-satoyama-forest text-white shadow-md scale-105'
                        : 'text-satoyama-forest hover:bg-satoyama-mist/40'
                    }`}
            >
                🚲 おすすめ
            </button>
            <button
                onClick={() => onRouteSelect('gpx')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeRoute === 'gpx'
                        ? 'bg-satoyama-forest text-white shadow-md scale-105'
                        : 'text-satoyama-forest hover:bg-satoyama-mist/40'
                    }`}
            >
                🗺️ GPXルート
            </button>
        </div>
    );
};

export default RouteSelector;
