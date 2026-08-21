export type JournalMediaBlobBackend = {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | null>;
  delete(key: string): Promise<void>;
  entries(): Promise<Array<{ key: string; blob: Blob }>>;
};

export type JournalMediaObjectUrlApi = {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
};

const journalMediaDatabaseName = "walk-back-home-journal-media";
const journalMediaObjectStoreName = "blobs";

export class JournalMediaBlobStore {
  private readonly objectUrls = new Map<string, string>();

  constructor(
    private readonly backend: JournalMediaBlobBackend = new IndexedDbJournalMediaBlobBackend(),
    private readonly objectUrlApi: JournalMediaObjectUrlApi = URL
  ) {}

  async putBlob(key: string, blob: Blob): Promise<void> {
    this.revokeObjectUrl(key);
    await this.backend.put(key, blob);
  }

  async getBlob(key: string): Promise<Blob | null> {
    return this.backend.get(key);
  }

  async deleteBlob(key: string): Promise<void> {
    this.revokeObjectUrl(key);
    await this.backend.delete(key);
  }

  async entries(): Promise<Array<{ key: string; blob: Blob }>> {
    return this.backend.entries();
  }

  async objectUrlFor(key: string): Promise<string | null> {
    const existing = this.objectUrls.get(key);
    if (existing) return existing;
    const blob = await this.getBlob(key);
    if (!blob) return null;
    const url = this.objectUrlApi.createObjectURL(blob);
    this.objectUrls.set(key, url);
    return url;
  }

  revokeObjectUrl(key: string): void {
    const url = this.objectUrls.get(key);
    if (!url) return;
    this.objectUrlApi.revokeObjectURL(url);
    this.objectUrls.delete(key);
  }

  revokeAllObjectUrls(): void {
    for (const key of this.objectUrls.keys()) this.revokeObjectUrl(key);
  }
}

class IndexedDbJournalMediaBlobBackend implements JournalMediaBlobBackend {
  private dbPromise: Promise<IDBDatabase> | null = null;

  async put(key: string, blob: Blob): Promise<void> {
    const db = await this.db();
    await this.transaction(db, "readwrite", (store) => store.put(blob, key));
  }

  async get(key: string): Promise<Blob | null> {
    const db = await this.db();
    const value = await this.transaction<unknown>(db, "readonly", (store) => store.get(key));
    return value instanceof Blob ? value : null;
  }

  async delete(key: string): Promise<void> {
    const db = await this.db();
    await this.transaction(db, "readwrite", (store) => store.delete(key));
  }

  async entries(): Promise<Array<{ key: string; blob: Blob }>> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(journalMediaObjectStoreName, "readonly");
      const request = tx.objectStore(journalMediaObjectStoreName).openCursor();
      const result: Array<{ key: string; blob: Blob }> = [];
      request.addEventListener("success", () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(result);
          return;
        }
        if (typeof cursor.key === "string" && cursor.value instanceof Blob) result.push({ key: cursor.key, blob: cursor.value });
        cursor.continue();
      });
      request.addEventListener("error", () => reject(request.error));
      tx.addEventListener("error", () => reject(tx.error));
    });
  }

  private db(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(journalMediaDatabaseName, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(journalMediaObjectStoreName)) request.result.createObjectStore(journalMediaObjectStoreName);
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
    return this.dbPromise;
  }

  private transaction<T = unknown>(db: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(journalMediaObjectStoreName, mode);
      const request = action(tx.objectStore(journalMediaObjectStoreName));
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
      tx.addEventListener("error", () => reject(tx.error));
    });
  }
}
