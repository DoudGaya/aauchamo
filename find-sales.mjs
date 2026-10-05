import fs from 'fs';

const content = fs.readFileSync('app/erp-workspace.tsx', 'utf8');
const lines = content.split('\n');

console.log('Searching for sales sections in erp-workspace.tsx...');
lines.forEach((line, i) => {
  if (
    line.includes('Sales & revenue') ||
    line.includes('Sales & Revenue') ||
    line.includes('tab === "sales"') ||
    line.includes("tab === 'sales'") ||
    line.includes('activeTab === "sales"') ||
    line.includes("activeTab === 'sales'") ||
    line.includes('section === "sales"') ||
    line.includes("section === 'sales'") ||
    line.includes('currentTab === "sales"') ||
    line.includes("currentTab === 'sales'") ||
    line.includes('Commercial / Sales') ||
    line.includes('SalesRevenue') ||
    line.includes('SalesSection')
  ) {
    console.log(`${i + 1}: ${line.trim().slice(0, 120)}`);
  }
});
