export class MusicBlobStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private objectUrls = new Map<string, string>();

  async putBlob(key: string, blob: Blob): Promise<void> {
    const db = await this.db();
    await this.transaction(db, "readwrite", (store) => store.put(blob, key));
  }

  async getBlob(key: string): Promise<Blob | null> {
    const db = await this.db();
    return await this.transaction<Blob | null>(db, "readonly", (store) => store.get(key));
  }

  async deleteBlob(key: string): Promise<void> {
    const db = await this.db();
    this.revokeObjectUrl(key);
    await this.transaction(db, "readwrite", (store) => store.delete(key));
  }

  async objectUrlFor(key: string): Promise<string> {
    const existing = this.objectUrls.get(key);
    if (existing) return existing;
    const blob = await this.getBlob(key);
    if (!blob) throw new Error("Missing music blob");
    const url = URL.createObjectURL(blob);
    this.objectUrls.set(key, url);
    return url;
  }

  revokeObjectUrl(key: string): void {
    const url = this.objectUrls.get(key);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.objectUrls.delete(key);
  }

  private db(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("walk-back-home-personal-music", 1);
      request.addEventListener("upgradeneeded", () => {
        request.result.createObjectStore("blobs");
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
