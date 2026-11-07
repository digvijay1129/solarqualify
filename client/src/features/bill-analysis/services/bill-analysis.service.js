import {
  billAnalysisRepository,
} from "../../../mocks/repositories/bill-analysis.repository.js";

/**
 * Retrieves the current Bill Analysis session.
 *
 * Uses the local demo repository until backend integration.
 */
export async function getBillAnalysisSession() {
  return billAnalysisRepository.getSession();
}