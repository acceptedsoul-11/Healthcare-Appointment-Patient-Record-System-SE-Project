import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ user: null as { id: string; role: string } | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => auth.user }));

import { PATCH, POST } from "@/app/api/appointments/route";

const endpoint = "http://localhost/api/appointments";

it.each([["POST", POST], ["PATCH", PATCH]] as const)(
  "rejects signed-out appointment %s requests",
  async (method, handler) => {
    auth.user = null;
    const response = await handler(new NextRequest(endpoint, { method, body: "{}" }));
    expect(response.status).toBe(401);
  },
);

it.each([["POST", POST], ["PATCH", PATCH]] as const)(
  "rejects malformed JSON and non-object bodies for %s",
  async (method, handler) => {
    auth.user = { id: "000000000000000000000001", role: "patient" };
    for (const body of ["{", "null", "[]", '"invalid"']) {
      const response = await handler(new NextRequest(endpoint, { method, body }));
      expect(response.status).toBe(400);
    }
  },
);
