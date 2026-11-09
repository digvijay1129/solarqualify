export const HOMEOWNER_NAVIGATION = [
  { label: "Dashboard", path: "/homeowner", icon: "Home" },
  { label: "Submit Inquiry", path: "/homeowner/lead", icon: "ClipboardPlus" },
  { label: "My Projects", path: "/homeowner/project", icon: "PanelsTopLeft" },
  { label: "My Quotations", path: "/homeowner/quotations", icon: "FileText" },
  { label: "My Documents", path: "/homeowner/documents", icon: "FolderOpen" },
  { label: "Profile & Support", path: "/homeowner/profile-support", icon: "UserRound" },
];

export const LEAD_STEPS = [
  { id: 1, label: "Contact Details", description: "Your basic contact information" },
  { id: 2, label: "Property Address", description: "Where the installation will be done" },
  { id: 3, label: "Roof & Energy Info", description: "Roof type, area and electricity usage" },
  { id: 4, label: "Upload Bill", description: "Share a recent electricity bill" },
  { id: 5, label: "Review & Submit", description: "Confirm and submit your inquiry" },
];

export const DOCUMENT_CATEGORIES = ["All Documents", "Quotations", "Bills"];
export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];
export const MAX_DOCUMENT_SIZE_MB = 5;
export const MAX_BILL_SIZE_MB = 5;

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Awaiting approved pricing";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Awaiting approved pricing";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(number);
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("en-IN").format(number) : "—";
}

export function annualGeneration(systemSizeKw) {
  const size = Number(systemSizeKw);
  if (!Number.isFinite(size) || size <= 0) return null;
  return Math.round(size * 1400);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email ?? "").trim());
}

export function validateUploadFile(file, options = {}) {
  const maxSizeMB = options.maxSizeMB ?? MAX_DOCUMENT_SIZE_MB;
  const allowedExtensions = options.allowedExtensions ?? ALLOWED_DOCUMENT_EXTENSIONS;
  if (!file) return "Choose a file to continue.";
  const filename = String(file.name ?? "");
  const extension = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
  if (!allowedExtensions.includes(extension)) {
    return `Unsupported file type. Allowed: ${allowedExtensions.join(", ").toUpperCase()}.`;
  }
  const bytes = Number(file.size);
  if (!Number.isFinite(bytes) || bytes <= 0) return "The selected file is empty or invalid.";
  if (bytes > maxSizeMB * 1024 * 1024) return `File must be ${maxSizeMB} MB or smaller.`;
  return null;
}

export function validateLeadStep(step, values, billFile) {
  const errors = {};
  const requireText = (key, label) => {
    if (!String(values[key] ?? "").trim()) errors[key] = `${label} is required.`;
  };
  if (step === 1) {
    requireText("fullName", "Full name");
    const mobile = String(values.mobileNumber ?? "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(mobile)) errors.mobileNumber = "Enter a valid 10-digit mobile number.";
    if (!validateEmail(values.email)) errors.email = "Enter a valid email address.";
    if (!["phone", "email", "whatsapp"].includes(values.preferredContact)) errors.preferredContact = "Choose a contact method.";
  }
  if (step === 2) {
    requireText("addressLine1", "Address");
    requireText("city", "City");
    requireText("state", "State");
    if (!/^\d{6}$/.test(String(values.pincode ?? "").trim())) errors.pincode = "Enter a valid 6-digit PIN code.";
  }
  if (step === 3) {
    requireText("propertyType", "Property type");
    requireText("ownershipStatus", "Ownership status");
    requireText("roofType", "Roof type");
    const roofArea = Number(values.roofAreaSqFt);
    if (!String(values.roofAreaSqFt ?? "").trim() || !Number.isFinite(roofArea) || roofArea <= 0) errors.roofAreaSqFt = "Enter roof area greater than zero.";
    const bill = Number(values.monthlyElectricityBill);
    if (!String(values.monthlyElectricityBill ?? "").trim() || !Number.isFinite(bill) || bill <= 0) errors.monthlyElectricityBill = "Enter a monthly bill greater than zero.";
    const units = Number(values.monthlyUnits);
    if (!String(values.monthlyUnits ?? "").trim() || !Number.isFinite(units) || units <= 0) errors.monthlyUnits = "Enter monthly units greater than zero.";
  }
  if (step === 4) {
    const fileError = validateUploadFile(billFile, { maxSizeMB: MAX_BILL_SIZE_MB, allowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp"] });
    if (fileError) errors.billFile = fileError;
  }
  return errors;
}

export function validateSupportRequest(values) {
  const errors = {};
  if (!String(values.subject ?? "").trim()) errors.subject = "Choose a support topic.";
  const message = String(values.message ?? "").trim();
  if (message.length < 10) errors.message = "Please enter at least 10 characters.";
  if (message.length > 500) errors.message = "Message cannot exceed 500 characters.";
  return errors;
}

export function validateProfile(values) {
  const errors = {};
  if (!String(values.fullName ?? "").trim()) errors.fullName = "Full name is required.";
  if (!validateEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!/^\d{10}$/.test(String(values.mobileNumber ?? "").replace(/\D/g, ""))) errors.mobileNumber = "Enter a valid 10-digit mobile number.";
  return errors;
}

export function filterDocuments(documents, filters = {}) {
  const query = String(filters.query ?? "").trim().toLowerCase();
  const category = filters.category ?? "All Documents";
  const status = filters.status ?? "All Status";
  const dateRange = filters.dateRange ?? "All Dates";
  const referenceDate = filters.referenceDate ? new Date(filters.referenceDate) : new Date();
  const cutoff = new Date(referenceDate);
  if (dateRange === "Last 30 Days") cutoff.setDate(cutoff.getDate() - 30);
  if (dateRange === "This Year") cutoff.setMonth(0, 1);
  return documents.filter((document) => {
    const matchesCategory = category === "All Documents" || document.category === category;
    const haystack = `${document.name ?? ""} ${document.category ?? ""} ${document.description ?? ""}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === "All Status" || document.status === status;
    const uploadedAt = new Date(`${document.uploadedAt ?? ""}T00:00:00`);
    const matchesDate = dateRange === "All Dates" || (!Number.isNaN(uploadedAt.getTime()) && uploadedAt >= cutoff);
    return matchesCategory && matchesQuery && matchesStatus && matchesDate;
  });
}

export function getMilestoneProgress(milestones = []) {
  if (!milestones.length) return 0;
  const completed = milestones.filter((item) => item.status === "completed").length;
  const active = milestones.find((item) => item.status === "in-progress");
  const fractional = active ? Math.max(0, Math.min(0.99, Number(active.fractionComplete ?? 0))) : 0;
  return Math.round(((completed + fractional) / milestones.length) * 100);
}

export function getMilestoneState(milestones, milestoneId) {
  return milestones.find((item) => item.id === milestoneId)?.status ?? "upcoming";
}

export function bytesToReadableSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
