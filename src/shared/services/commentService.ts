import type { CreateCommentRequest, UpdateCommentRequest } from '../types/api'
import { API_CONFIG } from '../constants'

export interface Comment {
	id: number
	text: string
	created_at: string
	updated_at: string
}

class CommentService {
	private baseUrl = API_CONFIG.BASE_URL

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || `HTTP ${response.status}`)
		}

		return response.json()
	}

	async getComments(deviceId: number): Promise<Comment[]> {
		return this.request<Comment[]>(
			`/${deviceId}${API_CONFIG.ENDPOINTS.COMMENTS}`
		)
	}

	async addComment(deviceId: number, text: string): Promise<Comment> {
		const body: CreateCommentRequest = { text }

		return this.request<Comment>(
			`/${deviceId}${API_CONFIG.ENDPOINTS.COMMENTS}`,
			{
				method: 'POST',
				body: JSON.stringify(body),
			}
		)
	}

	async updateComment(commentId: number, text: string): Promise<Comment> {
		const body: UpdateCommentRequest = { text }

		return this.request<Comment>(
			`${API_CONFIG.ENDPOINTS.COMMENTS}/${commentId}`,
			{
				method: 'PUT',
				body: JSON.stringify(body),
			}
		)
	}

	async deleteComment(commentId: number): Promise<void> {
		await this.request(`${API_CONFIG.ENDPOINTS.COMMENTS}/${commentId}`, {
			method: 'DELETE',
		})
	}
}

export const commentService = new CommentService()
