import { describe, expect, it } from "vitest";
import {
  annualGeneration, bytesToReadableSize, filterDocuments, formatCurrency,
  getMilestoneProgress, validateEmail, validateLeadStep, validateProfile,
  validateSupportRequest, validateUploadFile,
} from "./homeowner-portal.js";

const validLead = {
  fullName: "Aarav Sharma", mobileNumber: "9876543210", email: "aarav@example.invalid", preferredContact: "phone",
  addressLine1: "12 Sample Road", city: "Pune", state: "Maharashtra", pincode: "411001",
  propertyType: "Independent House", ownershipStatus: "owner", roofType: "RCC Flat Roof",
  roofAreaSqFt: "900", monthlyElectricityBill: "3200", monthlyUnits: "340",
};
const mockFile = (name = "bill.pdf", size = 1000) => ({ name, size, type: "application/pdf" });

describe("Homeowner portal utilities", () => {
  it("calculates annual generation using the stated 1,400-unit assumption", () => {
    expect(annualGeneration(3)).toBe(4200);
    expect(annualGeneration("2.5")).toBe(3500);
    expect(annualGeneration(0)).toBeNull();
    expect(annualGeneration("bad")).toBeNull();
  });
  it("formats currency safely and leaves missing rates pending", () => {
    expect(formatCurrency(78000)).toContain("78,000");
    expect(formatCurrency(null)).toBe("Awaiting approved pricing");
    expect(formatCurrency("unknown")).toBe("Awaiting approved pricing");
  });
  it("validates email addresses", () => {
    expect(validateEmail("a@example.com")).toBe(true);
    expect(validateEmail("bad-email")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
  });
  it("accepts a valid contact step", () => {
    expect(validateLeadStep(1, validLead, null)).toEqual({});
  });
  it("rejects missing contact details", () => {
    const errors = validateLeadStep(1, { ...validLead, fullName: "", email: "bad", mobileNumber: "12" }, null);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["fullName", "email", "mobileNumber"]));
  });
  it("rejects an invalid preferred contact choice", () => {
    expect(validateLeadStep(1, { ...validLead, preferredContact: "fax" }, null).preferredContact).toBeTruthy();
  });
  it("accepts a valid address step", () => {
    expect(validateLeadStep(2, validLead, null)).toEqual({});
  });
  it("rejects invalid PIN codes", () => {
    expect(validateLeadStep(2, { ...validLead, pincode: "123" }, null).pincode).toBeTruthy();
  });
  it("requires address and city", () => {
    const errors = validateLeadStep(2, { ...validLead, addressLine1: "", city: "" }, null);
    expect(errors.addressLine1).toBeTruthy();
    expect(errors.city).toBeTruthy();
  });
  it("accepts valid roof and energy information", () => {
    expect(validateLeadStep(3, validLead, null)).toEqual({});
  });
  it("rejects zero or invalid roof area", () => {
    expect(validateLeadStep(3, { ...validLead, roofAreaSqFt: "0" }, null).roofAreaSqFt).toBeTruthy();
    expect(validateLeadStep(3, { ...validLead, roofAreaSqFt: "abc" }, null).roofAreaSqFt).toBeTruthy();
  });
  it("requires positive bill amount and monthly units", () => {
    const errors = validateLeadStep(3, { ...validLead, monthlyElectricityBill: "0", monthlyUnits: "-2" }, null);
    expect(errors.monthlyElectricityBill).toBeTruthy();
    expect(errors.monthlyUnits).toBeTruthy();
  });
  it("accepts a PDF electricity bill", () => {
    expect(validateLeadStep(4, validLead, mockFile())).toEqual({});
  });
  it("rejects missing electricity bill", () => {
    expect(validateLeadStep(4, validLead, null).billFile).toBeTruthy();
  });
  it("rejects unsupported electricity bill file types", () => {
    expect(validateUploadFile(mockFile("bill.exe"))).toContain("Unsupported");
  });
  it("rejects files larger than the configured size", () => {
    expect(validateUploadFile(mockFile("bill.pdf", 11 * 1024 * 1024), { maxSizeMB: 10 })).toContain("10 MB");
  });
  it("rejects empty files", () => {
    expect(validateUploadFile(mockFile("empty.pdf", 0))).toContain("empty");
  });
  it("accepts JPG, PNG, PDF and WebP bill extensions", () => {
    expect(validateUploadFile(mockFile("bill.jpg"), { maxSizeMB: 10, allowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp"] })).toBeNull();
    expect(validateUploadFile(mockFile("bill.png"), { maxSizeMB: 10, allowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp"] })).toBeNull();
    expect(validateUploadFile(mockFile("bill.webp"), { maxSizeMB: 10, allowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp"] })).toBeNull();
  });
  it("validates profile data", () => {
    expect(validateProfile({ fullName: "Aarav", email: "a@example.com", mobileNumber: "9876543210" })).toEqual({});
  });
  it("rejects invalid profile data", () => {
    const errors = validateProfile({ fullName: "", email: "bad", mobileNumber: "1" });
    expect(errors.fullName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.mobileNumber).toBeTruthy();
  });
  it("accepts valid support messages", () => {
    expect(validateSupportRequest({ subject: "Project Update", message: "Please share my next project update." })).toEqual({});
  });
  it("rejects short and overlong support messages", () => {
    expect(validateSupportRequest({ subject: "Other", message: "short" }).message).toBeTruthy();
    expect(validateSupportRequest({ subject: "Other", message: "x".repeat(501) }).message).toBeTruthy();
  });
  it("requires a support topic", () => {
    expect(validateSupportRequest({ subject: "", message: "A sufficiently long message." }).subject).toBeTruthy();
  });
  it("filters documents by category, search and status", () => {
    const docs = [
      { name: "Quotation Demo.pdf", category: "Quotations", status: "Available" },
      { name: "Electricity Bill.pdf", category: "Bills", status: "Uploaded" },
    ];
    expect(filterDocuments(docs, { category: "Bills" })).toHaveLength(1);
    expect(filterDocuments(docs, { query: "quotation" })).toHaveLength(1);
    expect(filterDocuments(docs, { status: "Uploaded" })).toHaveLength(1);
  });
  it("filters documents by date range", () => {
    const docs = [
      { name: "Recent.pdf", category: "Bills", status: "Uploaded", uploadedAt: "2026-11-08" },
      { name: "Older.pdf", category: "Bills", status: "Uploaded", uploadedAt: "2026-09-01" },
    ];
    expect(filterDocuments(docs, { dateRange: "Last 30 Days", referenceDate: "2026-11-08" })).toHaveLength(1);
    expect(filterDocuments(docs, { dateRange: "This Year", referenceDate: "2026-11-08" })).toHaveLength(2);
  });
  it("returns zero progress for empty milestones", () => {
    expect(getMilestoneProgress([])).toBe(0);
  });
  it("calculates milestone progress from completed and active work", () => {
    expect(getMilestoneProgress([
      { status: "completed" },
      { status: "completed" },
      { status: "in-progress", fractionComplete: 0.5 },
      { status: "upcoming" },
    ])).toBe(63);
  });
  it("clamps active milestone progress", () => {
    expect(getMilestoneProgress([{ status: "in-progress", fractionComplete: 5 }])).toBe(99);
    expect(getMilestoneProgress([{ status: "in-progress", fractionComplete: -1 }])).toBe(0);
  });
  it("formats file sizes", () => {
    expect(bytesToReadableSize(2048)).toBe("2 KB");
    expect(bytesToReadableSize(2 * 1024 * 1024)).toBe("2.0 MB");
    expect(bytesToReadableSize(0)).toBe("0 KB");
  });
});
