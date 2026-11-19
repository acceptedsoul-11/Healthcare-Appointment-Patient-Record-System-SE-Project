import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ connect: vi.fn(), updateUser: vi.fn(), updatePatient: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "patient-id", role: "patient" }),
}));
vi.mock("@/lib/mongodb", () => ({ connectDB: db.connect }));
vi.mock("@/models/User", () => ({ default: { findByIdAndUpdate: db.updateUser } }));
vi.mock("@/models/Patient", () => ({ default: { findOneAndUpdate: db.updatePatient } }));

import { PATCH } from "@/app/api/profile/route";

const request = (body: string) =>
  new NextRequest("http://localhost/api/profile", { method: "PATCH", body });

beforeEach(() => vi.clearAllMocks());

it.each(["{", "null", "[]"])("rejects invalid profile request bodies (%s)", async (body) => {
  expect((await PATCH(request(body))).status).toBe(400);
  expect(db.connect).not.toHaveBeenCalled();
});

it.each(["2001-02-29", "2000-2-01", "2099-01-01"])(
  "rejects invalid dates of birth (%s)",
  async (dateOfBirth) => {
    const response = await PATCH(request(JSON.stringify({ fullName: "Test Patient", dateOfBirth })));
    expect(response.status).toBe(400);
    expect(db.updatePatient).not.toHaveBeenCalled();
  },
);

it("unsets erased profile fields and preserves a relationship-only contact", async () => {
  const response = await PATCH(request(JSON.stringify({
    fullName: "Test Patient",
    phone: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: { relationship: "Sibling" },
  })));

  expect(response.status).toBe(200);
  expect(db.updatePatient).toHaveBeenCalledWith(
    { userId: "patient-id" },
    {
      $set: {
        gender: "prefer_not_to_say",
        emergencyContact: { name: "", relationship: "Sibling", phone: "" },
      },
      $unset: { phone: 1, address: 1, dateOfBirth: 1 },
    },
    { returnDocument: "after" },
  );
});
