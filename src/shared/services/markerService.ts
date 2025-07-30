import type { DevicePoint } from '../types/marker'
import type {
	ApiRequestParams,
	CreateDeviceRequest,
	UpdateDeviceRequest,
	CreateAddressRequest,
	CreateClientRequest,
} from '../types/api'
import { API_CONFIG } from '../constants'

class MarkerService {
	private baseUrl = API_CONFIG.BASE_URL

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`
		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		}

		try {
			const response = await fetch(url, config)

			if (!response.ok) {
				const errorText = await response.text()

				let errorMessage = `HTTP ${response.status}: ${response.statusText}`
				try {
					const errorData = JSON.parse(errorText)
					if (errorData.detail) {
						errorMessage = errorData.detail
					} else if (errorData.message) {
						errorMessage = errorData.message
					}
				} catch (e) {
					// Если не удалось распарсить JSON, используем текст ошибки
					errorMessage = errorText || errorMessage
				}

				throw new Error(errorMessage)
			}

			const data = await response.json()
			return data
		} catch (error) {
			if (error instanceof TypeError && error.message.includes('fetch')) {
				throw new Error(
					'CORS Error: Unable to connect to server. Please check if the backend is running and CORS is configured properly.'
				)
			}
			throw error
		}
	}

	async getMarkers(params?: ApiRequestParams): Promise<DevicePoint[]> {
		const query: string[] = []

		if (params?.status) {
			query.push(`status=${params.status}`)
		}
		if (params?.client_id) {
			query.push(`client_id=${params.client_id}`)
		}
		if (params?.engineer) {
			query.push(`engineer=${params.engineer}`)
		}
		if (params?.service_month) {
			query.push(`service_month=${params.service_month}`)
		}

		const queryString = query.length ? `?${query.join('&')}` : ''

		const response = await this.request<any[]>(
			`${API_CONFIG.ENDPOINTS.DEVICES_FULL_INFO}${queryString}`
		)

		// Проверяем структуру ответа и преобразуем в DevicePoint
		let devices: any[] = []
		if (Array.isArray(response)) {
			devices = response
		} else if (
			response &&
			typeof response === 'object' &&
			'items' in response
		) {
			devices = response.items || []
		} else {
			return []
		}

		// Преобразуем DeviceWithAddressAndClient в DevicePoint
		const markers: DevicePoint[] = devices.map((device) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: device.address?.coordinates
					? [device.address.coordinates.lon, device.address.coordinates.lat]
					: [0, 0],
			},
			properties: {
				id: device.id,
				address_id: device.address_id,
				serial_number: device.serial_number,
				model: device.model,
				filters: device.filters || [],
				status: device.status,
				last_service_date: device.last_service_date,
				service_schedule: device.service_schedule || [],
				engineer: device.engineer,
				comments: device.comments,
				planned_service_date: device.planned_service_date,
				price: device.price,
				service: device.service,
				quantity: device.quantity,
				created_at: device.created_at,
				updated_at: device.updated_at,
				address: device.address,
				client: device.client,
			},
		}))

		return markers
	}

	async getAddress(addressId: string): Promise<any> {
		const response = await this.request<any>(
			`${API_CONFIG.ENDPOINTS.ADDRESSES}/${addressId}`
		)
		return response
	}

	async getAddressByClientAndAddress(
		clientId: string,
		fullAddress: string
	): Promise<any> {
		const response = await this.request<any>(
			`${API_CONFIG.ENDPOINTS.ADDRESSES}/client/${clientId}/by-address?full_address=${encodeURIComponent(fullAddress)}`
		)
		return response
	}

	async getDevice(deviceId: string): Promise<DevicePoint> {
		const response = await this.request<any>(
			`${API_CONFIG.ENDPOINTS.DEVICES}/${deviceId}`
		)

		// Преобразуем ответ в DevicePoint
		return {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: response.address?.coordinates
					? [response.address.coordinates.lon, response.address.coordinates.lat]
					: [0, 0],
			},
			properties: {
				id: response.id,
				address_id: response.address_id,
				serial_number: response.serial_number,
				model: response.model,
				filters: response.filters || [],
				status: response.status,
				last_service_date: response.last_service_date,
				service_schedule: response.service_schedule || [],
				engineer: response.engineer,
				comments: response.comments,
				planned_service_date: response.planned_service_date,
				price: response.price,
				service: response.service,
				quantity: response.quantity,
				created_at: response.created_at,
				updated_at: response.updated_at,
				address: response.address,
				client: response.client,
			},
		}
	}

	async createDevice(deviceData: CreateDeviceRequest): Promise<DevicePoint> {
		const response = await this.request<DevicePoint>(
			API_CONFIG.ENDPOINTS.DEVICES,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(deviceData),
			}
		)
		return response
	}

	async updateDevice(
		id: string,
		deviceData: UpdateDeviceRequest
	): Promise<DevicePoint> {
		const response = await this.request<DevicePoint>(
			`${API_CONFIG.ENDPOINTS.DEVICES}/${id}`,
			{
				method: 'PUT',
				body: JSON.stringify(deviceData),
			}
		)
		return response
	}

	async deleteDevice(id: string): Promise<void> {
		const response = await this.request<{ message: string }>(
			`${API_CONFIG.ENDPOINTS.DEVICES}/${id}`,
			{
				method: 'DELETE',
			}
		)
		// Проверяем, что удаление прошло успешно
		if (
			!response.message ||
			!response.message.includes('deleted successfully')
		) {
			throw new Error('Failed to delete device')
		}
	}

	async createAddress(addressData: CreateAddressRequest): Promise<any> {
		const response = await this.request(API_CONFIG.ENDPOINTS.ADDRESSES, {
			method: 'POST',
			body: JSON.stringify(addressData),
		})
		return response
	}

	async createClient(clientData: CreateClientRequest): Promise<any> {
		const response = await this.request(API_CONFIG.ENDPOINTS.CLIENTS, {
			method: 'POST',
			body: JSON.stringify(clientData),
		})
		return response
	}

	async getClients(): Promise<any[]> {
		const response = await this.request<{
			items: any[]
			total: number
			page: number
			size: number
			pages: number
		}>(API_CONFIG.ENDPOINTS.CLIENTS)
		// Возвращаем items из пагинированного ответа или весь ответ если это не пагинированный ответ
		return response.items || response || []
	}

	async getAddressWithDevicesCount(
		addressId: string
	): Promise<{ address: any; devices_count: number }> {
		const response = await this.request<{
			address: any
			devices_count: number
		}>(`${API_CONFIG.ENDPOINTS.ADDRESSES}/${addressId}/with-devices`)
		return response
	}

	async deleteAddress(addressId: string): Promise<void> {
		const response = await this.request<{ message: string }>(
			`${API_CONFIG.ENDPOINTS.ADDRESSES}/${addressId}`,
			{
				method: 'DELETE',
			}
		)
		// Проверяем, что удаление прошло успешно
		if (
			!response.message ||
			!response.message.includes('deleted successfully')
		) {
			throw new Error('Failed to delete address')
		}
	}
}

export const markerService = new MarkerService()
