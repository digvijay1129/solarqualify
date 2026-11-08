import { useState } from "react";
import { Clock3, X } from "lucide-react";

function CreateRuleVersionDialog({ initialVersion, initialEffectiveFrom, onClose, onCreate }) {
  const [version, setVersion] = useState(initialVersion);
  const [effectiveFrom, setEffectiveFrom] = useState(initialEffectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const result = onCreate({ version, effectiveFrom, effectiveTo, note });
    setErrors(result.errors ?? {});
    if (result.version) onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-version-title" className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-brand-emerald"><Clock3 size={22} /></span>
            <div>
              <h2 id="create-version-title" className="text-lg font-extrabold text-brand-text">Create New Rule Version</h2>
              <p className="text-xs text-brand-muted">Create a draft version for later admin review.</p>
            </div>
          </div>
          <button type="button" aria-label="Close new version dialog" onClick={onClose} className="rounded-lg p-1.5 text-brand-muted hover:bg-slate-100"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-text">Version label *</span>
            <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="e.g. v2.1" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
            {errors.version && <span className="mt-1 block text-xs text-red-600">{errors.version}</span>}
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-text">Effective From *</span>
              <input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
              {errors.effectiveFrom && <span className="mt-1 block text-xs text-red-600">{errors.effectiveFrom}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-text">Effective To</span>
              <input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
              {errors.effectiveTo && <span className="mt-1 block text-xs text-red-600">{errors.effectiveTo}</span>}
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-text">Version note (optional)</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={300} placeholder="Describe changes in this version..." className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950">The new version is saved as a local draft only. It does not replace or activate the current version.</div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800">Create Draft Version</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CreateRuleVersionDialog;
