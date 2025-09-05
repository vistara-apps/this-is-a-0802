/**
 * API Utilities for TherapyTrack
 * Centralized error handling and response processing
 */

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Generic API request handler with error handling
 */
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return response
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      'NETWORK_ERROR'
    )
  }
}

/**
 * Retry mechanism for API calls
 */
export async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError
}

/**
 * Format error messages for user display
 */
export function formatErrorMessage(error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again.'
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.'
      case 'NOT_FOUND':
        return 'The requested resource was not found.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }

  return error.message || 'An unexpected error occurred.'
}

/**
 * Environment variable helpers
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    organizationId: import.meta.env.OPENAI_ORGANIZATION_ID,
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  },
  pinata: {
    apiKey: import.meta.env.VITE_PINATA_API_KEY,
    secretApiKey: import.meta.env.VITE_PINATA_SECRET_API_KEY,
    jwt: import.meta.env.PINATA_JWT,
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  },
}

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_PINATA_API_KEY',
  ]

  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
