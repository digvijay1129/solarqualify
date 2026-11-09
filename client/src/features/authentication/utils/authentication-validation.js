const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\d{10}$/;

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
  } else if (step === 2) {
    const password = String(values.password ?? "");
    if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    } else if (new TextEncoder().encode(password).length > 72) {
      errors.password = "Password must not exceed 72 UTF-8 bytes.";
    }
    if (!values.confirmPassword || values.confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (values.termsAccepted !== true) {
      errors.termsAccepted = "Please acknowledge the terms and privacy notice.";
    }
  } else {
    errors.form = "Unknown registration step.";
  }

  return errors;
}

export { isValidEmail, validateSignIn, validateRegistrationStep };
