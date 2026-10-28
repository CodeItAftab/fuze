import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
} from "./base.adapter.js";
import { Storage, File as MegaFile } from "megajs";
import { randomUUID } from "node:crypto";

export interface MegaConfig {
  email: string;
  password?: string;
  session?: string;
}

export class MegaAdapter implements StorageAdapter {
  private static storageCache = new Map<string, { storage: Storage; expiresAt: number }>();
  private static folderCache = new Map<string, MegaFile>();
  private static streamTokens = new Map<
    string,
    { config: MegaConfig; fileName: string; size: number; expiresAt: number }
  >();
  private static downloadTokens = new Map<
    string,
    { config: MegaConfig; providerFileId: string; expiresAt: number }
  >();

  public static parseConfig(token: string): MegaConfig {
    try {
      const parsed = JSON.parse(token);
      if (parsed.email && (parsed.password || parsed.session)) {
        return {
          email: parsed.email.trim(),
          password: parsed.password?.trim(),
          session: parsed.session?.trim(),
        };
      }
    } catch {}

    throw new Error("Invalid MEGA credentials format");
  }

  async getStorage(config: MegaConfig): Promise<Storage> {
    const key = config.email;
    const cached = MegaAdapter.storageCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.storage;
    }

    const options: any = {
      email: config.email,
      userAgent: "Fuze-Drive-Storage/1.0",
    };
    if (config.password) options.password = config.password;
    if (config.session) options.session = config.session;

    const storage = await new Storage(options).ready;
    MegaAdapter.storageCache.set(key, {
      storage,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 min cache
    });

    return storage;
  }

  async ensureFuzeFolder(storage: Storage): Promise<MegaFile> {
    const email = (storage as any).email || "default";
    const cached = MegaAdapter.folderCache.get(email);
    if (cached) return cached;

    if (!storage.root) throw new Error("MEGA root folder unavailable");

    const existing = storage.root.children?.find(
      (f) => f.name === "Fuze" && f.directory,
    );
    if (existing) {
      MegaAdapter.folderCache.set(email, existing);
      return existing;
    }

    const created = await storage.mkdir("Fuze");
    MegaAdapter.folderCache.set(email, created);
    return created;
  }

  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
    origin?: string;
  }): Promise<UploadSessionResult> {
    const config = MegaAdapter.parseConfig(params.accessToken);
    await this.getStorage(config);

    const token = randomUUID();
    MegaAdapter.streamTokens.set(token, {
      config,
      fileName: params.fileName,
      size: params.size,
      expiresAt: Date.now() + 2 * 3600 * 1000,
    });

    const apiBase = process.env.API_URL || "http://localhost:4000";
    const sessionUrl = `${apiBase}/uploads/provider-stream/mega?token=${token}`;

    return {
      sessionUrl,
      httpMethod: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
      uploadType: "binary",
    };
  }

  static async handleStreamUpload(
    token: string,
    stream: NodeJS.ReadableStream,
  ): Promise<{ id: string; name: string }> {
    const entry = MegaAdapter.streamTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new Error("Invalid or expired MEGA upload stream token");
    }

    const adapter = new MegaAdapter();
    const storage = await adapter.getStorage(entry.config);
    const fuzeFolder = await adapter.ensureFuzeFolder(storage);

    return new Promise((resolve, reject) => {
      const uploadStream = (fuzeFolder as any).upload(
        { name: entry.fileName, size: entry.size },
        (err: any, file: any) => {
          if (err) return reject(err);
          MegaAdapter.streamTokens.delete(token);
          resolve({ id: file.nodeId || file.name, name: file.name });
        },
      );
      stream.pipe(uploadStream);
      stream.on("error", (err) => {
        try {
          uploadStream.destroy?.();
        } catch {}
        reject(err);
      });
    });
  }

  async uploadBuffer(params: {
    fileName: string;
    buffer: Buffer;
    accessToken: string;
    mimeType?: string;
  }): Promise<{ id: string; name: string }> {
    const config = MegaAdapter.parseConfig(params.accessToken);
    const storage = await this.getStorage(config);
    const fuzeFolder = await this.ensureFuzeFolder(storage);

    return new Promise((resolve, reject) => {
      const uploadStream = (fuzeFolder as any).upload(
        { name: params.fileName, size: params.buffer.length },
        (err: any, file: any) => {
          if (err) return reject(err);
          resolve({ id: file.nodeId || file.name, name: file.name });
        },
      );
      uploadStream.end(params.buffer);
      uploadStream.on("error", reject);
    });
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const config = MegaAdapter.parseConfig(params.accessToken);
    const storage = await this.getStorage(config);
    const fuzeFolder = await this.ensureFuzeFolder(storage);

    const file = fuzeFolder.children?.find(
      (f) => f.name === params.providerFileId || f.nodeId === params.providerFileId,
    );

    if (!file) {
      throw new Error(`File not found on MEGA: ${params.providerFileId}`);
    }

    // Stream file contents directly through proxy to prevent HTML webpage download errors

    const token = randomUUID();
    MegaAdapter.downloadTokens.set(token, {
      config,
      providerFileId: params.providerFileId,
      expiresAt: Date.now() + 2 * 3600 * 1000,
    });

    return `${process.env.API_URL || "http://localhost:4000"}/uploads/provider-stream/mega/download?token=${token}`;
  }

  static async handleStreamDownload(
    token: string,
  ): Promise<{ stream: NodeJS.ReadableStream; name: string; size?: number }> {
    const entry = MegaAdapter.downloadTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new Error("Invalid or expired MEGA download token");
    }

    const adapter = new MegaAdapter();
    const storage = await adapter.getStorage(entry.config);
    const fuzeFolder = await adapter.ensureFuzeFolder(storage);

    const file = fuzeFolder.children?.find(
      (f) => f.name === entry.providerFileId || f.nodeId === entry.providerFileId,
    );

    if (!file) {
      throw new Error(`File not found on MEGA: ${entry.providerFileId}`);
    }

    const stream = (file as any).download({});
    return { stream, name: file.name || 'chunk', size: file.size };
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    try {
      const config = MegaAdapter.parseConfig(params.accessToken);
      const storage = await this.getStorage(config);
      const fuzeFolder = await this.ensureFuzeFolder(storage);

      const file = fuzeFolder.children?.find(
        (f) => f.name === params.providerFileId || f.nodeId === params.providerFileId,
      );

      if (file) {
        await (file as any).delete(true);
      }
    } catch (err) {
      console.warn("[MegaAdapter] deleteFile warning:", err);
    }
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    try {
      const config = MegaAdapter.parseConfig(accessToken);
      const storage = await this.getStorage(config);
      const info = await storage.getAccountInfo();

      return {
        totalBytes: Number(info.spaceTotal || 20 * 1024 * 1024 * 1024),
        usedBytes: Number(info.spaceUsed || 0),
      };
    } catch {
      return {
        totalBytes: 20 * 1024 * 1024 * 1024,
        usedBytes: 0,
      };
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds: number;
  }> {
    return {
      accessToken: refreshToken,
      refreshToken,
      expiresInSeconds: 365 * 24 * 3600,
    };
  }
}
