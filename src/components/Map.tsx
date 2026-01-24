import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { locationData, routeData } from '../data/locations';

const HIGHLANDER_COORDS: [number, number] = [135.164515, 35.062031];

const Map: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

        if (!token) {
            console.error('Mapbox access token is missing.');
            setError('Mapbox access token is missing. Please check your environment variables.');
            return;
        }

        if (token === 'pk.YOUR_ACTUAL_TOKEN_HERE') {
            console.warn('Mapbox access token is using placeholder value.');
            setError('Mapbox access token is not configured correctly.');
            return;
        }

        mapboxgl.accessToken = token;

        if (mapContainerRef.current && !mapRef.current) {
            try {
                mapRef.current = new mapboxgl.Map({
                    container: mapContainerRef.current,
                    style: 'mapbox://styles/mapbox/outdoors-v12',
                    center: HIGHLANDER_COORDS,
                    zoom: 15,
                });

                // Add navigation controls (zoom, rotate)
                mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // Add Geolocation control
                mapRef.current.addControl(
                    new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true
                        },
                        trackUserLocation: true,
                        showUserHeading: true
                    }),
                    'top-right'
                );

                // Add Markers
                locationData.features.forEach((feature: any) => {
                    const coords = feature.geometry.coordinates as [number, number];
                    new mapboxgl.Marker({ color: '#2D5A27' })
                        .setLngLat(coords)
                        .setPopup(
                            new mapboxgl.Popup({
                                offset: 30,
                                maxWidth: '300px',
                                className: 'satoyama-popup'
                            })
                                .setHTML(`
                                    <div class="overflow-hidden rounded-lg shadow-sm border border-[#2D5A27]/20 bg-[#F4F1E8]">
                                        <div class="bg-[#2D5A27] px-3 py-2">
                                            <h3 class="font-bold text-white text-sm m-0 tracking-wide">${feature.properties.name}</h3>
                                        </div>
                                        <div class="p-3">
                                            <p class="text-xs leading-relaxed text-[#4A3728] mb-2 line-clamp-3">${feature.properties.description}</p>
                                            <div class="flex items-center gap-1.5 pt-2 border-t border-[#879166]/30">
                                                <span class="w-2 h-2 rounded-full bg-[#879166]"></span>
                                                <p class="text-[10px] font-bold uppercase tracking-wider text-[#2D5A27]">Green-Gear ポイント</p>
                                            </div>
                                        </div>
                                    </div>
                                `)
                        )
                        .addTo(mapRef.current!);
                });

                // Add Route Line
                mapRef.current.on('load', () => {
                    if (!mapRef.current) return;

                    mapRef.current.addSource('cycling-route', {
                        type: 'geojson',
                        data: routeData as any
                    });

                    mapRef.current.addLayer({
                        id: 'cycling-route-line',
                        type: 'line',
                        source: 'cycling-route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#2D5A27',
                            'line-width': 5,
                            'line-opacity': 0.7
                        }
                    });
                });
            } catch (e) {
                console.error('Failed to initialize Mapbox:', e);
                setError('Failed to initialize the map. Please check the browser console for details.');
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 p-8 text-center">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-red-800 mb-2">Map Error</h2>
                <p className="text-red-700 max-w-md">{error}</p>
                <div className="mt-6 p-4 bg-white rounded border border-red-200 text-sm text-left">
                    <p className="font-semibold mb-1">Troubleshooting:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Check if <code>VITE_MAPBOX_ACCESS_TOKEN</code> is set in Vercel.</li>
                        <li>Ensure the token starts with <code>pk.</code></li>
                        <li>Check the browser console (F12) for more specific errors.</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[400px]"
            style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}
        />
    );
};

export default Map;
