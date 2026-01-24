import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { locationData, routeData } from '../data/locations';

const HIGHLANDER_COORDS: [number, number] = [135.164515, 35.062031];

const Map: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!token || token === 'pk.YOUR_ACTUAL_TOKEN_HERE') {
            console.warn('Mapbox access token is missing or not configured.');
        }

        mapboxgl.accessToken = token || '';

        if (mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/outdoors-v12',
                center: HIGHLANDER_COORDS, // Tanba-Sasayama Highlander
                zoom: 15,
            });

            // Add navigation controls (zoom, rotate)
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Add Geolocation control (Show current location)
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

        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default Map;
