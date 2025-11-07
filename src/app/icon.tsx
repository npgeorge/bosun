import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* White background rect */}
          <rect width="100" height="100" fill="#FFFFFF" />

          {/* Outer rim */}
          <circle cx="50" cy="50" r="38" stroke="#000000" strokeWidth="4" fill="none" />
          {/* Inner hub */}
          <circle cx="50" cy="50" r="10" stroke="#000000" strokeWidth="4" fill="none" />

          {/* 8 spokes - simplified for small size */}
          <line x1="60" y1="50" x2="88" y2="50" stroke="#000000" strokeWidth="4" />
          <line x1="57.07" y1="57.07" x2="76.87" y2="76.87" stroke="#000000" strokeWidth="4" />
          <line x1="50" y1="60" x2="50" y2="88" stroke="#000000" strokeWidth="4" />
          <line x1="42.93" y1="57.07" x2="23.13" y2="76.87" stroke="#000000" strokeWidth="4" />
          <line x1="40" y1="50" x2="12" y2="50" stroke="#000000" strokeWidth="4" />
          <line x1="42.93" y1="42.93" x2="23.13" y2="23.13" stroke="#000000" strokeWidth="4" />
          <line x1="50" y1="40" x2="50" y2="12" stroke="#000000" strokeWidth="4" />
          <line x1="57.07" y1="42.93" x2="76.87" y2="23.13" stroke="#000000" strokeWidth="4" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
