import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import courseData from '../data/course.json';

interface GpxRouteLayerProps {
    map: mapboxgl.Map;
    isVisible: boolean;
}

const GpxRouteLayer: React.FC<GpxRouteLayerProps> = ({ map, isVisible }) => {
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!map) return;

        // Toggle visibility immediately if layers exist
        const layers = ['gpx-route-line', 'gpx-route-arrows'];
        layers.forEach(id => {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none');
            }
        });

        const addLayers = () => {
            if (map.getSource('gpx-route')) return;

            // 1. Process courseData for elevation segments
            const features: any[] = [];
            const coords = courseData.features[0].geometry.coordinates;

            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i];
                const p2 = coords[i + 1];
                const dEle = p2[2] - p1[2];
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
    }, [map, isVisible]);

    return null;
};

export default GpxRouteLayer;
