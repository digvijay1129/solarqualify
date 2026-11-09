import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { usePricingSubsidy, pricingSubsidyQueryKey } from "../hooks/usePricingSubsidy.js";
import {
  createRuleVersion,
  updateRuleVersionStatus,
  verifySubsidyRule,
} from "../services/pricing-subsidy.service.js";
import { getNextEffectiveDate } from "../utils/pricing-calculations.js";
import PricingSubsidyHero from "../components/PricingSubsidyHero.jsx";
import PricingSubsidyTabs from "../components/PricingSubsidyTabs.jsx";
import SystemPricingConfiguration from "../components/SystemPricingConfiguration.jsx";
import GovernmentSubsidyRuleCard from "../components/GovernmentSubsidyRuleCard.jsx";
import SubsidyCalculatorCard from "../components/SubsidyCalculatorCard.jsx";
import QuotationCostPreview from "../components/QuotationCostPreview.jsx";
import RuleVersionHistory from "../components/RuleVersionHistory.jsx";
import ConfigurationSettings from "../components/ConfigurationSettings.jsx";
import KeyReferences from "../components/KeyReferences.jsx";
import CreateRuleVersionDialog from "../components/CreateRuleVersionDialog.jsx";
import PricingInformationDialog from "../components/PricingInformationDialog.jsx";

function PricingLoading() {
  return <div className="space-y-5" aria-label="Loading Pricing and Subsidy"><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="h-12 animate-pulse rounded-2xl bg-slate-200" /><div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" /><div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" /></div></div>;
}

function PricingError({ onRetry, message }) {
  return <section className="rounded-2xl border border-red-200 bg-white p-8 text-center"><h2 className="text-lg font-bold text-brand-text">Pricing & Subsidy could not be loaded</h2><p className="mt-2 text-sm text-brand-muted">{message || "The business-rule API could not be reached."}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button></section>;
}

function formatRuleDate(value) {
  if (!value) return "No end date";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : parsed.toLocaleDateString("en-IN");
}

