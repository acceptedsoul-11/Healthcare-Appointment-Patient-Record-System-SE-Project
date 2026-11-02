import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/records/route";

describe("Medical record authorization", () => {
  it("rejects unauthenticated medical-record requests", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Authentication required.",
    });
  });
});
