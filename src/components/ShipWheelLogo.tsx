// Ship's Wheel Logo Component
// Minimal design matching Bosun's aesthetic

export default function ShipWheelLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rim */}
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Inner hub */}
      <circle
        cx="50"
        cy="50"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* 8 spokes with extended handles */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180

        // Spoke from hub to rim
        const innerX = 50 + 10 * Math.cos(rad)
        const innerY = 50 + 10 * Math.sin(rad)
        const rimX = 50 + 38 * Math.cos(rad)
        const rimY = 50 + 38 * Math.sin(rad)

        // Extended handle beyond rim
        const handleStartX = 50 + 38 * Math.cos(rad)
        const handleStartY = 50 + 38 * Math.sin(rad)
        const handleEndX = 50 + 48 * Math.cos(rad)
        const handleEndY = 50 + 48 * Math.sin(rad)

        // Handle grip width
        const perpRad = rad + Math.PI / 2
        const handleWidth = 3
        const hx1 = handleEndX + handleWidth * Math.cos(perpRad)
        const hy1 = handleEndY + handleWidth * Math.sin(perpRad)
        const hx2 = handleEndX - handleWidth * Math.cos(perpRad)
        const hy2 = handleEndY - handleWidth * Math.sin(perpRad)

        return (
          <g key={i}>
            {/* Spoke */}
            <line
              x1={innerX}
              y1={innerY}
              x2={rimX}
              y2={rimY}
              stroke="currentColor"
              strokeWidth="2"
            />

            {/* Extended handle beyond rim */}
            <line
              x1={handleStartX}
              y1={handleStartY}
              x2={handleEndX}
              y2={handleEndY}
              stroke="currentColor"
              strokeWidth="2"
            />

            {/* Handle grip (cross bar) */}
            <line
              x1={hx1}
              y1={hy1}
              x2={hx2}
              y2={hy2}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )
      })}
    </svg>
  )
}
