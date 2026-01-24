import React from 'react';

type RouteType = 'recommended' | 'gpx';

interface RouteSelectorProps {
    activeRoute: RouteType;
    onRouteSelect: (route: RouteType) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ activeRoute, onRouteSelect }) => {
    return (
        <div className="flex bg-white/10 p-1 rounded-lg border border-white/20">
            <button
                onClick={() => onRouteSelect('recommended')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeRoute === 'recommended'
                    ? 'bg-satoyama-mist text-satoyama-forest shadow-sm'
                    : 'text-satoyama-mist hover:bg-white/10'
                    }`}
            >
                🚲 おすすめ
            </button>
            <button
                onClick={() => onRouteSelect('gpx')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeRoute === 'gpx'
                    ? 'bg-satoyama-mist text-satoyama-forest shadow-sm'
                    : 'text-satoyama-mist hover:bg-white/10'
                    }`}
            >
                🗺️ GPXルート
            </button>
        </div>
    );
};

export default RouteSelector;
