import type { Response } from 'express'
import { logger } from './logger'
import { AppError } from './errors'

export interface ApiResponse<T = unknown> {
	success: boolean
	status: number
	data?: T | undefined
	message?: string | undefined
	errors?: any | undefined
}

export function successResponse<T = unknown>(
	res: Response,
	data: T,
	message?: string,
	status = 200
) {
	const payload: ApiResponse<T> = {
		success: true,
		status,
		data,
		message,
	}

	return res.status(status).json(payload)
}

export function createdResponse<T = unknown>(res: Response, data: T, message?: string) {
	return successResponse(res, data, message, 201)
}

export function errorResponse(res: Response, err: unknown) {
	if (err instanceof AppError) {
		logger.warn(`AppError: ${err.code} - ${err.message}`)
		return res.status(err.statusCode).json({
			success: false,
			status: err.statusCode,
			message: err.message,
			code: err.code,
			details: err.details,
		})
	}

	// Unknown error
	logger.error('Unhandled error in response helper', { error: String(err) })
	return res.status(500).json({
		success: false,
		status: 500,
		message: 'Internal server error',
	})
}

export default { successResponse, createdResponse, errorResponse }
