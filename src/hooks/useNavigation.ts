import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTextToSpeech } from './useTextToSpeech';

interface NavigationState {
    currentStep: any | null;
    nextStep: any | null;
    distanceToNext: number;
    currentInstruction: string | null;
    isNavigating: boolean;
}

export const useNavigation = (routeSteps: any[]) => {
    const [state, setState] = useState<NavigationState>({
        currentStep: null,
        nextStep: null,
        distanceToNext: Infinity,
        currentInstruction: null,
        isNavigating: false,
    });

    const { speak } = useTextToSpeech();

    const lastUserLocation = useRef<{ lat: number, lng: number, timestamp: number } | null>(null);
    const lastAnnouncedStepIndex = useRef<number>(-1);
    const speedRef = useRef<number>(0); // km/h

    const updateLocation = (lat: number, lng: number) => {
        if (!state.isNavigating || !routeSteps || routeSteps.length === 0) return;

        const now = Date.now();
        const userLoc = new mapboxgl.LngLat(lng, lat);

        // Calculate speed (rough estimation)
        if (lastUserLocation.current) {
            const prevLoc = new mapboxgl.LngLat(lastUserLocation.current.lng, lastUserLocation.current.lat);
            const dist = userLoc.distanceTo(prevLoc); // meters
            const timeDiff = (now - lastUserLocation.current.timestamp) / 1000; // seconds
            if (timeDiff > 0) {
                const currentSpeedMps = dist / timeDiff;
                const currentSpeedKmh = currentSpeedMps * 3.6;
                // Simple low-pass filter for speed
                speedRef.current = (speedRef.current * 0.7) + (currentSpeedKmh * 0.3);
            }
        }
        lastUserLocation.current = { lat, lng, timestamp: now };

        // Find closest step (simplified logic: look for the next uncompleted step)
        // Ideally we project user to route line, but for now we check distance to step maneuvers

        let nearestStepIndex = -1;
        let minDistance = Infinity;

        // Strategy: Only look ahead from the last announced step to avoid backtracking
        // But allow some buffer in case we missed one
        const searchStartIndex = Math.max(0, lastAnnouncedStepIndex.current);

        for (let i = searchStartIndex; i < routeSteps.length; i++) {
            const stepLoc = new mapboxgl.LngLat(
                routeSteps[i].maneuver.location[0],
                routeSteps[i].maneuver.location[1]
            );
            const dist = userLoc.distanceTo(stepLoc);

            // If we are very far from this step, it's likely not the next one (unless it's a long straight)
            // This is a naive heuristic. Real navigation SDKs use complex map matching.
            if (dist < minDistance) {
                minDistance = dist;
                nearestStepIndex = i;
            }
        }

        if (nearestStepIndex !== -1) {
            const step = routeSteps[nearestStepIndex];
            const nextStep = routeSteps[nearestStepIndex + 1] || null;

            // Voice Announcement Logic
            // Timing depends on speed
            const isHighSpeed = speedRef.current > 15;
            const threshold = isHighSpeed ? 150 : 50; // meters

            console.log(`Nav: Step ${nearestStepIndex}, Dist ${Math.round(minDistance)}m, Speed ${Math.round(speedRef.current)}km/h, Threshold ${threshold}m`);

            // If we haven't confirmed passing this step yet
            if (lastAnnouncedStepIndex.current < nearestStepIndex) {
                if (minDistance < threshold) {
                    // Announce!
                    const instruction = step.voiceInstructions?.[0]?.announcement || step.maneuver.instruction;
                    console.log(`Speaking: ${instruction}`);
                    speak(instruction);
                    lastAnnouncedStepIndex.current = nearestStepIndex;
                }
            }

            setState(prev => ({
                ...prev,
                currentStep: step,
                nextStep: nextStep,
                distanceToNext: minDistance,
                currentInstruction: step.maneuver.instruction
            }));
        }
    };

    const startNavigation = () => setState(prev => ({ ...prev, isNavigating: true }));
    const stopNavigation = () => setState(prev => ({ ...prev, isNavigating: false, currentStep: null }));

    return {
        ...state,
        updateLocation,
        startNavigation,
        stopNavigation,
        currentSpeed: speedRef.current
    };
};
