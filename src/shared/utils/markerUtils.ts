import type { DevicePoint } from '../types/marker'
import { STATUS_COLORS } from '../constants'

/**
 * Получает цвет маркера на основе статуса устройства
 */
export function getMarkerColor(marker) {
	if (!marker?.properties?.status) return 'gray'
	switch (marker.properties.status) {
		case 'completed':
			return 'green'
		case 'in_progress':
			return 'blue'
		case 'pending':
			return 'yellow'
		case 'no_work':
			return 'gray'
		default:
			return 'gray'
	}
}

/**
 * Проверяет, является ли маркер активным (имеет задачи)
 */
export function isMarkerActive(marker: DevicePoint): boolean {
	return marker.properties.status !== 'no_work'
}

/**
 * Фильтрует маркеры по заданным критериям
 */
export function filterMarkers(
	markers: DevicePoint[],
	filters: {
		statuses?: string[]
		clientIds?: string[]
		engineers?: string[]
		months?: number[]
	}
): DevicePoint[] {
	return markers.filter((marker) => {
		// Фильтр по статусам
		const statusOk =
			!filters.statuses?.length ||
			filters.statuses.includes(marker.properties.status)

		// Фильтр по клиентам
		const clientOk =
			!filters.clientIds?.length ||
			(marker.properties.address?.client_id &&
				filters.clientIds.includes(marker.properties.address.client_id))

		// Фильтр по исполнителям
		const engineerOk =
			!filters.engineers?.length ||
			(marker.properties.engineer &&
				filters.engineers.includes(marker.properties.engineer))

		// Фильтр по месяцам
		const monthsOk =
			!filters.months?.length ||
			(marker.properties.service_schedule &&
				marker.properties.service_schedule.some((month) =>
					filters.months!.includes(month)
				))

		return statusOk && clientOk && engineerOk && monthsOk
	})
}

/**
 * Создает новый маркер с базовыми значениями
 */
export function createNewMarker(
	coordinates: [number, number],
	address: string = 'Без адреса'
): DevicePoint {
	return {
		type: 'Feature',
		geometry: {
			type: 'Point',
			coordinates,
		},
		properties: {
			id: '',
			address_id: '',
			serial_number: '',
			model: '',
			filters: [],
			status: 'no_work',
			last_service_date: null,
			next_service_date: null,
			service_schedule: [],
			engineer: null,
			comments: null,
			created_at: '',
			updated_at: '',
			address: {
				id: '',
				client_id: '',
				full_address: address,
				coordinates: {
					lat: coordinates[1],
					lon: coordinates[0],
				},
				created_at: '',
				updated_at: '',
			},
		},
	}
}

/**
 * Обновляет свойства маркера
 */
export function updateMarkerProperties(
	marker: DevicePoint,
	updates: Partial<DevicePoint['properties']>
): DevicePoint {
	return {
		...marker,
		properties: {
			...marker.properties,
			...updates,
		},
	}
}
