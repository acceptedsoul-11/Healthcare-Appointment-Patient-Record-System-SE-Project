import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  connect: vi.fn(),
  doctor: vi.fn(),
  user: vi.fn(),
  exists: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "000000000000000000000001", role: "patient" }),
}));
vi.mock("@/lib/mongodb", () => ({ connectDB: db.connect }));
vi.mock("@/models/Doctor", () => ({ default: { findById: db.doctor } }));
vi.mock("@/models/User", () => ({ default: { findById: db.user } }));
vi.mock("@/models/Appointment", () => ({ default: { exists: db.exists } }));

import { POST } from "@/app/api/appointments/route";

const doctorId = "000000000000000000000002";
const date = "2099-03-01";
const request = (fields: Record<string, unknown> = {}) =>
  new NextRequest("http://localhost/api/appointments", {
    method: "POST",
    body: JSON.stringify({
      doctorId,
      appointmentDate: date,
      startTime: "10:00",
      reason: "Routine visit",
      ...fields,
    }),
  });

beforeEach(() => {
  vi.resetAllMocks();
  db.doctor.mockResolvedValue({
    userId: "000000000000000000000003",
    availability: [{ dayOfWeek: new Date(date).getUTCDay(), startTime: "09:00", endTime: "17:00" }],
  });
  db.user.mockReturnValue({ select: async () => ({ isActive: true, accountStatus: "approved" }) });
});

it.each([
  { appointmentDate: "2099-02-30" },
  { startTime: "25:00" },
  { durationMinutes: 14 },
  { appointmentDate: "2000-01-01" },
])("rejects invalid slot details before connecting to the database (%j)", async (fields) => {
  expect((await POST(request(fields))).status).toBe(400);
  expect(db.connect).not.toHaveBeenCalled();
});

it("checks for overlapping active appointments while allowing adjacent slots", async () => {
  db.exists.mockResolvedValue({ _id: "overlap" });
  const response = await POST(request());
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ message: expect.stringMatching(/already been booked/) });
  expect(db.exists).toHaveBeenCalledWith({
    doctorId,
    appointmentDate: new Date(date),
    status: { $in: ["scheduled", "confirmed"] },
    startTime: { $lt: "10:30" },
    endTime: { $gt: "10:00" },
  });
});
