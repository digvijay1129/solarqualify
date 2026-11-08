import { describe, expect, it } from "vitest";
import {
  calculateAnnualGeneration,
  calculateIllustrativeSubsidy,
  formatINR,
} from "./quotation-calculations.js";

const demoRule = {
  firstTwoKwPerKw: 30000,
  thirdKw: 18000,
  maximumAmount: 78000,
};

describe("quotation calculations", () => {
  it("uses the 1,400 units per kW per year assumption", () => {
    expect(calculateAnnualGeneration(1)).toBe(1400);
    expect(calculateAnnualGeneration(2)).toBe(2800);
    expect(calculateAnnualGeneration(3)).toBe(4200);
  });

  it("calculates only the illustrative demo subsidy tiers", () => {
    expect(calculateIllustrativeSubsidy(1, demoRule)).toBe(30000);
    expect(calculateIllustrativeSubsidy(2, demoRule)).toBe(60000);
    expect(calculateIllustrativeSubsidy(3, demoRule)).toBe(78000);
  });

  it("does not calculate a value for invalid capacity", () => {
    expect(calculateAnnualGeneration(0)).toBe(0);
    expect(calculateIllustrativeSubsidy(-2, demoRule)).toBe(0);
  });

  it("renders pending money as awaiting verified input", () => {
    expect(formatINR(null)).toBe("Awaiting verified input");
  });
});
