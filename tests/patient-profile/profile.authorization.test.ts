import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/models/Patient", () => ({ default: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock("@/models/User", () => ({ default: { findByIdAndUpdate: vi.fn() } }));

import { GET, PATCH } from "@/app/api/profile/route";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import User from "@/models/User";

const currentUser = getCurrentUser as unknown as ReturnType<typeof vi.fn>;
const patientModel = Patient as unknown as { findOne: ReturnType<typeof vi.fn>; findOneAndUpdate: ReturnType<typeof vi.fn> };
const userModel = User as unknown as { findByIdAndUpdate: ReturnType<typeof vi.fn> };
const profileRequest = (body: unknown) => new NextRequest("http://localhost/api/profile", {
  method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

describe("Patient profile authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies profile reads and writes without a session before touching storage", async () => {
    currentUser.mockResolvedValue(null);

    const read = await GET();
    const update = await PATCH(profileRequest({ fullName: "Synthetic Patient" }));

    expect(read.status).toBe(403);
    expect(update.status).toBe(403);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("denies a signed-in non-patient role", async () => {
    currentUser.mockResolvedValue({ id: "64b000000000000000000002", role: "doctor" });

    const response = await PATCH(profileRequest({ fullName: "Synthetic Doctor" }));

    expect(response.status).toBe(403);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("allows a patient to update only their own profile", async () => {
    currentUser.mockResolvedValue({ id: "64b000000000000000000001", role: "patient" });
    patientModel.findOneAndUpdate.mockResolvedValue({});
    userModel.findByIdAndUpdate.mockResolvedValue({});

    const response = await PATCH(profileRequest({ fullName: "Synthetic Patient", phone: "5550101" }));

    expect(response.status).toBe(200);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("64b000000000000000000001", { fullName: "Synthetic Patient" });
    expect(patientModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "64b000000000000000000001" },
      expect.objectContaining({ phone: "5550101" }),
      expect.any(Object),
    );
  });
});
