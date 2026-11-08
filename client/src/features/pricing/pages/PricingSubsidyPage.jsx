import { useState } from "react";
import { usePricingSubsidy } from "../hooks/usePricingSubsidy.js";
import { createDraftVersion, getNextEffectiveDate, getNextVersionLabel, validateEffectiveDates } from "../utils/pricing-calculations.js";
import PricingSubsidyHero from "../components/PricingSubsidyHero.jsx";
import PricingSubsidyTabs from "../components/PricingSubsidyTabs.jsx";
import SystemPricingConfiguration from "../components/SystemPricingConfiguration.jsx";
import GovernmentSubsidyRuleCard from "../components/GovernmentSubsidyRuleCard.jsx";
import SubsidyCalculatorCard from "../components/SubsidyCalculatorCard.jsx";
import QuotationCostPreview from "../components/QuotationCostPreview.jsx";
import RuleVersionHistory from "../components/RuleVersionHistory.jsx";
import ConfigurationSettings from "../components/ConfigurationSettings.jsx";
import KeyReferences from "../components/KeyReferences.jsx";
import PricingRateDialog from "../components/PricingRateDialog.jsx";
import CreateRuleVersionDialog from "../components/CreateRuleVersionDialog.jsx";
import PricingInformationDialog from "../components/PricingInformationDialog.jsx";

function PricingLoading() {
  return (
    <div className="space-y-5" aria-label="Loading Pricing and Subsidy">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" /><div className="h-[460px] animate-pulse rounded-2xl bg-slate-200" /></div>
    </div>
  );
}

function PricingError({ onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h2 className="text-lg font-bold text-brand-text">Pricing & Subsidy could not be loaded</h2>
      <p className="mt-2 text-sm text-brand-muted">The illustrative pricing configuration is unavailable.</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
    </section>
  );
}

