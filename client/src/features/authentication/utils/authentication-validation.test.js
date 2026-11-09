import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  validateRegistrationStep,
  validateSignIn,
} from "./authentication-validation.js";

describe("authentication validation", () => {
  it("accepts a normal email address", () => {
    expect(isValidEmail("person@example.com")).toBe(true);
  });

  it("trims email whitespace", () => {
    expect(isValidEmail("  person@example.com  ")).toBe(true);
  });

  it("rejects an invalid email address", () => {
    expect(isValidEmail("person@example")).toBe(false);
  });

  it("requires a valid email and password for sign in", () => {
    expect(validateSignIn({ email: "", password: "", role: "homeowner" })).toEqual({
      email: "Enter a valid email address.",
      password: "Password is required.",
    });
  });

  it("rejects an unknown sign-in role", () => {
    expect(validateSignIn({ email: "a@b.com", password: "secret", role: "admin" }).role)
      .toBe("Choose an account type.");
  });

  it("accepts valid sign-in fields", () => {
    expect(validateSignIn({ email: "a@b.com", password: "secret", role: "sales-staff" })).toEqual({});
  });
});

describe("homeowner registration — contact details", () => {
  const valid = {
    fullName: "Asha Patil",
    mobileNumber: "9876543210",
    email: "asha@example.com",
  };

  it("accepts valid contact details", () => {
    expect(validateRegistrationStep(1, valid)).toEqual({});
  });

  it("requires a full name", () => {
    expect(validateRegistrationStep(1, { ...valid, fullName: "" }).fullName).toBeTruthy();
  });

  it("requires exactly ten mobile digits", () => {
    expect(validateRegistrationStep(1, { ...valid, mobileNumber: "987654321" }).mobileNumber).toBeTruthy();
    expect(validateRegistrationStep(1, { ...valid, mobileNumber: "98765432101" }).mobileNumber).toBeTruthy();
  });

  it("requires a valid email", () => {
    expect(validateRegistrationStep(1, { ...valid, email: "not-an-email" }).email).toBeTruthy();
  });
});

describe("homeowner registration — account credentials", () => {
  const valid = {
    password: "Solar123",
    confirmPassword: "Solar123",
    termsAccepted: true,
  };

  it("accepts matching password and acknowledgement", () => {
    expect(validateRegistrationStep(2, valid)).toEqual({});
  });

  it("requires a password of at least eight characters", () => {
    expect(validateRegistrationStep(2, { ...valid, password: "short" }).password).toBeTruthy();
  });

  it("enforces the API's 72-byte password limit", () => {
    expect(validateRegistrationStep(2, { ...valid, password: "é".repeat(37) }).password).toBeTruthy();
  });

  it("requires matching passwords", () => {
    expect(validateRegistrationStep(2, { ...valid, confirmPassword: "different" }).confirmPassword).toBeTruthy();
  });

  it("requires terms acknowledgement", () => {
    expect(validateRegistrationStep(2, { ...valid, termsAccepted: false }).termsAccepted).toBeTruthy();
  });

  it("rejects an unknown step number", () => {
    expect(validateRegistrationStep(3, {}).form).toBeTruthy();
  });
});
