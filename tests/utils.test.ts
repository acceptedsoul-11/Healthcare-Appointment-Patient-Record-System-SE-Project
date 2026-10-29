import { describe, expect, it } from "vitest";
import {
  loginSchema,
  patientRegistrationSchema,
} from "../lib/validations/auth";

describe("Utility validation tests", () => {
  it("accepts valid patient registration data", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "Test Patient",
      email: "patient@example.com",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(false);
  });

  it("converts email addresses to lowercase", () => {
    const result = loginSchema.safeParse({
      email: "PATIENT@EXAMPLE.COM",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("patient@example.com");
    }
  });

  it("rejects passwords shorter than eight characters during registration", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "Test Patient",
      email: "patient@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty login password", () => {
    const result = loginSchema.safeParse({
      email: "patient@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});