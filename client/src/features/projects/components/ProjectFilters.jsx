import { Search, MapPin, Layers3, CalendarDays, RotateCcw } from "lucide-react";

const selectClass = "h-10 w-full min-w-0 appearance-none rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15";

function ProjectFilters({ filters, locations = [], stages = [], onChange = () => {}, onReset = () => {} }) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(210px,1.4fr)_minmax(135px,.8fr)_minmax(150px,.9fr)_minmax(135px,.8fr)_auto]">
      <label className="relative block min-w-0">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
        <input
          type="search"
          value={filters.query}
          onChange={(event) => onChange("query", event.target.value)}
          placeholder="Search project or customer..."
          aria-label="Search by project ID, customer, location or quotation reference"
          className="h-10 w-full min-w-0 rounded-xl border border-brand-border bg-white pl-10 pr-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
        />
      </label>

      <label className="relative block min-w-0">
        <MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
        <select aria-label="Filter by location" value={filters.location} onChange={(event) => onChange("location", event.target.value)} className={`${selectClass} pl-9`}>
          <option value="all">All Locations</option>
          {locations.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
        </select>
      </label>

      <label className="relative block min-w-0">
        <Layers3 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
        <select aria-label="Filter by current stage" value={filters.stage} onChange={(event) => onChange("stage", event.target.value)} className={`${selectClass} pl-9`}>
          <option value="all">All Stages</option>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.shortLabel}</option>)}
        </select>
      </label>

      <label className="relative block min-w-0">
        <CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
        <select aria-label="Filter by due date" value={filters.dateRange} onChange={(event) => onChange("dateRange", event.target.value)} className={`${selectClass} pl-9`}>
          <option value="all">All Time</option>
          <option value="this-month">Due This Month</option>
          <option value="next-30-days">Next 30 Days</option>
          <option value="overdue">Overdue</option>
        </select>
      </label>

      <button type="button" onClick={onReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-brand-text transition hover:bg-slate-50">
        <RotateCcw size={15} aria-hidden="true" />
        <span className="sm:hidden xl:inline">Reset</span>
      </button>
    </section>
  );
}

export default ProjectFilters;
