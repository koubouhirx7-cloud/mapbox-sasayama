import React from 'react';
import { getStepIcon } from '../services/DirectionsService';

interface NavigationPanelProps {
    steps: any[];
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({ steps }) => {
    if (!steps || steps.length === 0) return null;

    return (
        <div className="absolute top-20 left-4 z-30 w-72 max-h-[70vh] bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-satoyama-forest/20 overflow-hidden flex flex-col">
            <div className="bg-satoyama-forest text-white p-3 font-bold flex items-center justify-between">
                <span>ナビゲーション</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">サイクリング</span>
            </div>
            <div className="overflow-y-auto flex-grow p-2 space-y-2 custom-scrollbar">
                {steps.map((step, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-satoyama-forest/5 hover:bg-satoyama-mist/30 transition-colors shadow-sm">
                        <div className="text-2xl flex-shrink-0">
                            {getStepIcon(step.maneuver.type, step.maneuver.modifier)}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm font-medium text-satoyama-forest leading-snug">
                                {step.maneuver.instruction}
                            </p>
                            <p className="text-[10px] font-bold text-satoyama-forest/60 mt-1 uppercase tracking-wider">
                                {step.distance > 1000
                                    ? `${(step.distance / 1000).toFixed(1)} km`
                                    : `${Math.round(step.distance)} m`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NavigationPanel;
