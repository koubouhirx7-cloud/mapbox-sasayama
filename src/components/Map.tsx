import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { locationData } from '../data/locations';
import { fetchDirections } from '../services/DirectionsService';
import GpxRouteLayer from './GpxRouteLayer';
import courseData from '../data/course.json';
import { explorationRoutes } from '../data/explorationRoutes';

const HIGHLANDER_COORDS: [number, number] = [135.164515, 35.062031];

interface MapProps {
    onStepsChange?: (steps: any[]) => void;
    onProximityChange?: (step: any, distance: number | null) => void;
    onUserLocationChange?: (lat: number, lng: number) => void;
    activeRoute: 'mock-loop-west' | string;
    simulatedLocation?: { lat: number, lng: number } | null;
    onRouteLoaded?: (route: any) => void;
}

// Helper to create a circle GeoJSON
const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points = 64) => {
    const coords = { latitude: center[1], longitude: center[0] };
    const checkPoint = (i: number) => {
        return [
            coords.longitude + (radiusInKm / 111.32) * Math.cos(2 * Math.PI * i / points),
            coords.latitude + (radiusInKm / 111.32) * Math.sin(2 * Math.PI * i / points)
        ] as [number, number];
    };
    const ret: [number, number][] = [];
    for (let i = 0; i < points; i++) {
        ret.push(checkPoint(i));
    }
    ret.push(ret[0]);
    return ret;
};

