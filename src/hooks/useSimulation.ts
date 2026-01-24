import { useState, useEffect, useRef } from 'react';

// Helper to calculate bearing between two points
const calculateBearing = (start: number[], end: number[]) => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;

    const lat1 = toRad(start[1]);
    const lat2 = toRad(end[1]);
    const dLon = toRad(end[0] - start[0]);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

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
            const point = [
                start[0] + (end[0] - start[0]) * ratio,
                start[1] + (end[1] - start[1]) * ratio
            ];
            const bearing = calculateBearing(start, end);
            return { point, bearing };
        }

        traveled += segmentDist;
    }

    // End of line
    return {
        point: coordinates[coordinates.length - 1],
        bearing: calculateBearing(coordinates[coordinates.length - 2], coordinates[coordinates.length - 1])
    };
};

export const useSimulation = (routeGeoJSON: any) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(25); // km/h
    const [simulatedLocation, setSimulatedLocation] = useState<{ lat: number, lng: number, bearing: number } | null>(null);

    const requestRef = useRef<number>();
    const progressRef = useRef(0); // distance traveled in km

    useEffect(() => {
        if (!routeGeoJSON || !routeGeoJSON.geometry) return;

        const animate = () => {
            const distancePerFrame = speed / 3600 / 60;

            progressRef.current += distancePerFrame;

            const result = getPointAlongLine(routeGeoJSON.geometry.coordinates, progressRef.current);

            if (result) {
                setSimulatedLocation({
                    lat: result.point[1],
                    lng: result.point[0],
                    bearing: result.bearing
                });
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
