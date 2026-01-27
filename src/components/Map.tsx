import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { locationData } from '../data/locations';
import { fetchDirections } from '../services/DirectionsService';
import GpxRouteLayer from './GpxRouteLayer';
import courseData from '../data/course.json';
import { explorationRoutes } from '../data/explorationRoutes';
import { getMatchedRoute } from '../utils/mapMatching';
import { spots, Spot } from '../data/spots';
import { fetchPOIs, POI } from '../services/OverpassService';

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
    isNavigating?: boolean;
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
    speed = 0,
    isNavigating = false
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    // markersRef removed
    // markersRef removed
    const spotMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
    const [pois, setPois] = useState<POI[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
        restaurant: true,
        cafe: true,
        toilet: true,
        tourism: true,
        convenience: true
    });

    // Persisted States
    const [is3D, setIs3D] = useState(() => localStorage.getItem('map_is3D') === 'true');
    const [isHistorical, setIsHistorical] = useState(() => localStorage.getItem('map_isHistorical') === 'true');
    const [isSpotsVisible, setIsSpotsVisible] = useState(() => localStorage.getItem('map_isSpotsVisible') !== 'false'); // Default true


    // Tracking State
    const [isTracking, setIsTracking] = useState(false);
    const isTrackingRef = useRef(false);

    // Sync isTracking ref
    useEffect(() => {
        isTrackingRef.current = isTracking;
    }, [isTracking]);

    // Enable tracking when navigation starts
    useEffect(() => {
        if (isNavigating) {
            setIsTracking(true);
        } else {
            setIsTracking(false);
        }
    }, [isNavigating]);

    // Effects to save state
    useEffect(() => localStorage.setItem('map_is3D', is3D.toString()), [is3D]);
    useEffect(() => localStorage.setItem('map_isHistorical', isHistorical.toString()), [isHistorical]);
    useEffect(() => localStorage.setItem('map_isSpotsVisible', isSpotsVisible.toString()), [isSpotsVisible]);


    // Refs for state access inside callbacks
    const isNavigatingRef = useRef(isNavigating);
    const lastUserLocationRef = useRef<{ lng: number, lat: number, heading: number } | null>(null);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // Sync isNavigating ref and update marker
    useEffect(() => {
        isNavigatingRef.current = isNavigating;
        updateUserMarker();
    }, [isNavigating]);

    // Function to update the custom user marker
    const updateUserMarker = () => {
        if (!mapRef.current) return;
        const location = lastUserLocationRef.current;

        if (isNavigatingRef.current && location) {
            // Show/Update Arrow Marker
            if (!userMarkerRef.current) {
                const el = document.createElement('div');
                el.className = 'user-marker-arrow';
                el.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 100 100" style="display:block;">
                    <filter id="shadow-user" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                    <circle cx="50" cy="50" r="20" fill="#007cbf" stroke="white" stroke-width="2" style="opacity: 0.3"/>
                    <path d="M50 15 L85 85 L50 70 L15 85 Z" fill="#FF8C00" stroke="white" stroke-width="4" filter="url(#shadow-user)" />
                </svg>
                `;
                el.style.width = '40px';
                el.style.height = '40px';

                userMarkerRef.current = new mapboxgl.Marker({
                    element: el,
                    rotationAlignment: 'map',
                    pitchAlignment: 'map'
                })
                    .setLngLat([location.lng, location.lat])
                    .setRotation(location.heading)
                    .addTo(mapRef.current);
            } else {
                userMarkerRef.current.setLngLat([location.lng, location.lat]);
                userMarkerRef.current.setRotation(location.heading);
            }
        } else {
            // Hide/Remove Arrow Marker
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
                userMarkerRef.current = null;
            }
        }
    };

    // Refs for callbacks to avoid stale closures in Mapbox event listeners
    const onUserLocationChangeRef = useRef(onUserLocationChange);
    const onStepsChangeRef = useRef(onStepsChange);
    const onRouteLoadedRef = useRef(onRouteLoaded);

    // Track user heading
    const currentHeadingRef = useRef<number>(0);

    // Track initial zoom for simulation
    const hasInitialZoomedRef = useRef(false);
    // Track previous navigation state to detect STOP
    const prevIsNavigatingRef = useRef(isNavigating);
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

                    // 1.5 Add Historical Source (GSI 1974-1978: "gazo1")
                    // ort_old10 (1960s) also lacked data. gazo1 (1974-78) has reliable nationwide coverage.
                    if (!map.getSource('historical-tiles')) {
                        map.addSource('historical-tiles', {
                            type: 'raster',
                            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg'],
                            tileSize: 256,
                            attribution: '国土地理院 (1974-1978)'
                        });
                    }

                    // Add Historical Layer (Initially hidden or visible based on state)
                    if (!map.getLayer('historical-layer')) {
                        map.addLayer({
                            id: 'historical-layer',
                            type: 'raster',
                            source: 'historical-tiles',
                            paint: {
                                'raster-opacity': 0.7, // Increased from 0.4 for better visibility
                                'raster-fade-duration': 300
                            },
                            layout: {
                                visibility: 'none' // Start hidden
                            }
                        });
                    }

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

                    // 3. 3D Terrain & Sky Atmosphere
                    map.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    // Increase exaggeration to emphasize the "Basin" (Bonchi) feel
                    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 2.2 });

                    // Add Sky Layer for depth and atmosphere
                    map.addLayer({
                        'id': 'sky',
                        'type': 'sky',
                        'paint': {
                            'sky-type': 'atmosphere',
                            'sky-atmosphere-sun': [0.0, 0.0],
                            'sky-atmosphere-sun-intensity': 15
                        }
                    });
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

                    // Disable tracking on manual interaction
                    const disableTracking = (e: any) => {
                        if (e.originalEvent) {
                            setIsTracking(false);
                            isTrackingRef.current = false;
                        }
                    };
                    map.on('dragstart', disableTracking);
                    map.on('touchstart', disableTracking);
                    map.on('wheel', disableTracking);


                    geolocate.on('geolocate', (position: any) => {
                        const cb = onUserLocationChangeRef.current;
                        if (cb) cb(position.coords.latitude, position.coords.longitude);

                        // Update heading ref & last location
                        const heading = (position.coords.heading !== null && position.coords.heading !== undefined)
                            ? position.coords.heading
                            : 0;

                        currentHeadingRef.current = heading;
                        lastUserLocationRef.current = {
                            lng: position.coords.longitude,
                            lat: position.coords.latitude,
                            heading: heading
                        };

                        // Update marker immediately
                        updateUserMarker();

                        // Follow User Location if Tracking
                        if (isTrackingRef.current) {
                            mapRef.current?.easeTo({
                                center: [position.coords.longitude, position.coords.latitude],
                                duration: 1000,
                                easing: (t) => t // Linear easing for smooth following
                            });
                        }
                    });

                    geolocate.on('error', (e: any) => {
                        console.error('Geolocate error:', e);
                        /* Suppressed user alerts for smoother experience
                        if (e.code === 1) {
                            alert('位置情報の利用が許可されていません。端末の設定で位置情報をオンにしてください。');
                        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                            alert('セキュリティ制約のため、位置情報はHTTPS接続（またはlocalhost）でのみ利用可能です。');
                        } else {
                            alert('現在地を取得できませんでした。電波の良い場所で再度お試しください。');
                        }
                        */
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

    const simulationMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // Navigation View Lock (North Up + 45deg Tilt)
    // Triggered when speed is detected OR navigation starts
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        const isMoving = speed > 3; // Threshold: 3km/h
        const shouldSnap = isMoving || (isNavigating && !hasSnappedToNavRef.current);

        if (shouldSnap) {
            // Force North Up and 45deg Tilt while moving, OR Heading Up if available
            // Use current heading if we are navigating and moving
            const targetBearing = (isNavigating && speed > 0 && currentHeadingRef.current)
                ? currentHeadingRef.current
                : 0;

            const options: any = {
                bearing: targetBearing,
                pitch: 45,
                duration: 500
            };

            // Force Zoom 16.5 (~200m) only on the VERY FIRST detection of movement or nav start
            if (!hasSnappedToNavRef.current) {
                options.zoom = 16.5;
                hasSnappedToNavRef.current = true;

                // Smart Center Logic: User Location -> Course Start
                if (lastUserLocationRef.current) {
                    options.center = [lastUserLocationRef.current.lng, lastUserLocationRef.current.lat];
                    console.log('[Map] Nav Start: Snapping to USER LOCATION');
                } else {
                    const currentRoute = explorationRoutes.find(r => r.id === activeRoute);
                    if (currentRoute?.startPoint) {
                        options.center = currentRoute.startPoint;
                        console.log('[Map] Nav Start: User Location unknown, snapping to COURSE START');
                    }
                }

                console.log(`[Map] ${isNavigating ? 'Nav Start' : 'Movement'} detected. Snapping to Nav View (Zoom 16.5, North Up, 45 Tilt)`);
            }

            if (!simulatedLocation) {
                map.easeTo(options);
            }
        }

        // REVERT VIEW ON STOP
        // If navigation was active and is now stopped
        if (prevIsNavigatingRef.current === true && isNavigating === false) {
            console.log('[Map] Navigation STOP detected. Reverting to Overview Mode.');
            hasSnappedToNavRef.current = false; // Reset for next run

            // Birds-eye view (Pitch 0, Bearing 0)
            map.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1000
            });

            // If a route/area is active, refit bounds to show the whole thing
            const targetRoute = explorationRoutes.find(r => r.id === activeRoute);
            if (targetRoute) {
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
                            duration: 1500
                        });
                    }
                } else {
                    map.flyTo({ center: targetRoute.startPoint, zoom: 15, duration: 1500 });
                }
            }
        }

        prevIsNavigatingRef.current = isNavigating;
    }, [speed, isNavigating, simulatedLocation, activeRoute]);

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

    useEffect(() => {
        if (!mapInstance) return;

        // Create markers if they don't exist
        if (spotMarkersRef.current.length === 0) {
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
                    .setPopup(popup); // Don't add to map yet

                spotMarkersRef.current.push(marker);
            });
        }

        // Toggle visibility
        spotMarkersRef.current.forEach(marker => {
            if (isSpotsVisible) {
                marker.addTo(mapInstance);
            } else {
                marker.remove();
            }
        });

    }, [mapInstance, isSpotsVisible]);


    // Handle Overpass POI Search
    const handleSearchArea = async () => {
        if (!mapInstance) return;

        setIsSearching(true);
        const bounds = mapInstance.getBounds();
        const searchBounds = {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast()
        };

        const newPois = await fetchPOIs(searchBounds);
        setPois(newPois);
        // Reset visibility to all true on new search
        setVisibleCategories({
            restaurant: true,
            cafe: true,
            toilet: true,
            tourism: true,
            convenience: true
        });
        setIsSearching(false);
    };

    // Render POI Markers
    useEffect(() => {
        if (!mapInstance) return;

        // Clear existing POI markers
        poiMarkersRef.current.forEach(marker => marker.remove());
        poiMarkersRef.current = [];

        pois.forEach(poi => {
            // Skip if category is hidden
            if (!visibleCategories[poi.type]) return;

            let color = '#555';
            let icon = '📍';

            switch (poi.type) {
                case 'restaurant': color = '#FF5722'; icon = '🍽️'; break;
                case 'cafe': color = '#795548'; icon = '☕'; break;
                case 'toilet': color = '#03A9F4'; icon = '🚻'; break;
                case 'tourism': color = '#E91E63'; icon = 'ℹ️'; break;
                case 'convenience': color = '#FF9800'; icon = '🏪'; break;
            }

            // Create custom element for emoji marker
            const el = document.createElement('div');
            el.className = 'poi-marker';
            el.innerHTML = `<div style="font-size: 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${icon}</div>`;

            const popupContent = `
                <div class="p-3 max-w-[200px] font-sans">
                    <h3 class="text-sm font-bold text-gray-800 mb-1">${poi.name}</h3>
                    <p class="text-xs text-gray-500 mb-1 capitalize">${poi.type}</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}" target="_blank" rel="noopener noreferrer" 
                       class="inline-block w-full text-center bg-blue-600 text-white text-[10px] py-1.5 rounded shadow-sm hover:bg-blue-700 transition-colors mt-1">
                        Googleマップで見る
                    </a>
                </div>
            `;

            const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '250px' })
                .setHTML(popupContent);

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([poi.lon, poi.lat])
                .setPopup(popup)
                .addTo(mapInstance);

            poiMarkersRef.current.push(marker);
        });

    }, [pois, mapInstance, visibleCategories]);


    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />



            {mapInstance && targetRoute?.data && (
                <GpxRouteLayer
                    key={activeRoute}
                    map={mapInstance}
                    isVisible={targetRoute.category === 'route'}
                    onRouteLoaded={onRouteLoaded}
                    routeData={targetRoute.data}
                />
            )}

            {/* Historical Toggle Button */}
            <button
                onClick={() => {
                    if (mapRef.current && mapRef.current.getLayer('historical-layer')) {
                        const nextState = !isHistorical;
                        mapRef.current.setLayoutProperty(
                            'historical-layer',
                            'visibility',
                            nextState ? 'visible' : 'none'
                        );
                        setIsHistorical(nextState);
                    }
                }}
                className={`absolute top-40 right-3 z-10 p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center font-bold text-xs
                    ${isHistorical
                        ? 'bg-sepia-700 text-white bg-[#5D4037] ring-2 ring-[#8D6E63]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                style={{ width: '40px', height: '40px' }}
                aria-label="Toggle Historical Map"
            >
                {isHistorical ? '古' : '今'}
            </button>

            {/* Current Location Button */}
            <button
                onClick={() => {
                    if (lastUserLocationRef.current && mapRef.current) {
                        mapRef.current.flyTo({
                            center: [lastUserLocationRef.current.lng, lastUserLocationRef.current.lat],
                            zoom: 15,
                            pitch: 45,
                            bearing: lastUserLocationRef.current.heading || 0,
                            duration: 1500
                        });
                        // Re-engage snap if navigating
                        if (isNavigating) {
                            hasSnappedToNavRef.current = true;
                        }
                    } else {
                        alert('現在地を取得できませんでした。');
                    }
                    // Enable tracking mode
                    setIsTracking(true);
                }}
                className="absolute top-52 right-3 z-10 bg-white text-satoyama-forest p-2 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-300"
                style={{ width: '40px', height: '40px' }}
                aria-label="Return to Current Location"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="22" y1="12" x2="18" y2="12"></line>
                    <line x1="6" y1="12" x2="2" y2="12"></line>
                    <line x1="12" y1="6" x2="12" y2="2"></line>
                    <line x1="12" y1="22" x2="12" y2="18"></line>
                </svg>
            </button>

            {/* 3D Mode Toggle Button */}
            <button
                onClick={() => {
                    if (mapRef.current) {
                        const nextState = !is3D;
                        setIs3D(nextState);

                        if (nextState) {
                            // Switch to 3D View
                            mapRef.current.easeTo({
                                pitch: 60,
                                duration: 1000
                            });
                        } else {
                            // Switch to 2D View
                            mapRef.current.easeTo({
                                pitch: 0,
                                bearing: 0, // Reset bearing in 2D for easier orientation
                                duration: 1000
                            });
                        }
                    }
                }}
                className={`absolute top-64 right-3 z-10 p-2 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center font-bold text-xs
                    ${is3D
                        ? 'bg-satoyama-forest text-white ring-2 ring-satoyama-leaf'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                style={{ width: '40px', height: '40px' }}
                aria-label="Toggle 3D View"
            >
                3D
            </button>

            {/* Spots Toggle Button */}
            <button
                onClick={() => setIsSpotsVisible(!isSpotsVisible)}
                className={`absolute top-[308px] right-3 z-10 p-2 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center font-bold text-xs
                    ${isSpotsVisible
                        ? 'bg-orange-600 text-white ring-2 ring-orange-800'
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                style={{ width: '40px', height: '40px' }}
                aria-label="Toggle Spots"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z"></path>
                    <path d="M12 11V3"></path>
                    <path d="M8 3h8"></path>
                    <path d="M12 3a4 4 0 0 1 4 4"></path>
                </svg>
            </button>

            {/* Overpass Search Button */}
            <button
                onClick={handleSearchArea}
                disabled={isSearching}
                className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 font-bold text-sm
                    ${isSearching ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-white text-blue-600 hover:bg-blue-50 ring-1 ring-blue-200'}`}
            >
                {isSearching ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        検索中...
                    </>
                ) : (
                    <>
                        <span className="text-lg">🔍</span>
                        このエリアで探す
                    </>
                )}
            </button>

            {/* POI Control Panel (Only visible when POIs are present) */}
            {pois.length > 0 && (
                <div className="absolute top-[60px] left-4 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 w-48 animate-slide-down">
                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                        <h3 className="text-xs font-bold text-gray-700">検索結果 ({pois.length})</h3>
                        <button
                            onClick={() => setPois([])}
                            className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        >
                            クリア
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {[
                            { id: 'restaurant', icon: '🍽️', label: 'レストラン' },
                            { id: 'cafe', icon: '☕', label: 'カフェ' },
                            { id: 'toilet', icon: '🚻', label: 'トイレ' },
                            { id: 'tourism', icon: 'ℹ️', label: '観光案内' },
                            { id: 'convenience', icon: '🏪', label: 'コンビニ' },
                        ].map(type => {
                            const count = pois.filter(p => p.type === type.id).length;
                            if (count === 0) return null;
                            return (
                                <label key={type.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors select-none">
                                    <input
                                        type="checkbox"
                                        checked={visibleCategories[type.id]}
                                        onChange={(e) => setVisibleCategories(prev => ({ ...prev, [type.id]: e.target.checked }))}
                                        className="rounded text-satoyama-forest focus:ring-satoyama-leaf w-3.5 h-3.5"
                                    />
                                    <span className="text-base">{type.icon}</span>
                                    <span className="text-xs text-gray-600 flex-1">{type.label}</span>
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded-full">{count}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div >
    );
};

export default Map;