const Map: React.FC<MapProps> = ({ onStepsChange, onProximityChange, onUserLocationChange, activeRoute, simulatedLocation, onRouteLoaded }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
    const [is3D, setIs3D] = useState(false);

    // Area Polygons
    const sasayamaStationPoly = createGeoJSONCircle([135.1834, 35.0583], 0.8); // 800m radius
    // Jokamachi Area (Simple estimation based on request)
    const jokamachiPoly = createGeoJSONCircle([135.2166, 35.0755], 0.6); // Approx area for castle town

    useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

        if (!token || token === 'pk.YOUR_ACTUAL_TOKEN_HERE') {
            setError('Mapbox access token is missing or invalid.');
            return;
        }

        mapboxgl.accessToken = token;

        if (mapContainerRef.current && !mapRef.current) {
            try {
                mapRef.current = new mapboxgl.Map({
                    container: mapContainerRef.current,
                    style: 'mapbox://styles/mapbox/outdoors-v12', // 1. Outdoors Style
                    center: HIGHLANDER_COORDS,
                    zoom: 13,
                    pitch: 0,
                    bearing: 0
                });

                mapRef.current.on('style.load', () => {
                    const map = mapRef.current!;

                    // 2. Localize Labels & White Halo
                    const layers = map.getStyle()?.layers;
                    if (layers) {
                        layers.forEach((layer) => {
                            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                                map.setLayoutProperty(layer.id, 'text-field', ['get', 'name_ja']);
                                map.setPaintProperty(layer.id, 'text-halo-color', '#ffffff');
                                map.setPaintProperty(layer.id, 'text-halo-width', 2);
                            }
                        });
                    }

                    // 3. 3D Terrain
                    map.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                });

                mapRef.current.on('load', async () => {
                    const map = mapRef.current!;
                    setMapInstance(map);

                    // Add Navigation Controls
                    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
                    const geolocate = new mapboxgl.GeolocateControl({
                        positionOptions: { enableHighAccuracy: true },
                        trackUserLocation: true,
                        showUserHeading: true
                    });
                    map.addControl(geolocate, 'top-right');

                    geolocate.on('geolocate', (position: any) => {
                        if (onUserLocationChange) onUserLocationChange(position.coords.latitude, position.coords.longitude);
                    });

                    // 4. Area Overlays
                    // Sasayamaguchi Station Area
                    map.addSource('area-station', {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: { title: '篠山口駅エリア' },
                            geometry: { type: 'Polygon', coordinates: [sasayamaStationPoly] }
                        }
                    });
                    map.addLayer({
                        id: 'area-station-fill',
                        type: 'fill',
                        source: 'area-station',
                        paint: { 'fill-color': '#FF8C00', 'fill-opacity': 0.2 }
                    });

                    // Jokamachi Area
                    map.addSource('area-jokamachi', {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: { title: '城下町エリア' },
                            geometry: { type: 'Polygon', coordinates: [jokamachiPoly] }
                        }
                    });
                    map.addLayer({
                        id: 'area-jokamachi-fill',
                        type: 'fill',
                        source: 'area-jokamachi',
                        paint: { 'fill-color': '#800000', 'fill-opacity': 0.2 }
                    });

                    // Interactions (Popup & FlyTo)
                    const showPopup = (e: any) => {
                        const description = e.features[0].properties.title;
                        new mapboxgl.Popup()
                            .setLngLat(e.lngLat)
                            .setHTML(`<div class="px-2 py-1 text-sm font-bold text-satoyama-forest">${description}</div>`)
                            .addTo(map);
                    };

                    ['area-station-fill', 'area-jokamachi-fill'].forEach(layer => {
                        map.on('mousemove', layer, (e) => {
                            map.getCanvas().style.cursor = 'pointer';
                            showPopup(e);
                        });
                        map.on('mouseleave', layer, () => {
                            map.getCanvas().style.cursor = '';
                        });
                        map.on('click', layer, (e) => {
                            map.flyTo({ center: e.lngLat, zoom: 15, duration: 1500 });
                        });
                    });

                    // Markers for standard locations
                    locationData.features.forEach((feature: any) => {
                        const coords = feature.geometry.coordinates as [number, number];
                        new mapboxgl.Marker({ color: '#2D5A27' })
                            .setLngLat(coords)
                            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${feature.properties.name}</h3><p>${feature.properties.description}</p>`))
                            .addTo(map);
                    });
                });

            } catch (e) {
                console.error('Failed to initialize Mapbox:', e);
                setError('Failed to initialize map.');
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Handle Route Changes & Fetch Directions
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        const targetRoute = explorationRoutes.find(r => r.id === activeRoute);
        if (targetRoute) {
            map.flyTo({
                center: targetRoute.startPoint,
                zoom: 14,
                duration: 2000
            });

            // Fetch Turn-by-Turn Directions
            const loadRoute = async () => {
                try {
                    // Sample coordinates from courseData to force the route match
                    // This ensures the API returns instructions for THIS specific path
                    const rawCoords = courseData.features[0].geometry.coordinates;
                    const waypoints: [number, number][] = [];

                    // Add Start
                    waypoints.push(rawCoords[0] as [number, number]);

                    // Add intermediates (every 20th point to stay under URL limit but define shape)
                    // The Mapbox Directions API supports up to 25 coordinates
                    const step = Math.ceil(rawCoords.length / 23);
                    for (let i = step; i < rawCoords.length - 1; i += step) {
                        waypoints.push(rawCoords[i] as [number, number]);
                    }

                    // Add End
                    waypoints.push(rawCoords[rawCoords.length - 1] as [number, number]);

                    const data = await fetchDirections(waypoints);

                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        if (onStepsChange) {
                            // Extract steps from all legs
                            // Filter out intermediate "Arrive" steps (waypoints) to prevent falsely announcing destination at every sample point
                            const rawSteps = route.legs.flatMap((leg: any) => leg.steps);
                            // 1. Filter out specific "Arrive" steps
                            const filteredSteps = rawSteps.filter((step: any) => {
                                return step.maneuver.type !== 'arrive';
                            });

                            // 2. Sanitize text in remaining steps to remove "destination" mentions
                            // (e.g. "Right turn, then you will arrive at destination")
                            const allSteps = filteredSteps.map((step: any) => {
                                const cleanText = (text: string) => {
                                    if (!text) return text;
                                    // Remove phrases like "then you will arrive at your destination" or "目的地に到着します"
                                    return text
                                        .replace(/(and )?you will arrive at your destination/gi, '')
                                        .replace(/, then you will arrive/gi, '')
                                        .replace(/目的地に到着(します|です)?/g, '')
                                        .replace(/目的地/g, ''); // Fallback
                                };

                                const newStep = { ...step };
                                newStep.maneuver = { ...step.maneuver, instruction: cleanText(newStep.maneuver.instruction) };

                                if (newStep.voiceInstructions) {
                                    newStep.voiceInstructions = newStep.voiceInstructions.map((v: any) => ({
                                        ...v,
                                        announcement: cleanText(v.announcement)
                                    }));
                                }
                                return newStep;
                            });

                            onStepsChange(allSteps);
                        }
                        // removed onRouteLoaded call to keep simulation on the GPX trace
                    }
                } catch (err) {
                    console.error("Failed to load directions:", err);
                }
            };

            loadRoute();
        }
    }, [activeRoute]);

    const toggle3D = () => {
        if (!mapRef.current) return;
        const targetPitch = is3D ? 0 : 60;
        mapRef.current.easeTo({ pitch: targetPitch, duration: 1000 });
        setIs3D(!is3D);
    };

    // Simulation Marker
    const simulationMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // Update Simulation Marker
    useEffect(() => {
        if (!mapRef.current) return;

        if (simulatedLocation) {
            if (!simulationMarkerRef.current) {
                const el = document.createElement('div');
                el.className = 'simulation-marker';
                el.style.backgroundColor = '#FF8C00';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

                simulationMarkerRef.current = new mapboxgl.Marker({ element: el })
                    .setLngLat([simulatedLocation.lng, simulatedLocation.lat])
                    .addTo(mapRef.current);
            } else {
                simulationMarkerRef.current.setLngLat([simulatedLocation.lng, simulatedLocation.lat]);
            }

            // Optional: Camera follow
            mapRef.current.easeTo({
                center: [simulatedLocation.lng, simulatedLocation.lat],
                duration: 100,
                easing: (t) => t
            });
        } else {
            if (simulationMarkerRef.current) {
                simulationMarkerRef.current.remove();
                simulationMarkerRef.current = null;
            }
        }
    }, [simulatedLocation]);

    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* 5. 3D View Toggle Button */}
            <div className="absolute top-24 right-2.5 z-10">
                <button
                    onClick={toggle3D}
                    className="bg-[#F4F1E8] p-2 rounded-md shadow-md border border-[#2D5A27]/20 hover:bg-white transition-colors"
                    title={is3D ? "2D View" : "3D View"}
                >
                    <span className="text-xl font-bold text-[#2D5A27]">{is3D ? "2D" : "3D"}</span>
                </button>
            </div>

            {mapInstance && (
                <GpxRouteLayer
                    map={mapInstance}
                    isVisible={activeRoute === 'sasayama-main'}
                    onRouteLoaded={onRouteLoaded}
                />
            )}
        </div>
    );
};

export default Map;
