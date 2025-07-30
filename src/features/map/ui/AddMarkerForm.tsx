import React, { useState, useEffect, useCallback } from 'react'
import { X } from '@phosphor-icons/react'
import { markerService } from '../../../shared/services/markerService'
import type { Client } from '../../../shared/types/marker'

interface AddMarkerFormProps {
	coordinates: [number, number]
	address?: string
	onSave: (data: any) => void
	onCancel: () => void
}

export const AddMarkerForm: React.FC<AddMarkerFormProps> = ({
	coordinates,
	address,
	onSave,
	onCancel,
}) => {
	const [formData, setFormData] = useState({
		clientName: '',
		address: address || '',
		serialNumber: '',
		model: '',
		filters: '',
		engineer: '',
		comments: '',
		serviceSchedule: [] as number[],
		lastServiceDate: '',
		plannedServiceDate: '', // новое поле
		price: '', // новое поле
		service: '', // новое поле
		quantity: '', // новое поле
	})
	const [clients, setClients] = useState<Client[]>([])
	const [isLoadingClients, setIsLoadingClients] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

	// Загружаем клиентов только один раз при монтировании
	useEffect(() => {
		const loadClients = async () => {
			if (clients.length === 0 && !isLoadingClients) {
				setIsLoadingClients(true)
				try {
					const clientsData = await markerService.getClients()
					setClients(clientsData)
				} catch (error) {
					console.error('Ошибка загрузки клиентов:', error)
				} finally {
					setIsLoadingClients(false)
				}
			}
		}

		loadClients()
	}, []) // Убираем зависимости чтобы избежать бесконечного рендеринга

	const handleInputChange = useCallback((field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}, [])

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			setIsSubmitting(true)

			try {
				let clientId = selectedClientId
				// Если не выбран существующий клиент, создаём нового
				if (!clientId) {
					const newClient = await markerService.createClient({
						name: formData.clientName,
					})
					clientId = newClient.id
				}

				// Проверяем существование адреса для этого клиента
				let addressId: string
				try {
					// Пытаемся создать новый адрес
					const newAddress = await markerService.createAddress({
						client_id: clientId!,
						full_address: formData.address,
						coordinates: {
							lat: coordinates[1],
							lon: coordinates[0],
						},
					})
					addressId = newAddress.id
				} catch (error: any) {
					// Если адрес уже существует, получаем его ID
					if (
						error.message &&
						error.message.includes('already exists for this client')
					) {
						try {
							// Получаем существующий адрес
							const existingAddress =
								await markerService.getAddressByClientAndAddress(
									clientId!,
									formData.address
								)
							addressId = existingAddress.id
						} catch (getError) {
							console.error('Ошибка получения существующего адреса:', getError)
							alert(
								'Ошибка получения существующего адреса. Пожалуйста, попробуйте еще раз.'
							)
							return
						}
					} else {
						throw error
					}
				}

				// Создаём устройство
				const deviceData = {
					address_id: addressId,
					serial_number: formData.serialNumber,
					model: formData.model,
					filters: formData.filters ? [{ name: formData.filters }] : [],
					service_schedule: formData.serviceSchedule,
					last_service_date: formData.lastServiceDate || null,
					planned_service_date: formData.plannedServiceDate || null,
					price: formData.price ? parseFloat(formData.price) : null,
					service: formData.service || null,
					quantity: formData.quantity ? parseInt(formData.quantity, 10) : null,
					engineer: formData.engineer || null,
					comments: formData.comments || null,
				}

				if (!deviceData.engineer) delete deviceData.engineer
				if (!deviceData.comments) delete deviceData.comments
				if (deviceData.filters.length === 0) delete deviceData.filters

				onSave(deviceData)
			} catch (error) {
				console.error('Ошибка создания объекта:', error)
			} finally {
				setIsSubmitting(false)
			}
		},
		[formData, clients, coordinates, onSave, isSubmitting, selectedClientId]
	)

	return (
		<div className="fixed right-0 top-0 h-full w-2/5 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-40">
			<div className="p-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">
						Добавить новый объект
					</h2>
					<button
						onClick={onCancel}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>
			</div>

			<div className="p-4">
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Клиент */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Клиент *
						</label>
						<select
							value={selectedClientId || ''}
							onChange={(e) => {
								const val = e.target.value
								if (val) {
									setSelectedClientId(val)
									const client = clients.find((c) => c.id === val)
									if (client) handleInputChange('clientName', client.name)
								} else {
									setSelectedClientId(null)
									handleInputChange('clientName', '')
								}
							}}
							className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
						>
							<option value="">— Новый клиент —</option>
							{clients.map((client) => (
								<option key={client.id} value={client.id}>
									{client.name}
								</option>
							))}
						</select>
						<input
							type="text"
							value={formData.clientName}
							onChange={(e) => handleInputChange('clientName', e.target.value)}
							placeholder="Введите название клиента"
							required
							disabled={!!selectedClientId}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Адрес */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Адрес *
						</label>
						<input
							type="text"
							value={formData.address}
							onChange={(e) => handleInputChange('address', e.target.value)}
							placeholder="Введите адрес"
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Серийный номер */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Серийный номер *
						</label>
						<input
							type="text"
							value={formData.serialNumber}
							onChange={(e) =>
								handleInputChange('serialNumber', e.target.value)
							}
							placeholder="Введите серийный номер"
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Модель */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Модель *
						</label>
						<input
							type="text"
							value={formData.model}
							onChange={(e) => handleInputChange('model', e.target.value)}
							placeholder="Введите модель устройства"
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Фильтры */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Фильтры
						</label>
						<input
							type="text"
							value={formData.filters}
							onChange={(e) => handleInputChange('filters', e.target.value)}
							placeholder="Введите информацию о фильтрах"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Инженер */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Инженер
						</label>
						<input
							type="text"
							value={formData.engineer}
							onChange={(e) => handleInputChange('engineer', e.target.value)}
							placeholder="Введите имя инженера"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Комментарии */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Комментарии
						</label>
						<textarea
							value={formData.comments}
							onChange={(e) => handleInputChange('comments', e.target.value)}
							placeholder="Введите комментарии"
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
						/>
					</div>

					{/* График ТО */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							График ТО
						</label>
						<div className="grid grid-cols-3 gap-2">
							{[
								'Январь',
								'Февраль',
								'Март',
								'Апрель',
								'Май',
								'Июнь',
								'Июль',
								'Август',
								'Сентябрь',
								'Октябрь',
								'Ноябрь',
								'Декабрь',
							].map((month, index) => (
								<label key={month} className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.serviceSchedule.includes(index + 1)}
										onChange={(e) => {
											const monthNumber = index + 1
											if (e.target.checked) {
												setFormData((prev) => ({
													...prev,
													serviceSchedule: [
														...prev.serviceSchedule,
														monthNumber,
													],
												}))
											} else {
												setFormData((prev) => ({
													...prev,
													serviceSchedule: prev.serviceSchedule.filter(
														(m) => m !== monthNumber
													),
												}))
											}
										}}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-700">{month}</span>
								</label>
							))}
						</div>
					</div>

					{/* Дата последнего ТО */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Дата последнего ТО
						</label>
						<input
							type="date"
							value={formData.lastServiceDate}
							onChange={(e) =>
								handleInputChange('lastServiceDate', e.target.value)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Дата планового ТО */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Дата планового ТО
						</label>
						<input
							type="date"
							value={formData.plannedServiceDate}
							onChange={(e) =>
								handleInputChange('plannedServiceDate', e.target.value)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Цена */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Цена оборудования
						</label>
						<input
							type="number"
							min="0"
							step="0.01"
							value={formData.price}
							onChange={(e) => handleInputChange('price', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					{/* Услуга */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Услуга
						</label>
						<input
							type="text"
							value={formData.service}
							onChange={(e) => handleInputChange('service', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					{/* Количество */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Количество аппаратов
						</label>
						<input
							type="number"
							min="1"
							step="1"
							value={formData.quantity}
							onChange={(e) => handleInputChange('quantity', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Координаты */}
					<div className="text-sm text-gray-500">
						Координаты: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
					</div>

					{/* Кнопки */}
					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onCancel}
							className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
						>
							Отмена
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
						>
							{isSubmitting ? 'Создание...' : 'Создать'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
