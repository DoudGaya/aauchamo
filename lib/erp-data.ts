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
  Clock,
  ContactRound,
  FileChartColumn,
  FileText,
  Landmark,
  PackageOpen,
  PackageSearch,
  Plane,
  ReceiptText,
  RotateCcw,
  SearchCheck,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  TicketCheck,
  TrendingDown,
  UserCog,
  Users,
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
      { id: "attendance", label: "Attendance logs", icon: Clock },
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
  attendance: {
    eyebrow: "People operations",
    title: "Attendance logs",
    description: "Manage employee clock-ins and clock-outs, view location coordinates, and review tracking logs.",
  },
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

export type ReportEntry = {
  key: string;
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  formats: ("csv" | "json")[];
  permission: string;
};

export const reportCatalogue: ReportEntry[] = [
  // ── Sales ────────────────────────────────────────────────────────────
  {
    key: "consolidated_sales",
    title: "Consolidated sales performance",
    category: "Sales",
    description: "Revenue, refunds and payment mix by station and business unit.",
    icon: ChartNoAxesCombined,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "station_sales_breakdown",
    title: "Station sales breakdown",
    category: "Sales",
    description: "Per-station revenue totals, ticket counts and outstanding balances for the period.",
    icon: Store,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "payment_mix",
    title: "Payment mix analysis",
    category: "Sales",
    description: "Breakdown of sales by payment method: cash, transfer, POS card, wallet, and credit.",
    icon: Landmark,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "refunds_cancellations",
    title: "Refunds & cancellations",
    category: "Sales",
    description: "All reversed, cancelled and refunded transactions with reason codes and officer.",
    icon: RotateCcw,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "outstanding_balances",
    title: "Outstanding balances",
    category: "Sales",
    description: "Open invoice balances by customer showing amount due and days overdue.",
    icon: TrendingDown,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  // ── Inventory ─────────────────────────────────────────────────────────
  {
    key: "stock_valuation",
    title: "Stock valuation & movement",
    category: "Inventory",
    description: "Opening, movement, closing quantity and current stock valuation.",
    icon: PackageSearch,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "stock_movement_log",
    title: "Stock movement log",
    category: "Inventory",
    description: "Detailed record of every IN, OUT, ADJUST and TRANSFER movement with officer and reference.",
    icon: PackageOpen,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "low_stock_alert",
    title: "Low stock alert",
    category: "Inventory",
    description: "Products at or below reorder level grouped by station and category.",
    icon: Tags,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "purchase_history",
    title: "Purchase history",
    category: "Inventory",
    description: "All purchase orders with supplier, GRN status, cost and unit breakdown.",
    icon: Archive,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  // ── Cargo ─────────────────────────────────────────────────────────────
  {
    key: "cargo_manifest",
    title: "Cargo manifest & status",
    category: "Cargo",
    description: "AWB summary, weight, origin/destination, route status and delivery confirmation.",
    icon: Plane,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  // ── Finance ───────────────────────────────────────────────────────────
  {
    key: "cashbook_ledger",
    title: "Cashbook ledger",
    category: "Finance",
    description: "All posted and reconciled cashbook entries with direction, category and account.",
    icon: FileChartColumn,
    formats: ["csv", "json"],
    permission: "reports.view_financial",
  },
  {
    key: "income_expense",
    title: "Income vs expense summary",
    category: "Finance",
    description: "Aggregate credit and debit totals grouped by category and station for the period.",
    icon: Banknote,
    formats: ["csv", "json"],
    permission: "reports.view_financial",
  },
  {
    key: "station_profitability",
    title: "Station profitability",
    category: "Finance",
    description: "Revenue, direct cost, manual expenses and net contribution per station.",
    icon: ChartNoAxesCombined,
    formats: ["csv", "json"],
    permission: "reports.view_financial",
  },
  {
    key: "agent_wallet_reconciliation",
    title: "Agent wallet reconciliation",
    category: "Finance",
    description: "Deposits, credits, debits and exposure with ledger verification.",
    icon: WalletCards,
    formats: ["csv", "json"],
    permission: "reports.view_financial",
  },
  // ── Staff ─────────────────────────────────────────────────────────────
  {
    key: "staff_directory",
    title: "Staff directory",
    category: "Staff",
    description: "Active employees with roles, station assignments, employment type and contact details.",
    icon: Users,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "user_activity",
    title: "User activity log",
    category: "Staff",
    description: "Login events, module access and key actions performed by each user in the period.",
    icon: UserCog,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  // ── Audit ─────────────────────────────────────────────────────────────
  {
    key: "audit_access_review",
    title: "Audit access review",
    category: "Governance",
    description: "User access, privileged actions and permission changes with IP and device info.",
    icon: ShieldCheck,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
  {
    key: "customer_transaction_history",
    title: "Customer transaction history",
    category: "Customers",
    description: "Sales, cargo, bookings, outstanding balances and lifetime value per customer.",
    icon: Building2,
    formats: ["csv", "json"],
    permission: "reports.view",
  },
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
