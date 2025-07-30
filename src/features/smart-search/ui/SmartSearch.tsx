import { useState } from 'react'
import { getCoords } from '../model/geocode'

interface SmartSearchProps {
	handleSearchedCoords: (coords: { lon: number; lat: number }) => void
}

export function SmartSearch({ handleSearchedCoords }: SmartSearchProps) {
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		setSearchQuery(e.target.value)
		setError(null)
	}

	async function getCoordinates() {
		if (!searchQuery.trim()) return

		setIsLoading(true)
		setError(null)

		try {
			const coords = await getCoords(searchQuery)
			if (coords) {
				handleSearchedCoords(coords)
			} else {
				setError('Адрес не найден')
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Ошибка при поиске')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="relative">
			<div className="relative">
				<input
					value={searchQuery}
					onChange={handleSearch}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							getCoordinates()
						}
					}}
					type="text"
					placeholder="Введите адрес и нажмите Enter"
					className="h-10 w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
					disabled={isLoading}
				/>
				{isLoading && (
					<div className="absolute right-3 top-3">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
					</div>
				)}
			</div>
			{error && (
				<div className="absolute top-full left-0 mt-1 text-red-500 text-sm bg-white px-2 py-1 rounded shadow">
					{error}
				</div>
			)}
		</div>
	)
}
