import { useState } from "react";
import { CheckCircle2, Clock3, Eye, MoreHorizontal, Plus, ShieldCheck, XCircle } from "lucide-react";
import { getVersionStatus, sortVersionsNewestFirst } from "../utils/pricing-calculations.js";

const statusStyles = {
  active: "bg-green-100 text-green-900",
  expired: "bg-slate-200 text-slate-700",
  draft: "bg-amber-100 text-amber-900",
  scheduled: "bg-blue-100 text-blue-900",
  inactive: "bg-slate-100 text-slate-700",
  unknown: "bg-slate-100 text-slate-700",
};

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function RuleVersionHistory({
  versions = [],
  referenceDate,
  ruleType = "pricing",
  onCreateVersion = () => {},
  onViewVersion = () => {},
  onUpdateStatus = () => {},
  onVerifySubsidy = () => {},
  busyRuleId = null,
}) {
  const [menuFor, setMenuFor] = useState(null);
  const orderedVersions = sortVersionsNewestFirst(versions);
  const title = ruleType === "subsidies" ? "Subsidy" : ruleType === "generation" ? "Generation" : "Pricing";

  return (
    <section id="rule-versions" className="min-w-0 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><Clock3 size={30} className="shrink-0 text-brand-emerald" /><div className="min-w-0"><h2 className="text-lg font-extrabold tracking-tight text-brand-text">{title} Rule Version History</h2><p className="text-xs text-brand-muted">Review server-stored immutable versions and manage their activation status.</p></div></div>
        <button type="button" onClick={onCreateVersion} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-800"><Plus size={17} />Create New Version</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-bold text-brand-text"><tr><th className="px-3 py-2.5">Version</th><th className="px-3 py-2.5">Effective From</th><th className="px-3 py-2.5">Effective To</th><th className="px-3 py-2.5">Status</th>{ruleType === "subsidies" && <th className="px-3 py-2.5">Verification</th>}<th className="px-3 py-2.5 text-right">Actions</th></tr></thead>
          <tbody>
            {orderedVersions.map((version) => {
              const status = getVersionStatus(version, referenceDate);
              const busy = busyRuleId === version.id;
              const canActivate = version.status !== "active" && !(ruleType === "subsidies" && version.verificationStatus !== "verified");
              const isUnverifiedSubsidy = ruleType === "subsidies" && version.verificationStatus === "unverified";
              return <tr key={version.id} className="border-t border-slate-100">
                <th scope="row" className="whitespace-nowrap px-3 py-3 font-extrabold text-brand-text">v{version.version}</th>
                <td className="whitespace-nowrap px-3 py-3 text-xs">{displayDate(version.effectiveFrom)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs">{displayDate(version.effectiveTo)}</td>
                <td className="px-3 py-3"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[status] ?? statusStyles.unknown}`}>{status}</span></td>
                {ruleType === "subsidies" && <td className="px-3 py-3"><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold capitalize ${version.verificationStatus === "verified" ? "bg-green-100 text-green-900" : version.verificationStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-950"}`}>{version.verificationStatus || "unverified"}</span></td>}
                <td className="px-3 py-3"><div className="flex flex-wrap items-center justify-end gap-1.5">
                  <button type="button" onClick={() => onViewVersion(version)} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold hover:border-brand-emerald hover:text-brand-emerald"><Eye size={15} />View</button>
                  {isUnverifiedSubsidy && <><button type="button" disabled={busy} onClick={() => onVerifySubsidy(version, "verified")} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-green-300 px-2 text-[11px] font-bold text-green-800 hover:bg-green-50 disabled:opacity-50"><ShieldCheck size={14} />Verify</button><button type="button" disabled={busy} onClick={() => onVerifySubsidy(version, "rejected")} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-200 px-2 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={14} />Reject</button></>}
                  {version.status === "active" ? <button type="button" disabled={busy} onClick={() => onUpdateStatus(version, "inactive")} className="min-h-8 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy ? "Saving…" : "Deactivate"}</button> : <button type="button" disabled={busy || !canActivate} onClick={() => onUpdateStatus(version, "active")} title={!canActivate ? "Verify subsidy rule before activation." : "Activate this rule version"} className="min-h-8 rounded-lg bg-emerald-700 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Saving…" : "Activate"}</button>}
                  <div className="relative"><button type="button" aria-label={`More details for version ${version.version}`} aria-expanded={menuFor === version.id} onClick={() => setMenuFor(menuFor === version.id ? null : version.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 hover:border-brand-emerald"><MoreHorizontal size={18} /></button>{menuFor === version.id && <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-brand-border bg-white p-1.5 shadow-lg"><button type="button" onClick={() => { setMenuFor(null); onViewVersion(version); }} className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-brand-text hover:bg-brand-mint-soft">View rule data</button></div>}</div>
                </div></td>
              </tr>;
            })}
            {!orderedVersions.length && <tr><td colSpan={ruleType === "subsidies" ? 6 : 5} className="px-4 py-9 text-center text-xs text-slate-500">No {title.toLowerCase()} rule versions are stored yet. Create a draft version to begin.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-brand-muted">Versions are stored by the backend and are immutable. Activate/deactivate and subsidy verification actions are persisted and audited by the API. An active effective-period overlap is rejected by the server.</p>
    </section>
  );
}

export default RuleVersionHistory;
