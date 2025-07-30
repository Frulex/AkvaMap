import { create } from 'zustand'
import { markerService } from '../../../shared/services/markerService'
import type { DevicePoint } from '../../../shared/types/marker'
import type { ApiRequestParams } from '../../../shared/types/api'

interface MarkersState {
	markers: DevicePoint[]
	selectedMarker: DevicePoint | null
	isLoading: boolean
	error: string | null
	filters: {
		status: string[]
		clientId: string | null
		engineer: string | null
		serviceMonth: number | null
	}
}

interface MarkersActions {
	// Основные действия
	fetchMarkers: () => Promise<void>
	addMarker: (deviceData: {
		address_id: string
		serial_number: string
		model: string
		filters?: unknown[]
		engineer?: string
		comments?: string
	}) => Promise<void>
	updateMarker: (id: string, marker: DevicePoint) => Promise<void>
	deleteMarker: (id: string) => Promise<void>

	// Управление состоянием
	setSelectedMarker: (marker: DevicePoint | null) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void

	// Обновление маркера в store
	updateMarkerInStore: (updatedMarker: DevicePoint) => void

	// Фильтрация
	setFilters: (filters: Partial<MarkersState['filters']>) => void
	clearFilters: () => void

	// Вычисляемые значения
	filteredMarkers: () => DevicePoint[]
}

export const useMarkersStore = create<MarkersState & MarkersActions>(
	(set, get) => ({
		// Начальное состояние
		markers: [],
		selectedMarker: null,
		isLoading: false,
		error: null,
		filters: {
			status: [],
			clientId: null,
			engineer: null,
			serviceMonth: null,
		},

		// Действия
		fetchMarkers: async () => {
			set({ isLoading: true, error: null })
			try {
				const filters = get().filters
				const params: ApiRequestParams = {}

				if (filters.status.length > 0) {
					// Берем первый статус, так как API поддерживает только один
					params.status = filters.status[0]
				}
				if (filters.clientId) {
					params.client_id = filters.clientId
				}
				if (filters.engineer) {
					params.engineer = filters.engineer
				}
				if (filters.serviceMonth) {
					params.service_month = filters.serviceMonth
				}

				const markers = await markerService.getMarkers(params)
				set({ markers, isLoading: false })
			} catch (error) {
				set({
					error:
						error instanceof Error ? error.message : 'Ошибка загрузки маркеров',
					isLoading: false,
				})
			}
		},

		addMarker: async (deviceData: {
			address_id: string
			serial_number: string
			model: string
			filters?: unknown[]
			engineer?: string
			comments?: string
		}) => {
			set({ isLoading: true, error: null })
			try {
				const newDevice = await markerService.createDevice(deviceData)

				// Получаем адрес для получения координат
				const address = await markerService.getAddress(deviceData.address_id)

				// Создаем новый маркер с правильными координатами
				const newMarker: DevicePoint = {
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: address.coordinates
							? [address.coordinates.lon, address.coordinates.lat]
							: [0, 0],
					},
					properties: {
						id: newDevice.id,
						serial_number: newDevice.serial_number,
						model: newDevice.model,
						status: newDevice.status,
						engineer: newDevice.engineer,
						address: address.full_address,
						client_name: address.client?.name || 'Неизвестный клиент',
					},
				}

				// Добавляем новый маркер в состояние
				set((state) => ({
					markers: [...state.markers, newMarker],
					isLoading: false,
				}))
			} catch (error) {
				set({
					error:
						error instanceof Error ? error.message : 'Ошибка создания маркера',
					isLoading: false,
				})
			}
		},

		updateMarker: async (id: string, marker: DevicePoint) => {
			set({ isLoading: true, error: null })
			try {
				await markerService.updateDevice(id, marker.properties)
				// Обновляем список маркеров
				await get().fetchMarkers()
			} catch (error) {
				set({
					error:
						error instanceof Error
							? error.message
							: 'Ошибка обновления маркера',
					isLoading: false,
				})
			}
		},

			deleteMarker: async (id: string) => {
		set({ isLoading: true, error: null })
		try {
			await markerService.deleteDevice(id)
			// Удаляем маркер из локального состояния сразу
			set((state) => ({
				markers: state.markers.filter(marker => marker.properties.id !== id),
				selectedMarker: state.selectedMarker?.properties.id === id ? null : state.selectedMarker,
				isLoading: false,
			}))
		} catch (error) {
			set({
				error:
					error instanceof Error ? error.message : 'Ошибка удаления маркера',
				isLoading: false,
			})
		}
	},

		setSelectedMarker: (marker) => {
			set({ selectedMarker: marker })
		},

		setLoading: (loading) => {
			set({ isLoading: loading })
		},

		setError: (error) => {
			set({ error })
		},

		updateMarkerInStore: (updatedMarker: DevicePoint) => {
			set((state) => {
				const updatedMarkers = state.markers.map((marker) =>
					marker.properties.id === updatedMarker.properties.id
						? updatedMarker
						: marker
				)

				// Также обновляем selectedMarker, если это тот же маркер
				const updatedSelectedMarker = state.selectedMarker?.properties.id === updatedMarker.properties.id
					? updatedMarker
					: state.selectedMarker

				return {
					markers: updatedMarkers,
					selectedMarker: updatedSelectedMarker,
				}
			})
		},

		setFilters: (newFilters) => {
			set((state) => ({
				filters: { ...state.filters, ...newFilters },
			}))
		},

		clearFilters: () => {
			set({
				filters: {
					status: [],
					clientId: null,
					engineer: null,
					serviceMonth: null,
				},
			})
		},

		filteredMarkers: () => {
			const { markers, filters } = get()

			return markers.filter((marker) => {
				// Фильтр по статусу
				if (filters.status.length > 0) {
					if (!filters.status.includes(marker.properties.status)) {
						return false
					}
				}

				// Фильтр по клиенту
				if (filters.clientId && marker.properties.address?.client_id) {
					if (marker.properties.address.client_id !== filters.clientId) {
						return false
					}
				}

				// Фильтр по исполнителю
				if (filters.engineer && marker.properties.engineer) {
					if (marker.properties.engineer !== filters.engineer) {
						return false
					}
				}

				// Фильтр по месяцу обслуживания
				if (filters.serviceMonth && marker.properties.service_schedule) {
					if (
						!marker.properties.service_schedule.includes(filters.serviceMonth)
					) {
						return false
					}
				}

				return true
			})
		},
	})
)
