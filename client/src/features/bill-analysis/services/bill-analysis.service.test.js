import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  confirmBillLeadAssignment,
  deleteBillDocument,
  downloadBillDocument,
  getBillAnalysisLeads,
  getBillDocumentMetadata,
  getBillReview,
  runBillOcr,
  submitBillVerification,
  uploadBillDocument,
} from "./bill-analysis.service.js";

describe("Bill Analysis API integration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads leads from the live sales queue with a server-side search", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { items: [], pagination: { totalItems: 0 } } });
    await getBillAnalysisLeads("RCP-100");

    const url = new URL(apiRequest.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/leads");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(url.searchParams.get("status")).toBe("all");
    expect(url.searchParams.get("search")).toBe("RCP-100");
  });

  it("claims a lead for the signed-in Sales Staff user before accessing its bill", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { lead: { id: "lead-1" } } });
    await expect(confirmBillLeadAssignment("lead-1", "staff-1")).resolves.toEqual({ id: "lead-1" });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/assignment", {
      method: "PATCH",
      body: { salesStaffId: "staff-1" },
    });
  });

  it("uploads one electricity bill using the backend multipart field name", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { bill: { id: "bill-1" } } });
    const file = new File(["sample bill"], "bill.pdf", { type: "application/pdf" });

    await expect(uploadBillDocument("lead-1", file)).resolves.toEqual({ id: "bill-1" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/leads/lead-1/bill");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("bill").name).toBe("bill.pdf");
  });

  it("starts server OCR and returns extraction confidence and review state", async () => {
    const analysis = {
      ocrStatus: "completed",
      verificationStatus: "needs_review",
      extractionConfidence: 0.86,
      fields: { consumerNumber: "12345", tariff: "LT-I" },
    };
    apiRequest.mockResolvedValue({ success: true, data: { analysis } });

    await expect(runBillOcr("lead-1")).resolves.toEqual(analysis);
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/bill/analyze", { method: "POST" });
  });

  it("loads the manual review DTO for an assigned lead", async () => {
    const analysis = { billId: "bill-1", verificationStatus: "needs_review", fields: { monthlyUnits: 310 } };
    apiRequest.mockResolvedValue({ success: true, data: { analysis } });

    await expect(getBillReview("lead-1")).resolves.toEqual(analysis);
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/bill/review");
  });

  it("submits corrected fields and the Sales Staff verification decision", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { analysis: { verificationStatus: "verified" } } });
    const payload = {
      decision: "verified",
      fields: {
        consumerNumber: "12345",
        tariff: "LT-I",
        sanctionedLoad: 3,
        sanctionedLoadUnit: "kW",
        monthlyUnits: 310,
      },
      reviewNotes: "Checked against the original bill.",
    };

    await expect(submitBillVerification("lead-1", payload)).resolves.toEqual({ verificationStatus: "verified" });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/bill/verification", {
      method: "PATCH",
      body: payload,
    });
  });

  it("retrieves private bill bytes and supports deleting a rejected document", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    apiRequest.mockResolvedValueOnce(blob).mockResolvedValueOnce({ success: true });

    await expect(downloadBillDocument("lead-1")).resolves.toBe(blob);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/leads/lead-1/bill/download", { responseType: "blob" });

    await deleteBillDocument("lead-1");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/leads/lead-1/bill", { method: "DELETE" });
  });

  it("reads the live document metadata instead of using local fixtures", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { bill: { id: "bill-1", verificationStatus: "pending" } } });
    await expect(getBillDocumentMetadata("lead-1")).resolves.toEqual({ id: "bill-1", verificationStatus: "pending" });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/bill");
  });
});
