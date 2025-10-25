// src/middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting
// For production, consider Redis or Upstash
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

// Rate limit configuration
const RATE_LIMITS = {
  // API endpoints
  '/api/settlements/process': { requests: 10, windowMs: 60000 }, // 10 per minute
  '/api/transactions': { requests: 100, windowMs: 60000 }, // 100 per minute
  '/api/': { requests: 200, windowMs: 60000 }, // 200 per minute for general API

  // Auth endpoints
  '/auth/login': { requests: 5, windowMs: 60000 }, // 5 per minute
  '/auth/signup': { requests: 3, windowMs: 300000 }, // 3 per 5 minutes
  '/auth/register': { requests: 3, windowMs: 300000 }, // 3 per 5 minutes
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 300000)

export function rateLimit(req: NextRequest): NextResponse | null {
  // Get client identifier (IP address + user agent)
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const identifier = `${clientIp}-${userAgent}`

  const pathname = req.nextUrl.pathname

  // Find matching rate limit config
  let limit = RATE_LIMITS['/api/'] // Default
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      limit = config
      break
    }
  }

  const key = `${identifier}-${pathname}`
  const now = Date.now()

  // Initialize or get existing rate limit data
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.windowMs
    }
  }

  // Increment counter
  rateLimitStore[key].count++

  // Check if limit exceeded
  if (rateLimitStore[key].count > limit.requests) {
    const resetInSeconds = Math.ceil((rateLimitStore[key].resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Limit': limit.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitStore[key].resetTime.toString()
        }
      }
    )
  }

  // Return null if not rate limited (allow request to proceed)
  return null
}

// Helper to get rate limit headers for successful requests
export function getRateLimitHeaders(req: NextRequest): Record<string, string> {
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const identifier = `${clientIp}-${userAgent}`
  const pathname = req.nextUrl.pathname

  let limit = RATE_LIMITS['/api/']
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      limit = config
      break
    }
  }

  const key = `${identifier}-${pathname}`
  const data = rateLimitStore[key]

  if (!data) {
    return {
      'X-RateLimit-Limit': limit.requests.toString(),
      'X-RateLimit-Remaining': limit.requests.toString(),
    }
  }

  return {
    'X-RateLimit-Limit': limit.requests.toString(),
    'X-RateLimit-Remaining': Math.max(0, limit.requests - data.count).toString(),
    'X-RateLimit-Reset': data.resetTime.toString()
  }
}
