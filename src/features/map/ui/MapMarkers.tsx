import { Marker } from 'react-map-gl/maplibre'
import type { DevicePoint } from '../../../shared/types/marker'
import { getMarkerColor } from '../../../shared/utils/markerUtils'
import { UI_CONSTANTS } from '../../../shared/constants'

interface MapMarkersProps {
	markers: DevicePoint[]
	onMarkerClick: (marker: DevicePoint) => void
	isAdding: boolean
	tempMarker?: DevicePoint
}

export function MapMarkers({
	markers,
	onMarkerClick,
	isAdding,
	tempMarker,
}: MapMarkersProps) {
	if (!Array.isArray(markers)) {
		return null
	}

	const validMarkers = markers.filter(
		(m) =>
			m &&
			m.properties &&
			m.properties.status &&
			m.geometry &&
			Array.isArray(m.geometry.coordinates)
	)

	return (
		<>
			{validMarkers.map((marker) => {
				const color = getMarkerColor(marker)

				return (
					<Marker
						key={marker.properties.id}
						longitude={marker.geometry.coordinates[0]}
						latitude={marker.geometry.coordinates[1]}
						onClick={(e) => {
							e.originalEvent.stopPropagation()
							if (!isAdding) {
								onMarkerClick(marker)
							}
						}}
					>
						<div
							style={{
								backgroundColor: color,
								width: UI_CONSTANTS.MARKER_SIZE,
								height: UI_CONSTANTS.MARKER_SIZE,
							}}
							className="rounded-full border-2 border-white shadow-lg cursor-pointer"
						/>
					</Marker>
				)
			})}
			{/* Временный маркер */}
			{tempMarker && (
				<Marker
					key="temp-marker"
					longitude={tempMarker.geometry.coordinates[0]}
					latitude={tempMarker.geometry.coordinates[1]}
				>
					<div
						style={{
							backgroundColor: '#8884ff', // Особый цвет для временного маркера
							width: UI_CONSTANTS.MARKER_SIZE,
							height: UI_CONSTANTS.MARKER_SIZE,
							border: '2px dashed #fff',
						}}
						className="rounded-full shadow-lg opacity-70 pointer-events-none"
					/>
				</Marker>
			)}
		</>
	)
}
