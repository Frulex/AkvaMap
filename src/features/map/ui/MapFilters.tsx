import React, { useState, useEffect, useCallback } from 'react'
import { useMarkersStore } from '../../../entities/marker/model/markersStore'
import { markerService } from '../../../shared/services/markerService'
import type { Client } from '../../../shared/types/marker'
import {
	DEVICE_STATUSES,
	DEVICE_STATUS_OPTIONS,
} from '../../../shared/constants'

interface MapFiltersProps {
	className?: string
}

export const MapFilters: React.FC<MapFiltersProps> = ({ className = '' }) => {
	const { filters, setFilters, clearFilters } = useMarkersStore()
	const [clients, setClients] = useState<Client[]>([])
	const [isLoadingClients, setIsLoadingClients] = useState(false)

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
					// Показываем пользователю ошибку
					if (error instanceof Error && error.message.includes('CORS')) {
						console.warn(
							'Проблема с CORS. Убедитесь, что бэкенд запущен и настроен правильно.'
						)
					} else {
						console.warn(
							'Не удалось загрузить список клиентов. Попробуйте обновить страницу.'
						)
					}
				} finally {
					setIsLoadingClients(false)
				}
			}
		}

		loadClients()
	}, [clients.length, isLoadingClients])

	const handleStatusChange = useCallback(
		(status: string) => {
			setFilters({ status: status ? [status] : [] })
		},
		[setFilters]
	)

	const handleClientChange = useCallback(
		(clientId: string) => {
			setFilters({ clientId: clientId || null })
		},
		[setFilters]
	)

	const handleEngineerChange = useCallback(
		(engineer: string) => {
			setFilters({ engineer: engineer || null })
		},
		[setFilters]
	)

	const handleServiceMonthChange = useCallback(
		(month: string) => {
			setFilters({ serviceMonth: month ? parseInt(month) : null })
		},
		[setFilters]
	)

	const handleClearFilters = useCallback(() => {
		clearFilters()
	}, [clearFilters])

	return (
		<div
			className={`bg-white p-4 rounded-lg shadow-xl border border-gray-200 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
				<button
					onClick={handleClearFilters}
					className="text-sm text-blue-600 hover:text-blue-800 font-medium"
				>
					Очистить
				</button>
			</div>

			<div className="space-y-4">
				{/* Статус устройства */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Статус
					</label>
					<select
						value={filters.status.length > 0 ? filters.status[0] : ''}
						onChange={(e) => handleStatusChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
					>
						<option value="">Все статусы</option>
						{DEVICE_STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				{/* Клиент */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Клиент
					</label>
					<select
						value={filters.clientId || ''}
						onChange={(e) => handleClientChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
						disabled={isLoadingClients}
					>
						<option value="">
							{isLoadingClients ? 'Загрузка клиентов...' : 'Все клиенты'}
						</option>
						{clients.map((client) => (
							<option key={client.id} value={client.id}>
								{client.name}
							</option>
						))}
					</select>
				</div>

				{/* Инженер */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Инженер
					</label>
					<input
						type="text"
						value={filters.engineer || ''}
						onChange={(e) => handleEngineerChange(e.target.value)}
						placeholder="Введите имя инженера"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
					/>
				</div>

				{/* Месяц обслуживания */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Месяц ТО
					</label>
					<select
						value={filters.serviceMonth ? filters.serviceMonth.toString() : ''}
						onChange={(e) => handleServiceMonthChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
					>
						<option value="">Все месяцы</option>
						<option value="1">Январь</option>
						<option value="2">Февраль</option>
						<option value="3">Март</option>
						<option value="4">Апрель</option>
						<option value="5">Май</option>
						<option value="6">Июнь</option>
						<option value="7">Июль</option>
						<option value="8">Август</option>
						<option value="9">Сентябрь</option>
						<option value="10">Октябрь</option>
						<option value="11">Ноябрь</option>
						<option value="12">Декабрь</option>
					</select>
				</div>
			</div>
		</div>
	)
}
