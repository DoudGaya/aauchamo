import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  Banknote,
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  ClipboardCheck,
  ContactRound,
  FileChartColumn,
  Landmark,
  PackageSearch,
  Plane,
  ReceiptText,
  SearchCheck,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  TicketCheck,
  UserCog,
  UsersRound,
  WalletCards,
} from "lucide-react";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    label: "Command centre",
    items: [
      { id: "overview", label: "Overview", icon: CircleGauge },
      { id: "operations", label: "Live operations", icon: Activity, badge: "12" },
      { id: "approvals", label: "Approvals", icon: ClipboardCheck, badge: "5" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { id: "pos", label: "Point of sale", icon: ShoppingCart },
      { id: "sales", label: "Sales & revenue", icon: ReceiptText },
      { id: "customers", label: "Customers", icon: UsersRound },
      { id: "agents", label: "Agents & wallets", icon: WalletCards },
      { id: "tickets", label: "Flight bookings", icon: TicketCheck },
    ],
  },
  {
    label: "Fulfilment",
    items: [
      { id: "inventory", label: "Inventory", icon: Boxes, badge: "8" },
      { id: "purchases", label: "Purchases", icon: Tags },
      { id: "cargo", label: "Cargo & AWB", icon: Plane },
      { id: "stations", label: "Stations", icon: Store },
    ],
  },
  {
    label: "Control",
    items: [
      { id: "finance", label: "Finance", icon: Landmark },
      { id: "reports", label: "Reports & analytics", icon: FileChartColumn },
      { id: "staff", label: "Staff & HR", icon: ContactRound },
      { id: "access", label: "User access", icon: UserCog },
      { id: "audit", label: "Audit trail", icon: SearchCheck },
      { id: "management", label: "Correction tools", icon: ShieldCheck },
    ],
  },
  {
    label: "System",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell, badge: "9" },
      { id: "documents", label: "Documents", icon: Archive },
      { id: "settings", label: "Configuration", icon: Settings2 },
    ],
  },
];

export const moduleMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Executive command centre",
    title: "Good morning, Amina",
    description: "A live view of sales, inventory, cargo and financial performance across AAU Chamo.",
  },
  operations: {
    eyebrow: "Operations",
    title: "Live operations",
    description: "Track active workflows, station exceptions and operational service levels in real time.",
  },
  approvals: {
    eyebrow: "Governance",
    title: "Approval queue",
    description: "Review protected refunds, stock adjustments, reversals and high-value transactions.",
  },
  pos: {
    eyebrow: "Commercial",
    title: "Point of sale",
    description: "Create a controlled sale, collect payment and issue a numbered receipt.",
  },
  sales: {
    eyebrow: "Commercial",
    title: "Sales & revenue",
    description: "Analyse sales, refunds, cancellations and outstanding payments across the network.",
  },
  customers: {
    eyebrow: "Relationships",
    title: "Customer directory",
    description: "Maintain trusted customer records, travel context and complete transaction history.",
  },
  agents: {
    eyebrow: "Commercial partners",
    title: "Agents & wallets",
    description: "Monitor credit exposure, wallet activity, deposits and agent performance.",
  },
  tickets: {
    eyebrow: "Travel services",
    title: "Flight bookings",
    description: "Manage internal bookings, PNR records, payments, documents and ticket profitability.",
  },
  inventory: {
    eyebrow: "Stock control",
    title: "Inventory",
    description: "Control product availability, pricing, stock movements and replenishment across stations.",
  },
  purchases: {
    eyebrow: "Procurement",
    title: "Purchases & suppliers",
    description: "Plan stock intake, register supplier purchases and reconcile delivered quantities.",
  },
  cargo: {
    eyebrow: "Logistics",
    title: "Cargo & AWB",
    description: "Create, trace and reprint cargo records with barcode and QR-ready labels.",
  },
  stations: {
    eyebrow: "Network administration",
    title: "Stations",
    description: "Manage station configuration, leadership, stock transfers and comparative performance.",
  },
  finance: {
    eyebrow: "Financial control",
    title: "Finance",
    description: "Reconcile income, expenses, wallets, refunds and cash positions with a complete ledger.",
  },
  reports: {
    eyebrow: "Business intelligence",
    title: "Reports & analytics",
    description: "Build permission-aware operational and financial reports for every business unit.",
  },
  staff: {
    eyebrow: "People operations",
    title: "Staff & HR",
    description: "Manage employment records, station assignments, status and protected HR information.",
  },
  access: {
    eyebrow: "Identity & access",
    title: "Users, roles & permissions",
    description: "Enforce least-privilege access with station scope and granular server-side permissions.",
  },
  audit: {
    eyebrow: "Assurance",
    title: "Audit trail",
    description: "Inspect immutable evidence of logins, transactions, changes, approvals and corrections.",
  },
  management: {
    eyebrow: "Protected administration",
    title: "Correction tools",
    description: "Run traceable reversals, merges, recalculations, recovery actions and system diagnostics.",
  },
  notifications: {
    eyebrow: "Attention centre",
    title: "Notifications",
    description: "Prioritise inventory, wallet, login, approval and transaction alerts in one queue.",
  },
  documents: {
    eyebrow: "Document centre",
    title: "Documents & print centre",
    description: "Retrieve protected receipts, invoices, labels, statements and operational reports.",
  },
  settings: {
    eyebrow: "System administration",
    title: "Configuration",
    description: "Control company identity, business units, payments, tax, printers and notification adapters.",
  },
};

