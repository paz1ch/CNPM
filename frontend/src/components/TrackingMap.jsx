import React, { useEffect, useRef } from 'react';

const TrackingMap = ({ droneLocation, restaurantLocation, customerLocation }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const polylineRef = useRef(null);

    useEffect(() => {
        // Initialize map if not already initialized
        if (!mapInstanceRef.current && mapRef.current && window.L) {
            const map = window.L.map(mapRef.current).setView([10.762622, 106.660172], 13);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map || !window.L) return;

        // Helper to update markers
        const updateMarker = (key, location, iconHtml, size = [30, 30]) => {
            if (location) {
                const latLng = [location.lat, location.lng];

                if (markersRef.current[key]) {
                    markersRef.current[key].setLatLng(latLng);
                } else {
                    const icon = window.L.divIcon({
                        className: 'custom-div-icon',
                        html: iconHtml,
                        iconSize: size,
                        iconAnchor: [size[0] / 2, size[1] / 2]
                    });

                    markersRef.current[key] = window.L.marker(latLng, { icon }).addTo(map);
                }
            } else if (markersRef.current[key]) {
                map.removeLayer(markersRef.current[key]);
                delete markersRef.current[key];
            }
        };

        updateMarker('restaurant', restaurantLocation, '<div style="font-size: 24px;">🏪</div>');
        updateMarker('customer', customerLocation, '<div style="font-size: 24px;">🏠</div>');

        // Drone marker
        if (droneLocation) {
            const latLng = [droneLocation.lat, droneLocation.lng];
            if (markersRef.current.drone) {
                markersRef.current.drone.setLatLng(latLng);
            } else {
                const icon = window.L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="font-size: 24px; background: #4F46E5; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">🚁</div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                markersRef.current.drone = window.L.marker(latLng, { icon }).addTo(map);
            }
        }

        // Polyline
        if (restaurantLocation && customerLocation) {
            const latLngs = [
                [restaurantLocation.lat, restaurantLocation.lng],
                [customerLocation.lat, customerLocation.lng]
            ];

            if (polylineRef.current) {
                polylineRef.current.setLatLngs(latLngs);
            } else {
                polylineRef.current = window.L.polyline(latLngs, { color: '#FF6B35', weight: 4, opacity: 0.8 }).addTo(map);
            }

            // Fit bounds
            const bounds = window.L.latLngBounds(latLngs);
            if (droneLocation) bounds.extend([droneLocation.lat, droneLocation.lng]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }

    }, [droneLocation, restaurantLocation, customerLocation]);

    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-premium-lg border-4 border-white relative z-0">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
};

export default React.memo(TrackingMap);
