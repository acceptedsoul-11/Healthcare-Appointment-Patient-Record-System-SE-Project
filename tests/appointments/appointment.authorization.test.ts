import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/appointments/route";

describe("Appointment authorization", () => {
  it("rejects unauthenticated appointment-list requests", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Please sign in to view appointments.",
    });
  });
});
