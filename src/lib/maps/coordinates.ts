/**
 * Coordinate and GIS Utilities
 * Utilities for handling geographic coordinates and calculations
 */

export interface Coordinate {
  lat: number
  lng: number
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'
    coordinates: number[] | number[][] | number[][][]
  }
  properties: Record<string, any>
}

/**
 * Indonesian administrative regions with their approximate coordinates
 */
export const INDONESIA_REGIONS = {
  // Major cities
  JAKARTA: { lat: -6.2088, lng: 106.8456 },
  SURABAYA: { lat: -7.2575, lng: 112.7521 },
  BANDUNG: { lat: -6.9175, lng: 107.6191 },
  MEDAN: { lat: 3.5952, lng: 98.6722 },
  SEMARANG: { lat: -6.9667, lng: 110.4167 },
  MAKASSAR: { lat: -5.1477, lng: 119.4327 },
  PALEMBANG: { lat: -2.9761, lng: 104.7754 },
  
  // Provinces (approximate centers)
  ACEH: { lat: 4.695135, lng: 96.749397 },
  NORTH_SUMATRA: { lat: 2.1154, lng: 99.5451 },
  WEST_SUMATRA: { lat: -0.7893, lng: 100.6514 },
  RIAU: { lat: 0.2933, lng: 101.7068 },
  JAMBI: { lat: -1.4851, lng: 102.4381 },
  SOUTH_SUMATRA: { lat: -3.3194, lng: 103.9140 },
  BENGKULU: { lat: -3.8004, lng: 102.2655 },
  LAMPUNG: { lat: -4.5585, lng: 105.4068 },
  BANGKA_BELITUNG: { lat: -2.7410, lng: 106.4405 },
  RIAU_ISLANDS: { lat: 3.9456, lng: 108.1429 },
  JAKARTA: { lat: -6.2088, lng: 106.8456 },
  WEST_JAVA: { lat: -6.9147, lng: 107.6098 },
  CENTRAL_JAVA: { lat: -7.1500, lng: 110.1403 },
  YOGYAKARTA: { lat: -7.8753, lng: 110.4262 },
  EAST_JAVA: { lat: -7.5360, lng: 112.2384 },
  BANTEN: { lat: -6.4058, lng: 106.0640 },
  BALI: { lat: -8.4095, lng: 115.1889 },
  WEST_NUSA_TENGGARA: { lat: -8.6529, lng: 117.3616 },
  EAST_NUSA_TENGGARA: { lat: -8.6574, lng: 121.0794 },
  WEST_KALIMANTAN: { lat: -0.2787, lng: 111.4752 },
  CENTRAL_KALIMANTAN: { lat: -1.6815, lng: 113.3824 },
  SOUTH_KALIMANTAN: { lat: -2.7118, lng: 115.2837 },
  EAST_KALIMANTAN: { lat: 1.5709, lng: 116.0187 },
  NORTH_KALIMANTAN: { lat: 2.7200, lng: 116.9119 },
  NORTH_SULAWESI: { lat: 0.6246, lng: 123.9750 },
  CENTRAL_SULAWESI: { lat: -1.4300, lng: 121.4456 },
  SOUTH_SULAWESI: { lat: -3.6687, lng: 119.9740 },
  SOUTHEAST_SULAWESI: { lat: -4.1400, lng: 122.1746 },
  GORONTALO: { lat: 0.7077, lng: 122.4441 },
  WEST_SULAWESI: { lat: -2.8441, lng: 119.2320 },
  MALUKU: { lat: -3.2385, lng: 130.1453 },
  NORTH_MALUKU: { lat: 1.5709, lng: 127.8088 },
  WEST_PAPUA: { lat: -1.3361, lng: 133.1747 },
  PAPUA: { lat: -4.2699, lng: 138.0804 }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLng = toRadians(coord2.lng - coord1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Calculate bearing between two coordinates
 */
export function calculateBearing(coord1: Coordinate, coord2: Coordinate): number {
  const dLng = toRadians(coord2.lng - coord1.lng)
  const lat1 = toRadians(coord1.lat)
  const lat2 = toRadians(coord2.lat)
  
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  
  const bearing = toDegrees(Math.atan2(y, x))
  return (bearing + 360) % 360
}

/**
 * Check if a coordinate is within a bounding box
 */
export function isWithinBounds(coord: Coordinate, bounds: BoundingBox): boolean {
  return (
    coord.lat >= bounds.south &&
    coord.lat <= bounds.north &&
    coord.lng >= bounds.west &&
    coord.lng <= bounds.east
  )
}

/**
 * Calculate bounding box for a set of coordinates
 */
export function calculateBounds(coordinates: Coordinate[]): BoundingBox {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounds for empty coordinate array')
  }
  
  let north = coordinates[0].lat
  let south = coordinates[0].lat
  let east = coordinates[0].lng
  let west = coordinates[0].lng
  
  coordinates.forEach(coord => {
    north = Math.max(north, coord.lat)
    south = Math.min(south, coord.lat)
    east = Math.max(east, coord.lng)
    west = Math.min(west, coord.lng)
  })
  
  return { north, south, east, west }
}

/**
 * Expand bounding box by a given margin (in degrees)
 */
export function expandBounds(bounds: BoundingBox, margin: number): BoundingBox {
  return {
    north: bounds.north + margin,
    south: bounds.south - margin,
    east: bounds.east + margin,
    west: bounds.west - margin
  }
}

/**
 * Generate a grid of coordinates within a bounding box
 */
export function generateGrid(bounds: BoundingBox, gridSize: number): Coordinate[] {
  const coordinates: Coordinate[] = []
  const latStep = (bounds.north - bounds.south) / gridSize
  const lngStep = (bounds.east - bounds.west) / gridSize
  
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      coordinates.push({
        lat: bounds.south + (i * latStep),
        lng: bounds.west + (j * lngStep)
      })
    }
  }
  
  return coordinates
}

