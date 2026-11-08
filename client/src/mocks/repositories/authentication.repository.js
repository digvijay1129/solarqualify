import { authenticationFixture } from "../fixtures/authentication.fixture.js";

function clone(value) {
  return structuredClone(value);
}

export async function getAuthenticationContent() {
  return clone(authenticationFixture);
}

export async function submitDemoSignIn() {
  return {
    authenticated: false,
    mode: "demo",
    message: "Your form is valid, but no user was authenticated. Connect the backend authentication API before enabling sign-in.",
  };
}

export async function submitDemoRegistration() {
  return {
    created: false,
    mode: "demo",
    message: "Registration details passed frontend validation. No account was created or saved because the backend is not connected.",
  };
}

export async function submitDemoPasswordReset() {
  return {
    requested: false,
    mode: "demo",
    message: "The email is valid, but password-reset delivery is not connected in this frontend demo.",
  };
}
