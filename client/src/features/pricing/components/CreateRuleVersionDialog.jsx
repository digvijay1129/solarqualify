import { useState } from "react";
import { Clock3, Plus, Trash2, X } from "lucide-react";

const DEFAULT_NAMES = {
  pricing: "Residential Solar Pricing",
  subsidies: "Residential Rooftop Subsidy",
  generation: "Annual Solar Generation",
};

function CreateRuleVersionDialog({ ruleType = "pricing", initialRule = null, initialEffectiveFrom, onClose, onCreate }) {
  const [ruleName, setRuleName] = useState(initialRule?.ruleName ?? DEFAULT_NAMES[ruleType]);
  const [effectiveFrom, setEffectiveFrom] = useState(initialEffectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [pricePerKW, setPricePerKW] = useState(initialRule?.pricePerKW ?? "");
  const [installationCharges, setInstallationCharges] = useState(initialRule?.installationCharges ?? "");
  const [unitsPerKWPerYear, setUnitsPerKWPerYear] = useState(initialRule?.unitsPerKWPerYear ?? "");
  const [maximumSubsidy, setMaximumSubsidy] = useState(initialRule?.maximumSubsidy ?? "");
  const [slabs, setSlabs] = useState(() => initialRule?.slabs?.map((slab) => ({ upToKW: String(slab.upToKW), amountPerKW: String(slab.amountPerKW) })) ?? [
    { upToKW: "", amountPerKW: "" },
  ]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function updateSlab(index, field, value) {
    setSlabs((current) => current.map((slab, slabIndex) => slabIndex === index ? { ...slab, [field]: value } : slab));
  }

  function validate() {
    const next = {};
    if (!ruleName.trim()) next.ruleName = "Rule name is required.";
    if (!effectiveFrom) next.effectiveFrom = "Effective-from date is required.";
    if (effectiveTo && effectiveFrom && effectiveTo <= effectiveFrom) next.effectiveTo = "Effective-to date must be later than effective-from date.";

    if (ruleType === "pricing") {
      const price = Number(pricePerKW);
      const charges = Number(installationCharges);
      if (pricePerKW === "" || !Number.isFinite(price) || price < 0) next.pricePerKW = "Enter a valid non-negative price per kW.";
      if (installationCharges === "" || !Number.isFinite(charges) || charges < 0) next.installationCharges = "Enter valid non-negative installation charges.";
    }

    if (ruleType === "generation") {
      const rate = Number(unitsPerKWPerYear);
      if (unitsPerKWPerYear === "" || !Number.isFinite(rate) || rate <= 0) next.unitsPerKWPerYear = "Enter annual generation greater than zero.";
    }

    if (ruleType === "subsidies") {
      if (!slabs.length) next.slabs = "At least one subsidy slab is required.";
      let previous = 0;
      slabs.forEach((slab, index) => {
        const upper = Number(slab.upToKW);
        const amount = Number(slab.amountPerKW);
        if (!Number.isFinite(upper) || upper <= previous) next[`slab-${index}-upToKW`] = "Each capacity limit must be positive and increasing.";
        if (!Number.isFinite(amount) || amount < 0) next[`slab-${index}-amountPerKW`] = "Enter a valid non-negative amount.";
        if (Number.isFinite(upper)) previous = upper;
      });
      const cap = Number(maximumSubsidy);
      if (maximumSubsidy === "" || !Number.isFinite(cap) || cap < 0) next.maximumSubsidy = "Enter a valid non-negative maximum subsidy.";
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      ruleName: ruleName.trim(),
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      status: "draft",
    };
    if (ruleType === "pricing") {
      payload.pricePerKW = Number(pricePerKW);
      payload.installationCharges = Number(installationCharges);
    } else if (ruleType === "generation") {
      payload.unitsPerKWPerYear = Number(unitsPerKWPerYear);
    } else {
      payload.slabs = slabs.map((slab) => ({ upToKW: Number(slab.upToKW), amountPerKW: Number(slab.amountPerKW) }));
      payload.maximumSubsidy = Number(maximumSubsidy);
    }

    setSubmitting(true);
    try {
      await onCreate(payload);
      onClose();
    } catch (error) {
      setErrors({ form: error?.message || "The rule version could not be created." });
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel = ruleType === "subsidies" ? "Subsidy" : ruleType === "generation" ? "Generation" : "Pricing";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-version-title" className="my-5 w-full max-w-2xl rounded-2xl border border-brand-border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-brand-emerald"><Clock3 size={22} /></span><div><h2 id="create-version-title" className="text-lg font-extrabold text-brand-text">Create {typeLabel} Rule Version</h2><p className="text-xs text-brand-muted">The API assigns the next numeric version and saves it as a draft.</p></div></div><button type="button" aria-label="Close new version dialog" disabled={submitting} onClick={onClose} className="rounded-lg p-1.5 text-brand-muted hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button></div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errors.form && <div role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-800">{errors.form}</div>}
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Rule name *</span><input value={ruleName} onChange={(event) => setRuleName(event.target.value)} maxLength={120} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald" />{errors.ruleName && <span className="mt-1 block text-xs text-red-600">{errors.ruleName}</span>}</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Effective From *</span><input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald" />{errors.effectiveFrom && <span className="mt-1 block text-xs text-red-600">{errors.effectiveFrom}</span>}</label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Effective To (optional)</span><input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-emerald" />{errors.effectiveTo && <span className="mt-1 block text-xs text-red-600">{errors.effectiveTo}</span>}</label></div>

          {ruleType === "pricing" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Price per kW (₹) *</span><input type="number" min="0" step="0.01" value={pricePerKW} onChange={(event) => setPricePerKW(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors.pricePerKW && <span className="mt-1 block text-xs text-red-600">{errors.pricePerKW}</span>}</label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Installation charges (₹) *</span><input type="number" min="0" step="0.01" value={installationCharges} onChange={(event) => setInstallationCharges(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors.installationCharges && <span className="mt-1 block text-xs text-red-600">{errors.installationCharges}</span>}</label></div>}

          {ruleType === "generation" && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Annual generation (units per kW per year) *</span><input type="number" min="0.1" step="0.1" value={unitsPerKWPerYear} onChange={(event) => setUnitsPerKWPerYear(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors.unitsPerKWPerYear && <span className="mt-1 block text-xs text-red-600">{errors.unitsPerKWPerYear}</span>}</label>}

          {ruleType === "subsidies" && <div className="space-y-3"><div><h3 className="text-sm font-bold text-brand-text">Subsidy capacity slabs</h3><p className="mt-0.5 text-xs text-brand-muted">Each slab amount is applied to the capacity segment after the previous limit, up to the stated kW limit.</p></div>{slabs.map((slab,index) => <div key={index} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]"><label className="block"><span className="mb-1 block text-xs font-semibold text-slate-700">Up to capacity (kW)</span><input type="number" min="0.1" step="0.1" value={slab.upToKW} onChange={(event) => updateSlab(index,"upToKW",event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors[`slab-${index}-upToKW`] && <span className="mt-1 block text-[10px] text-red-600">{errors[`slab-${index}-upToKW`]}</span>}</label><label className="block"><span className="mb-1 block text-xs font-semibold text-slate-700">Amount per kW (₹)</span><input type="number" min="0" step="0.01" value={slab.amountPerKW} onChange={(event) => updateSlab(index,"amountPerKW",event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors[`slab-${index}-amountPerKW`] && <span className="mt-1 block text-[10px] text-red-600">{errors[`slab-${index}-amountPerKW`]}</span>}</label><button type="button" disabled={slabs.length <= 1} onClick={() => setSlabs((current) => current.filter((_, slabIndex) => slabIndex !== index))} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-600 disabled:opacity-30"><Trash2 size={14} />Remove</button></div>)}{errors.slabs && <p className="text-xs text-red-600">{errors.slabs}</p>}<button type="button" disabled={slabs.length >= 20} onClick={() => setSlabs((current) => [...current,{upToKW:"",amountPerKW:""}])} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 disabled:opacity-40"><Plus size={14} />Add slab</button><label className="block"><span className="mb-1.5 block text-sm font-semibold text-brand-text">Maximum subsidy (₹) *</span><input type="number" min="0" step="0.01" value={maximumSubsidy} onChange={(event) => setMaximumSubsidy(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />{errors.maximumSubsidy && <span className="mt-1 block text-xs text-red-600">{errors.maximumSubsidy}</span>}</label></div>}

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950">{ruleType === "subsidies" ? "New subsidy rules start unverified and inactive as draft. A Sales Staff verification decision is required before activation." : "New rules are saved as draft and do not affect calculations until explicitly activated for their effective period."}</div>
          <div className="flex flex-wrap justify-end gap-2 pt-1"><button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={submitting} className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50">{submitting ? "Creating…" : "Create Draft Version"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default CreateRuleVersionDialog;
