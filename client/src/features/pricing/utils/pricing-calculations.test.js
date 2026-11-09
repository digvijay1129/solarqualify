import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUBSIDY_RULE,
  GENERATION_UNITS_PER_KW_PER_YEAR,
  calculateAnnualGeneration,
  calculateApprovedGrossCost,
  calculateDraftGrossCost,
  calculateNetInstallationCost,
  calculateSubsidy,
  createDraftVersion,
  getNextEffectiveDate,
  getNextVersionLabel,
  getRateDisplayState,
  getVersionStatus,
  sortVersionsNewestFirst,
  validateEffectiveDates,
  validateNewVersion,
} from "./pricing-calculations.js";

const versions = [
  { version: "v2.0", effectiveFrom: "2026-11-01", status: "active" },
  { version: "v1.1", effectiveFrom: "2026-07-01", effectiveTo: "2026-10-31", status: "expired" },
];

describe("pricing and subsidy calculations", () => {
  it("uses the fixed 1,400 units per kW per year assumption", () => {
    expect(GENERATION_UNITS_PER_KW_PER_YEAR).toBe(1400);
  });

  it("calculates 1 kW annual generation", () => {
    expect(calculateAnnualGeneration(1)).toBe(1400);
  });

  it("calculates 2 kW annual generation", () => {
    expect(calculateAnnualGeneration(2)).toBe(2800);
  });

  it("calculates 3 kW annual generation", () => {
    expect(calculateAnnualGeneration(3)).toBe(4200);
  });

  it("rejects zero capacity for generation", () => {
    expect(calculateAnnualGeneration(0)).toBeNull();
  });

  it("rejects non-finite generation inputs", () => {
    expect(calculateAnnualGeneration(Number.NaN)).toBeNull();
  });

  it("calculates the demo subsidy for 1 kW", () => {
    expect(calculateSubsidy(1)).toBe(30000);
  });

  it("calculates the demo subsidy for 2 kW", () => {
    expect(calculateSubsidy(2)).toBe(60000);
  });

  it("calculates the demo subsidy for 3 kW", () => {
    expect(calculateSubsidy(3)).toBe(78000);
  });

  it("caps subsidy at the configured maximum for larger systems", () => {
    expect(calculateSubsidy(5)).toBe(78000);
  });

  it("returns null for invalid subsidy capacity", () => {
    expect(calculateSubsidy(0)).toBeNull();
  });

  it("uses the demo subsidy rule values from the project brief", () => {
    expect(DEFAULT_SUBSIDY_RULE).toEqual({
      firstTwoKwPerKw: 30000,
      thirdKw: 18000,
      maximumSubsidy: 78000,
    });
  });

  it("calculates subsidies from ordered backend slab rules", () => {
    const rule = {
      slabs: [
        { upToKW: 2, amountPerKW: 30000 },
        { upToKW: 3, amountPerKW: 18000 },
      ],
      maximumSubsidy: 78000,
    };
    expect(calculateSubsidy(1, rule)).toBe(30000);
    expect(calculateSubsidy(2, rule)).toBe(60000);
    expect(calculateSubsidy(3, rule)).toBe(78000);
    expect(calculateSubsidy(5, rule)).toBe(78000);
  });

  it("uses a backend maximum subsidy cap for the slab calculation", () => {
    const rule = {
      slabs: [{ upToKW: 5, amountPerKW: 20000 }],
      maximumSubsidy: 65000,
    };
    expect(calculateSubsidy(5, rule)).toBe(65000);
  });

  it("calculates a draft total when both draft cost parts exist", () => {
    expect(calculateDraftGrossCost({ equipmentCost: 100000, installationCost: 25000 })).toBe(125000);
  });

  it("does not calculate draft total when a cost part is missing", () => {
    expect(calculateDraftGrossCost({ equipmentCost: 100000, installationCost: null })).toBeNull();
  });

  it("does not treat draft rates as approved gross cost", () => {
    expect(calculateApprovedGrossCost({ equipmentCost: 100000, installationCost: 25000, approvalStatus: "draft" })).toBeNull();
  });

  it("calculates gross cost only for an approved rate", () => {
    expect(calculateApprovedGrossCost({ equipmentCost: 100000, installationCost: 25000, approvalStatus: "approved" })).toBe(125000);
  });

  it("does not calculate net cost without verified inputs", () => {
    expect(calculateNetInstallationCost(125000, 78000, false)).toBeNull();
  });

  it("calculates net cost only when inputs are verified", () => {
    expect(calculateNetInstallationCost(125000, 78000, true)).toBe(47000);
  });

  it("does not allow a negative net installation cost", () => {
    expect(calculateNetInstallationCost(50000, 78000, true)).toBe(0);
  });

  it("requires an effective-from date", () => {
    expect(validateEffectiveDates("").effectiveFrom).toBeTruthy();
  });

  it("rejects impossible calendar dates", () => {
    expect(validateEffectiveDates("2026-02-30").effectiveFrom).toBeTruthy();
  });

  it("rejects effective-to earlier than effective-from", () => {
    expect(validateEffectiveDates("2026-11-01", "2026-10-31").effectiveTo).toBeTruthy();
  });

  it("accepts a valid effective date range", () => {
    expect(validateEffectiveDates("2026-11-01", "2026-11-30")).toEqual({});
  });

  it("rejects an effective-to date equal to the effective-from date", () => {
    expect(validateEffectiveDates("2026-11-01", "2026-11-01").effectiveTo).toBeTruthy();
  });

  it("recognizes an inactive backend rule version", () => {
    expect(getVersionStatus({ status: "inactive", effectiveFrom: "2026-11-01" }, "2026-11-14")).toBe("inactive");
  });

  it("supports backend ISO timestamps in rule dates", () => {
    expect(getVersionStatus({
      status: "active",
      effectiveFrom: "2026-07-01T00:00:00.000Z",
      effectiveTo: "2026-10-31T00:00:00.000Z",
    }, "2026-11-14")).toBe("expired");
  });

  it("derives an expired version status from the reference date", () => {
    expect(getVersionStatus(versions[1], "2026-11-14")).toBe("expired");
  });

  it("derives a scheduled version status before its start date", () => {
    expect(getVersionStatus(versions[0], "2026-10-31")).toBe("scheduled");
  });

  it("keeps draft versions in draft state", () => {
    expect(getVersionStatus({ status: "draft", effectiveFrom: "2026-11-15" }, "2026-11-14")).toBe("draft");
  });

  it("sorts versions newest first", () => {
    expect(sortVersionsNewestFirst(versions).map((item) => item.version)).toEqual(["v2.0", "v1.1"]);
  });

  it("defaults the next version effective date to the day after the reference date", () => {
    expect(getNextEffectiveDate("2026-11-14")).toBe("2026-11-15");
  });

  it("returns an empty next effective date for an invalid reference date", () => {
    expect(getNextEffectiveDate("bad-date")).toBe("");
  });

  it("suggests the next minor version label", () => {
    expect(getNextVersionLabel(versions)).toBe("v2.1");
  });

  it("rejects duplicate version labels", () => {
    expect(validateNewVersion({ version: "v2.0", effectiveFrom: "2026-11-15", effectiveTo: "" }, versions).version).toBeTruthy();
  });

  it("creates a version as draft and does not activate it", () => {
    const result = createDraftVersion({ version: "v2.1", effectiveFrom: "2026-11-15", effectiveTo: "", note: "Test" }, versions);
    expect(result.version.status).toBe("draft");
    expect(result.version.createdInSession).toBe(true);
  });

  it("marks complete unapproved pricing as draft", () => {
    expect(getRateDisplayState({ equipmentCost: 100000, installationCost: 25000, approvalStatus: "draft" })).toBe("draft");
  });

  it("marks empty pricing as awaiting approval", () => {
    expect(getRateDisplayState({ equipmentCost: null, installationCost: null })).toBe("awaiting");
  });
});
