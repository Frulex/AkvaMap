export interface Client {
	id: string
	name: string
	created_at: string
	updated_at: string
}

export interface Address {
	id: string
	client_id: string
	full_address: string
	coordinates: {
		lat: number
		lon: number
	} | null
	created_at: string
	updated_at: string
	client?: Client
}

export interface DeviceProperties {
	id: string
	address_id: string
	serial_number: string
	model: string
	filters: any[]
	status: 'completed' | 'pending' | 'in_progress' | 'no_work'
	last_service_date: string | null
	service_schedule: number[]
	engineer: string | null
	comments: string | null
	planned_service_date: string | null
	price: number | null
	service: string | null
	quantity: number | null
	created_at: string
	updated_at: string
	address?: Address
	client?: Client
}

export interface DevicePoint {
	type: 'Feature'
	geometry: {
		type: 'Point'
		coordinates: [number, number]
	}
	properties: DeviceProperties
}

export interface DevicePointsResponse {
	type: 'FeatureCollection'
	features: DevicePoint[]
}
