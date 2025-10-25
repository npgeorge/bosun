// src/lib/security/sanitize.ts
// Input sanitization utilities to prevent XSS and injection attacks

/**
 * Sanitize HTML to prevent XSS attacks
 * For production, consider using DOMPurify library
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize string for use in SQL (additional layer beyond parameterized queries)
 */
export function sanitizeSql(input: string): string {
  // Remove potentially dangerous characters
  return input.replace(/['";\\]/g, '')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate numeric input
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Validate amount (positive number with max 2 decimal places)
 */
export function isValidAmount(amount: number): boolean {
  return (
    isValidNumber(amount) &&
    amount > 0 &&
    amount <= 999_999_999_999.99 && // Max 1 trillion
    Number.isInteger(amount * 100) // Max 2 decimal places
  )
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255) // Max filename length
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
} = {}): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options.allowedTypes || ['application/pdf', 'image/jpeg', 'image/png']

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for server-side
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length >= 32
}

/**
 * Rate limit check (simple implementation)
 * For production, use Redis or Upstash
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || record.resetTime < now) {
    // Create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true }
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  record.count++
  return { allowed: true }
}

// Cleanup old rate limit records every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }, 300000)
}
