import { Settings } from "lucide-react";

function SettingRow({ title, description, checked, onChange, disabled = false }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 px-3.5 py-3 hover:bg-slate-50"><span className="min-w-0"><span className="block text-sm font-semibold text-brand-text">{title}</span><span className="mt-0.5 block text-xs leading-5 text-brand-muted">{description}</span></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-green-700 disabled:opacity-60" /></label>;
}

function ConfigurationSettings({ settings, onChange, generationUnits }) {
  return (
    <section id="configuration-settings" className="min-w-0 scroll-mt-5 rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center gap-3"><Settings size={29} className="text-brand-emerald" /><div><h2 className="text-lg font-extrabold tracking-tight text-brand-text">Configuration Settings</h2><p className="text-xs text-brand-muted">Display preferences and the current generation assumption.</p></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-sm font-semibold text-brand-text">Currency</p><p className="mt-1 text-sm text-brand-muted">Indian Rupee (INR · ₹)</p><p className="mt-2 text-[11px] text-brand-muted">Currency formatting is fixed to INR.</p></div>
        <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-sm font-semibold text-brand-text">Active generation assumption</p><p className="mt-1 text-sm text-brand-muted">{generationUnits == null ? "No active generation rule" : `${generationUnits.toLocaleString("en-IN")} units per kW per year`}</p><p className="mt-2 text-[11px] text-brand-muted">Read from the active generation rule; not a performance guarantee.</p></div>
        <SettingRow title="Require effective-from date" description="The API requires an effective-from date for each version." checked={settings.requireEffectiveFrom} onChange={(value) => onChange("requireEffectiveFrom", value)} disabled />
        <SettingRow title="Preserve previously issued quotations" description="Issued quotations keep their immutable rule snapshots." checked={settings.preserveIssuedQuotations} onChange={(value) => onChange("preserveIssuedQuotations", value)} disabled />
        <SettingRow title="Show unverified rule warning" description="Keep a warning visible until the subsidy rule is verified." checked={settings.showUnverifiedRuleWarning} onChange={(value) => onChange("showUnverifiedRuleWarning", value)} />
      </div>
      <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900">These display preferences are retained in the current page session. Business-rule creation, verification and activation are persisted separately through the API.</p>
    </section>
  );
}

export default ConfigurationSettings;
