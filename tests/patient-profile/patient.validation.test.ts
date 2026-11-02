import { describe, expect, it } from "vitest";

import { patientRegistrationSchema } from "../../lib/validations/auth";

describe("Patient profile input validation", () => {
  it("accepts optional patient contact details with a valid date of birth", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "Test Patient",
      email: "patient@example.com",
      password: "DemoPass2026Secure",
      phone: "9876543210",
      dateOfBirth: "2000-01-15",
      address: "Test address only",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a patient name shorter than two characters", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "A",
      email: "patient@example.com",
      password: "DemoPass2026Secure",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = patientRegistrationSchema.safeParse({
      fullName: "Test Patient",
      email: "patient@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
