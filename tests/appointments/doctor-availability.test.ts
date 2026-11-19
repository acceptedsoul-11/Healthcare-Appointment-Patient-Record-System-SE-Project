import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({ requireApiUser: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/models/Doctor", () => ({ default: { findOneAndUpdate: vi.fn() } }));

import { PATCH } from "@/app/api/doctor/availability/route";
import { requireApiUser } from "@/lib/api-auth";
import Doctor from "@/models/Doctor";

const auth = requireApiUser as unknown as ReturnType<typeof vi.fn>;
const doctorModel = Doctor as unknown as { findOneAndUpdate: ReturnType<typeof vi.fn> };
const request = (availability: unknown) => new NextRequest("http://localhost/api/doctor/availability", {
  method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ availability }),
});

describe("Doctor availability validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "64b000000000000000000002", role: "doctor" }, response: null });
  });

  it("rejects duplicate weekdays and non-increasing working hours", async () => {
    const duplicateDay = await PATCH(request([
      { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
    ]));
    const invalidRange = await PATCH(request([{ dayOfWeek: 2, startTime: "17:00", endTime: "09:00" }]));

    expect(duplicateDay.status).toBe(400);
    expect(invalidRange.status).toBe(400);
    expect(doctorModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("saves a valid weekly availability period for the authenticated doctor", async () => {
    doctorModel.findOneAndUpdate.mockResolvedValue({
      _id: "64b000000000000000000010",
      availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
    });

    const response = await PATCH(request([{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]));

    expect(response.status).toBe(200);
    expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "64b000000000000000000002" },
      { $set: { availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }] } },
      expect.any(Object),
    );
  });
});
