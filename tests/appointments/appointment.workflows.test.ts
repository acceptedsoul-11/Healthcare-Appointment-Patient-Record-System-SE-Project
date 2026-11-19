import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({ requireApiUser: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/models/Appointment", () => ({ default: { findOne: vi.fn(), findById: vi.fn(), create: vi.fn() } }));
vi.mock("@/models/Doctor", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/models/Patient", () => ({ default: { findOne: vi.fn(), findById: vi.fn(), exists: vi.fn() } }));
vi.mock("@/models/User", () => ({ default: { findById: vi.fn() } }));

import { POST, PATCH } from "@/app/api/appointments/route";
import { requireApiUser } from "@/lib/api-auth";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import User from "@/models/User";

const doctorId = "64b000000000000000000010";
const patientId = "64b000000000000000000001";
const doctorUserId = "64b000000000000000000002";
const appointmentId = "64b000000000000000000020";
const futureDate = "2030-01-07"; // Monday, well beyond the test execution date.
const auth = requireApiUser as unknown as ReturnType<typeof vi.fn>;
const appointmentModel = Appointment as unknown as Record<string, ReturnType<typeof vi.fn>>;
const doctorModel = Doctor as unknown as { findById: ReturnType<typeof vi.fn> };
const patientModel = Patient as unknown as Record<string, ReturnType<typeof vi.fn>>;
const userModel = User as unknown as { findById: ReturnType<typeof vi.fn> };
const request = (method: string, body: unknown) => new NextRequest("http://localhost/api/appointments", {
  method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

function configureSlot({ availableDay = 1, conflict = null }: { availableDay?: number; conflict?: unknown } = {}) {
  const doctor = {
    _id: doctorId,
    userId: doctorUserId,
    availability: [{ dayOfWeek: availableDay, startTime: "08:00", endTime: "17:00" }],
    select: vi.fn().mockResolvedValue({ userId: { toString: () => doctorUserId } }),
  };
  doctorModel.findById.mockReturnValue(doctor);
  userModel.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ isActive: true, accountStatus: "approved" }) });
  appointmentModel.findOne.mockReturnValue({ select: vi.fn().mockReturnValue({
    lean: vi.fn().mockResolvedValue(conflict),
  }) });
}

function currentAppointment() {
  return {
    _id: { toString: () => appointmentId },
    patientId: { _id: { toString: () => patientId }, toString: () => patientId, userId: { fullName: "Synthetic Patient" } },
    doctorId: { _id: { toString: () => doctorId }, toString: () => doctorId, userId: { fullName: "Synthetic Doctor" } },
    appointmentDate: new Date("2030-01-07T00:00:00.000Z"),
    startTime: "09:00", endTime: "09:30", durationMinutes: 30,
    reason: "Synthetic visit", status: "scheduled",
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe("Appointment API workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: patientId, role: "patient" }, response: null });
  });

  it("books a valid available slot for the authenticated patient", async () => {
    configureSlot();
    patientModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: patientId }) });
    patientModel.exists.mockResolvedValue(true);
    appointmentModel.create.mockResolvedValue({
      _id: { toString: () => appointmentId },
      appointmentDate: new Date(`${futureDate}T00:00:00.000Z`),
      startTime: "09:00", endTime: "09:30", durationMinutes: 30,
      reason: "Synthetic visit", status: "scheduled",
      patientId: { _id: { toString: () => patientId }, userId: { fullName: "Synthetic Patient" } },
      doctorId: { _id: { toString: () => doctorId }, userId: { fullName: "Synthetic Doctor" }, specialization: "Primary care" },
    });

    const response = await POST(request("POST", {
      doctorId, appointmentDate: futureDate, startTime: "09:00", durationMinutes: 30, reason: "Synthetic visit",
    }));

    expect(response.status).toBe(201);
    expect(appointmentModel.create).toHaveBeenCalledWith(expect.objectContaining({
      startTime: "09:00", endTime: "09:30", status: "scheduled", reason: "Synthetic visit",
    }));
  });

  it("rejects an overlapping appointment for an otherwise available doctor", async () => {
    configureSlot({ conflict: { startTime: "09:00", endTime: "09:30" } });

    const response = await POST(request("POST", {
      doctorId, appointmentDate: futureDate, startTime: "09:15", durationMinutes: 30, reason: "Synthetic visit",
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("already been booked");
    expect(patientModel.findOne).not.toHaveBeenCalled();
  });

  it("rejects a date outside the doctor's published weekly availability", async () => {
    configureSlot({ availableDay: 2 });

    const response = await POST(request("POST", {
      doctorId, appointmentDate: futureDate, startTime: "09:00", reason: "Synthetic visit",
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("not available on the selected day");
    expect(appointmentModel.findOne).not.toHaveBeenCalled();
  });

  it("rejects past appointments before reading doctor availability", async () => {
    const response = await POST(request("POST", {
      doctorId, appointmentDate: "2020-01-01", startTime: "09:00", reason: "Synthetic visit",
    }));

    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("future appointment");
    expect(doctorModel.findById).not.toHaveBeenCalled();
  });

  it("reschedules an owned appointment into a valid free slot", async () => {
    const appointment = currentAppointment();
    appointmentModel.findById.mockResolvedValue(appointment);
    configureSlot();
    patientModel.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ userId: { toString: () => patientId } }) });

    const response = await PATCH(request("PATCH", {
      appointmentId, action: "reschedule", appointmentDate: futureDate, startTime: "10:00", durationMinutes: 30,
    }));

    expect(response.status).toBe(200);
    expect(appointment.startTime).toBe("10:00");
    expect(appointment.endTime).toBe("10:30");
    expect(appointment.save).toHaveBeenCalledOnce();
  });

  it("cancels an owned scheduled appointment", async () => {
    const appointment = currentAppointment();
    appointmentModel.findById.mockResolvedValue(appointment);
    patientModel.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ userId: { toString: () => patientId } }) });
    doctorModel.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ userId: { toString: () => doctorUserId } }) });

    const response = await PATCH(request("PATCH", { appointmentId, action: "cancel" }));

    expect(response.status).toBe(200);
    expect(appointment.status).toBe("cancelled");
    expect(appointment.save).toHaveBeenCalledOnce();
  });
});
