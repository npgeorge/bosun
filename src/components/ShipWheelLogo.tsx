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
        r="45"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Inner hub */}
      <circle
        cx="50"
        cy="50"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* 8 spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const innerX = 50 + 8 * Math.cos(rad)
        const innerY = 50 + 8 * Math.sin(rad)
        const outerX = 50 + 45 * Math.cos(rad)
        const outerY = 50 + 45 * Math.sin(rad)

        return (
          <line
            key={i}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        )
      })}

      {/* 8 handles on the outer rim */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x = 50 + 45 * Math.cos(rad)
        const y = 50 + 45 * Math.sin(rad)

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}
