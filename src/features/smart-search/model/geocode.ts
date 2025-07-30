export interface ICoordinates {
	lon: number
	lat: number
	address?: string
}

const apiKey = import.meta.env.VITE_YANDEX_MAP_API
const geocodeCache = new Map<string, ICoordinates>()

export const getCoords = async function geocode(
	adress: string,
	signal?: AbortSignal
): Promise<ICoordinates | null> {
	const caschedCoordinates = geocodeCache.get(adress)
	if (caschedCoordinates) return caschedCoordinates

	const encodedAddress = encodeURIComponent(adress)
	const url = `https://geocode-maps.yandex.ru/v1/?apikey=${apiKey}&geocode=${encodedAddress}&format=json`

	try {
		const response = await fetch(url, { signal })
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`)
		}
		const data = await response.json()
		const featureMember = data.response?.GeoObjectCollection?.featureMember[0]
		const pos = featureMember.GeoObject.Point.pos

		const [lon, lat] = pos.split(' ').map(Number)
		const addressLine =
			featureMember.GeoObject.metaDataProperty.GeocoderMetaData.text
		const coordinates = { lon, lat, address: addressLine }

		return coordinates
	} catch (error) {
		if (error instanceof Error) {
			console.error('Ошибка:', error.message)
		} else {
			console.error('Неизвестная ошибка!')
		}
		return null
	}
}
