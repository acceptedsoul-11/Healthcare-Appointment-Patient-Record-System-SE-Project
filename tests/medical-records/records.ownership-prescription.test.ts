import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({ requireApiUser: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/models/MedicalRecord", () => ({ default: { find: vi.fn(), create: vi.fn() } }));
vi.mock("@/models/Appointment", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/models/Doctor", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/models/Patient", () => ({ default: { findOne: vi.fn() } }));

import { GET, POST } from "@/app/api/records/route";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import MedicalRecord from "@/models/MedicalRecord";
import Patient from "@/models/Patient";

const auth = requireApiUser as unknown as ReturnType<typeof vi.fn>;
const appointmentModel = Appointment as unknown as { findOne: ReturnType<typeof vi.fn> };
const doctorModel = Doctor as unknown as { findOne: ReturnType<typeof vi.fn> };
const recordModel = MedicalRecord as unknown as { find: ReturnType<typeof vi.fn> };
const patientModel = Patient as unknown as { findOne: ReturnType<typeof vi.fn> };
const request = (body: unknown) => new NextRequest("http://localhost/api/records", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});
const appointmentId = "64b000000000000000000020";
const patientId = "64b000000000000000000001";

describe("Medical record ownership and prescriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "64b000000000000000000002", role: "doctor" }, response: null });
  });

  it("scopes patient record reads to the authenticated patient's own record id", async () => {
    auth.mockResolvedValue({ user: { id: patientId, role: "patient" }, response: null });
    patientModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: patientId }) });
    recordModel.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(recordModel.find).toHaveBeenCalledWith(expect.objectContaining({ patientId }));
    expect((await response.json()).records).toEqual([]);
  });

  it("rejects a prescription missing medication, dosage, or frequency", async () => {
    const response = await POST(request({
      appointmentId,
      diagnosis: "Synthetic diagnosis",
      prescriptions: [{ medication: "Synthetic medicine", dosage: "10 mg", frequency: "" }],
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("name, dosage and frequency");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("does not let a doctor create a record for an appointment they do not own", async () => {
    doctorModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: "64b000000000000000000010" }) });
    appointmentModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

    const response = await POST(request({ appointmentId, diagnosis: "Synthetic diagnosis" }));

    expect(response.status).toBe(403);
    expect(recordModel.find).not.toHaveBeenCalled();
  });
});
