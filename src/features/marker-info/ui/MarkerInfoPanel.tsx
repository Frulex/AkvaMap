import { useState, useEffect } from 'react'
import {
	X,
	Calendar,
	User,
	Monitor,
	PaperPlane,
	Paperclip,
	Trash,
} from '@phosphor-icons/react'
import type { DevicePoint } from '../../../shared/types/marker'
import { DEVICE_STATUS_OPTIONS, MONTHS } from '../../../shared/constants'
import { markerService } from '../../../shared/services/markerService'
import { AddMarkerForm } from '../../map/ui/AddMarkerForm'

interface MarkerInfoPanelProps {
	marker: DevicePoint
	onClose: () => void
	onUpdate?: (marker: DevicePoint) => void
	onDelete?: (markerId: string) => void
}

export function MarkerInfoPanel({
	marker,
	onClose,
	onUpdate,
	onDelete,
}: MarkerInfoPanelProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [fullMarker, setFullMarker] = useState<DevicePoint>(marker)
	const [plannedServiceDate, setPlannedServiceDate] = useState(
		marker.properties.planned_service_date || ''
	)
	const [model, setModel] = useState(marker.properties.model || '')
	const [quantity, setQuantity] = useState(marker.properties.quantity || 1)
	const [service, setService] = useState(marker.properties.service || '')
	const [price, setPrice] = useState(marker.properties.price || '')
	const [isAddingDevice, setIsAddingDevice] = useState(false)
	const [comment, setComment] = useState('')

	// Загружаем полную информацию об устройстве при открытии панели
	useEffect(() => {
		const loadFullDeviceInfo = async () => {
			try {
				const fullDevice = await markerService.getDevice(marker.properties.id)
				setFullMarker(fullDevice)
				setPlannedServiceDate(fullDevice.properties.planned_service_date || '')
				setModel(fullDevice.properties.model || '')
				setQuantity(fullDevice.properties.quantity || 1)
				setService(fullDevice.properties.service || '')
				setPrice(fullDevice.properties.price || '')
			} catch (error) {
				console.error('Ошибка загрузки полной информации об устройстве:', error)
			}
		}

		loadFullDeviceInfo()
	}, [marker.properties.id])

	const handleStatusChange = async (newStatus: string) => {
		if (!onUpdate) return

		setIsLoading(true)
		try {
			const updatedDevice = await markerService.updateDevice(
				fullMarker.properties.id,
				{
					id: fullMarker.properties.id,
					status: newStatus as
						| 'completed'
						| 'pending'
						| 'in_progress'
						| 'no_work',
				}
			)

			// Обновляем маркер в store
			const updatedMarker = {
				...fullMarker,
				properties: {
					...fullMarker.properties,
					status: updatedDevice.status,
				},
			}

			setFullMarker(updatedMarker)
			onUpdate(updatedMarker)
		} catch (error) {
			console.error('Ошибка обновления статуса:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleCommentSubmit = async () => {
		if (!comment.trim() || !onUpdate) return

		setIsLoading(true)
		try {
			const updatedDevice = await markerService.updateDevice(
				fullMarker.properties.id,
				{ comments: comment }
			)
			const updatedMarker = {
				...fullMarker,
				properties: {
					...fullMarker.properties,
					comments: updatedDevice.comments,
				},
			}
			setFullMarker(updatedMarker)
			onUpdate(updatedMarker)
			setComment('')
		} catch (error) {
			console.error('Ошибка добавления комментария:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handlePlannedServiceDateChange = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!onUpdate) return
		const newDate = e.target.value
		setPlannedServiceDate(newDate)
		setIsLoading(true)
		try {
			const updatedDevice = await markerService.updateDevice(
				fullMarker.properties.id,
				{ planned_service_date: newDate }
			)
			const updatedMarker = {
				...fullMarker,
				properties: {
					...fullMarker.properties,
					planned_service_date: updatedDevice.planned_service_date,
				},
			}
			setFullMarker(updatedMarker)
			onUpdate(updatedMarker)
		} catch (error) {
			console.error('Ошибка обновления даты планового ТО:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleFieldUpdate = async (field: string, value: any) => {
		if (!onUpdate) return
		setIsLoading(true)
		try {
			const updatedDevice = await markerService.updateDevice(
				fullMarker.properties.id,
				{
					[field]: value,
				}
			)
			const updatedMarker = {
				...fullMarker,
				properties: {
					...fullMarker.properties,
					[field]: updatedDevice[field],
				},
			}
			setFullMarker(updatedMarker)
			onUpdate(updatedMarker)
		} catch (error) {
			console.error('Ошибка обновления поля', field, error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleAddDevice = () => {
		setIsAddingDevice(true)
	}

	const handleDeviceAdded = () => {
		setIsAddingDevice(false)
		if (onUpdate) onUpdate(fullMarker) // Можно также вызвать fetchMarkers
	}

	const handleDeviceCancel = () => {
		setIsAddingDevice(false)
	}

	const handleDeleteDevice = async () => {
		if (!onDelete) {
			return
		}

		try {
			// Получаем информацию об адресе с количеством устройств
			const addressInfo = await markerService.getAddressWithDevicesCount(
				fullMarker.properties.address_id
			)
			const devicesCount = addressInfo.devices_count

			let shouldDelete = false
			let message = ''

			if (devicesCount === 1) {
				// Это последнее устройство на адресе
				message = `Удалить точку и адрес "${fullMarker.properties.address?.full_address}"? Это действие нельзя отменить.`
				shouldDelete = confirm(message)
			} else {
				// Есть другие устройства на этом адресе
				message = `Удалить только эту точку? На адресе останется ${devicesCount - 1} устройств.`
				shouldDelete = confirm(message)
			}

			if (!shouldDelete) {
				return
			}

			setIsLoading(true)

			if (devicesCount === 1) {
				// Удаляем адрес (это каскадно удалит и устройство)
				await markerService.deleteAddress(fullMarker.properties.address_id)
			} else {
				// Удаляем только устройство
				await markerService.deleteDevice(fullMarker.properties.id)
			}

			onDelete(fullMarker.properties.id)
			onClose()
		} catch (error) {
			console.error('Ошибка удаления:', error)
			alert('Ошибка при удалении')
		} finally {
			setIsLoading(false)
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-500'
			case 'in_progress':
				return 'bg-blue-500'
			case 'pending':
				return 'bg-yellow-500'
			case 'no_work':
				return 'bg-gray-400'
			default:
				return 'bg-gray-400'
		}
	}

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Не указана'
		return new Date(dateString).toLocaleDateString('ru-RU')
	}

	return (
		<div className="fixed right-0 top-0 h-full w-2/5 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-40">
			{/* Заголовок */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
					<X size={24} />
				</button>
				<h2 className="text-lg font-semibold text-gray-900">
					{fullMarker.properties.address?.full_address || 'Адрес не указан'}
				</h2>
			</div>

			<div className="p-4 space-y-6">
				{/* График ТО */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
						<Calendar size={16} />
						График ТО
					</h3>
					<div className="grid grid-cols-2 gap-2">
						{MONTHS.map((month, index) => {
							const monthNumber = index + 1
							const isSelected =
								fullMarker.properties.service_schedule?.includes(monthNumber)
							return isSelected ? (
								<button
									key={index}
									className="px-3 py-2 text-xs rounded-md transition-colors bg-blue-500 text-white"
								>
									{month}
								</button>
							) : null
						})}
					</div>
				</div>

				{/* Клиент */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<User size={16} />
						Клиент
					</h3>
					<p className="text-gray-900">
						{fullMarker.properties.client?.name || 'Не указан'}
					</p>
				</div>

				{/* Фильтры */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<Monitor size={16} />
						Фильтры
					</h3>
					<div className="flex flex-wrap gap-2">
						{fullMarker.properties.filters &&
						fullMarker.properties.filters.length > 0 ? (
							fullMarker.properties.filters.map(
								(filter: any, index: number) => (
									<span
										key={index}
										className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
									>
										{filter.name}
									</span>
								)
							)
						) : (
							<p className="text-gray-400 text-sm">Фильтры не указаны</p>
						)}
					</div>
				</div>

				{/* Дата последнего ТО */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-2">
						Дата последнего ТО
					</h3>
					<p className="text-gray-900">
						{formatDate(fullMarker.properties.last_service_date)}
					</p>
				</div>

				{/* Оборудование */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
						<Monitor size={16} />
						Оборудование
					</h3>
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 mb-2">
							<div>Модель</div>
							<div>Кол-во</div>
							<div>Услуга</div>
							<div>Цена</div>
						</div>
						<div className="space-y-2">
							<div className="grid grid-cols-4 gap-2 text-sm">
								<input
									type="text"
									value={model}
									disabled={isLoading}
									onChange={(e) => setModel(e.target.value)}
									onBlur={(e) => handleFieldUpdate('model', e.target.value)}
									className="font-medium px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<input
									type="number"
									min="1"
									value={quantity}
									disabled={isLoading}
									onChange={(e) => setQuantity(Number(e.target.value))}
									onBlur={(e) =>
										handleFieldUpdate('quantity', Number(e.target.value))
									}
									className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<input
									type="text"
									value={service}
									disabled={isLoading}
									onChange={(e) => setService(e.target.value)}
									onBlur={(e) => handleFieldUpdate('service', e.target.value)}
									className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<input
									type="number"
									min="0"
									step="0.01"
									value={price}
									disabled={isLoading}
									onChange={(e) => setPrice(e.target.value)}
									onBlur={(e) =>
										handleFieldUpdate('price', parseFloat(e.target.value))
									}
									className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<button
							className="mt-3 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
							onClick={handleAddDevice}
						>
							<Monitor size={16} />
							Добавить аппарат
						</button>
						{isAddingDevice && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
								<div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
									<AddMarkerForm
										coordinates={fullMarker.geometry.coordinates}
										address={fullMarker.properties.address?.full_address}
										onSave={handleDeviceAdded}
										onCancel={handleDeviceCancel}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Информация о задаче */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-2">
						Плановая дата ТО
					</h3>
					<input
						type="date"
						value={plannedServiceDate ? plannedServiceDate.slice(0, 10) : ''}
						onChange={handlePlannedServiceDateChange}
						disabled={isLoading}
						className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>

					<h3 className="text-sm font-medium text-gray-700 mb-2">
						Исполнитель
					</h3>
					<p className="text-gray-900 mb-3">
						{fullMarker.properties.engineer || 'Не назначен'}
					</p>

					<h3 className="text-sm font-medium text-gray-700 mb-2">Статус</h3>
					<div className="flex gap-2">
						{DEVICE_STATUS_OPTIONS.map((statusOption) => (
							<button
								key={statusOption.value}
								onClick={() => handleStatusChange(statusOption.value)}
								disabled={isLoading}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									fullMarker.properties.status === statusOption.value
										? `${getStatusColor(statusOption.value)} text-white`
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								{statusOption.label}
							</button>
						))}
					</div>
				</div>

				{/* Комментарии */}
				<div>
					<h3 className="text-sm font-medium text-gray-700 mb-2">
						Комментарии
					</h3>
					<div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
						{fullMarker.properties.comments ? (
							<p className="text-gray-900 text-sm">
								{fullMarker.properties.comments}
							</p>
						) : (
							<p className="text-gray-400 text-sm italic">Нет комментариев</p>
						)}
					</div>

					<div className="mt-3 flex gap-2">
						<input
							type="text"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Напишите комментарий"
							className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							onClick={handleCommentSubmit}
							disabled={!comment.trim() || isLoading}
							className="px-3 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
						>
							<Paperclip size={16} />
						</button>
						<button
							onClick={handleCommentSubmit}
							disabled={!comment.trim() || isLoading}
							className="px-3 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
						>
							<PaperPlane size={16} />
						</button>
					</div>
				</div>

				{/* Кнопка удаления */}
				<div className="pt-4 border-t border-gray-200">
					<button
						onClick={handleDeleteDevice}
						disabled={isLoading}
						className="w-full px-4 py-3 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Trash size={16} />
						Удалить точку
					</button>
				</div>
			</div>
		</div>
	)
}