function PricingSubsidyContent({ data }) {
  const [activeTab, setActiveTab] = useState("pricing-configuration");
  const [selectedCapacityKw, setSelectedCapacityKw] = useState(data.selectedCapacityKw);
  const [rates, setRates] = useState(data.rates);
  const [versions, setVersions] = useState(data.versions);
  const [settings, setSettings] = useState(data.settings);
  const [effectiveDates, setEffectiveDates] = useState(data.effectiveDates);
  const [dateErrors, setDateErrors] = useState({});
  const [selectedRate, setSelectedRate] = useState(null);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [initialVersion, setInitialVersion] = useState(getNextVersionLabel(data.versions));
  const [ruleInfoOpen, setRuleInfoOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [notice, setNotice] = useState("");

  function navigateToSection(sectionId) {
    setActiveTab(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateEffectiveDate(key, value) {
    setEffectiveDates((previous) => ({ ...previous, [key]: value }));
    setDateErrors((previous) => ({ ...previous, [key]: undefined }));
    setNotice("");
  }

  function saveRateDraft(input) {
    const errors = validateEffectiveDates(effectiveDates.effectiveFrom, effectiveDates.effectiveTo);
    setDateErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice("Please correct the effective dates before saving the draft rate.");
      return false;
    }

    setRates((previous) => previous.map((rate) => rate.systemSizeKw === input.systemSizeKw
      ? { ...rate, ...input, approvalStatus: "draft" }
      : rate));
    setNotice(`${input.systemSizeKw} kW rate saved as a draft in this page session. Administrator approval and server persistence are not connected.`);
    return true;
  }

  function createVersion(input) {
    const result = createDraftVersion(input, versions);
    if (!result.version) return result;
    setVersions((previous) => [result.version, ...previous]);
    setNotice(`${result.version.version} created as a local draft. The active version remains ${data.activeVersion}.`);
    setInitialVersion(getNextVersionLabel([result.version, ...versions]));
    return result;
  }

  function handleDuplicateVersion(version) {
    setInitialVersion(getNextVersionLabel(versions));
    setShowCreateVersion(true);
    setNotice(`Create a new draft based on ${version.version}; the historic version will remain unchanged.`);
  }

  function updateSetting(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setNotice("Preference changed in this page session only; it has not been saved to a server.");
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PricingSubsidyHero />
      <PricingSubsidyTabs activeTab={activeTab} onNavigate={navigateToSection} />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2 xl:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <SystemPricingConfiguration
            rates={rates}
            activeVersion={data.activeVersion}
            effectiveFrom={effectiveDates.effectiveFrom}
            effectiveTo={effectiveDates.effectiveTo}
            dateErrors={dateErrors}
            onEffectiveFromChange={(value) => updateEffectiveDate("effectiveFrom", value)}
            onEffectiveToChange={(value) => updateEffectiveDate("effectiveTo", value)}
            onConfigureRate={setSelectedRate}
          />
          <QuotationCostPreview capacityKw={selectedCapacityKw} generation={data.generation} rates={rates} subsidyRule={data.subsidyRule} />
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <GovernmentSubsidyRuleCard rule={data.subsidyRule} onViewDetails={() => setRuleInfoOpen(true)} />
          <SubsidyCalculatorCard rule={data.subsidyRule} selectedCapacityKw={selectedCapacityKw} onCapacityChange={(value) => { setSelectedCapacityKw(value); setNotice(""); }} />
          <RuleVersionHistory
            versions={versions}
            referenceDate={data.referenceDate}
            onCreateVersion={() => { setInitialVersion(getNextVersionLabel(versions)); setShowCreateVersion(true); }}
            onViewVersion={setSelectedVersion}
            onDuplicateVersion={handleDuplicateVersion}
          />
        </div>
      </div>

      <ConfigurationSettings settings={settings} onChange={updateSetting} />
      <KeyReferences generationUnits={data.generation.unitsPerKwPerYear} maximumSubsidy={data.subsidyRule.maximumSubsidy} />

      {notice && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{notice}</div>}
      <p className="text-[11px] leading-5 text-brand-muted">{data.dataLabel} Annual generation uses the fixed illustrative assumption of {data.generation.unitsPerKwPerYear.toLocaleString("en-IN")} units per kW per year. Subsidy amounts, eligibility and policy effective dates must be verified with current official MNRE / DISCOM guidance before production use. Draft pricing and version changes are temporary page-session state only.</p>

      {selectedRate && (
        <PricingRateDialog
          key={selectedRate.systemSizeKw}
          rate={rates.find((item) => item.systemSizeKw === selectedRate.systemSizeKw) ?? selectedRate}
          effectiveFrom={effectiveDates.effectiveFrom}
          effectiveTo={effectiveDates.effectiveTo}
          onClose={() => setSelectedRate(null)}
          onSave={saveRateDraft}
        />
      )}

      {showCreateVersion && (
        <CreateRuleVersionDialog
          initialVersion={initialVersion}
          initialEffectiveFrom={getNextEffectiveDate(data.referenceDate)}
          onClose={() => setShowCreateVersion(false)}
          onCreate={createVersion}
        />
      )}

      {ruleInfoOpen && (
        <PricingInformationDialog title="Subsidy rule status and limitations" subtitle="Read-only information for the client-provided demonstration rule" onClose={() => setRuleInfoOpen(false)}>
          <div className="space-y-3">
            <p>This rule is included from the project brief for prototype demonstration only. It has not been verified against a current official MNRE circular, DISCOM implementation notice, customer eligibility criteria or effective date.</p>
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
              <strong>Demo values</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>₹30,000 per kW for the first 2 kW</li>
                <li>₹18,000 for the third kW</li>
                <li>Maximum illustrative subsidy: ₹78,000</li>
              </ul>
            </div>
            <p>Do not use this display as an eligibility decision or final customer quotation. Confirm official amounts, caps, system restrictions and effective dates before launch.</p>
          </div>
        </PricingInformationDialog>
      )}

      {selectedVersion && (
        <PricingInformationDialog title={`Rule version ${selectedVersion.version}`} subtitle="Version history detail" onClose={() => setSelectedVersion(null)}>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4"><dt className="text-brand-muted">Effective From</dt><dd className="font-semibold">{selectedVersion.effectiveFrom}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-brand-muted">Effective To</dt><dd className="font-semibold">{selectedVersion.effectiveTo || "No end date"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-brand-muted">Status</dt><dd className="font-semibold capitalize">{selectedVersion.status}</dd></div>
          </dl>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-brand-muted">{selectedVersion.note || "No version notes supplied."}</p>
          {selectedVersion.createdInSession && <p className="mt-3 text-xs font-semibold text-blue-800">Created in this page session only; not persisted or activated.</p>}
        </PricingInformationDialog>
      )}
    </div>
  );
}

function PricingSubsidyPage() {
  const { data, isPending, isError, refetch } = usePricingSubsidy();
  if (isPending) return <PricingLoading />;
  if (isError || !data) return <PricingError onRetry={refetch} />;
  return <PricingSubsidyContent data={data} />;
}

export default PricingSubsidyPage;
