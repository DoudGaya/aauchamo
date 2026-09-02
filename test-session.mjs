import pg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_KDPCgrRbLE90@ep-muddy-boat-axtp2q4l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require' });
  await client.connect();

  const resUser = await client.query("SELECT id, \"securityVersion\" FROM users WHERE status = 'ACTIVE' LIMIT 1");
  if (resUser.rows.length === 0) {
    console.log("No user");
    process.exit(1);
  }
  const user = resUser.rows[0];

  const sessionId = randomUUID();
  const sessionToken = randomUUID();

  await client.query(
    "INSERT INTO sessions (id, \"sessionToken\", \"userId\", expires, \"securityVersion\") VALUES ($1, $2, $3, $4, $5)",
    [sessionId, sessionToken, user.id, new Date(Date.now() + 86400000), user.securityVersion]
  );
  
  console.log("Created session:", sessionToken);
  await client.end();
  
  const res = await fetch("http://127.0.0.1:3000/api/dashboard/station-performance", {
    headers: {
      "Cookie": `authjs.session-token=${sessionToken};`
    }
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

main().catch(console.error);
