import { useState } from "react";
import { Clock3, Eye, MoreHorizontal, Plus } from "lucide-react";
import { getVersionStatus, sortVersionsNewestFirst } from "../utils/pricing-calculations.js";

const statusStyles = {
  active: "bg-green-100 text-green-900",
  expired: "bg-slate-200 text-slate-700",
  draft: "bg-amber-100 text-amber-900",
  scheduled: "bg-blue-100 text-blue-900",
  revoked: "bg-red-100 text-red-800",
  unknown: "bg-slate-100 text-slate-700",
};

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function RuleVersionHistory({ versions, referenceDate, onCreateVersion, onViewVersion, onDuplicateVersion }) {
  const [menuFor, setMenuFor] = useState(null);
  const orderedVersions = sortVersionsNewestFirst(versions);

  return (
    <section id="rule-versions" className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Clock3 size={30} className="shrink-0 text-brand-emerald" />
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Rule Version History</h2>
            <p className="text-xs text-brand-muted">Manage and view historical versions of pricing and subsidy rules.</p>
          </div>
        </div>
        <button type="button" onClick={onCreateVersion} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-800">
          <Plus size={17} /> Create New Version
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[520px] table-fixed border-collapse text-sm xl:min-w-0">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="bg-slate-100 text-left text-xs font-bold text-brand-text">
            <tr>
              <th className="px-3 py-2.5">Version</th>
              <th className="px-3 py-2.5">Effective From</th>
              <th className="px-3 py-2.5">Effective To</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orderedVersions.map((version) => {
              const status = getVersionStatus(version, referenceDate);
              return (
                <tr key={version.id ?? version.version} className="border-t border-slate-100">
                  <th scope="row" className="px-3 py-2.5 font-extrabold text-brand-text">{version.version}</th>
                  <td className="px-3 py-2.5 whitespace-nowrap">{displayDate(version.effectiveFrom)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{displayDate(version.effectiveTo)}</td>
                  <td className="px-3 py-2.5"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[status] ?? statusStyles.unknown}`}>{status}</span></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => onViewVersion(version)} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold hover:border-brand-emerald hover:text-brand-emerald"><Eye size={15} /> View</button>
                      <div className="relative">
                        <button type="button" aria-label={`More actions for ${version.version}`} aria-expanded={menuFor === version.id} onClick={() => setMenuFor(menuFor === version.id ? null : version.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 hover:border-brand-emerald"><MoreHorizontal size={18} /></button>
                        {menuFor === version.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-brand-border bg-white p-1.5 shadow-lg">
                            <button type="button" onClick={() => { setMenuFor(null); onDuplicateVersion(version); }} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-brand-text hover:bg-brand-mint-soft">Duplicate as draft</button>
                            <button type="button" onClick={() => { setMenuFor(null); onViewVersion(version); }} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-brand-text hover:bg-brand-mint-soft">View details</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-brand-muted">Version statuses are illustrative and derived from the reference date shown in this demo. Creating or duplicating versions does not activate them.</p>
    </section>
  );
}

export default RuleVersionHistory;
