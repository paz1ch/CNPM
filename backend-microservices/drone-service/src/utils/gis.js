/**
 * Haversine formula to calculate the distance between two lat/lng points in kilometers.
 * @param {object} point1 - The first point {lat, lng}.
 * @param {object} point2 - The second point {lat, lng}.
 * @returns {number} The distance in kilometers.
 */
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    const lat1 = point1.lat * (Math.PI / 180);
    const lat2 = point2.lat * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * Generates a simple interpolated path between two points.
 * For a real-world scenario, this would involve a proper routing engine.
 * @param {object} startPoint - The starting point {lat, lng}.
 * @param {object} endPoint - The ending point {lat, lng}.
 * @param {number} numPoints - The number of points to interpolate. Defaults to 20.
 * @returns {Array<object>} An array of {lat, lng} points representing the path.
 */
function calculatePath(startPoint, endPoint, numPoints = 20) {
    const path = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat = startPoint.lat + t * (endPoint.lat - startPoint.lat);
        const lng = startPoint.lng + t * (endPoint.lng - startPoint.lng);
        path.push({ lat, lng });
    }
    return path;
}

/**
 * Moves a point along a path by a certain distance.
 * This is a simplified simulation function.
 * @param {Array<object>} path - The array of {lat, lng} points.
 * @param {object} currentLocation - The current {lat, lng} of the object.
 * @param {number} distanceToMove - The distance to move in kilometers.
 * @returns {object} The new {lat, lng} and whether the destination is reached.
 */
function moveAlongPath(path, currentLocation, distanceToMove) {
    let remainingDistance = distanceToMove;
    let currentPathIndex = findClosestPointIndex(path, currentLocation);

    // If already at the last point, do nothing.
    if (currentPathIndex >= path.length - 1) {
        return { newLocation: path[path.length - 1], reachedDestination: true };
    }

    let newLocation = { ...currentLocation };

    while (remainingDistance > 0 && currentPathIndex < path.length - 1) {
        const nextPoint = path[currentPathIndex + 1];
        const distanceToNextPoint = calculateDistance(newLocation, nextPoint);

        if (remainingDistance >= distanceToNextPoint) {
            remainingDistance -= distanceToNextPoint;
            newLocation = nextPoint;
            currentPathIndex++;
        } else {
            const ratio = remainingDistance / distanceToNextPoint;
            newLocation = {
                lat: newLocation.lat + (nextPoint.lat - newLocation.lat) * ratio,
                lng: newLocation.lng + (nextPoint.lng - newLocation.lng) * ratio,
            };
            remainingDistance = 0;
        }
    }
    
    const reachedDestination = currentPathIndex >= path.length - 1;

    return { newLocation, reachedDestination };
}

function findClosestPointIndex(path, point) {
    let closestIndex = 0;
    let minDistance = Infinity;

    path.forEach((pathPoint, index) => {
        const distance = calculateDistance(point, pathPoint);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}


module.exports = {
    calculateDistance,
    calculatePath,
    moveAlongPath
};
