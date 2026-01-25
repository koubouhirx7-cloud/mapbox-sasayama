import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { locationData } from '../data/locations';
import { fetchDirections } from '../services/DirectionsService';
import GpxRouteLayer from './GpxRouteLayer';
import courseData from '../data/course.json';
import { explorationRoutes } from '../data/explorationRoutes';
import { getMatchedRoute } from '../utils/mapMatching';
import { spots, Spot } from '../data/spots';

const HIGHLANDER_COORDS: [number, number] = [135.164515, 35.062031];

interface MapProps {
    onStepsChange?: (steps: any[]) => void;
    onProximityChange?: (step: any, distance: number | null) => void;
    onUserLocationChange?: (lat: number, lng: number) => void;
    activeRoute: 'mock-loop-west' | string;
    simulatedLocation?: { lat: number, lng: number, bearing?: number } | null;
    onRouteLoaded?: (route: any) => void;
    selectionTimestamp?: number;
    speed?: number;
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

const Map: React.FC<MapProps> = ({
    onStepsChange,
    onProximityChange,
    onUserLocationChange,
    activeRoute,
    simulatedLocation,
    onRouteLoaded,
    selectionTimestamp,
    speed = 0
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const spotMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
    const [is3D, setIs3D] = useState(false);

    // Refs for callbacks to avoid stale closures in Mapbox event listeners
    const onUserLocationChangeRef = useRef(onUserLocationChange);
    const onStepsChangeRef = useRef(onStepsChange);
    const onRouteLoadedRef = useRef(onRouteLoaded);

    // Track initial zoom for simulation
    const hasInitialZoomedRef = useRef(false);
    const hasSnappedToNavRef = useRef(false);

    // Reset snap ref when route changes
    useEffect(() => {
        hasSnappedToNavRef.current = false;
        hasInitialZoomedRef.current = false;
    }, [activeRoute, selectionTimestamp]);

    useEffect(() => {
        onUserLocationChangeRef.current = onUserLocationChange;
        onStepsChangeRef.current = onStepsChange;
        onRouteLoadedRef.current = onRouteLoaded;
    }, [onUserLocationChange, onStepsChange, onRouteLoaded]);

    // Areas to be rendered as polygons
    const areas = explorationRoutes.filter(r => r.category === 'area');

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
                                // Skip road shields (they use 'ref' not 'name')
                                if (layer.id.indexOf('shield') !== -1) return;

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
                        const cb = onUserLocationChangeRef.current;
                        if (cb) cb(position.coords.latitude, position.coords.longitude);
                    });

                    geolocate.on('error', (e: any) => {
                        console.error('Geolocate error:', e);
                        if (e.code === 1) {
                            alert('位置情報の利用が許可されていません。端末の設定で位置情報をオンにしてください。');
                        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                            alert('セキュリティ制約のため、位置情報はHTTPS接続（またはlocalhost）でのみ利用可能です。');
                        } else {
                            alert('現在地を取得できませんでした。電波の良い場所で再度お試しください。');
                        }
                    });

                    // Auto-start Geolocation for all users
                    // This ensures the "Blue Dot" appears and camera centers on user initially
                    setTimeout(() => {
                        console.log('Triggering auto-geolocation...');
                        geolocate.trigger();

                        // Check for specific launch modes
                        const searchParams = new URLSearchParams(window.location.search);
                        if (searchParams.get('mode') === 'ride') {
                            map.setPitch(60); // Tilt for 3D/Heading up view
                            setIs3D(true);    // Sync UI state
                        }
                    }, 1000);

