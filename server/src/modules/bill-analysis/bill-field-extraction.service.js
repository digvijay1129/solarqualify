function normalizeLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseNumericValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/,/g, '');
  const number = Number(normalized);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

function extractConsumerNumber(lines) {
  const pattern =
    /(?:consumer\s*(?:number|no\.?|id)|account\s*(?:number|no\.?|id)|customer\s*(?:number|no\.?|id)|service\s*connection\s*(?:number|no\.?))\s*[:#=-]?\s*([A-Z0-9][A-Z0-9/-]{3,23})/i;

  for (const line of lines) {
    const match = line.match(pattern);

    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

function extractTariff(lines) {
  const pattern =
    /(?:tariff(?:\s+category)?|consumer\s+category|category\s+of\s+supply)\s*[:#=-]?\s*([A-Z0-9][A-Z0-9 ()./_-]{0,39})/i;

  for (const line of lines) {
    const match = line.match(pattern);

    if (match) {
      const value = match[1]
        .trim()
        .replace(/\s{2,}.*/, '')
        .replace(/[;,]+$/, '')
        .trim();

      return value || null;
    }
  }

  return null;
}

function extractSanctionedLoad(lines) {
  const pattern =
    /(?:sanctioned|connected)\s+load(?:\s*\(?\s*(kW|kVA|HP)\s*\)?)?\s*[:#=-]?\s*([\d,]+(?:\.\d+)?)(?:\s*(kW|kVA|HP))?/i;

  for (const line of lines) {
    const match = line.match(pattern);

    if (!match) {
      continue;
    }

    const value = parseNumericValue(match[2]);

    if (value === null) {
      continue;
    }

    const rawUnit = match[1] || match[3] || null;

    const unit = rawUnit
      ? ({
          KW: 'kW',
          KVA: 'kVA',
          HP: 'HP',
        }[rawUnit.toUpperCase()] ?? null)
      : null;

    return {
      value,
      unit,
    };
  }

  return {
    value: null,
    unit: null,
  };
}

function extractMonthlyUnits(lines) {
  const pattern =
    /(?:monthly\s+units|units?\s+consumed|consumed\s+units|billed\s+units|energy\s+consumption|consumption\s+units)\s*[:#=-]?\s*([\d,]+(?:\.\d+)?)/i;

  for (const line of lines) {
    const match = line.match(pattern);

    if (!match) {
      continue;
    }

    const value = parseNumericValue(match[1]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

/**
 * Extracts supported electricity-bill fields from OCR text.
 *
 * Missing or unrecognized fields are returned as null.
 * This function does not assign confidence scores.
 */
export function extractBillFields(text) {
  if (typeof text !== 'string') {
    throw new TypeError(
      'OCR text must be a string.'
    );
  }

  const lines = normalizeLines(text);

  const consumerNumber = extractConsumerNumber(lines);
  const tariff = extractTariff(lines);

  const sanctionedLoadResult =
    extractSanctionedLoad(lines);

  const monthlyUnits = extractMonthlyUnits(lines);

  const fields = {
    consumerNumber,
    tariff,
    sanctionedLoad: sanctionedLoadResult.value,
    sanctionedLoadUnit: sanctionedLoadResult.unit,
    monthlyUnits,
  };

  const missingFields = [
    'consumerNumber',
    'tariff',
    'sanctionedLoad',
    'monthlyUnits',
  ].filter((field) => fields[field] === null);

  return {
    ...fields,
    missingFields,
  };
}