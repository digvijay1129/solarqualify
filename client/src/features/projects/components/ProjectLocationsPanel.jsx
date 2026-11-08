import { MapPin, Plus, Minus, MapPinned } from "lucide-react";

function ProjectLocationsPanel({ locations = [], onSelectLocation = () => {}, selectedLocation = "all" }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <MapPin size={23} className="text-brand-emerald" aria-hidden="true" />
        <h2 className="text-lg font-bold text-brand-text">Project Locations</h2>
      </div>

      <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-sky-100 bg-[#E7F2F8] sm:min-h-[245px]">
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: "linear-gradient(28deg, transparent 46%, rgba(255,255,255,.95) 47%, rgba(255,255,255,.95) 49%, transparent 50%), linear-gradient(112deg, transparent 47%, rgba(255,255,255,.95) 48%, rgba(255,255,255,.95) 50%, transparent 51%), linear-gradient(0deg, rgba(120,178,139,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(120,178,139,.10) 1px, transparent 1px)", backgroundSize: "150px 110px, 190px 150px, 28px 28px, 28px 28px" }} />
        <svg viewBox="0 0 600 300" className="absolute inset-0 h-full w-full" role="img" aria-label="Schematic project location distribution for Maharashtra demo cities; not a geographic map">
          <path d="M48 35 C145 8, 188 45, 238 33 S338 52, 384 30 S506 48, 566 18 L580 268 C510 250, 470 290, 400 262 S260 277, 213 250 S114 268, 38 222 Z" fill="#D4E9D5" opacity=".8" />
          <path d="M58 210 C150 150, 170 100, 255 127 S380 205, 540 85" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
          <path d="M120 35 C185 104, 250 120, 300 280 M510 20 C430 88, 395 138, 340 280 M20 120 C160 135, 370 88, 590 150" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
          <path d="M48 35 C145 8, 188 45, 238 33 S338 52, 384 30 S506 48, 566 18 L580 268 C510 250, 470 290, 400 262 S260 277, 213 250 S114 268, 38 222 Z" fill="none" stroke="#9DCBA8" strokeWidth="3" />
        </svg>

        {locations.map((location) => {
          const selected = selectedLocation.toLowerCase() === location.name.toLowerCase();
          return (
            <button
              key={location.id}
              type="button"
              onClick={() => onSelectLocation(selected ? "all" : location.name)}
              title={`Filter projects in ${location.name}: ${location.count} illustrative projects`}
              aria-pressed={selected}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald"
              style={{ left: `${location.marker.x}%`, top: `${location.marker.y}%` }}
            >
              <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold shadow-md sm:text-xs ${selected ? "border-brand-forest bg-brand-forest text-white" : "border-white bg-white/95 text-brand-text"}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected ? "#BBF7D0" : location.color }} />
                {location.name} ({location.count})
              </span>
            </button>
          );
        })}

        <div className="absolute bottom-2 left-2 rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-[10px] leading-4 text-slate-600 shadow-sm">
          <span className="flex items-center gap-1 font-semibold"><MapPinned size={12} /> Illustrative distribution</span>
          <span>Schematic pins · not precise geocoding</span>
        </div>
        <div className="absolute bottom-2 right-2 flex flex-col gap-1" aria-hidden="true">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm" aria-hidden="true"><Plus size={15} /></span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm" aria-hidden="true"><Minus size={15} /></span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {locations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => onSelectLocation(selectedLocation === location.name ? "all" : location.name)}
            className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${selectedLocation === location.name ? "bg-brand-mint-soft font-bold text-brand-forest" : "hover:bg-slate-50 text-brand-muted"}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: location.color }} />
            <span className="min-w-0 flex-1 truncate">{location.name}</span>
            <span className="font-semibold tabular-nums">{location.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ProjectLocationsPanel;