export const salesTrend = [
  { day: "Mon", sales: 3.2, target: 3.6 },
  { day: "Tue", sales: 4.1, target: 3.8 },
  { day: "Wed", sales: 3.7, target: 4.0 },
  { day: "Thu", sales: 5.2, target: 4.1 },
  { day: "Fri", sales: 4.8, target: 4.4 },
  { day: "Sat", sales: 6.4, target: 4.8 },
  { day: "Sun", sales: 5.9, target: 5.0 },
];

export const revenueMix = [
  { name: "Logistics", value: 42, color: "#ca0b12" },
  { name: "Binani", value: 28, color: "#231f20" },
  { name: "UMZA", value: 18, color: "#e5898c" },
  { name: "Ticketing", value: 12, color: "#888888" },
];

export const stationPerformance = [
  { station: "Head Office", revenue: 12.4, target: 10.8 },
  { station: "Airport", revenue: 8.7, target: 8.2 },
  { station: "Kano Central", revenue: 6.1, target: 6.8 },
  { station: "Lagos", revenue: 5.4, target: 5.1 },
];

export type Sale = {
  id: string;
  customer: string;
  channel: string;
  station: string;
  amount: number;
  method: string;
  status: string;
  time: string;
};

export const initialSales: Sale[] = [
  { id: "SAL-260802-1847", customer: "Musa Ibrahim", channel: "Logistics", station: "Head Office", amount: 286500, method: "Transfer", status: "Completed", time: "10:42" },
  { id: "SAL-260802-1846", customer: "Zainab Bello", channel: "Binani", station: "Airport", amount: 143200, method: "POS", status: "Completed", time: "10:31" },
  { id: "SAL-260802-1845", customer: "Horizon Travels", channel: "Ticketing", station: "Kano Central", amount: 612000, method: "Wallet", status: "Pending", time: "10:18" },
  { id: "SAL-260802-1844", customer: "Aisha Abdullahi", channel: "UMZA", station: "Head Office", amount: 98750, method: "Cash", status: "Completed", time: "09:54" },
  { id: "SAL-260802-1843", customer: "Northern Link Ltd", channel: "Logistics", station: "Lagos", amount: 415000, method: "Transfer", status: "Part paid", time: "09:37" },
];

export type Product = {
  code: string;
  name: string;
  category: string;
  station: string;
  stock: number;
  reorder: number;
  price: number;
  updated: string;
};

export const initialProducts: Product[] = [
  { code: "BNA-RCE-050", name: "Binani Premium Rice 50kg", category: "Foodstuff", station: "Head Office", stock: 184, reorder: 60, price: 68500, updated: "4 min ago" },
  { code: "UMZ-OPL-025", name: "UMZA Palm Oil 25L", category: "Cooking oil", station: "Airport", stock: 12, reorder: 25, price: 49200, updated: "12 min ago" },
  { code: "PKG-CRG-L", name: "Cargo Safety Wrap - Large", category: "Packaging", station: "Kano Central", stock: 8, reorder: 20, price: 4500, updated: "18 min ago" },
  { code: "BNA-FLR-010", name: "Binani Flour 10kg", category: "Foodstuff", station: "Lagos", stock: 76, reorder: 30, price: 14750, updated: "31 min ago" },
  { code: "PKG-TAG-100", name: "Thermal Cargo Tags (100)", category: "Packaging", station: "Airport", stock: 0, reorder: 10, price: 12000, updated: "48 min ago" },
];

