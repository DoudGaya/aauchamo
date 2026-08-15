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
      { id: "operations", label: "Live operations", icon: Activity },
      { id: "approvals", label: "Approvals", icon: ClipboardCheck },
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
      { id: "inventory", label: "Inventory", icon: Boxes },
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
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "documents", label: "Documents", icon: Archive },
      { id: "settings", label: "Configuration", icon: Settings2 },
    ],
  },
];

export const moduleMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Executive command centre",
    title: "Command centre",
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
