// Типы для API запросов
export interface ApiRequestParams {
	status?: string
	client_id?: string
	engineer?: string
	service_month?: number
}

export interface CreateDeviceRequest {
	address_id: string
	serial_number: string
	model: string
	filters?: any[]
	status?: 'completed' | 'pending' | 'in_progress' | 'no_work'
	service_schedule?: number[]
	engineer?: string
	comments?: string
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {
	id: string
}

export interface CreateAddressRequest {
	client_id: string
	full_address: string
	coordinates: {
		lat: number
		lon: number
	}
}

export interface CreateClientRequest {
	name: string
}

export interface CreateCommentRequest {
	text: string
}

export interface UpdateCommentRequest {
	text: string
}

// Типы для API ответов
export interface ApiResponse<T> {
	data: T
	message?: string
}

export interface ErrorResponse {
	error: string
	message: string
	status: number
}