export const cargoRows = [
  { awb: "AAU-LOS-882451", customer: "Bashir & Sons", route: "KAN → LOS", pieces: 4, weight: "68.4 kg", airline: "Max Air", status: "In transit", time: "10:36" },
  { awb: "AAU-ABV-882450", customer: "Maryam Foods", route: "KAN → ABV", pieces: 2, weight: "24.1 kg", airline: "Rano Air", status: "Processing", time: "10:22" },
  { awb: "AAU-KAN-882449", customer: "Emeka Okafor", route: "LOS → KAN", pieces: 1, weight: "8.7 kg", airline: "Air Peace", status: "Delivered", time: "09:58" },
  { awb: "AAU-PHC-882448", customer: "Arewa Merchants", route: "KAN → PHC", pieces: 6, weight: "112.0 kg", airline: "ValueJet", status: "On hold", time: "09:41" },
];

export const agents = [
  { id: "AGT-0041", name: "Horizon Travels", contact: "Sani Musa", balance: 2480000, limit: 3500000, volume: 8420000, status: "Healthy" },
  { id: "AGT-0037", name: "Northstar Agency", contact: "Hauwa Aliyu", balance: 184500, limit: 1200000, volume: 4760000, status: "Low balance" },
  { id: "AGT-0029", name: "Safeway Logistics", contact: "Kabiru Lawal", balance: 925000, limit: 2000000, volume: 3610000, status: "Healthy" },
  { id: "AGT-0018", name: "Unity Ticketing", contact: "Grace Nwosu", balance: -142000, limit: 750000, volume: 2980000, status: "Overdue" },
];

export const customers = [
  { id: "CUS-10582", name: "Musa Ibrahim", phone: "+234 803 445 1920", type: "Individual", last: "Today, 10:42", value: 1286500, station: "Head Office" },
  { id: "CUS-10573", name: "Zainab Bello", phone: "+234 806 782 0034", type: "Individual", last: "Today, 10:31", value: 743200, station: "Airport" },
  { id: "CUS-10494", name: "Northern Link Ltd", phone: "+234 701 220 8411", type: "Corporate", last: "Today, 09:37", value: 4815000, station: "Lagos" },
  { id: "CUS-10388", name: "Bashir & Sons", phone: "+234 809 009 7171", type: "Corporate", last: "Today, 10:36", value: 3254000, station: "Kano Central" },
];

export const staff = [
  { id: "AAU-STAFF-004", name: "Amina Yusuf", role: "Operations Manager", department: "Operations", station: "Head Office", since: "12 Feb 2021", status: "Active" },
  { id: "AAU-STAFF-018", name: "Kabiru Danladi", role: "Sales Officer", department: "Commercial", station: "Airport", since: "08 Sep 2023", status: "Active" },
  { id: "AAU-STAFF-021", name: "Hajara Sule", role: "Finance Officer", department: "Finance", station: "Head Office", since: "19 Jan 2024", status: "Active" },
  { id: "AAU-STAFF-027", name: "Chinedu Eze", role: "Cargo Coordinator", department: "Logistics", station: "Lagos", since: "03 Jun 2024", status: "On leave" },
];

export const auditEvents = [
  { id: "EVT-99281", actor: "Amina Yusuf", action: "Approved stock adjustment", subject: "ADJ-260802-017", station: "Head Office", ip: "102.89.34.18", time: "10:44:19", tone: "success" as Tone },
  { id: "EVT-99280", actor: "Kabiru Danladi", action: "Completed sale", subject: "SAL-260802-1847", station: "Head Office", ip: "102.89.34.42", time: "10:42:03", tone: "info" as Tone },
  { id: "EVT-99279", actor: "System", action: "Low stock threshold reached", subject: "UMZ-OPL-025", station: "Airport", ip: "Internal job", time: "10:39:55", tone: "warning" as Tone },
  { id: "EVT-99278", actor: "Hajara Sule", action: "Agent wallet deposit posted", subject: "AGT-0037", station: "Head Office", ip: "102.89.34.71", time: "10:35:12", tone: "success" as Tone },
  { id: "EVT-99277", actor: "Chinedu Eze", action: "Cargo label reprinted", subject: "AAU-LOS-882451", station: "Lagos", ip: "197.210.64.9", time: "10:30:47", tone: "neutral" as Tone },
];

