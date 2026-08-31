export class CapsuleMediaStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private objectUrls = new Map<string, string>();

  async put(key: string, blob: Blob): Promise<void> {
    const db = await this.db();
    await this.transaction(db, "readwrite", (store) => store.put(blob, key));
  }

  async putBlob(key: string, blob: Blob): Promise<void> {
    await this.put(key, blob);
  }

  async get(key: string): Promise<Blob | null> {
    const db = await this.db();
    return await this.transaction<Blob | null>(db, "readonly", (store) => store.get(key));
  }

  async delete(key: string): Promise<void> {
    const db = await this.db();
    this.revoke(key);
    await this.transaction(db, "readwrite", (store) => store.delete(key));
  }

  async objectUrl(key: string): Promise<string | null> {
    const cached = this.objectUrls.get(key);
    if (cached) return cached;
    const blob = await this.get(key);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    this.objectUrls.set(key, url);
    return url;
  }

  revoke(key: string): void {
    const url = this.objectUrls.get(key);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.objectUrls.delete(key);
  }

  revokeAll(): void {
    for (const key of [...this.objectUrls.keys()]) this.revoke(key);
  }

  private db(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("walk-back-home-capsule-media", 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains("blobs")) request.result.createObjectStore("blobs");
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
    return this.dbPromise;
  }

  private transaction<T = void>(db: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("blobs", mode);
      const request = action(tx.objectStore("blobs"));
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
      tx.addEventListener("error", () => reject(tx.error));
    });
  }
}
