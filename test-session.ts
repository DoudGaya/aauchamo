import { db } from "./lib/server/db";
import { randomUUID } from "crypto";

async function main() {
  const user = await db.user.findFirst({ where: { status: "ACTIVE" } });
  if (!user) {
    console.log("No active user found.");
    process.exit(1);
  }
  const sessionId = randomUUID();
  const sessionToken = randomUUID();
  await db.session.create({
    data: {
      id: sessionId,
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 86400000),
      securityVersion: user.securityVersion,
    }
  });
  console.log("Created session:", sessionToken);
  
  const res = await fetch("http://127.0.0.1:3000/api/dashboard/station-performance", {
    headers: {
      "Cookie": `authjs.session-token=${sessionToken};`
    }
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

main().catch(console.error).finally(() => db.$disconnect());
