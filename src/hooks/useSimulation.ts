import { useState, useEffect, useRef } from 'react';

// Simplified helper to find a point along a line string at a given distance
const getPointAlongLine = (coordinates: number[][], distanceKm: number) => {
    let traveled = 0;

    // Safety check
    if (!coordinates || coordinates.length < 2) return null;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];

        // Haversine distance
        const R = 6371;
        const dLat = (end[1] - start[1]) * Math.PI / 180;
        const dLon = (end[0] - start[0]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(start[1] * Math.PI / 180) * Math.cos(end[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const segmentDist = R * c; // in KM

        if (traveled + segmentDist > distanceKm) {
            const ratio = (distanceKm - traveled) / segmentDist;
            return [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio
            ];
        }

        traveled += segmentDist;
    }

    return coordinates[coordinates.length - 1]; // End of line
};

export const useSimulation = (routeGeoJSON: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(25); // km/h
    const [simulatedLocation, setSimulatedLocation] = useState<{ lat: number, lng: number } | null>(null);

    const requestRef = useRef<number>();
    const progressRef = useRef(0); // distance traveled in km

    useEffect(() => {
        if (!routeGeoJSON || !routeGeoJSON.geometry) return;

        const animate = () => {
            const distancePerFrame = speed / 3600 / 60;

            progressRef.current += distancePerFrame;

            const point = getPointAlongLine(routeGeoJSON.geometry.coordinates, progressRef.current);

            if (point) {
                setSimulatedLocation({ lat: point[1], lng: point[0] });
            } else {
                // End of route or error (reset)
                progressRef.current = 0;
                setIsPlaying(false);
                return;
            }

            if (isPlaying) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        if (isPlaying && routeGeoJSON) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, routeGeoJSON, speed]);

    const toggleSimulation = () => setIsPlaying(!isPlaying);

    return { isPlaying, toggleSimulation, simulatedLocation, setSpeed, speed };
};
