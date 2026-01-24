import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface GpxRouteLayerProps {
    map: mapboxgl.Map;
    isVisible: boolean;
    onRouteLoaded?: (route: any) => void;
    routeData: any;
}

const GpxRouteLayer: React.FC<GpxRouteLayerProps> = ({ map, isVisible, onRouteLoaded, routeData }) => {
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!map || !routeData) return;

        // Pass route data up
        if (onRouteLoaded && routeData.features && routeData.features.length > 0) {
            onRouteLoaded(routeData.features[0]);
        }

        // Toggle visibility immediately if layers exist
        const layers = ['gpx-route-line', 'gpx-route-arrows'];
        layers.forEach(id => {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none');
            }
        });

        const addLayers = () => {
            if (map.getSource('gpx-route')) {
                // If source exists, update data
                (map.getSource('gpx-route') as mapboxgl.GeoJSONSource).setData(routeData as any); // Use processed data below actually
                // But wait, the below logic recalculates 'features' with slope categorization.
                // We should re-run the processing logic if data changes.
                // For simplicity, let's remove source if data changed? Or just update.
                // The current logic adds source once.
                // Let's allow re-running if we make the Source ID unique or just update the data.
                // Actually, the component unmounts/remounts logic is handled by "return () => cleanup".
                // But if activeRoute changes, the component might stay mounted if it's the same component.
                // In Map.tsx, <GpxRouteLayer ... /> is rendered conditionally?
                // No, "isVisible" changes.
                // But if we switch routes, "activeRoute" changes, so "routeData" changes.
                // We need to remove old source and add new one.
                // The cleanup function removes it. So if routeData changes, this useEffect runs again.
                // Perfect.
            }
            if (map.getSource('gpx-route')) return; // Safety check if cleanup failed or race condition

            // 1. Process courseData for elevation segments
            const features: any[] = [];
            // Ensure data structure
            if (!routeData.features || !routeData.features[0]) return;

            const coords = routeData.features[0].geometry.coordinates;

            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i];
                const p2 = coords[i + 1];
                const dEle = (p2[2] || 0) - (p1[2] || 0); // Handle missing elevation
                const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
                const slope = dist > 0 ? dEle / (dist * 111000) : 0;

                let category = 'flat';
                if (slope > 0.02) category = 'uphill';
                else if (slope < -0.02) category = 'downhill';

                features.push({
                    type: 'Feature',
                    properties: { category },
                    geometry: {
                        type: 'LineString',
                        coordinates: [p1, p2]
                    }
                });
            }

            map.addSource('gpx-route', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // 2. Base Line with Elevation Colors
            map.addLayer({
                id: 'gpx-route-line',
                type: 'line',
                source: 'gpx-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-width': 10,
                    'line-color': [
                        'match',
                        ['get', 'category'],
                        'uphill', '#FF4B2B',   // Red for uphill
                        'downhill', '#2BB0FF', // Blue for downhill
                        '#2D5A27'              // Forest green for flat
                    ],
                    'line-opacity': 0.8
                }
            });

            // 3. Directional Arrows (Symbol Layer)
            map.addLayer({
                id: 'gpx-route-arrows',
                type: 'symbol',
                source: 'gpx-route',
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 50,
                    'text-field': '▶',
                    'text-size': 14,
                    'text-keep-upright': false,
                    'text-rotation-alignment': 'map',
                    'text-allow-overlap': true,
                    'text-ignore-placement': true
                },
                paint: {
                    'text-color': '#FFFFFF',
                    'text-opacity': 0.9
                }
            });

            // 4. Animation effect (Pulse or Dash)
            let opacity = 0.5;
            let increment = 0.01;
            const animate = () => {
                opacity += increment;
                if (opacity > 0.9 || opacity < 0.4) increment *= -1;

                if (map.getLayer('gpx-route-arrows')) {
                    map.setPaintProperty('gpx-route-arrows', 'text-opacity', opacity);
                }
                animationRef.current = requestAnimationFrame(animate);
            };
            animate();
        };

        if (map.isStyleLoaded()) {
            addLayers();
        } else {
            map.on('load', addLayers);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            ['gpx-route-arrows', 'gpx-route-line'].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
            if (map.getSource('gpx-route')) map.removeSource('gpx-route');
        };
    }, [map, isVisible, routeData]); // Added routeData dependency

    return null;
};

export default GpxRouteLayer;
