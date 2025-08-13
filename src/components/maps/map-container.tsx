"use client"

/**
 * Map Container Component
 * Main map component using Leaflet for Indonesian geography
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { LatLngExpression, Icon, DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'

// Fix for default markers in Next.js
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

export interface MapPoint {
  id: string
  position: LatLngExpression
  title: string
  description?: string
  type?: 'citizen' | 'facility' | 'boundary' | 'poi' | 'asset'
  data?: any
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapContainerProps {
  center?: LatLngExpression
  zoom?: number
  height?: string
  className?: string
  points?: MapPoint[]
  bounds?: MapBounds
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (point: MapPoint) => void
  showControls?: boolean
  enableDrawing?: boolean
  children?: React.ReactNode
}

// Map event handlers component
function MapEventHandler({ 
  onMapClick, 
  onMarkerClick 
}: { 
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (point: MapPoint) => void 
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

// Map bounds setter component
function MapBoundsSetter({ bounds }: { bounds?: MapBounds }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ])
    }
  }, [bounds, map])
  
  return null
}

// Custom marker icons for different types
const getMarkerIcon = (type: string = 'default') => {
  const iconConfigs = {
    citizen: {
      iconUrl: '/icons/citizen-marker.png',
      iconSize: [25, 25],
      className: 'citizen-marker'
    },
    facility: {
      iconUrl: '/icons/facility-marker.png',
      iconSize: [30, 30],
      className: 'facility-marker'
    },
    boundary: {
      iconUrl: '/icons/boundary-marker.png',
      iconSize: [20, 20],
      className: 'boundary-marker'
    },
    poi: {
      iconUrl: '/icons/poi-marker.png',
      iconSize: [25, 25],
      className: 'poi-marker'
    },
    asset: {
      iconUrl: '/icons/asset-marker.png',
      iconSize: [25, 25],
      className: 'asset-marker'
    },
    default: {
      iconUrl: '/leaflet/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: '/leaflet/marker-shadow.png',
      shadowSize: [41, 41]
    }
  }

  const config = iconConfigs[type as keyof typeof iconConfigs] || iconConfigs.default
  
  // Use DivIcon for custom styled markers
  if (type !== 'default') {
    return new DivIcon({
      html: `<div class="custom-marker ${config.className}"></div>`,
      iconSize: config.iconSize as [number, number],
      className: 'custom-div-icon'
    })
  }
  
  return new Icon(config)
}

export function LeafletMap({
  center = [-6.2088, 106.8456], // Default to Jakarta coordinates
  zoom = 13,
  height = '400px',
  className,
  points = [],
  bounds,
  onMapClick,
  onMarkerClick,
  showControls = true,
  enableDrawing = false,
  children
}: MapContainerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div 
        className={cn("bg-gray-200 animate-pulse rounded-lg flex items-center justify-center", className)}
        style={{ height }}
      >
        <span className="text-gray-500">Loading map...</span>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        zoomControl={showControls}
      >
        {/* Indonesian tile layers */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Alternative Indonesian tile layer */}
        {/* <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        /> */}

        {/* Map event handlers */}
        <MapEventHandler onMapClick={onMapClick} onMarkerClick={onMarkerClick} />
        
        {/* Set bounds if provided */}
        {bounds && <MapBoundsSetter bounds={bounds} />}

        {/* Render markers */}
        {points.map((point) => (
          <Marker
            key={point.id}
            position={point.position}
            icon={getMarkerIcon(point.type)}
            eventHandlers={{
              click: () => onMarkerClick?.(point)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{point.title}</h3>
                {point.description && (
                  <p className="text-xs text-gray-600 mt-1">{point.description}</p>
                )}
                {point.data && (
                  <div className="mt-2 text-xs">
                    {Object.entries(point.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {children}
      </MapContainer>

      {/* Map controls overlay */}
      {showControls && (
        <div className="absolute top-2 right-2 z-[1000] space-y-2">
          <div className="bg-white rounded shadow-md p-2">
            <div className="text-xs text-gray-600">
              Zoom: {zoom} | Points: {points.length}
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for markers */}
      <style jsx global>{`
        .custom-div-icon {
          background: transparent;
          border: none;
        }
        
        .custom-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .citizen-marker {
          background-color: #3b82f6;
        }
        
        .facility-marker {
          background-color: #10b981;
        }
        
        .boundary-marker {
          background-color: #f59e0b;
        }
        
        .poi-marker {
          background-color: #8b5cf6;
        }
        
        .asset-marker {
          background-color: #ef4444;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        
        .leaflet-popup-content {
          margin: 8px;
        }
      `}</style>
    </div>
  )
}

// Export dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-200 animate-pulse rounded-lg flex items-center justify-center h-96">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})