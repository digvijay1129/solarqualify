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

describe("homeowner registration — step 1", () => {
  const valid = {
    fullName: "Asha Patil",
    mobileNumber: "9876543210",
    email: "asha@example.com",
    dateOfBirth: "",
  };

  it("accepts valid basic details", () => {
    expect(validateRegistrationStep(1, valid)).toEqual({});
  });

  it("requires a full name", () => {
    expect(validateRegistrationStep(1, { ...valid, fullName: "" }).fullName).toBeTruthy();
  });

  it("requires exactly ten mobile digits", () => {
    expect(validateRegistrationStep(1, { ...valid, mobileNumber: "987654321" }).mobileNumber).toBeTruthy();
    expect(validateRegistrationStep(1, { ...valid, mobileNumber: "98765432101" }).mobileNumber).toBeTruthy();
  });

  it("allows an optional date of birth", () => {
    expect(validateRegistrationStep(1, { ...valid, dateOfBirth: "" })).toEqual({});
  });

  it("rejects a future date of birth", () => {
    expect(validateRegistrationStep(1, { ...valid, dateOfBirth: "2099-01-01" }).dateOfBirth).toBeTruthy();
  });
});

describe("homeowner registration — step 2", () => {
  const valid = {
    houseFlatNo: "12/A",
    addressLine1: "Main Road",
    addressLine2: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
  };

  it("accepts valid address details", () => {
    expect(validateRegistrationStep(2, valid)).toEqual({});
  });

  it("requires house or flat number and address line", () => {
    const errors = validateRegistrationStep(2, { ...valid, houseFlatNo: "", addressLine1: "" });
    expect(errors.houseFlatNo).toBeTruthy();
    expect(errors.addressLine1).toBeTruthy();
  });

  it("requires a six-digit pincode", () => {
    expect(validateRegistrationStep(2, { ...valid, pincode: "41101" }).pincode).toBeTruthy();
  });

  it("requires a state", () => {
    expect(validateRegistrationStep(2, { ...valid, state: "" }).state).toBeTruthy();
  });
});

describe("homeowner registration — step 3", () => {
  const valid = {
    ownershipStatus: "owner",
    roofType: "RCC",
    roofAreaSqFt: "600",
    monthlyElectricityBill: "3200",
  };

  it("accepts valid property and solar details", () => {
    expect(validateRegistrationStep(3, valid)).toEqual({});
  });

  it("requires owner or tenant selection", () => {
    expect(validateRegistrationStep(3, { ...valid, ownershipStatus: "" }).ownershipStatus).toBeTruthy();
  });

  it("requires a supported roof type", () => {
    expect(validateRegistrationStep(3, { ...valid, roofType: "Unknown" }).roofType).toBeTruthy();
  });

  it("requires roof area greater than zero", () => {
    expect(validateRegistrationStep(3, { ...valid, roofAreaSqFt: "0" }).roofAreaSqFt).toBeTruthy();
    expect(validateRegistrationStep(3, { ...valid, roofAreaSqFt: "-5" }).roofAreaSqFt).toBeTruthy();
  });

  it("allows zero monthly electricity bill but rejects negative or invalid values", () => {
    expect(validateRegistrationStep(3, { ...valid, monthlyElectricityBill: "0" })).toEqual({});
    expect(validateRegistrationStep(3, { ...valid, monthlyElectricityBill: "-1" }).monthlyElectricityBill).toBeTruthy();
    expect(validateRegistrationStep(3, { ...valid, monthlyElectricityBill: "x" }).monthlyElectricityBill).toBeTruthy();
  });
});

describe("homeowner registration — step 4", () => {
  const valid = {
    password: "Solar123",
    confirmPassword: "Solar123",
    termsAccepted: true,
  };

  it("accepts matching password and acknowledgement", () => {
    expect(validateRegistrationStep(4, valid)).toEqual({});
  });

  it("requires a password of at least eight characters", () => {
    expect(validateRegistrationStep(4, { ...valid, password: "short" }).password).toBeTruthy();
  });

  it("requires matching passwords", () => {
    expect(validateRegistrationStep(4, { ...valid, confirmPassword: "different" }).confirmPassword).toBeTruthy();
  });

  it("requires terms acknowledgement", () => {
    expect(validateRegistrationStep(4, { ...valid, termsAccepted: false }).termsAccepted).toBeTruthy();
  });

  it("rejects an unknown step number", () => {
    expect(validateRegistrationStep(5, {}).form).toBeTruthy();
  });
});
