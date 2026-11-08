const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\d{10}$/;
const PINCODE_PATTERN = /^\d{6}$/;

function clean(value) {
  return String(value ?? "").trim();
}

function isValidEmail(value) {
  return EMAIL_PATTERN.test(clean(value));
}

function validateSignIn(values = {}) {
  const errors = {};
  if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!clean(values.password)) {
    errors.password = "Password is required.";
  }
  if (!["homeowner", "sales-staff"].includes(values.role)) {
    errors.role = "Choose an account type.";
  }
  return errors;
}

function validateRegistrationStep(step, values = {}) {
  const errors = {};

  if (step === 1) {
    if (clean(values.fullName).length < 2) errors.fullName = "Enter your full name.";
    if (!MOBILE_PATTERN.test(clean(values.mobileNumber).replace(/\s/g, ""))) {
      errors.mobileNumber = "Enter a 10-digit mobile number.";
    }
    if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
    if (clean(values.dateOfBirth)) {
      const date = new Date(`${clean(values.dateOfBirth)}T00:00:00`);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (Number.isNaN(date.getTime()) || date > today) {
        errors.dateOfBirth = "Enter a valid date that is not in the future.";
      }
    }
  }

  if (step === 2) {
    if (!clean(values.houseFlatNo)) errors.houseFlatNo = "Enter your house or flat number.";
    if (!clean(values.addressLine1)) errors.addressLine1 = "Enter your street or locality.";
    if (!clean(values.city)) errors.city = "Enter your city or town.";
    if (!clean(values.state)) errors.state = "Select your state or union territory.";
    if (!PINCODE_PATTERN.test(clean(values.pincode))) errors.pincode = "Enter a 6-digit pincode.";
  }

  if (step === 3) {
    if (!["owner", "tenant"].includes(values.ownershipStatus)) {
      errors.ownershipStatus = "Select whether you own or rent this property.";
    }
    if (!["RCC", "Metal", "Tile", "Other"].includes(values.roofType)) {
      errors.roofType = "Select a roof type.";
    }

    const roofArea = Number(clean(values.roofAreaSqFt));
    if (!clean(values.roofAreaSqFt) || !Number.isFinite(roofArea) || roofArea <= 0) {
      errors.roofAreaSqFt = "Enter a roof area greater than zero.";
    }

    const monthlyBill = Number(clean(values.monthlyElectricityBill));
    if (!clean(values.monthlyElectricityBill) || !Number.isFinite(monthlyBill) || monthlyBill < 0) {
      errors.monthlyElectricityBill = "Enter a valid monthly bill amount (zero or greater).";
    }
  }

  if (step === 4) {
    if (String(values.password ?? "").length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    if (!values.confirmPassword || values.confirmPassword !== values.password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (values.termsAccepted !== true) {
      errors.termsAccepted = "Please acknowledge the terms and privacy notice.";
    }
  }

  if (![1, 2, 3, 4].includes(step)) {
    errors.form = "Unknown registration step.";
  }

  return errors;
}

export { isValidEmail, validateSignIn, validateRegistrationStep };
