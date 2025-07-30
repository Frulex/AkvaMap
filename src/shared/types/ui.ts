import type { DevicePoint } from './marker'
import type { ICoordinates } from '../../features/smart-search/model/geocode'

// Типы для UI компонентов
export interface ViewState {
	longitude: number
	latitude: number
	zoom: number
}

export interface MarkerSidebarProps {
	mode: 'view' | 'edit'
	onSave?: (data: Partial<DevicePoint['properties']>) => void
	onCancel?: () => void
	onClose?: () => void
}

export interface SmartSearchProps {
	handleSearchedCoords: (coords: ICoordinates) => void
}

export interface MapProps {
	onMarkerClick?: (marker: DevicePoint) => void
	onMapClick?: (coords: [number, number]) => void
	onAddMarker?: (data: Partial<DevicePoint['properties']>) => void
}

// Типы для форм
export interface MarkerFormData {
	model: string
	address: string
	contractors: DevicePoint['properties']['contractors']
	task_status: string
	to_schedule: number[]
}

// Типы для фильтров
export interface FilterState {
	contractors: number[]
	statuses: string[]
	months: number[]
}
