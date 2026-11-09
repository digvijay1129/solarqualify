import { createQuotation, getLeadQuotations, getQuotation, downloadQuotationPdf, decideQuotation } from './quotation.service.js';

export async function createQuotationController(req, res) {
  const quotation = await createQuotation(req.user, req.params.leadId, req.body);
  return res.status(201).json({ success: true, message: 'Quotation generated successfully.', data: { quotation } });
}
export async function getLeadQuotationsController(req, res) {
  const result = await getLeadQuotations(req.user, req.params.leadId, req.query);
  return res.status(200).json({ success: true, message: 'Quotation history retrieved successfully.', data: result });
}
export async function getQuotationController(req, res) {
  const quotation = await getQuotation(req.user, req.params.quotationId);
  return res.status(200).json({ success: true, message: 'Quotation retrieved successfully.', data: { quotation } });
}
export async function decideQuotationController(req, res) {
  const quotation = await decideQuotation(req.user, req.params.quotationId, req.body);
  return res.status(200).json({
    success: true,
    message: 'Your quotation decision has been saved.',
    data: { quotation },
  });
}

export async function downloadQuotationPdfController(req, res) {
  const pdf = await downloadQuotationPdf(req.user, req.params.quotationId);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="' + pdf.fileName + '"',
    'Content-Length': String(pdf.buffer.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  });
  return res.status(200).send(pdf.buffer);
}