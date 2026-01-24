import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import courseData from '../data/course.geojson';

interface GpxRouteLayerProps {
    map: mapboxgl.Map;
}

const GpxRouteLayer: React.FC<GpxRouteLayerProps> = ({ map }) => {
    useEffect(() => {
        if (!map) return;

        const addLayer = () => {
            if (map.getSource('gpx-route')) return;

            map.addSource('gpx-route', {
                type: 'geojson',
                data: courseData as any
            });

            map.addLayer({
                id: 'gpx-route-line',
                type: 'line',
                source: 'gpx-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#2D5A27',
                    'line-width': 8,
                    'line-opacity': 0.8
                }
            });
        };

        if (map.isStyleLoaded()) {
            addLayer();
        } else {
            map.on('load', addLayer);
        }

        return () => {
            if (map.getLayer('gpx-route-line')) {
                map.removeLayer('gpx-route-line');
            }
            if (map.getSource('gpx-route')) {
                map.removeSource('gpx-route');
            }
        };
    }, [map]);

    return null;
};

export default GpxRouteLayer;
