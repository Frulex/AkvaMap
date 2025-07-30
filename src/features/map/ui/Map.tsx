import { Map } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useState, useEffect, useCallback } from 'react'
import { SmartSearch } from '../../smart-search/ui/SmartSearch'
import { FilterButton } from './FilterButton'
import { AddMarkerForm } from './AddMarkerForm'
import { MarkerInfoPanel } from '../../marker-info/ui/MarkerInfoPanel'
import type { DevicePoint } from '../../../shared/types/marker'
import { MapMarkers } from './MapMarkers'
import { useMarkersStore } from '../../../entities/marker/model/markersStore'
import { DEFAULT_COORDINATES, MAP_CONFIG } from '../../../shared/constants'

interface MapViewState {
	longitude: number
	latitude: number
	zoom: number
}

export function AkvaMap() {
	const {
		fetchMarkers,
		addMarker,
		selectedMarker,
		setSelectedMarker,
		filteredMarkers,
		updateMarkerInStore,
		deleteMarker,
	} = useMarkersStore()

	const [viewState, setViewState] = useState<MapViewState>({
		longitude: DEFAULT_COORDINATES.longitude,
		latitude: DEFAULT_COORDINATES.latitude,
		zoom: DEFAULT_COORDINATES.zoom,
	})
	const [isAdding, setIsAdding] = useState(false)
	const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(
		null
	)
	const [selectedAddress, setSelectedAddress] = useState<string>('')

	useEffect(() => {
		fetchMarkers()
	}, [fetchMarkers])

	const handleStartAdding = () => {
		setIsAdding(true)
		setPendingCoords(null)
		setSelectedAddress('')
	}

	const handleCancelAdding = () => {
		setIsAdding(false)
		setPendingCoords(null)
		setSelectedAddress('')
	}

	const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
		if (isAdding) {
			const { lng, lat } = event.lngLat
			setPendingCoords([lng, lat])
		}
	}

	const handleSearchedCoords = useCallback(
		(coords: { lon: number; lat: number; address?: string }) => {
			if (!isAdding) {
				const existing = filteredMarkers().find(
					(m) =>
						m.geometry.coordinates[0] === coords.lon &&
						m.geometry.coordinates[1] === coords.lat
				)
				if (existing) {
					setSelectedMarker(existing)
					return
				}
				setIsAdding(true)
			}
			setPendingCoords([coords.lon, coords.lat])
			if (coords.address) setSelectedAddress(coords.address)
		},
		[isAdding, filteredMarkers, setSelectedMarker]
	)

	const handleAddMarker = async (deviceData: {
		address_id: string
		serial_number: string
		model: string
		filters?: unknown[]
		engineer?: string
		comments?: string
	}) => {
		try {
			await addMarker(deviceData)
			setIsAdding(false)
			setPendingCoords(null)
			setSelectedAddress('')
		} catch (error) {
			console.error('Ошибка добавления маркера:', error)
		}
	}

	const handleMarkerClick = useCallback(
		(marker: DevicePoint) => {
			setSelectedMarker(marker)
		},
		[setSelectedMarker]
	)

	return (
		<div className="relative h-full w-full">
			{/* Верхняя панель с поиском и фильтрами */}
			<div className="absolute top-4 left-4 z-10 flex items-center gap-3">
				<SmartSearch handleSearchedCoords={handleSearchedCoords} />
				<FilterButton />
			</div>

			<Map
				mapLib={maplibregl}
				mapStyle={MAP_CONFIG.STYLE_URL}
				style={{ width: '100%', height: '100%' }}
				dragPan={true}
				touchZoomRotate={true}
				scrollZoom={true}
				doubleClickZoom={true}
				keyboard={true}
				{...viewState}
				onMove={(evt) => setViewState(evt.viewState)}
				onClick={handleMapClick}
			>
				<MapMarkers
					markers={filteredMarkers()}
					onMarkerClick={handleMarkerClick}
					isAdding={isAdding}
					// Новый пропс для временного маркера
					tempMarker={
						isAdding && pendingCoords
							? {
									geometry: { type: 'Point', coordinates: pendingCoords },
									properties: { id: 'temp', status: 'draft' },
									type: 'Feature',
								}
							: undefined
					}
				/>
			</Map>

			{isAdding && (
				<AddMarkerForm
					coordinates={
						pendingCoords || [
							DEFAULT_COORDINATES.longitude,
							DEFAULT_COORDINATES.latitude,
						]
					}
					address={selectedAddress}
					onSave={handleAddMarker}
					onCancel={handleCancelAdding}
				/>
			)}

			{selectedMarker && (
				<MarkerInfoPanel
					marker={selectedMarker}
					onClose={() => setSelectedMarker(null)}
					onUpdate={updateMarkerInStore}
					onDelete={deleteMarker}
				/>
			)}
		</div>
	)
}
