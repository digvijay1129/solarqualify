import { billAnalysisFixture } from "../fixtures/bill-analysis.fixture.js";

/**
 * Local Bill Analysis demo repository.
 *
 * OCR and persistent file storage are not connected yet.
 * Replace this implementation with API-backed operations
 * during backend integration.
 */
export const billAnalysisRepository = {
  async getSession() {
    return structuredClone(billAnalysisFixture);
  },
};