                    // 4. Area Overlays (Dynamic)
                    areas.forEach(area => {
                        const sourceId = `area-${area.id}`;
                        const polygon = createGeoJSONCircle(area.startPoint, 1.2); // Balanced radius for areas

                        map.addSource(sourceId, {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                properties: { title: area.name },
                                geometry: { type: 'Polygon', coordinates: [polygon] }
                            }
                        });

                        map.addLayer({
                            id: `${sourceId}-fill`,
                            type: 'fill',
                            source: sourceId,
                            paint: {
                                'fill-color': area.color || '#2D5A27',
                                'fill-opacity': 0.2
                            }
                        });
                    });

                    // Interactions (Popup & FlyTo)
                    let hoverPopup: mapboxgl.Popup | null = null;

                    const showPopup = (e: any) => {
                        const description = e.features[0].properties.title;

                        // If popup doesn't exist, create it
                        if (!hoverPopup) {
                            hoverPopup = new mapboxgl.Popup({
                                closeButton: false,
                                closeOnClick: false
                            });
                        }

                        // Update styling and content
                        hoverPopup
                            .setLngLat(e.lngLat)
                            .setHTML(`<div class="px-2 py-1 text-sm font-bold text-satoyama-forest">${description}</div>`)
                            .addTo(map);
                    };

                    const areaLayerIds = areas.map(area => `area-${area.id}-fill`);

                    areaLayerIds.forEach(layerId => {
                        map.on('mousemove', layerId, (e) => {
                            map.getCanvas().style.cursor = 'pointer';
                            showPopup(e);
                        });
                        map.on('mouseleave', layerId, () => {
                            map.getCanvas().style.cursor = '';
                            if (hoverPopup) {
                                hoverPopup.remove();
                                hoverPopup = null;
                            }
                        });
                        map.on('click', layerId, (e) => {
                            map.flyTo({ center: e.lngLat, zoom: 15, duration: 1500 });
                        });
                    });

                    // 5. Sightseeing Spots & Cafes Markers
                    spots.forEach((spot: Spot) => {
                        const markerColor = spot.category === 'cafe' ? '#D84315' :
                            spot.category === 'experience' ? '#AD1457' : '#2D5A27';

                        const popupContent = `
                            <div class="p-3 max-w-[200px] font-sans">
                                <h3 class="text-sm font-bold text-[#2D5A27] mb-1">${spot.name}</h3>
                                <p class="text-xs text-gray-600 mb-2 leading-tight">${spot.description}</p>
                                <a href="${spot.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
                                   class="inline-block w-full text-center bg-[#2D5A27] text-white text-[10px] py-1.5 rounded shadow-sm hover:bg-[#1B3617] transition-colors">
                                    Googleマップで見る
                                </a>
                            </div>
                        `;

                        const popup = new mapboxgl.Popup({ offset: 35, maxWidth: '250px' })
                            .setHTML(popupContent);

                        const marker = new mapboxgl.Marker({ color: markerColor })
                            .setLngLat(spot.coordinates)
                            .setPopup(popup)
                            .addTo(map);

                        spotMarkersRef.current.push(marker);
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

    const targetRoute = explorationRoutes.find(r => r.id === activeRoute);

    // Handle Route Changes & Fetch Directions
    useEffect(() => {
        if (!mapInstance || !targetRoute) return;
        const map = mapInstance;

        // Fit bounds to show the entire route
        if (targetRoute.data && targetRoute.category === 'route') {
            const bounds = new mapboxgl.LngLatBounds();
            targetRoute.data.features?.forEach((feature: any) => {
                if (feature.geometry.type === 'LineString') {
                    feature.geometry.coordinates.forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                }
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: { top: 50, bottom: 200, left: 50, right: 50 },
                    duration: 2000
                });
            } else {
                map.flyTo({ center: targetRoute.startPoint, zoom: 14, duration: 2000 });
            }
        } else {
            // Fallback for areas or missing data
            map.flyTo({
                center: targetRoute.startPoint,
                zoom: targetRoute.category === 'area' ? 15 : 14,
                duration: 2000
            });
        }

        // Fetch Turn-by-Turn Directions
        const loadRoute = async () => {
            try {
                if (!targetRoute.data) return;

                const routeFeature = targetRoute.data.features?.find((f: any) => f.geometry.type === 'LineString');
                if (!routeFeature) return;

                const coords = routeFeature.geometry.coordinates;

                // Use Map Matching API for precise snapping and steps as requested
                const matched = await getMatchedRoute(coords);

                if (matched) {
                    const cb = onStepsChangeRef.current;
                    if (cb) {
                        cb(matched.steps);
                    }
                }
            } catch (err) {
                console.error("Failed to load directions:", err);
            }
        };

        loadRoute();
    }, [activeRoute, targetRoute, mapInstance, selectionTimestamp]);

    const toggle3D = () => {
        if (!mapRef.current) return;
        const targetPitch = is3D ? 0 : 60;
        mapRef.current.easeTo({ pitch: targetPitch, duration: 1000 });
        setIs3D(!is3D);
    };

    const simulationMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // Navigation View Lock (North Up + 45deg Tilt)
    // Triggered when speed is detected
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        const isMoving = speed > 3; // Threshold: 3km/h

        if (isMoving) {
            // Force North Up and 45deg Tilt while moving
            // Note: We use easeTo with short duration to keep it smooth
            const options: any = {
                bearing: 0,
                pitch: 45,
                duration: 500
            };

            // Force Zoom 16.5 (~200m) only on the VERY FIRST detection of movement for this route
            if (!hasSnappedToNavRef.current) {
                options.zoom = 16.5;
                hasSnappedToNavRef.current = true;
                console.log('[Map] Movement detected. Snapping to Nav View (Zoom 16.5, North Up, 45 Tilt)');
            }

            // Only update camera if we are NOT simulating (simulation has its own loop)
            if (!simulatedLocation) {
                // We don't center here because Mapbox's GeolocateControl (trackUserLocation) handles centering.
                // However, we WANT to override bearing/pitch.
                map.easeTo(options);
            }
        }
    }, [speed, simulatedLocation]);

    // Simulation Marker & Camera Follow
    useEffect(() => {
        if (!mapRef.current) return;

        if (simulatedLocation) {
            if (!simulationMarkerRef.current) {
                const el = document.createElement('div');
                el.className = 'simulation-marker-arrow';
                // Navigation Arrow SVG (Triangle)
                el.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 100 100" style="display:block;">
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                    <path d="M50 15 L85 85 L50 70 L15 85 Z" fill="#FF8C00" stroke="white" stroke-width="4" filter="url(#shadow)" />
                </svg>
                `;
                el.style.width = '40px';
                el.style.height = '40px';

                simulationMarkerRef.current = new mapboxgl.Marker({
                    element: el,
                    rotationAlignment: 'map',
                    pitchAlignment: 'map'
                })
                    .setLngLat([simulatedLocation.lng, simulatedLocation.lat])
                    .setRotation(simulatedLocation.bearing || 0)
                    .addTo(mapRef.current);
            } else {
                simulationMarkerRef.current.setLngLat([simulatedLocation.lng, simulatedLocation.lat]);
                if (simulatedLocation.bearing !== undefined) {
                    simulationMarkerRef.current.setRotation(simulatedLocation.bearing);
                }
            }

            // Camera follow with easing
            // Enforce North Up (bearing 0) and 45-degree pitch as per user request
            const cameraOptions: any = {
                center: [simulatedLocation.lng, simulatedLocation.lat],
                pitch: 45,
                bearing: 0,
                duration: 100, // Short duration for smooth continuous update
                easing: (t) => t
            };

            if (hasInitialZoomedRef && !hasInitialZoomedRef.current) {
                // Force an immediate snap to North Up, Tilt, and Zoom on the very first frame
                mapRef.current.jumpTo({
                    center: [simulatedLocation.lng, simulatedLocation.lat],
                    bearing: 0,
                    pitch: 45,
                    zoom: 16.5
                });
                hasInitialZoomedRef.current = true;
                hasSnappedToNavRef.current = true; // Sync this ref too
            } else {
                // Continuous smooth follow
                mapRef.current.easeTo(cameraOptions);
            }
        } else {
            if (hasInitialZoomedRef) hasInitialZoomedRef.current = false; // Reset for next run
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

            {mapInstance && targetRoute?.data && (
                <GpxRouteLayer
                    key={activeRoute}
                    map={mapInstance}
                    isVisible={targetRoute.category === 'route'}
                    onRouteLoaded={onRouteLoaded}
                    routeData={targetRoute.data}
                />
            )}
        </div>
    );
};

export default Map;
