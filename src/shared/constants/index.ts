// Координаты по умолчанию (Москва)
export const DEFAULT_COORDINATES = {
	longitude: 37.6151,
	latitude: 55.7569,
	zoom: 10,
} as const

// Статусы устройств
export const DEVICE_STATUSES = {
	COMPLETED: 'completed',
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	NO_WORK: 'no_work',
} as const

export const DEVICE_STATUS_OPTIONS = [
	{ value: DEVICE_STATUSES.COMPLETED, label: 'Выполнено' },
	{ value: DEVICE_STATUSES.PENDING, label: 'Ожидает' },
	{ value: DEVICE_STATUSES.IN_PROGRESS, label: 'В работе' },
	{ value: DEVICE_STATUSES.NO_WORK, label: 'Нет работы' },
] as const

// Цвета для статусов
export const STATUS_COLORS = {
	[DEVICE_STATUSES.COMPLETED]: '#1BC47D', // зеленый
	[DEVICE_STATUSES.PENDING]: '#FFD600', // желтый
	[DEVICE_STATUSES.IN_PROGRESS]: '#2D6BFF', // синий
	[DEVICE_STATUSES.NO_WORK]: '#E5E7EB', // серый
	DEFAULT: '#E5E7EB', // серый
} as const

// Месяцы для графика ТО
export const MONTHS = [
	'январь',
	'февраль',
	'март',
	'апрель',
	'май',
	'июнь',
	'июль',
	'август',
	'сентябрь',
	'октябрь',
	'ноябрь',
	'декабрь',
] as const

// API конфигурация
export const API_CONFIG = {
	BASE_URL: 'http://localhost:8000',
	ENDPOINTS: {
		DEVICES: '/api/v1/devices',
		ADDRESSES: '/api/v1/addresses',
		CLIENTS: '/api/v1/clients',
		DEVICES_FOR_MAP: '/api/v1/devices/map/with-coordinates',
		DEVICES_FULL_INFO: '/api/v1/devices/map/full-info',
	},
} as const

// Map конфигурация
export const MAP_CONFIG = {
	STYLE_URL:
		'https://api.maptiler.com/maps/01982e2e-6966-7f91-92e7-e4b34e1c711c/style.json?key=shOTfMjg9NtFhrfS0Ufh',
} as const

// UI константы
export const UI_CONSTANTS = {
	MARKER_SIZE: 16, // px
	DEBOUNCE_DELAY: 300, // ms
} as const
