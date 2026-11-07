import {
  Search,
  MapPin,
  LayoutGrid,
  Filter,
  ChevronDown,
  Plus,
} from "lucide-react";

function LeadFilters({
  searchValue = "",
  onSearchChange = () => {},
  locationValue = "all",
  locationOptions = [],
  onLocationChange = () => {},
  priorityValue = "all",
  priorities = [],
  onPriorityChange = () => {},
  statusValue = "all",
  statuses = [],
  onStatusChange = () => {},
  onAddLead = () => {},
}) {
  const selectClass =
    "h-[42px] w-full min-w-0 appearance-none rounded-xl border border-[#D0D9E5] bg-white pl-9 pr-9 text-sm font-medium text-brand-text outline-none transition focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15";

  return (
    <section
      aria-label="Search and filter leads"
      className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_minmax(145px,0.9fr)_minmax(145px,0.9fr)_minmax(145px,0.9fr)_auto]"
    >
      <label className="relative flex min-w-0 items-center">
        <Search
          size={19}
          className="pointer-events-none absolute left-4 text-brand-muted"
          aria-hidden="true"
        />

        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, phone or lead ID..."
          aria-label="Search leads by name, phone or lead ID"
          className="h-[42px] w-full min-w-0 rounded-xl border border-[#D0D9E5] bg-white pl-11 pr-4 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
        />
      </label>

      <label className="relative min-w-0">
        <MapPin
          size={18}
          className="pointer-events-none absolute left-3 top-3 text-brand-text"
          aria-hidden="true"
        />

        <select
          value={locationValue}
          onChange={(event) => onLocationChange(event.target.value)}
          aria-label="Filter by location"
          className={selectClass}
        >
          {locationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-3 text-brand-text"
          aria-hidden="true"
        />
      </label>

      <label className="relative min-w-0">
        <LayoutGrid
          size={18}
          className="pointer-events-none absolute left-3 top-3 text-brand-text"
          aria-hidden="true"
        />

        <select
          value={priorityValue}
          onChange={(event) => onPriorityChange(event.target.value)}
          aria-label="Filter by priority"
          className={selectClass}
        >
          <option value="all">All Priority</option>

          {priorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.label} Priority
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-3 text-brand-text"
          aria-hidden="true"
        />
      </label>

      <label className="relative min-w-0">
        <Filter
          size={18}
          className="pointer-events-none absolute left-3 top-3 text-brand-text"
          aria-hidden="true"
        />

        <select
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="all">All Status</option>

          {statuses
            .filter((status) => status.id !== "all")
            .map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-3 text-brand-text"
          aria-hidden="true"
        />
      </label>

      <button
        type="button"
        onClick={onAddLead}
        className="inline-flex h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#078B37] bg-gradient-to-r from-[#079447] to-[#00723A] px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald"
      >
        <Plus size={19} strokeWidth={2.3} aria-hidden="true"/>
        Add New Lead
      </button>
    </section>
  );
}

export default LeadFilters;