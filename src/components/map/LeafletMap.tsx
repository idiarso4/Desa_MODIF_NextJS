"use client"
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

export function LeafletMap({ center, zoom = 13 }: { center: LatLngExpression; zoom?: number }) {
  return (
    <div className="w-full h-[480px] rounded overflow-hidden border">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>Lokasi Pusat Desa</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

