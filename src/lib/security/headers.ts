// src/lib/security/headers.ts
// Security headers for production deployment

export const securityHeaders = [
  // Prevent clickjacking attacks
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Enable XSS protection in older browsers
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Referrer policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions policy (restrict features)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  // Strict Transport Security (HTTPS only)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]
