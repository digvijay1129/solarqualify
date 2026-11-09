
import { uploadBillDocument } from './bill.service.js';
import {
  getBillDocumentMetadata,
  downloadBillDocument,
} from './bill-read.service.js';
import { deleteBillDocument } from './bill-deletion.service.js';

import {
  analyzeBillDocument,
} from '../bill-analysis/bill-analysis.service.js';

import {
  getBillAnalysisForReview,
  verifyBillAnalysis,
} from '../bill-analysis/bill-verification.service.js';

function encodeRFC5987Value(value) {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function createContentDisposition(fileName) {
  const fallbackName =
    fileName
      .replace(/[^A-Za-z0-9._ -]/g, '_')
      .trim() || 'bill-document';

  const encodedName = encodeRFC5987Value(fileName);

  return (
    `attachment; filename="${fallbackName}"; ` +
    `filename*=UTF-8''${encodedName}`
  );
}

export async function uploadBillDocumentController(req, res) {
  const bill = await uploadBillDocument(
    req.user,
    req.params.leadId,
    req.file
  );

  return res.status(201).json({
    success: true,
    message: 'Bill document uploaded successfully.',
    data: { bill },
  });
}

export async function getBillDocumentMetadataController(req, res) {
  const bill = await getBillDocumentMetadata(
    req.user,
    req.params.leadId
  );

  return res.status(200).json({
    success: true,
    message: 'Bill metadata retrieved successfully.',
    data: { bill },
  });
}

export async function downloadBillDocumentController(req, res) {
  const document = await downloadBillDocument(
    req.user,
    req.params.leadId
  );

  res.set({
    'Content-Type': document.documentType,
    'Content-Length': String(document.documentSize),
    'Content-Disposition': createContentDisposition(
      document.originalFileName
    ),
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'",
  });

  return res.status(200).send(document.buffer);
}

export async function deleteBillDocumentController(req, res) {
  const result = await deleteBillDocument(
    req.user,
    req.params.leadId
  );

  return res.status(200).json({
    success: true,
    message: 'Bill document deleted successfully.',
    data: { bill: result },
  });
}

export async function analyzeBillDocumentController(req, res) {
  const analysis = await analyzeBillDocument(
    req.user,
    req.params.leadId
  );

  return res.status(200).json({
    success: true,
    message:
      'Bill analysis completed. Manual verification is required.',
    data: { analysis },
  });
}

export async function getBillAnalysisForReviewController(req, res) {
  const analysis = await getBillAnalysisForReview(
    req.user,
    req.params.leadId
  );

  return res.status(200).json({
    success: true,
    message: 'Bill analysis retrieved for manual review.',
    data: { analysis },
  });
}

export async function verifyBillAnalysisController(req, res) {
  const analysis = await verifyBillAnalysis(
    req.user,
    req.params.leadId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message:
      analysis.verificationStatus === 'verified'
        ? 'Bill verified successfully.'
        : 'Bill rejected successfully.',
    data: { analysis },
  });
}
