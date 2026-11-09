function ascii(value) {
  return String(value ?? '').replace(/₹/g, 'INR ').replace(/[–—]/g, '-')
    .replace(/[×]/g, 'x').replace(/[^\x20-\x7E]/g, '');
}
function escapeText(value) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function money(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not available';
  return 'INR ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function number(value, suffix = '') {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + suffix
    : 'Not available';
}
function date(value) {
  if (!value) return 'Not recorded';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Not recorded' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function wrap(value, max = 88) {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  for (const word of words) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= max) line += ' ' + word;
    else { out.push(line); line = word; }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}
function add(lines, value, bold = false, size = 10, gap = 15) {
  for (const text of wrap(value)) lines.push({ text, bold, size, gap });
}
function section(lines, value) {
  lines.push({ text: '', size: 6, gap: 8 });
  add(lines, value.toUpperCase(), true, 12, 19);
}
function quotationLines(q) {
  const c = q.customerSnapshot ?? {};
  const p = q.pricingSnapshot ?? {};
  const s = q.subsidySnapshot;
  const g = q.generationSnapshot ?? {};
  const input = q.calculationInputs ?? {};
  const lines = [];
  const numberText = q.quotationNumber || ('SQ-' + String(q._id ?? q.id ?? '').slice(-8).toUpperCase());
  add(lines, 'SOLARQUALIFY', true, 21, 27);
  add(lines, 'ROOFTOP SOLAR SYSTEM QUOTATION', true, 14, 22);
  add(lines, 'Quotation No: ' + numberText, true, 11);
  add(lines, 'Status: ' + String(q.quotationStatus ?? 'generated').toUpperCase());
  add(lines, 'Generated on: ' + date(q.generatedAt ?? q.createdAt));
  add(lines, 'Calculation version: ' + String(q.calculationVersion ?? '1.0.0'));

  section(lines, 'Customer and property');
  add(lines, 'Customer: ' + (c.customerName ?? 'Not recorded'));
  add(lines, 'Lead reference: ' + (c.referenceId ?? 'Not recorded'));
  add(lines, 'Email: ' + (c.email ?? 'Not recorded'));
  add(lines, 'Phone: ' + (c.phone ?? 'Not recorded'));
  add(lines, 'Property type: ' + (c.propertyType ?? 'Not recorded'));
  add(lines, 'Property address: ' + (c.propertyAddress ?? 'Not recorded'));

  section(lines, 'Recommended solar system');
  add(lines, 'System capacity: ' + number(q.systemCapacityKW, ' kW'));
  add(lines, 'Estimated annual generation: ' + number(q.estimatedAnnualGeneration, ' units'));
  add(lines, 'Annual consumption: ' + number(q.annualConsumptionUnits, ' units'));
  add(lines, 'Expected consumption coverage: ' + number(q.consumptionCoveragePercent, '%'));
  add(lines, 'Generation assumption: ' + number(g.unitsPerKWPerYear, ' units/kW/year'));

  section(lines, 'Financial breakdown');
  add(lines, 'Equipment cost: ' + money(q.equipmentCost));
  add(lines, 'Installation charges: ' + money(q.installationCharges));
  add(lines, 'Gross system cost: ' + money(q.totalInstallationCost), true);
  add(lines, 'Configured subsidy estimate: ' + money(q.applicableSubsidy));
  add(lines, 'Net installation cost: ' + money(q.netInstallationCost), true, 12, 20);
  add(lines, 'Estimated annual bill offset: ' + money(q.estimatedAnnualSavings));
  add(lines, 'Estimated simple payback: ' + number(q.estimatedPaybackYears, ' years'));

  section(lines, 'Applied business rule versions');
  add(lines, 'Pricing: ' + (p.ruleName ?? 'Not recorded') + ' | v' + (p.version ?? 'N/A') +
    ' | Rate ' + number(p.pricePerKW, ' per kW') + ' | Effective ' + date(p.effectiveFrom) + ' to ' + date(p.effectiveTo));
  add(lines, 'Installation rate: ' + money(p.installationCharges));
  add(lines, 'Generation: ' + (g.ruleName ?? 'Not recorded') + ' | v' + (g.version ?? 'N/A') +
    ' | Effective ' + date(g.effectiveFrom) + ' to ' + date(g.effectiveTo));
  if (s) {
    add(lines, 'Subsidy: ' + s.ruleName + ' | v' + s.version + ' | Verification: ' + s.verificationStatus);
    add(lines, 'Subsidy policy cap: ' + money(s.maximumSubsidy));
    for (const slab of input.subsidySlabCalculation ?? []) {
      add(lines, 'Slab ' + slab.fromKW + '-' + slab.upToKW + ' kW: ' + slab.eligibleCapacityKW +
        ' kW x ' + money(slab.amountPerKW) + '/kW = ' + money(slab.amount));
    }
  } else add(lines, 'No active verified subsidy rule was applied.');

  section(lines, 'Calculation explanation');
  for (const reason of q.calculationReasons ?? []) {
    if (!reason?.label) continue;
    add(lines, reason.label + ': ' + (reason.detail ?? ''), false, 9, 13);
    if (reason.formula) add(lines, 'Formula: ' + reason.formula, false, 8, 12);
  }

  section(lines, 'Assumptions and conditions');
  add(lines, 'This is a preliminary estimate based on customer information and the saved rule versions shown above.');
  add(lines, 'Final design, roof area, shading, structural suitability, electrical safety, approvals and installation scope require a site survey.');
  add(lines, 'Subsidy is a configured rule estimate. This document does not determine individual government eligibility or guarantee approval.');
  add(lines, 'Generation, savings and payback are estimates, not guarantees. Actual results depend on site, weather, tariff, export policy and system performance.');
  add(lines, 'Financing, maintenance, degradation, taxes, tariff escalation and discounting are excluded unless stated separately.');
  return lines;
}
function pages(lines) {
  const result = [];
  let page = [];
  let y = 790;
  for (const line of lines) {
    if (y - line.gap < 64 && page.length) {
      result.push(page); page = []; y = 790;
    }
    page.push({ ...line, y });
    y -= line.gap;
  }
  result.push(page);
  return result;
}
function pdfBuffer(pageList) {
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  const kids = [];
  pageList.forEach((page, index) => {
    const pageId = 5 + index * 2;
    const streamId = pageId + 1;
    kids.push(pageId + ' 0 R');
    const commands = page.map(line => 'BT /' + (line.bold ? 'F2' : 'F1') + ' ' +
      line.size + ' Tf 48 ' + line.y + ' Td (' + escapeText(line.text) + ') Tj ET');
    commands.push('BT /F1 8 Tf 48 38 Td (SolarQualify | Page ' + (index + 1) + ' of ' + pageList.length + ') Tj ET');
    const stream = commands.join('\n');
    objects[pageId] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + streamId + ' 0 R >>';
    objects[streamId] = '<< /Length ' + Buffer.byteLength(stream, 'ascii') + ' >>\nstream\n' + stream + '\nendstream';
  });
  objects[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pageList.length + ' >>';
  const header = '%PDF-1.4\n%SolarQualify\n';
  const chunks = [Buffer.from(header, 'ascii')];
  const offsets = [0];
  let offset = Buffer.byteLength(header, 'ascii');
  for (let id = 1; id < objects.length; id += 1) {
    const data = Buffer.from(id + ' 0 obj\n' + objects[id] + '\nendobj\n', 'ascii');
    offsets[id] = offset; chunks.push(data); offset += data.length;
  }
  let xref = 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
  for (let id = 1; id < objects.length; id += 1) xref += String(offsets[id]).padStart(10, '0') + ' 00000 n \n';
  chunks.push(Buffer.from(xref + 'trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + offset + '\n%%EOF', 'ascii'));
  return Buffer.concat(chunks);
}
export function generateQuotationPdf(q) {
  if (!q || typeof q !== 'object') throw new TypeError('A quotation record is required.');
  return pdfBuffer(pages(quotationLines(q)));
}
export function getQuotationPdfFileName(q) {
  const value = q.quotationNumber || ('SQ-' + String(q._id ?? q.id ?? 'quotation').slice(-8).toUpperCase());
  const safe = ascii(value).replace(/[^A-Za-z0-9-]/g, '');
  return 'SolarQualify-' + (safe || 'Quotation') + '.pdf';
}