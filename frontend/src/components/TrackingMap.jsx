import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { motion } from 'framer-motion';

const containerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '1.5rem'
};

const defaultCenter = {
    lat: 10.762622,
    lng: 106.660172
};

const TrackingMap = ({ droneLocation, restaurantLocation, customerLocation }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    });

    const [map, setMap] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Fit bounds to show all markers
    useEffect(() => {
        if (map && restaurantLocation && customerLocation) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(restaurantLocation);
            bounds.extend(customerLocation);
            if (droneLocation) bounds.extend(droneLocation);
            map.fitBounds(bounds);
        }
    }, [map, restaurantLocation, customerLocation, droneLocation]);

    if (!isLoaded) {
        return (
            <div className="w-full h-[500px] bg-gray-100 rounded-3xl flex items-center justify-center">
                <p className="text-gray-500">Loading Map...</p>
            </div>
        );
    }

    const pathOptions = {
        strokeColor: "#FF6B35",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        geodesic: true,
    };

    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-premium-lg border-4 border-white relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={droneLocation || defaultCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {/* Restaurant Marker */}
                {restaurantLocation && (
                    <Marker
                        position={restaurantLocation}
                        label={{
                            text: "🏪",
                            fontSize: "24px",
                            className: "map-marker-label"
                        }}
                        title="Restaurant"
                    />
                )}

                {/* Customer Marker */}
                {customerLocation && (
                    <Marker
                        position={customerLocation}
                        label={{
                            text: "🏠",
                            fontSize: "24px",
                            className: "map-marker-label"
                        }}
                        title="You"
                    />
                )}

                {/* Drone Marker */}
                {droneLocation && (
                    <Marker
                        position={droneLocation}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#4F46E5",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#ffffff",
                        }}
                        label={{
                            text: "🚁",
                            fontSize: "24px",
                            className: "map-marker-label"
                        }}
                        title="Drone"
                    />
                )}

                {/* Path Line */}
                {restaurantLocation && customerLocation && (
                    <Polyline
                        path={[restaurantLocation, customerLocation]}
                        options={pathOptions}
                    />
                )}
            </GoogleMap>


        </div>
    );
};

export default React.memo(TrackingMap);
