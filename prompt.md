Lets work on the settings and configurations modules. Make sure all the ablity to upload and update company logo and information are available and fully functional. Business creation, deletion and update should be available. Printer settings, integration, security, and notifications should all be fully functional and working correctly. Make sure both the UI and the backend are working excellently good and error free. I want to see only meaningful data, errors or warnings, and no noisy logs. Thanks.






Errors 


 GET /api/hr/catalogue 200 in 2.2s (next.js: 6ms, application-code: 2.2s)
prisma:error 
Invalid `tx.staff.create()` invocation in
C:\projects\aau-chamo\.next\dev\server\chunks\[root-of-the-server]__13wx7ki._.js:2720:44

  2717     includeDate: false,
  2718     padding: 5
  2719 });
→ 2720 const created = await tx.staff.create(
Unique constraint failed on the fields: (`"companyId"`, `"staffNumber"`)
Unhandled API error {
  requestId: '3779d37a-20ea-4d1c-9521-68432d7972ad',
  error: Error [PrismaClientKnownRequestError]:
  Invalid `tx.staff.create()` invocation in
  C:\projects\aau-chamo\.next\dev\server\chunks\[root-of-the-server]__13wx7ki._.js:2720:44

    2717     includeDate: false,
    2718     padding: 5
    2719 });
  → 2720 const created = await tx.staff.create(
  Unique constraint failed on the fields: (`"companyId"`, `"staffNumber"`)
      at <unknown> (app\api\staff\route.ts:123:38)
      at async (app\api\staff\route.ts:123:23)
      at async POST (app\api\staff\route.ts:114:19)
    121 |         padding: 5,
    122 |       });
  > 123 |       const created = await tx.staff.create({
        |                                      ^
    124 |         data: {
    125 |           companyId: access.companyId,
    126 |           businessUnitId: input.businessUnitId, {
    code: 'P2002',
    meta: { modelName: 'Staff', driverAdapterError: [Error] },
    clientVersion: '7.9.1'
  }
}
 POST /api/staff 500 in 8.7s (next.js: 6ms, application-code: 8.7s)
✓ Compiled in 3.1s
 