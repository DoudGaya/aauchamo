import { db } from "./lib/server/db";
async function main() {
  const company = await db.company.findFirst();
  if (!company) return;
  await db.sequence.upsert({
    where: { companyId_scopeKey_documentType_dateKey: { companyId: company.id, scopeKey: "GLOBAL", documentType: "STAFF", dateKey: "" } },
    create: { companyId: company.id, scopeKey: "GLOBAL", documentType: "STAFF", dateKey: "", prefix: "STF", nextValue: 5, padding: 5 },
    update: { nextValue: 5 }
  });
  console.log("Fixed sequence");
}
main().catch(console.error);
