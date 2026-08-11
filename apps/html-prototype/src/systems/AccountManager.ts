import { SaveManager } from "./SaveManager.js";

export type AccountSession =
  | { mode: "guest"; ownerId: "guest"; provider: "local" }
  | { mode: "authenticated"; ownerId: string; provider: "google"; email?: string; claimedGuestDataAt?: string };

const accountSessionKey = "walk-back-home:html-prototype:v1:account-session";

export class AccountManager {
  current(): AccountSession {
    const parsed = this.parseSession(localStorage.getItem(accountSessionKey));
    return parsed ?? { mode: "guest", ownerId: "guest", provider: "local" };
  }

  signInWithConfiguredProvider(input: { provider: "google"; userId: string; email?: string }): AccountSession {
    const session: AccountSession = {
      mode: "authenticated",
      ownerId: `account:${input.provider}:${input.userId}`,
      provider: input.provider,
      email: input.email
    };
    localStorage.setItem(accountSessionKey, JSON.stringify(session));
    return session;
  }

  signOut(): AccountSession {
    localStorage.removeItem(accountSessionKey);
    return this.current();
  }

  claimGuestData(now = new Date()): AccountSession {
    const session = this.current();
    if (session.mode !== "authenticated" || session.claimedGuestDataAt) return session;
    const guest = new SaveManager("guest");
    const account = new SaveManager(session.ownerId);
    const diary = guest.loadDiaryLibrary();
    const journey = guest.loadJourney();
    const reflectionWall = guest.loadReflectionWall();
    const musicLibrary = guest.loadMusicLibrary();
    const personalPlayer = guest.loadPersonalPlayer();
    if (diary && !account.loadDiaryLibrary()) account.saveDiaryLibrary(diary);
    if (journey && !account.loadJourney()) account.saveJourney(journey);
    if (reflectionWall && !account.loadReflectionWall()) account.saveReflectionWall(reflectionWall);
    if (musicLibrary && !account.loadMusicLibrary()) account.saveMusicLibrary(musicLibrary);
    if (personalPlayer && !account.loadPersonalPlayer()) account.savePersonalPlayer(personalPlayer);
    const next: AccountSession = { ...session, claimedGuestDataAt: now.toISOString() };
    localStorage.setItem(accountSessionKey, JSON.stringify(next));
    return next;
  }

  private parseSession(value: string | null): AccountSession | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as AccountSession;
      if (parsed.mode === "guest" && parsed.ownerId === "guest") return { mode: "guest", ownerId: "guest", provider: "local" };
      if (parsed.mode === "authenticated" && parsed.ownerId.startsWith("account:") && parsed.provider === "google") return parsed;
      return null;
    } catch {
      return null;
    }
  }
}
