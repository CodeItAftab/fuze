import dotenv from "dotenv";
dotenv.config();

import { db } from "../db/index.js";
import { providerIdentities, vfsNodes, fileChunks } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { TokenService } from "../services/token.service.js";

async function restoreFiles() {
  console.log("🔍 Scanning connected storage providers for unlinked /Fuze files...");

  const providers = await db
    .select()
    .from(providerIdentities)
    .where(eq(providerIdentities.isRevoked, false));

  console.log(`Found ${providers.length} provider identity records.`);

  for (const prov of providers) {
    try {
      console.log(`\nChecking [${prov.provider.toUpperCase()}] (${prov.accountEmail || prov.id})...`);
      const token = await TokenService.getValidAccessToken(prov.id);

      let filesToRestore: Array<{
        name: string;
        size: number;
        providerFileId: string;
        mimeType: string;
      }> = [];

      if (prov.provider === "one_drive") {
        const res = await fetch("https://graph.microsoft.com/v1.0/me/drive/root:/Fuze:/children", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const items = data.value || [];
          for (const item of items) {
            if (item.file) {
              filesToRestore.push({
                name: item.name,
                size: item.size || 0,
                providerFileId: item.id,
                mimeType: item.file.mimeType || "application/octet-stream",
              });
            }
          }
        } else {
          console.warn(`OneDrive returned status ${res.status}: ${await res.text()}`);
        }
      } else if (prov.provider === "dropbox") {
        const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: "/Fuze" }),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const entries = data.entries || [];
          for (const entry of entries) {
            if (entry[".tag"] === "file") {
              filesToRestore.push({
                name: entry.name,
                size: entry.size || 0,
                providerFileId: entry.id || entry.path_lower,
                mimeType: "application/octet-stream",
              });
            }
          }
        } else {
          console.warn(`Dropbox returned status ${res.status}: ${await res.text()}`);
        }
      }

      console.log(`Found ${filesToRestore.length} file(s) in /Fuze folder.`);

      for (const item of filesToRestore) {
        // Check if file chunk or VFS node already exists
        const [existingChunk] = await db
          .select()
          .from(fileChunks)
          .where(eq(fileChunks.providerFileId, item.providerFileId))
          .limit(1);

        if (existingChunk) {
          console.log(`  ✓ Already tracked: ${item.name}`);
          continue;
        }

        // Check if VFS node already exists by user and name
        const [existingNode] = await db
          .select()
          .from(vfsNodes)
          .where(and(eq(vfsNodes.userId, prov.userId), eq(vfsNodes.name, item.name)))
          .limit(1);

        let nodeId: string;
        if (existingNode) {
          nodeId = existingNode.id;
        } else {
          const [newNode] = await db
            .insert(vfsNodes)
            .values({
              userId: prov.userId,
              parentId: null,
              name: item.name,
              type: "file",
              size: item.size,
              mimeType: item.mimeType,
            })
            .returning({ id: vfsNodes.id });
          nodeId = newNode.id;
        }

        await db.insert(fileChunks).values({
          vfsNodeId: nodeId,
          providerIdentityId: prov.id,
          providerFileId: item.providerFileId,
          byteStart: 0,
          byteEnd: Math.max(0, item.size - 1),
          chunkHash: "recovered",
          chunkIndex: 0,
        });

        console.log(`  ✨ Restored missing file to dashboard: ${item.name} (${item.size} bytes)`);
      }
    } catch (err: any) {
      console.error(`Error scanning ${prov.provider}:`, err?.message || err);
    }
  }

  console.log("\n✅ Recovery check completed!");
}

restoreFiles().catch(console.error).finally(() => process.exit(0));
