function SolarQualifyLogo() {
  return (
    <div
      className="flex min-w-0 items-center gap-2.5"
      role="img"
      aria-label="SolarQualify — Rooftop Solar Solutions"
    >
      <svg
        viewBox="0 0 60 56"
        className="h-12 w-12 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Golden sun */}
        <circle cx="22" cy="13" r="8" fill="#FACC15" />
        <g stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 1V4" />
          <path d="M22 22V25" />
          <path d="M10 13H13" />
          <path d="M31 13H34" />
          <path d="M13.5 4.5L15.7 6.7" />
          <path d="M28.3 19.3L30.5 21.5" />
          <path d="M30.5 4.5L28.3 6.7" />
        </g>

        {/* Solar panel structure */}
        <path
          d="M8 25H47L55 49H2L8 25Z"
          fill="#087A4B"
          stroke="#D1FAE5"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Solar cell grid */}
        <g stroke="white" strokeWidth="1.5">
          <path d="M8 33H50" />
          <path d="M5 41H52" />
          <path d="M17 26L12 48" />
          <path d="M28 26L27 48" />
          <path d="M39 26L43 48" />
        </g>

        {/* Panel base */}
        <path
          d="M1 52H56"
          stroke="#D1FAE5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="min-w-0">
        <div className="whitespace-nowrap text-[19px] font-extrabold leading-tight tracking-tight text-white">
          SolarQualify
        </div>
        <div className="mt-1 whitespace-nowrap text-[10px] font-medium leading-tight text-slate-200">
          Rooftop Solar Solutions
        </div>
      </div>
    </div>
  );
}

export default SolarQualifyLogo;