function PricingSubsidyContent({ data, refetch }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pricing-configuration");
  const [selectedCapacityKw, setSelectedCapacityKw] = useState(data.selectedCapacityKw ?? 3);
  const [settings, setSettings] = useState(data.settings);
  const [ruleDialogType, setRuleDialogType] = useState(null);
  const [ruleInfoOpen, setRuleInfoOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [notice, setNotice] = useState(null);

  const invalidateRules = () => queryClient.invalidateQueries({ queryKey: pricingSubsidyQueryKey });

  const createMutation = useMutation({
    mutationFn: ({ ruleType, payload }) => createRuleVersion(ruleType, payload),
    onSuccess: async (rule, variables) => {
      setRuleDialogType(null);
      setNotice({ tone: "success", message: `${variables.ruleType} rule version v${rule.version} was created as a draft. Activate it after review; subsidy rules must be verified first.` });
      await invalidateRules();
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "Rule version could not be created." }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ ruleType, ruleId, status }) => updateRuleVersionStatus(ruleType, ruleId, { status }),
    onSuccess: async (rule, variables) => {
      setNotice({ tone: "success", message: `${variables.ruleType} rule v${rule.version} is now ${rule.status}.` });
      await invalidateRules();
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "Rule status could not be updated." }),
  });

  const verificationMutation = useMutation({
    mutationFn: ({ ruleId, decision }) => verifySubsidyRule(ruleId, decision),
    onSuccess: async (rule) => {
      setNotice({ tone: rule.verificationStatus === "verified" ? "success" : "warning", message: `Subsidy rule v${rule.version} verification decision: ${rule.verificationStatus}. Activation remains a separate action.` });
      await invalidateRules();
    },
    onError: (error) => setNotice({ tone: "error", message: error?.message || "Subsidy verification could not be saved." }),
  });

  function navigateToSection(sectionId) {
    setActiveTab(sectionId);
    globalThis.document?.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onCreateRule(payload) {
    return createMutation.mutateAsync({ ruleType: ruleDialogType, payload });
  }

  function updateRuleStatus(ruleType, rule, status) {
    statusMutation.mutate({ ruleType, ruleId: rule.id, status });
  }

  function decideSubsidy(rule, decision) {
    const accepted = decision === "verified";
    const question = accepted
      ? "Confirm that you have checked the source, date, conditions and authority for this subsidy rule. This is a final verification decision."
      : "Reject this subsidy rule? A rejected subsidy rule is automatically made inactive.";
    if (typeof globalThis.confirm === "function" && !globalThis.confirm(question)) return;
    verificationMutation.mutate({ ruleId: rule.id, decision });
  }

  function updateSetting(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  const pricingRules = data.rules.pricing ?? [];
  const subsidyRules = data.rules.subsidies ?? [];
  const generationRules = data.rules.generation ?? [];
  const selectedRule = selectedVersion;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PricingSubsidyHero />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div><p className="text-xs font-extrabold text-slate-900">Live business-rule configuration</p><p className="mt-1 text-[11px] text-slate-500">{data.dataLabel} · Effective date {data.referenceDate}</p></div>
        <button type="button" onClick={() => { setNotice(null); refetch(); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw size={14} />Refresh Rules</button>
      </div>
      <PricingSubsidyTabs activeTab={activeTab} onNavigate={navigateToSection} />

      {(data.conflicts.pricing || data.conflicts.generation || data.conflicts.subsidies) && <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p>Overlapping active rule versions were detected for {Object.entries(data.conflicts).filter(([, value]) => value).map(([key]) => key).join(", ")}. The quotation calculation API requires a single applicable pricing and generation version; correct any overlap before generating quotations.</p></div>}

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2 xl:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <SystemPricingConfiguration
            rates={data.rates}
            activeRule={data.activeRules.pricing}
            conflict={data.conflicts.pricing}
            onCreateVersion={() => setRuleDialogType("pricing")}
          />
          <QuotationCostPreview capacityKw={selectedCapacityKw} generation={data.generation} rates={data.rates} subsidyRule={data.subsidyRule} />
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <GovernmentSubsidyRuleCard rule={data.subsidyRule} onViewDetails={() => setRuleInfoOpen(true)} />
          <SubsidyCalculatorCard rule={data.subsidyRule} selectedCapacityKw={selectedCapacityKw} onCapacityChange={setSelectedCapacityKw} />
          <RuleVersionHistory
            versions={subsidyRules}
            referenceDate={data.referenceDate}
            ruleType="subsidies"
            busyRuleId={verificationMutation.variables?.ruleId ?? statusMutation.variables?.ruleId}
            onCreateVersion={() => setRuleDialogType("subsidies")}
            onViewVersion={setSelectedVersion}
            onVerifySubsidy={decideSubsidy}
            onUpdateStatus={(rule, status) => updateRuleStatus("subsidies", rule, status)}
          />
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-brand-text">Generation Rule Management</h2><p className="mt-1 text-xs text-brand-muted">Annual units per kW are read from effective-dated generation rules; no default is silently substituted.</p></div><button type="button" onClick={() => setRuleDialogType("generation")} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-green-700 px-3 text-xs font-bold text-white"><span>+</span>Create generation rule</button></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active generation rule</p><p className="mt-1 text-sm font-extrabold text-slate-950">{data.activeRules.generation?.ruleName ?? "Not configured"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Annual generation</p><p className="mt-1 text-sm font-extrabold text-slate-950">{data.generation.unitsPerKwPerYear == null ? "Not configured" : `${data.generation.unitsPerKwPerYear.toLocaleString("en-IN")} units/kW/year`}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Effective from</p><p className="mt-1 text-sm font-extrabold text-slate-950">{formatRuleDate(data.activeRules.generation?.effectiveFrom)}</p></div></div>
        <RuleVersionHistory
          versions={generationRules}
          referenceDate={data.referenceDate}
          ruleType="generation"
          busyRuleId={statusMutation.variables?.ruleId}
          onCreateVersion={() => setRuleDialogType("generation")}
          onViewVersion={setSelectedVersion}
          onUpdateStatus={(rule, status) => updateRuleStatus("generation", rule, status)}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-brand-text">Pricing Rule Version History</h2><p className="mt-1 text-xs text-brand-muted">Persisted price-per-kW and installation charge versions.</p></div><button type="button" onClick={() => setRuleDialogType("pricing")} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-700 px-3 text-xs font-bold text-emerald-800">+ Create pricing version</button></div>
        <RuleVersionHistory
          versions={pricingRules}
          referenceDate={data.referenceDate}
          ruleType="pricing"
          busyRuleId={statusMutation.variables?.ruleId}
          onCreateVersion={() => setRuleDialogType("pricing")}
          onViewVersion={setSelectedVersion}
          onUpdateStatus={(rule, status) => updateRuleStatus("pricing", rule, status)}
        />
      </section>

      <ConfigurationSettings settings={settings} onChange={updateSetting} generationUnits={data.generation.unitsPerKWPerYear} />
      <KeyReferences generationUnits={data.generation.unitsPerKWPerYear} maximumSubsidy={data.subsidyRule.slabs?.length ? data.subsidyRule.maximumSubsidy : null} />

      {notice && <div role="status" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : notice.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.message}</div>}
      <p className="text-[11px] leading-5 text-brand-muted">Pricing and generation values are read from the active rule versions. Only a subsidy rule marked verified can be activated or applied by the quotation API. A verified subsidy rule does not establish individual government eligibility; use current official authority guidance to verify the source and terms before activation.</p>

      {ruleDialogType && <CreateRuleVersionDialog
        key={ruleDialogType}
        ruleType={ruleDialogType}
        initialEffectiveFrom={getNextEffectiveDate(data.referenceDate)}
        onClose={() => setRuleDialogType(null)}
        onCreate={onCreateRule}
      />}

      {ruleInfoOpen && <PricingInformationDialog title="Subsidy rule verification and limitations" subtitle="Server rule state and activation requirements" onClose={() => setRuleInfoOpen(false)}>
        <div className="space-y-3">
          <p><strong>Rule:</strong> {data.subsidyRule.ruleName || "Not configured"} {data.subsidyRule.version ? `(version ${data.subsidyRule.version})` : ""}</p>
          <p><strong>Verification:</strong> {data.subsidyRule.verificationStatus}. <strong>Status:</strong> {data.subsidyRule.status}.</p>
          <p>Subsidy rules are created as unverified drafts. Sales Staff must submit a final verification decision before the rule may be activated. Rejected rules are forced inactive by the backend. Verified rules still require explicit activation.</p>
          <p>Verification is an internal rule review state. It is not a determination of an individual homeowner's eligibility and does not replace review of current official MNRE / DISCOM guidance.</p>
        </div>
      </PricingInformationDialog>}

      {selectedRule && <PricingInformationDialog title={`${selectedRule.ruleName} · Version ${selectedRule.version}`} subtitle={`${selectedRule.status} rule details`} onClose={() => setSelectedVersion(null)}>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-4"><dt className="text-brand-muted">Effective from</dt><dd className="font-semibold">{formatRuleDate(selectedRule.effectiveFrom)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-brand-muted">Effective to</dt><dd className="font-semibold">{formatRuleDate(selectedRule.effectiveTo)}</dd></div>
          {selectedRule.pricePerKW !== undefined && <div className="flex justify-between gap-4"><dt className="text-brand-muted">Price per kW</dt><dd className="font-semibold">{selectedRule.pricePerKW}</dd></div>}
          {selectedRule.installationCharges !== undefined && <div className="flex justify-between gap-4"><dt className="text-brand-muted">Installation charges</dt><dd className="font-semibold">{selectedRule.installationCharges}</dd></div>}
          {selectedRule.unitsPerKWPerYear !== undefined && <div className="flex justify-between gap-4"><dt className="text-brand-muted">Generation units / kW / year</dt><dd className="font-semibold">{selectedRule.unitsPerKWPerYear}</dd></div>}
          {selectedRule.maximumSubsidy !== undefined && <div className="flex justify-between gap-4"><dt className="text-brand-muted">Maximum subsidy</dt><dd className="font-semibold">{selectedRule.maximumSubsidy}</dd></div>}
          {selectedRule.verificationStatus && <div className="flex justify-between gap-4"><dt className="text-brand-muted">Subsidy verification</dt><dd className="font-semibold">{selectedRule.verificationStatus}</dd></div>}
        </dl>
        {selectedRule.slabs?.length > 0 && <div className="mt-3 space-y-2"><p className="text-xs font-bold">Subsidy slabs</p>{selectedRule.slabs.map((slab, index) => <p key={index} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs"><span>Up to {slab.upToKW} kW</span><strong>{slab.amountPerKW} / kW</strong></p>)}</div>}
      </PricingInformationDialog>}
    </div>
  );
}

function PricingSubsidyPage() {
  const { data, isPending, isError, error, refetch } = usePricingSubsidy();
  if (isPending) return <PricingLoading />;
  if (isError || !data) return <PricingError onRetry={refetch} message={error?.message} />;
  return <PricingSubsidyContent data={data} refetch={refetch} />;
}

export default PricingSubsidyPage;