/**
 * Validate coordinate format
 */
export function validateCoordinate(coord: any): coord is Coordinate {
  return (
    typeof coord === 'object' &&
    coord !== null &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  )
}

/**
 * Format coordinate for display
 */
export function formatCoordinate(coord: Coordinate, precision: number = 6): string {
  return `${coord.lat.toFixed(precision)}, ${coord.lng.toFixed(precision)}`
}

/**
 * Parse coordinate string
 */
export function parseCoordinate(coordString: string): Coordinate | null {
  const parts = coordString.split(',').map(s => s.trim())
  if (parts.length !== 2) return null
  
  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])
  
  if (isNaN(lat) || isNaN(lng)) return null
  
  const coord = { lat, lng }
  return validateCoordinate(coord) ? coord : null
}

/**
 * Convert coordinate to Indonesian grid reference system
 */
export function toIndonesianGrid(coord: Coordinate): string {
  // Simplified Indonesian grid system (UTM zones)
  const zone = Math.floor((coord.lng + 180) / 6) + 1
  const hemisphere = coord.lat >= 0 ? 'N' : 'S'
  
  return `UTM ${zone}${hemisphere}`
}

/**
 * Get administrative level from coordinate (mock implementation)
 */
export function getAdministrativeLevel(coord: Coordinate): {
  province?: string
  regency?: string
  district?: string
  village?: string
} {
  // This would typically use a reverse geocoding service
  // For now, return a mock implementation
  return {
    province: 'Unknown Province',
    regency: 'Unknown Regency',
    district: 'Unknown District',
    village: 'Unknown Village'
  }
}

/**
 * Indonesian coordinate system utilities
 */
export const INDONESIAN_COORDINATE_SYSTEMS = {
  WGS84: 'EPSG:4326',
  UTM_ZONE_47N: 'EPSG:32647',
  UTM_ZONE_48N: 'EPSG:32648',
  UTM_ZONE_49N: 'EPSG:32649',
  UTM_ZONE_50N: 'EPSG:32650',
  UTM_ZONE_51N: 'EPSG:32651',
  UTM_ZONE_52N: 'EPSG:32652',
  UTM_ZONE_53N: 'EPSG:32653',
  UTM_ZONE_54N: 'EPSG:32654'
}

/**
 * Get appropriate UTM zone for Indonesian coordinates
 */
export function getUTMZone(coord: Coordinate): string {
  const zone = Math.floor((coord.lng + 180) / 6) + 1
  
  // Indonesian UTM zones typically range from 47N to 54N
  if (zone >= 47 && zone <= 54) {
    return INDONESIAN_COORDINATE_SYSTEMS[`UTM_ZONE_${zone}N` as keyof typeof INDONESIAN_COORDINATE_SYSTEMS]
  }
  
  return INDONESIAN_COORDINATE_SYSTEMS.WGS84
}