import React from 'react';
import { ExplorationRoute } from '../data/explorationRoutes';

interface CourseInfoPanelProps {
    route: ExplorationRoute;
    onStartSimulation: () => void;
    isSimulating: boolean;
    speed: number;
    onSpeedChange: (speed: number) => void;
    className?: string;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ route, onStartSimulation, isSimulating, speed, onSpeedChange, className = '' }) => {
    return (
        <div className={`bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-satoyama-forest/10 max-w-sm md:max-w-md ${className}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <h2 className="text-xl font-bold text-satoyama-forest leading-tight font-outfit">
                        {route.name}
                    </h2>
                    {route.category === 'route' && route.distance && (
                        <div className="flex items-center gap-2 mt-1 text-satoyama-leaf font-bold tracking-wide text-sm">
                            <span className="bg-satoyama-forest/10 px-2 py-0.5 rounded text-satoyama-forest">
                                {route.distance} km
                            </span>
                            <span>cycling course</span>
                        </div>
                    )}
                </div>
                {/* Optional Icon based on category */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md
                    ${route.category === 'route' ? 'bg-[#2D5A27]' : 'bg-[#800000]'}`}>
                    <span className="text-xl">{route.category === 'route' ? '🚲' : '🗺️'}</span>
                </div>
            </div>

            <p className="text-sm text-satoyama-soil leading-relaxed mb-4 border-t border-dashed border-satoyama-leaf/30 pt-3">
                {route.description || 'No description available.'}
            </p>

            {route.category === 'route' && (
                <div className="space-y-3">
                    <div className="border-t border-dashed border-satoyama-leaf/30 pt-3">
                        <div className="flex items-center justify-between text-xs font-bold text-satoyama-leaf mb-2">
                            <span>Simulation Speed</span>
                            <span>{speed} km/h</span>
                        </div>
                        <input
                            type="range"
                            min="5" max="60" step="5"
                            value={speed}
                            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                            className="w-full accent-satoyama-forest h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSimulating} // Optional: allow changing while running? Yes.
                        />
                    </div>

                    <button
                        onClick={onStartSimulation}
                        className={`w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2
                            ${isSimulating
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-satoyama-forest text-white hover:bg-[#1a3815]'
                            }`}
                    >
                        {isSimulating ? (
                            <><span>⏹</span> Stop Simulation</>
                        ) : (
                            <><span>▶</span> Start Simulation</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseInfoPanel;
