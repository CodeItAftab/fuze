import { db, fileChunks, vfsNodes, providerIdentities } from "../db/index.js";
import { eq, inArray } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "./token.service.js";

export interface RecoveryChunkItem {
  partIndex: number;
  totalParts: number;
  chunkFileName: string;
  sizeBytes: number;
  isPresentLocally: boolean;
  providerLocation: string;
}

export interface RecoveryFileItem {
  fileName: string;
  totalSizeBytes: number;
  totalParts: number;
  localPartsCount: number;
  isComplete: boolean;
  chunks: RecoveryChunkItem[];
}

export class RecoveryKitService {
  /**
   * Builds the comprehensive chunk inventory for the provider being unlinked.
   */
  static async buildRecoveryInventory(
    userId: string,
    providerIdentityId: string,
  ): Promise<RecoveryFileItem[]> {
    // 1. Chunks currently stored on this provider
    const localChunks = await db
      .select({
        chunkId: fileChunks.id,
        vfsNodeId: fileChunks.vfsNodeId,
        chunkIndex: fileChunks.chunkIndex,
        providerFileId: fileChunks.providerFileId,
        byteStart: fileChunks.byteStart,
        byteEnd: fileChunks.byteEnd,
      })
      .from(fileChunks)
      .where(eq(fileChunks.providerIdentityId, providerIdentityId));

    const affectedNodeIds = Array.from(
      new Set(localChunks.map((c) => c.vfsNodeId)),
    );
    if (affectedNodeIds.length === 0) return [];

    // 2. Query all sibling chunks across all providers for these files
    const allChunks = await db
      .select({
        vfsNodeId: fileChunks.vfsNodeId,
        chunkIndex: fileChunks.chunkIndex,
        providerIdentityId: fileChunks.providerIdentityId,
        providerFileId: fileChunks.providerFileId,
        byteStart: fileChunks.byteStart,
        byteEnd: fileChunks.byteEnd,
      })
      .from(fileChunks)
      .where(inArray(fileChunks.vfsNodeId, affectedNodeIds));

    // 3. Query all user providers for descriptive names
    const allProviders = await db
      .select({
        id: providerIdentities.id,
        provider: providerIdentities.provider,
        accountEmail: providerIdentities.accountEmail,
      })
      .from(providerIdentities)
      .where(eq(providerIdentities.userId, userId));

    const providerMap = new Map(
      allProviders.map((p) => [
        p.id,
        `${p.provider.toUpperCase()} (${p.accountEmail || "connected account"})`,
      ]),
    );

    // 4. Query VFS node metadata
    const nodes = await db
      .select({ id: vfsNodes.id, name: vfsNodes.name, size: vfsNodes.size })
      .from(vfsNodes)
      .where(inArray(vfsNodes.id, affectedNodeIds));

    const inventory: RecoveryFileItem[] = [];

    for (const node of nodes) {
      const nodeChunks = allChunks
        .filter((c) => c.vfsNodeId === node.id)
        .sort((a, b) => a.chunkIndex - b.chunkIndex);

      // Only chunked files (2+ pieces) need a recovery kit
      if (nodeChunks.length > 1) {
        const localCount = nodeChunks.filter(
          (c) => c.providerIdentityId === providerIdentityId,
        ).length;

        const chunks: RecoveryChunkItem[] = nodeChunks.map((c) => ({
          partIndex: c.chunkIndex,
          totalParts: nodeChunks.length,
          chunkFileName: c.providerFileId,
          sizeBytes: c.byteEnd - c.byteStart,
          isPresentLocally: c.providerIdentityId === providerIdentityId,
          providerLocation:
            providerMap.get(c.providerIdentityId) || "Connected Cloud Storage",
        }));

        inventory.push({
          fileName: node.name,
          totalSizeBytes: node.size,
          totalParts: nodeChunks.length,
          localPartsCount: localCount,
          isComplete: localCount === nodeChunks.length,
          chunks,
        });
      }
    }

    return inventory;
  }