export const financeRows = [
  { ref: "INC-260802-781", account: "Sales clearing", description: "Daily POS settlement", type: "Income", amount: 1286000, station: "Head Office", status: "Reconciled" },
  { ref: "EXP-260802-142", account: "Station operations", description: "Airport cargo handling", type: "Expense", amount: -185000, station: "Airport", status: "Approved" },
  { ref: "DEP-260802-094", account: "Agent wallets", description: "Northstar Agency deposit", type: "Deposit", amount: 500000, station: "Head Office", status: "Posted" },
  { ref: "REF-260802-031", account: "Refunds payable", description: "Sale reversal - duplicate", type: "Refund", amount: -48750, station: "Kano Central", status: "Pending" },
];

export const approvals = [
  { id: "APR-0281", request: "Stock adjustment", subject: "UMZA Palm Oil 25L", requestedBy: "Kabiru Danladi", station: "Airport", value: "-3 units", age: "8 min", risk: "Medium" },
  { id: "APR-0280", request: "Sale refund", subject: "SAL-260802-1818", requestedBy: "Sadiya Musa", station: "Kano Central", value: "₦185,500", age: "21 min", risk: "High" },
  { id: "APR-0279", request: "Price change", subject: "Binani Premium Rice 50kg", requestedBy: "Admin", station: "All stations", value: "+₦2,500", age: "46 min", risk: "Medium" },
  { id: "APR-0278", request: "Agent credit extension", subject: "Unity Ticketing", requestedBy: "Hajara Sule", station: "Head Office", value: "₦250,000", age: "1 hr", risk: "High" },
];

export const notifications = [
  { id: "N-882", title: "Product out of stock", detail: "Thermal Cargo Tags at Airport station", time: "2 min ago", tone: "danger" as Tone },
  { id: "N-881", title: "Approval required", detail: "Sale refund of ₦185,500 is waiting", time: "21 min ago", tone: "warning" as Tone },
  { id: "N-880", title: "Agent balance below limit", detail: "Northstar Agency has ₦184,500 remaining", time: "34 min ago", tone: "warning" as Tone },
  { id: "N-879", title: "Large transaction completed", detail: "₦1,286,000 at Head Office", time: "49 min ago", tone: "success" as Tone },
];

export const stations = [
  { name: "Head Office", code: "HQ-KAN", manager: "Amina Yusuf", revenue: 12400000, stock: 1842, staff: 28, health: 98 },
  { name: "Airport", code: "KAN-APT", manager: "Ibrahim Musa", revenue: 8700000, stock: 928, staff: 17, health: 91 },
  { name: "Kano Central", code: "KAN-CTR", manager: "Sa'ad Ahmed", revenue: 6100000, stock: 641, staff: 13, health: 88 },
  { name: "Lagos", code: "LOS-001", manager: "Chinedu Eze", revenue: 5400000, stock: 517, staff: 11, health: 94 },
];

export const tickets = [
  { pnr: "6KX2QA", passenger: "Fatima Garba", route: "KAN → LOS", airline: "Air Peace", travel: "04 Aug 2026", fare: 142500, profit: 12500, status: "Ticketed" },
  { pnr: "8PM4LT", passenger: "Samuel Okoro", route: "LOS → ABV", airline: "ValueJet", travel: "05 Aug 2026", fare: 118000, profit: 10000, status: "Reserved" },
  { pnr: "3AD7RV", passenger: "Rahila Ahmed", route: "KAN → JED", airline: "Saudia", travel: "12 Aug 2026", fare: 912000, profit: 42000, status: "Part paid" },
];

export const reportCatalogue = [
  { title: "Consolidated sales performance", category: "Sales", description: "Revenue, refunds and payment mix by station and business unit.", icon: ChartNoAxesCombined },
  { title: "Stock valuation & movement", category: "Inventory", description: "Opening, movement, closing quantity and current stock valuation.", icon: PackageSearch },
  { title: "Agent wallet reconciliation", category: "Finance", description: "Deposits, credits, debits and exposure with ledger verification.", icon: WalletCards },
  { title: "Station profitability", category: "Management", description: "Revenue, direct cost, expenses and contribution by station.", icon: Banknote },
  { title: "Audit access review", category: "Governance", description: "User access, privileged actions and permission changes over time.", icon: ShieldCheck },
  { title: "Customer transaction history", category: "Customers", description: "Sales, cargo, bookings, outstanding balances and lifetime value.", icon: Building2 },
];

export const formatNaira = (amount: number, compact = false) => {
  if (compact) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
};
