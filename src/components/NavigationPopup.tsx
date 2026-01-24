import React from 'react';
import { getStepIcon } from '../services/DirectionsService';

interface NavigationPopupProps {
    step: any;
    distance: number;
}

const NavigationPopup: React.FC<NavigationPopupProps> = ({ step, distance }) => {
    if (!step) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg animate-slide-down">
            <div className="bg-satoyama-forest/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-3 flex items-center gap-4 text-white">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                    {getStepIcon(step.maneuver.type, step.maneuver.modifier)}
                </div>
                <div className="flex-grow">
                    <p className="text-xs font-bold uppercase tracking-widest text-satoyama-mist opacity-80 mb-1">
                        接近中 - あと {Math.round(distance)}m
                    </p>
                    <p className="text-lg font-bold leading-tight line-clamp-2">
                        {step.maneuver.instruction}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-white/10 flex items-center justify-center relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-white/20"
                        style={{ height: `${(1 - distance / 200) * 100}%`, top: 'auto', bottom: 0 }}
                    />
                    <span className="text-[10px] font-black z-10">OK</span>
                </div>
            </div>
        </div>
    );
};

export default NavigationPopup;
