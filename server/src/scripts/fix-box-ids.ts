import dotenv from "dotenv";
dotenv.config();

import { db, providerIdentities, fileChunks, vfsNodes } from "../db/index.js";
import { eq } from "drizzle-orm";
import { TokenService } from "../services/token.service.js";

async function main() {
  console.log("🔍 Checking Box file IDs in database vs Box cloud...");

  const [boxProvider] = await db
    .select()
    .from(providerIdentities)
    .where(eq(providerIdentities.provider, "box"));

  if (!boxProvider) {
    console.log("No Box account connected.");
    return;
  }

  const token = await TokenService.getValidAccessToken(boxProvider.id);

  console.log("Fetching live items from Box...");
  const rootRes = await fetch(
    "https://api.box.com/2.0/folders/0/items?limit=1000&fields=id,name,type",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const rootData = (await rootRes.json()) as any;

  let allBoxFiles: Array<{ id: string; name: string }> = [];

  for (const item of rootData.entries || []) {
    if (item.type === "file") {
      allBoxFiles.push({ id: item.id, name: item.name });
    } else if (item.type === "folder" && item.name === "Fuze") {
      const fuzeRes = await fetch(
        `https://api.box.com/2.0/folders/${item.id}/items?limit=1000&fields=id,name,type`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const fuzeData = (await fuzeRes.json()) as any;
      for (const fItem of fuzeData.entries || []) {
        if (fItem.type === "file") {
          allBoxFiles.push({ id: fItem.id, name: fItem.name });
        }
      }
    }
  }

  console.log(`\nFound ${allBoxFiles.length} file(s) in Box cloud:`);
  for (const f of allBoxFiles) {
    console.log(`  Box File: "${f.name}" -> real ID: ${f.id}`);
  }

  const chunks = await db
    .select({
      id: fileChunks.id,
      vfsNodeId: fileChunks.vfsNodeId,
      providerFileId: fileChunks.providerFileId,
      nodeName: vfsNodes.name,
    })
    .from(fileChunks)
    .innerJoin(vfsNodes, eq(fileChunks.vfsNodeId, vfsNodes.id))
    .where(eq(fileChunks.providerIdentityId, boxProvider.id));

  console.log(`\n--- DATABASE CHUNKS (${chunks.length}) vs REAL BOX IDs ---`);
  let fixedCount = 0;

  for (const c of chunks) {
    console.log(`\nDB Record: "${c.nodeName}"`);
    console.log(`  Currently stored ID: "${c.providerFileId}"`);

    const matched = allBoxFiles.find((f) => f.name === c.nodeName);

    if (matched) {
      if (c.providerFileId !== matched.id) {
        console.log(`  ⚡ ID MISMATCH! Updating DB to real Box ID: "${matched.id}"...`);
        await db
          .update(fileChunks)
          .set({ providerFileId: matched.id })
          .where(eq(fileChunks.id, c.id));
        fixedCount++;
      } else {
        console.log(`  ✓ ID matches Box correctly.`);
      }
    } else {
      console.log(`  ⚠️ NOT FOUND in Box cloud! Name in DB: "${c.nodeName}"`);
    }
  }

  console.log(`\n✅ Finished. Auto-repaired ${fixedCount} file ID(s) in database!`);
}

main().catch(console.error);
