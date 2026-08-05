import { describe, expect, it } from "vitest";
import { createFixtureAuthAdapter } from "../auth/fixture-auth";

describe("createFixtureAuthAdapter", () => {
  it("returns a deterministic local user without remote services", async () => {
    const auth = createFixtureAuthAdapter();

    const session = await auth.getSession();

    expect(session.user).toEqual({
      id: "fixture-user-001",
      displayName: "Fictional Visitor"
    });
    expect(session.provider).toBe("fixture");
  });
});
