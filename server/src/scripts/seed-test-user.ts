import dotenv from "dotenv";
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  console.log("Connecting to Neon PostgreSQL database...");
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  const passwordHash = await bcrypt.hash("FuzeDemo2026!", 12);

  const testAccounts = [
    {
      email: "demo@fuze.aftabalam.me",
      name: "Fuze Demo Reviewer",
    },
    {
      email: "test@fuze.aftabalam.me",
      name: "Dropbox QA Reviewer",
    },
  ];

  for (const acc of testAccounts) {
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, acc.email));

    if (existing) {
      console.log(`Updating existing test account: ${acc.email}...`);
      await db
        .update(schema.users)
        .set({
          name: acc.name,
          passwordHash,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existing.id));
    } else {
      console.log(`Creating verified test account: ${acc.email}...`);
      await db.insert(schema.users).values({
        email: acc.email,
        name: acc.name,
        passwordHash,
        emailVerified: true,
      });
    }
  }

  console.log("\n✅ Success! Test accounts created on Neon:");
  console.log("-----------------------------------------");
  console.log("Email: demo@fuze.aftabalam.me");
  console.log("Password: FuzeDemo2026!");
  console.log("Status: Email Verified (Pre-activated)");
  console.log("-----------------------------------------");
  console.log("Email: test@fuze.aftabalam.me");
  console.log("Password: FuzeDemo2026!");
  console.log("Status: Email Verified (Pre-activated)");
  console.log("-----------------------------------------");

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error seeding test user:", err);
  process.exit(1);
});
