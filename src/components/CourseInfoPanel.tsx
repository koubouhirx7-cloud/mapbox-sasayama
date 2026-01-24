import React, { useState } from 'react';
import { ExplorationRoute } from '../data/explorationRoutes';

interface CourseInfoPanelProps {
    route: ExplorationRoute;
    onStartSimulation: () => void;
    isSimulating: boolean;
    speed: number;
    onSpeedChange: (speed: number) => void;
    isVoiceEnabled: boolean;
    onVoiceChange: (enabled: boolean) => void;
    onTestVoice: () => void;
    className?: string;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ route, onStartSimulation, isSimulating, speed, onSpeedChange, isVoiceEnabled, onVoiceChange, onTestVoice, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-satoyama-forest/10 max-w-sm md:max-w-md transition-all duration-300 ${className}`}>
            <div className="flex items-start justify-between gap-3 mb-1">
                <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <h2 className="text-lg font-bold text-satoyama-forest leading-tight font-outfit pr-2">
                        {route.name}
                    </h2>
                    {route.category === 'route' && route.distance && (
                        <div className="flex items-center gap-2 mt-1 text-satoyama-leaf font-bold tracking-wide text-xs">
                            <span className="bg-satoyama-forest/10 px-2 py-0.5 rounded text-satoyama-forest">
                                {route.distance} km
                            </span>
                            <span>cycling course</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full text-gray-500 transition-colors"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? (
                            // Chevron Down
                            <svg className="w-4 h-4" fill="none" href="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            // Chevron Up
                            <svg className="w-4 h-4" fill="none" href="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                        )}
                    </button>
                    {!isExpanded && route.category === 'route' && (
                        <div className="flex gap-2 animate-fadeIn">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartSimulation();
                                }}
                                className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-sm transition-colors flex items-center gap-1
                                    ${isSimulating
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-satoyama-forest text-white hover:bg-[#1a3815]'
                                    }`}
                            >
                                {isSimulating ? '⏹ Stop' : '▶ Start'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-2 animate-fadeIn">
                    <p className="text-sm text-satoyama-soil leading-relaxed mb-4 border-t border-dashed border-satoyama-leaf/30 pt-3">
                        {route.description || 'No description available.'}
                    </p>

                    {/* Voice Toggle */}
                    {route.category === 'route' && (
                        <div className="flex items-center justify-between mb-4 bg-[#2D5A27]/5 p-3 rounded-lg border border-[#2D5A27]/10">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{isVoiceEnabled ? '🔊' : '🔇'}</span>
                                <div className="text-xs font-bold text-satoyama-forest">
                                    <div>音声案内 (Voice)</div>
                                    <div className="text-[10px] text-satoyama-leaf font-normal leading-none mt-0.5">{isVoiceEnabled ? '有効 (ON)' : '無効 (OFF)'}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => onVoiceChange(!isVoiceEnabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D5A27] ${isVoiceEnabled ? 'bg-[#2D5A27]' : 'bg-gray-300'}`}
                                title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm transform ${isVoiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}

                    {route.category === 'route' && (
                        <div className="space-y-3">
                            {/* Primary Action: Select Route (Collapse Panel for Riding) */}
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-full py-3 bg-satoyama-forest text-white rounded-lg font-bold text-lg shadow-md hover:bg-[#1a3815] transition-colors flex items-center justify-center gap-2 mb-2"
                            >
                                <span>🚲</span> このルートを選ぶ
                            </button>

                            {/* Simulation Controls */}
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
                                    disabled={isSimulating}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={onTestVoice}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    Test Voice
                                </button>
                                <button
                                    onClick={onStartSimulation}
                                    className={`flex-[2] py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2
                                        ${isSimulating
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-satoyama-forest text-white hover:bg-[#1a3815]'
                                        }`}
                                >
                                    {isSimulating ? (
                                        <><span>⏹</span> Stop</>
                                    ) : (
                                        <><span>▶</span> Start</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseInfoPanel;