  /**
   * Generates the RECOVERY_INSTRUCTIONS.txt
   */
  static generateManifestText(
    files: RecoveryFileItem[],
    providerName: string,
  ): string {
    const lines: string[] = [
      "==================================================================",
      ` FUZE CLOUD DRIVE - RECOVERY MANIFEST FOR ${providerName.toUpperCase()}`,
      ` Date: ${new Date().toISOString().split("T")[0]}`,
      "==================================================================",
      "",
      "This folder was created before disconnecting this cloud from Fuze.",
      "The files below were segmented into chunks. Follow the instructions to reassemble.",
      "",
    ];

    const completeFiles = files.filter((f) => f.isComplete);
    const splitFiles = files.filter((f) => !f.isComplete);

    if (completeFiles.length > 0) {
      lines.push(
        "------------------------------------------------------------------",
      );
      lines.push("1. COMPLETE FILES (All parts present in this cloud):");
      lines.push(
        "------------------------------------------------------------------",
      );
      completeFiles.forEach((f, idx) => {
        lines.push(
          `${idx + 1}. ${f.fileName} (${(f.totalSizeBytes / 1024 / 1024).toFixed(2)} MB, ${f.totalParts} parts total)`,
        );
        f.chunks.forEach((c) => {
          lines.push(
            `   • Part ${c.partIndex + 1} of ${f.totalParts}: "${c.chunkFileName}"`,
          );
        });
        lines.push("   -> Status: READY TO COMBINE immediately.\r\n");
      });
    }

    if (splitFiles.length > 0) {
      lines.push(
        "------------------------------------------------------------------",
      );
      lines.push("2. SPLIT FILES (Requires parts from other clouds):");
      lines.push(
        "------------------------------------------------------------------",
      );
      splitFiles.forEach((f, idx) => {
        lines.push(
          `⚠️ ${idx + 1}. ${f.fileName} (${(f.totalSizeBytes / 1024 / 1024).toFixed(2)} MB, ${f.totalParts} parts total)`,
        );
        lines.push(
          `   Parts on this cloud: ${f.localPartsCount} of ${f.totalParts}`,
        );
        f.chunks.forEach((c) => {
          if (c.isPresentLocally) {
            lines.push(
              `   [✓ PRESENT] Part ${c.partIndex + 1} of ${f.totalParts}: "${c.chunkFileName}"`,
            );
          } else {
            lines.push(
              `   [✗ MISSING] Part ${c.partIndex + 1} of ${f.totalParts}: "${c.chunkFileName}"`,
            );
            lines.push(`               Location: ${c.providerLocation}`);
          }
        });
        lines.push(
          "   -> Action needed: Download the missing parts into this folder before running the script.\r\n",
        );
      });
    }

    lines.push(
      "------------------------------------------------------------------",
      "HOW TO REASSEMBLE:",
      "------------------------------------------------------------------",
      "On Windows:",
      "  Double-click 'RESTORE_ALL_FILES.bat'. It automatically verifies all parts.",
      "",
      "On Mac / Linux:",
      "  Open terminal in this directory and run: bash RESTORE_ALL_FILES.sh",
      "==================================================================",
    );

    return lines.join("\r\n");
  }

  /**
   * Generates Windows RESTORE_ALL_FILES.bat with pre-flight chunk verification.
   */
  static generateWindowsBat(files: RecoveryFileItem[]): string {
    const lines: string[] = [
      "@echo off",
      "echo ====================================================",
      "echo   Fuze File Reassembler (Windows)",
      "echo ====================================================",
      "echo.",
    ];

    files.forEach((f, idx) => {
      lines.push(
        `echo [${idx + 1}/${files.length}] Checking parts for "${f.fileName}" (Requires ${f.totalParts} parts)...`,
      );
      lines.push("set MISSING=0");
      f.chunks.forEach((c) => {
        lines.push(`if not exist "${c.chunkFileName}" (`);
        lines.push(
          `    echo    [X] Missing Part ${c.partIndex + 1} of ${f.totalParts}: "${c.chunkFileName}"`,
        );
        if (!c.isPresentLocally) {
          lines.push(`    echo        ^> Location: ${c.providerLocation}`);
        }
        lines.push("    set MISSING=1");
        lines.push(")");
      });

      const parts = f.chunks.map((c) => `"${c.chunkFileName}"`).join(" + ");
      lines.push("if %MISSING% equ 0 (");
      lines.push(`    copy /b ${parts} "${f.fileName}" >nul`);
      lines.push(`    echo    [OK] Successfully reassembled "${f.fileName}"!`);
      lines.push(") else (");
      lines.push(
        `    echo    [ERROR] Cannot restore "${f.fileName}". Missing parts listed above.`,
      );
      lines.push(")");
      lines.push("echo.");
    });

    lines.push("echo All tasks processed.");
    lines.push("pause");
    return lines.join("\r\n");
  }

  /**
   * Deploys the _fuze_recovery folder with files to the cloud provider.
   */
  static async deployRecoveryKit(
    userId: string,
    providerIdentityId: string,
  ): Promise<void> {
    const [identity] = await db
      .select()
      .from(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    if (!identity) return;

    const inventory = await this.buildRecoveryInventory(
      userId,
      providerIdentityId,
    );
    if (inventory.length === 0) return;

    const manifestText = this.generateManifestText(
      inventory,
      identity.provider,
    );
    const batScript = this.generateWindowsBat(inventory);

    try {
      const adapter = getStorageAdapter(identity.provider);
      const token = await TokenService.getValidAccessToken(providerIdentityId);

      // Best-effort upload manifest
      const uploadTextFile = async (fileName: string, content: string) => {
        const buffer = Buffer.from(content, "utf-8");
        const session = await adapter.createResumableUploadSession({
          fileName: `_fuze_recovery_${fileName}`,
          mimeType: "text/plain",
          size: buffer.length,
          accessToken: token,
        });

        if (session.uploadType === "multipart") {
          const formData = new FormData();
          if (session.formDataFields) {
            for (const [k, v] of Object.entries(session.formDataFields)) {
              formData.append(k, v);
            }
          }
          formData.append("file", new Blob([buffer]), fileName);
          await fetch(session.sessionUrl, {
            method: session.httpMethod || "POST",
            headers: session.headers,
            body: formData,
          });
        } else {
          await fetch(session.sessionUrl, {
            method: session.httpMethod || "POST",
            headers: {
              "Content-Type": "text/plain",
              ...(session.headers || {}),
            },
            body: buffer,
          });
        }
      };

      await uploadTextFile("RECOVERY_INSTRUCTIONS.txt", manifestText);
      await uploadTextFile("RESTORE_ALL_FILES.bat", batScript);
      console.log(
        `[RecoveryKit] ✓ Deployed recovery kit to ${identity.provider}`,
      );
    } catch (err: any) {
      console.warn(
        `[RecoveryKit] Could not upload recovery files to cloud:`,
        err?.message,
      );
    }
  }
}
