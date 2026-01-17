
/**
 * Calculates the distance between two geographical points using the Haversine formula
 * @param lat1 First point latitude
 * @param lon1 First point longitude
 * @param lat2 Second point latitude
 * @param lon2 Second point longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Converts degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Checks if a point is within a certain radius of another point
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param centerLat Center point latitude
 * @param centerLng Center point longitude
 * @param radiusKm Radius in kilometers
 * @returns Boolean indicating if the user is within the radius
 */
export function isPointWithinRadius(
  userLat: number, 
  userLng: number, 
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLat, userLng, centerLat, centerLng);
  return distance <= radiusKm;
}
