export type FixtureSession = {
  provider: "fixture";
  user: {
    id: "fixture-user-001";
    displayName: "Fictional Visitor";
  };
};

export function createFixtureAuthAdapter() {
  return {
    async getSession(): Promise<FixtureSession> {
      return {
        provider: "fixture",
        user: {
          id: "fixture-user-001",
          displayName: "Fictional Visitor"
        }
      };
    }
  };
}
