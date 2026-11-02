import { describe, expect, it } from "vitest";

import {
  loginSchema,
  patientRegistrationSchema,
} from "../../lib/validations/auth";

describe("Authentication validation", () => {
  it("accepts valid patient registration data", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "Test Patient",
      email: "patient@example.com",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(true);
  });

  it("normalizes login email addresses to lowercase", () => {
    const result = loginSchema.safeParse({
      email: "PATIENT@EXAMPLE.COM",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("patient@example.com");
    }
  });

  it("rejects invalid email addresses and empty passwords", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
