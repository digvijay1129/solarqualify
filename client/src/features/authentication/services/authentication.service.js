import {
  getAuthenticationContent,
  submitDemoPasswordReset,
  submitDemoRegistration,
  submitDemoSignIn,
} from "../../../mocks/repositories/authentication.repository.js";

export function getAuthContent() {
  return getAuthenticationContent();
}

export function signInDemo(credentials) {
  // Credentials are intentionally not persisted or logged.
  return submitDemoSignIn({ role: credentials.role, email: credentials.email });
}

export function registerHomeownerDemo() {
  // Never pass or persist the password through the demo repository.
  return submitDemoRegistration();
}

export function requestPasswordResetDemo() {
  return submitDemoPasswordReset();
}
