import { useState } from "react";
import { Pencil, X } from "lucide-react";

function PricingRateDialog({ rate, effectiveFrom, effectiveTo, onClose, onSave }) {
  const [equipmentCost, setEquipmentCost] = useState(rate.equipmentCost ?? "");
  const [installationCost, setInstallationCost] = useState(rate.installationCost ?? "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    const equipment = Number(equipmentCost);
    const installation = Number(installationCost);
    if (equipmentCost === "" || !Number.isFinite(equipment) || equipment <= 0) nextErrors.equipmentCost = "Enter an equipment cost greater than zero.";
    if (installationCost === "" || !Number.isFinite(installation) || installation <= 0) nextErrors.installationCost = "Enter installation charges greater than zero.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const saved = onSave({
      systemSizeKw: rate.systemSizeKw,
      equipmentCost: equipment,
      installationCost: installation,
      approvalStatus: "draft",
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      note: note.trim(),
    });
    if (saved !== false) onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="pricing-rate-dialog-title" className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-brand-emerald"><Pencil size={21} /></span>
            <div>
              <h2 id="pricing-rate-dialog-title" className="text-lg font-extrabold text-brand-text">Configure {rate.systemSizeKw} kW Rate</h2>
              <p className="text-xs text-brand-muted">Enter draft values for administrator review.</p>
            </div>
          </div>
          <button type="button" aria-label="Close rate dialog" onClick={onClose} className="rounded-lg p-1.5 text-brand-muted hover:bg-slate-100"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-text">Equipment Cost (₹) *</span>
            <input type="number" min="0.01" step="0.01" value={equipmentCost} onChange={(event) => setEquipmentCost(event.target.value)} placeholder="Enter equipment cost" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
            {errors.equipmentCost && <span className="mt-1 block text-xs text-red-600">{errors.equipmentCost}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-text">Installation Charges (₹) *</span>
            <input type="number" min="0.01" step="0.01" value={installationCost} onChange={(event) => setInstallationCost(event.target.value)} placeholder="Enter installation charges" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
            {errors.installationCost && <span className="mt-1 block text-xs text-red-600">{errors.installationCost}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs text-brand-muted">
            <p><strong className="block text-brand-text">Effective From</strong>{effectiveFrom || "Not set"}</p>
            <p><strong className="block text-brand-text">Effective To</strong>{effectiveTo || "No end date"}</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brand-text">Review note (optional)</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={300} placeholder="Add rate source or approval context..." className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20" />
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950">Saved values remain an unapproved draft in this page session. This frontend cannot approve or persist an official rate.</div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800">Save Draft Rate</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default PricingRateDialog;
