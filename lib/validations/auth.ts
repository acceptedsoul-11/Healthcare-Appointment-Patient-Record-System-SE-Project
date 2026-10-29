
import { z } from "zod";

export const patientRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(8).max(72),
  phone: z.string().trim().min(7).max(20).optional(),
  dateOfBirth: z.iso.date().optional(),
  address: z.string().trim().max(300).optional(),
});

export type PatientRegistrationInput = z.infer<
  typeof patientRegistrationSchema
>;


export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) =>
    value.toLowerCase()
  ),
  password: z.string().min(1).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
