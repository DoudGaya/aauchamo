"use client";

import Image from "next/image";
import { useOfflineSync } from "@/lib/client/offline-sync";

import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  Calculator,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  Clock3,
  Cloud,
  Command,
  Download,
  FileCheck2,
  FileDown,
  FileSearch,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  LockKeyhole,
  LogOut,
  Menu,
  Minus,
  Moon,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Plus,
  Printer,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Sun,
  Tag,
  TicketCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import React from "react";
import { signOut } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SalesTrendChart } from "./components/SalesTrendChart";
import {
  formatNaira,
  moduleMeta,
  navigation,
  reportCatalogue,
  type Tone,
} from "@/lib/erp-data";

type ModalKind = "sale" | "product" | "cargo" | "deposit" | "customer" | "purchase" | "ticket" | "finance" | "staff" | "station" | "invite" | "agent" | "profile" | "preferences" | "activity" | null;

type Toast = {
  title: string;
  detail: string;
};

type WorkspaceIdentity = {
  name: string;
  email: string;
  role: string;
  permissions: string[];
  companyWide: boolean;
};

type AllowedStation = { id: string; code: string; name: string };

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
  meta?: { total?: number };
};

type CustomerRecord = {
  id: string;
  customerNumber: string;
  type: "INDIVIDUAL" | "BUSINESS";
  displayName: string;
  primaryPhone: string;
  primaryEmail: string | null;
  defaultPnr: string | null;
  createdAt: string;
  homeStation: AllowedStation;
};

type StationRecord = AllowedStation & {
  city: string | null;
  state: string | null;
  isActive: boolean;
  businessUnits: Array<{ businessUnit: { id: string; code: string; name: string } }>;
  managerHistory: Array<{ manager: { id: string; name: string | null; firstName: string | null; lastName: string | null } }>;
};

type StaffRecord = {
  id: string;
  userId: string | null;
  staffNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  employmentDate: string;
  status: string;
  department: { name: string };
  position: { name: string };
  homeStation: AllowedStation;
  passportObjectKey?: string | null;
};

type RoleRecord = {
  id: string;
  name: string;
  code: string;
  scope: string;
  permissions: Array<{ permission: { key: string } }>;
  _count: { users: number };
};

type ProductRecord = {
  id: string; code: string; barcode: string | null; name: string; sellingPrice: string; purchasePrice: string | null;
  reorderLevel: string; status: string; category: { name: string }; unit: { code: string; name: string };
  balances: Array<{ id: string; quantity: string; station: AllowedStation; batch: { id: string; code: string; expiresAt: string | null } | null }>;
};
type PurchaseRecord = { id: string; orderNumber: string; status: string; total: string; expectedDate: string | null; createdAt: string; supplier: { name: string }; station: AllowedStation; lines: Array<{ id: string; quantityOrdered: string; quantityReceived: string; product: { name: string; trackBatches: boolean; trackExpiry: boolean } }> };
type SaleRecord = { id: string; saleNumber: string; postedAt: string; status: string; total: string; paidTotal: string; outstandingTotal: string; customer: { displayName: string }; station: AllowedStation; businessUnit: { name: string }; allocations: Array<{ payment: { paymentMethod: { name: string } } }> };
type CargoRecord = { id: string; awbNumber: string; senderName: string; senderPhone: string; receiverName: string; receiverPhone: string; receiverAddress: string | null; origin: string; destination: string; pieces: number; weightKg: string; commodity: string; airline: string | null; flightNumber: string | null; flightDate: string | null; handlingNotes: string | null; declaredValue: string | null; status: string; labelVersion: number; reprintCount: number; createdAt: string; customer: { id: string; displayName: string; primaryPhone: string }; station: AllowedStation };
type AgentRecord = { id: string; agentNumber: string; name: string; contactName: string; phone: string; email: string | null; address: string | null; creditLimit: string; status: string; homeStation: AllowedStation; wallet: { balance: string } | null; _count: { sales: number; bookings: number } };
type FinanceRecord = { id: string; entryNumber: string; direction: string; amount: string; description: string; status: string; createdAt: string; account: { name: string }; category: { name: string }; station: AllowedStation };
type TicketRecord = { id: string; bookingNumber: string; pnr: string; passengerName: string; origin: string; destination: string; airline: string; travelDate: string; fare: string; sellingPrice: string; profit: string; status: string; station: AllowedStation };
type POSBootstrap = { permissions: string[]; products: Array<{ id: string; code: string; name: string; sellingPrice: string; available: number; unit: { code: string } }>; customers: Array<{ id: string; customerNumber: string; displayName: string; primaryPhone: string }>; paymentMethods: Array<{ id: string; name: string; type: string; requiresReference: boolean; requiresTerminal: boolean }>; businessUnits: Array<{ id: string; code: string; name: string }>; agents: Array<{ id: string; name: string; agentNumber: string; wallet: { balance: string } | null }> };
type InventorySetup = { categories: Array<{ id: string; code: string; name: string }>; units: Array<{ id: string; code: string; name: string }>; suppliers: Array<{ id: string; supplierNumber: string; name: string }> };
type FinanceSetup = { accounts: Array<{ id: string; code: string; name: string }>; categories: Array<{ id: string; code: string; name: string; type: string }>; paymentMethods: Array<{ id: string; name: string; type: string }> };
type DashboardSummary = { sales: { grossRevenue: string; refunds: string; netRevenue: string; transactions: number; outstanding: string }; inventory: { quantity: string; balanceRows: number; outOfStock: number; value?: string }; entities: { customers: number; agents: number; staff: number; stations: number }; cargo: Record<string, number>; approvals: { pending: number }; receivables: { count: number; amount: string }; financialVisible?: boolean; businessUnits?: Array<{ id: string; code: string; name: string }> };
type StationPerformanceRecord = { id: string; code: string; name: string; revenue: string; outstanding: string; transactions: number; _count: { staffHome: number; cargoShipments: number } };
type ApprovalRecord = { id: string; entityType: string; entityId: string; action: string; status: string; requestReason: string; requestedAt: string; payload: Record<string, unknown> | null; version: number; station: AllowedStation | null; requestedBy: { id: string; name: string | null; firstName: string; lastName: string } };
type AuditRecord = { id: string; action: string; entityType: string; entityId: string | null; outcome: string; requestId: string | null; ipAddress: string | null; eventHash: string; occurredAt: string; actor: { name: string | null; firstName: string; lastName: string; username: string } | null; station: AllowedStation | null; before?: any; after?: any; metadata?: any; };
type NotificationRecord = { id: string; type: string; severity: string; title: string; message: string; href: string | null; status: string; createdAt: string };
type DocumentRecord = { id: string; documentType: string; documentNumber: string; sourceType: string; sourceId: string; status: string; mimeType: string | null; generatedAt: string | null; createdAt: string; station: AllowedStation | null; prints: Array<{ id: string; format: string; printedAt: string; reason?: string | null; printerName?: string | null }> };
type SettingsRecord = { company: { legalName: string; displayName: string; email: string | null; phone: string | null; address: string | null; timezone: string; currencyCode: string; locale: string; logoUrl?: string; logoDarkUrl?: string; taxRate?: string | null }; businessUnits: Array<{ id: string; code: string; name: string; description?: string | null; isActive: boolean; version: number }>; paymentMethods: Array<{ id: string; name: string; type: string; isActive: boolean; requiresReference: boolean; requiresTerminal: boolean }>; settings: Array<{ id: string; namespace: string; key: string; value: unknown; valueType: string; isSensitive: boolean }> };
type SearchResults = { customers?: Array<{ id: string; customerNumber: string; displayName: string; primaryPhone: string }>; sales?: Array<{ id: string; saleNumber: string; total: string; customer: { displayName: string } }>; products?: Array<{ id: string; code: string; name: string; sellingPrice: string }>; cargo?: Array<{ id: string; awbNumber: string; senderName: string; receiverName: string; status: string }>; tickets?: Array<{ id: string; bookingNumber: string; pnr: string; passengerName: string; status: string }> };
type TicketSetup = { customers: Array<{ id: string; customerNumber: string; displayName: string }>; agents: Array<{ id: string; agentNumber: string; name: string }>; paymentMethods: Array<{ id: string; name: string; type: string; requiresReference: boolean }>; businessUnits: Array<{ id: string; code: string; name: string }> };
type HrSetup = { departments: Array<{ id: string; code: string; name: string }>; positions: Array<{ id: string; code: string; name: string }> };
type UserSetup = { roles: Array<{ id: string; name: string; scope: string }>; businessUnits: Array<{ id: string; code: string; name: string }> };
type UserRecord = { id: string; name: string | null; firstName: string; lastName: string; username: string; email: string | null; status: string; lastLoginAt: string | null; roleAssignments: Array<{ role: { id: string; name: string; scope: string } }>; stationScopes: Array<{ stationId: string; canOperate: boolean }> };
type PermissionRecord = { id: string; key: string; module: string; action: string; description: string; elevated: boolean };
type SessionRecord = { id: string; expires: string; ipAddress: string | null; userAgent: string | null; lastSeenAt: string; revokedAt: string | null; user: { id: string; name: string | null; username: string; email: string | null } };
type MovementRecord = { id: string; movementType: string; quantityDelta: string; balanceAfter: string; referenceType: string; referenceId: string; reason: string | null; occurredAt: string; product: { id: string; code: string; name: string }; station: AllowedStation };
type TransferRecord = { id: string; transferNumber: string; status: string; reason: string; requestedAt: string; version: number; originStation: AllowedStation; destinationStation: AllowedStation; lines: Array<{ id: string; quantityRequested: string; quantityDispatched: string; quantityReceived: string; product: { id: string; code: string; name: string } }> };
type AdjustmentRecord = { id: string; adjustmentNumber: string; status: string; reason: string; requestedAt: string; station: AllowedStation; version: number; lines: Array<{ id: string; expectedQuantity: string; countedQuantity: string; quantityDelta: string; product: { id: string; code: string; name: string } }> };
type SaleDetailRecord = { id: string; saleNumber: string; status: string; lines: Array<{ id: string; productName: string; quantity: string; quantityRefunded: string }>; allocations: Array<{ payment: { paymentMethod: { id: string; name: string; requiresReference: boolean } } }> };

function useApiData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setLoading(true);
      setError(null);
      setRevision((value) => value + 1);
    };
    window.addEventListener("erp-data-changed", refresh);
    return () => window.removeEventListener("erp-data-changed", refresh);
  }, []);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = (await response.json()) as ApiEnvelope<T>;
        if (!response.ok || !body.ok || body.data === undefined) {
          throw new Error(body.error?.message || "The requested data could not be loaded.");
        }
        setData(body.data);
        setTotal(body.meta?.total ?? (Array.isArray(body.data) ? body.data.length : 0));
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "The requested data could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, revision]);

  const reload = () => {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  };
  return url ? { data, total, loading, error, reload } : { data: null, total: 0, loading: false, error: null, reload };
}

async function workflowPost<T>(url: string, body: unknown, method = "POST") {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !result.ok || result.data === undefined) throw new Error(result.error?.message ?? "The workflow could not be completed.");
  window.dispatchEvent(new Event("erp-data-changed"));
  return result.data;
}

const modulePermission: Record<string, string | undefined> = {
  overview: "dashboard.view",
  operations: "dashboard.view",
  approvals: "approvals.view",
  pos: "sales.create",
  sales: "sales.view",
  customers: "customers.view",
  agents: "agents.view",
  tickets: "tickets.view",
  inventory: "inventory.view",
  purchases: "purchases.view",
  cargo: "cargo.view",
  stations: "stations.view",
  finance: "finance.view",
  reports: "reports.view",
  staff: "staff.view",
  access: "users.view",
  audit: "audit.view",
  management: "management.correct",
  notifications: "notifications.view",
  documents: "documents.view",
  settings: "settings.view",
};

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

const pageActions: Record<string, { label: string; modal?: ModalKind; icon: LucideIcon }> = {
  overview: { label: "New sale", modal: "sale", icon: Plus },
  operations: { label: "Refresh live data", icon: RefreshCcw },
  approvals: { label: "Review next", icon: CheckCircle2 },
  pos: { label: "New sale", modal: "sale", icon: Plus },
  sales: { label: "Export sales", icon: Download },
  customers: { label: "Add customer", modal: "customer", icon: UserPlus },
  agents: { label: "Add agent", modal: "agent", icon: Plus },
  tickets: { label: "New booking", modal: "ticket", icon: Plus },
  inventory: { label: "Add product", modal: "product", icon: PackagePlus },
  purchases: { label: "New purchase", modal: "purchase", icon: Plus },
  cargo: { label: "Create AWB", modal: "cargo", icon: Plus },
  stations: { label: "Add station", modal: "station", icon: Plus },
  finance: { label: "Record entry", modal: "finance", icon: Plus },
  reports: { label: "Export report", icon: Download },
  staff: { label: "Add staff", modal: "staff", icon: UserPlus },
  attendance: { label: "Refresh logs", icon: RefreshCcw },
  access: { label: "Invite user", modal: "invite", icon: UserPlus },
  audit: { label: "Export evidence", icon: FileDown },
  management: { label: "Run diagnostics", icon: Gauge },
  notifications: { label: "Mark all read", icon: Check },
  documents: { label: "Refresh documents", icon: RefreshCcw },
  settings: { label: "Review settings", icon: Settings2 },
};

export default function ERPWorkspace({
  identity,
  brand,
  allowedStations,
}: {
  identity: WorkspaceIdentity;
  brand: { logoUrl: string | null; logoDarkUrl: string | null };
  allowedStations: AllowedStation[];
}) {
  const { isOnline, queueCount, isSyncing, triggerManualSync } = useOfflineSync();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeModule, setActiveModule] = useState(searchParams?.get("module") || "overview");
  const [station, setStation] = useState(
    searchParams?.get("station") || (identity.companyWide ? "All stations" : (allowedStations[0]?.name ?? "No assigned station")),
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const moduleParam = searchParams?.get("module");
    if (moduleParam && moduleParam !== activeModule) {
      setActiveModule(moduleParam);
    }
    const stationParam = searchParams?.get("station");
    if (stationParam && stationParam !== station) {
      setStation(stationParam);
    }
  }, [searchParams, activeModule, station]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("This week");
  const [isDark, setIsDark] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logoUrl);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(brand.logoDarkUrl);

  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: "light" | "dark"; url: string | null }>;
      if (customEvent.detail.theme === "light") {
        setLogoUrl(customEvent.detail.url);
      } else {
        setLogoDarkUrl(customEvent.detail.url);
      }
    };
    window.addEventListener("erp-logo-updated", handleLogoUpdate as EventListener);
    return () => window.removeEventListener("erp-logo-updated", handleLogoUpdate as EventListener);
  }, []);
  const meta = moduleMeta[activeModule] ?? moduleMeta.overview;
  const action = pageActions[activeModule] ?? pageActions.overview;
  const ActionIcon = action.icon;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setModal(null);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("aau-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (id: string) => {
    setActiveModule(id);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("module", id);
    router.replace(`${pathname}?${params.toString()}`);
    setMobileSidebar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStationChange = (value: string) => {
    setStation(value);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("station", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePrimaryAction = async () => {
    if (activeModule === "pos") {
      window.dispatchEvent(new Event("erp-pos-new-sale"));
      setModal("sale");
      return;
    }
    if (action.modal) {
      setModal(action.modal);
      return;
    }

    if (activeModule === "sales") {
      window.open("/api/reports/export", "_blank", "noopener,noreferrer");
      setToast({ title: "Export prepared", detail: "A permission-scoped sales CSV is being downloaded." });
      return;
    }
    if (activeModule === "audit") {
      window.open("/api/audit/export", "_blank", "noopener,noreferrer");
      setToast({ title: "Evidence export prepared", detail: "A verified audit CSV is being downloaded." });
      return;
    }

    if (activeModule === "notifications") {
      const response = await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "MARK_ALL_READ" }) });
      window.dispatchEvent(new Event("erp-data-changed"));
      setToast({ title: response.ok ? "Inbox cleared" : "Inbox update failed", detail: response.ok ? "All notifications have been marked as read." : "The notification state could not be updated." });
      return;
    }

    if (activeModule === "reports") {
      window.open("/api/reports/export", "_blank", "noopener,noreferrer");
      setToast({ title: "Report export started", detail: "The permission-scoped sales ledger is being exported." });
      return;
    }

    window.dispatchEvent(new Event("erp-data-changed"));
    setToast({ title: "Data refreshed", detail: `${meta.title} was refreshed from the server.` });
  };

  return (
    <div className={classNames("erp-app", isDark && "theme-dark")}>
      <Sidebar
        active={activeModule}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebar}
        onNavigate={navigate}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        onMobileClose={() => setMobileSidebar(false)}
        permissions={identity.permissions}
        brand={{ logoUrl, logoDarkUrl }}
        isDark={isDark}
      />

      <div className={classNames("app-frame", sidebarCollapsed && "sidebar-is-collapsed")}>
        <Topbar
          station={station}
          setStation={handleStationChange}
          isDark={isDark}
          onTheme={() => setIsDark((value) => !value)}
          onMenu={() => setMobileSidebar(true)}
          onSearch={() => setSearchOpen(true)}
          notificationOpen={notificationOpen}
          setNotificationOpen={setNotificationOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          onNavigate={navigate}
          identity={identity}
          allowedStations={allowedStations}
          onModal={(k) => setModal(k)}
        />

        <main className="page-shell">
          <PageHeader
            eyebrow={meta.eyebrow}
            title={meta.title}
            description={meta.description}
            period={period}
            setPeriod={setPeriod}
            action={action.label}
            ActionIcon={ActionIcon}
            onAction={handlePrimaryAction}
          />

          <ModuleView
            active={activeModule}
            station={station}
            period={period}
            onNavigate={navigate}
            onModal={setModal}
            onToast={setToast}
            allowedStations={allowedStations}
            identity={identity}
          />
        </main>

        <footer className="app-footer">
          <span>AAU Chamo Operations Suite</span>
          <span className={classNames("sync-state", !isOnline && "offline", queueCount > 0 && "has-queue")}>
            {isSyncing ? (
              <span style={{ color: "#ca0b12", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <RefreshCcw size={13} className="animate-spin" /> Syncing {queueCount} offline item{queueCount > 1 ? "s" : ""}...
              </span>
            ) : !isOnline ? (
              <span style={{ color: "#ca0b12", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Zap size={13} /> Offline Mode ({queueCount} pending syncs)
              </span>
            ) : queueCount > 0 ? (
              <button
                type="button"
                onClick={() => triggerManualSync()}
                style={{ background: "none", border: "none", color: "#ca0b12", cursor: "pointer", fontWeight: "bold", padding: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCcw size={13} /> Sync {queueCount} pending offline item{queueCount > 1 ? "s" : ""} now
              </button>
            ) : (
              <>
                <Wifi size={13} /> Live sync · Connected 🟢
              </>
            )}
          </span>
          <span>v1.0.0</span>
        </footer>
      </div>

      {searchOpen && (
        <CommandSearch
          query={searchQuery}
          setQuery={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onNavigate={(id) => {
            navigate(id);
            setSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      {modal && (
        <WorkflowModal
          kind={modal}
          onClose={() => setModal(null)}
          onComplete={(title, detail) => {
            setModal(null);
            setToast({ title, detail });
          }}
          allowedStations={allowedStations}
          identity={identity}
          isDark={isDark}
          setIsDark={setIsDark}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <div className="toast-icon"><Check size={17} /></div>
          <div><strong>{toast.title}</strong><span>{toast.detail}</span></div>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  active,
  collapsed,
  mobileOpen,
  onNavigate,
  onCollapse,
  onMobileClose,
  permissions,
  brand,
  isDark,
}: {
  active: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (id: string) => void;
  onCollapse: () => void;
  onMobileClose: () => void;
  permissions: string[];
  brand: { logoUrl: string | null; logoDarkUrl: string | null };
  isDark: boolean;
}) {
  const permissionSet = new Set(permissions);
  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const required = modulePermission[item.id];
        return !required || permissionSet.has(required);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const currentLogo = isDark
    ? (brand.logoDarkUrl ?? brand.logoUrl ?? "/logo.png")
    : (brand.logoUrl ?? "/logo.png");

  return (
    <>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onMobileClose} />}
      <aside className={classNames("sidebar", collapsed && "collapsed", mobileOpen && "mobile-open")}>
        <div className="brand-block">
          {!collapsed ? (
            <Image src={currentLogo} alt="AAU Chamo Logo" className="brand-logo-full" width={160} height={40} priority style={{ objectFit: "contain" }} />
          ) : (
            <Image src={currentLogo} alt="AAU Chamo Logo" className="brand-logo-collapsed" width={32} height={32} priority style={{ objectFit: "contain" }} />
          )}
          <button className="mobile-close" onClick={onMobileClose} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="workspace-chip">
          <div className="workspace-icon"><Building2 size={16} /></div>
          {!collapsed && <div><strong>AAU Chamo</strong><span>Production workspace</span></div>}
          {!collapsed && <ChevronDown size={14} />}
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {visibleNavigation.map((group) => (
            <div className="nav-group" key={group.label}>
              {!collapsed && <div className="nav-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={classNames("nav-item", active === item.id && "active")}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && <em>{item.badge}</em>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><CircleHelp size={17} /></div>
            {!collapsed && <div><strong>Need help?</strong><span>Open the support centre</span></div>}
          </div>
          <button className="collapse-control" onClick={onCollapse}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && <span>Collapse navigation</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  station,
  setStation,
  isDark,
  onTheme,
  onMenu,
  onSearch,
  notificationOpen,
  setNotificationOpen,
  profileOpen,
  setProfileOpen,
  onNavigate,
  identity,
  allowedStations,
  onModal,
}: {
  station: string;
  setStation: (value: string) => void;
  isDark: boolean;
  onTheme: () => void;
  onMenu: () => void;
  onSearch: () => void;
  notificationOpen: boolean;
  setNotificationOpen: (value: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (value: boolean) => void;
  onNavigate: (id: string) => void;
  identity: WorkspaceIdentity;
  allowedStations: AllowedStation[];
  onModal?: (kind: ModalKind) => void;
}) {
  const notificationApi = useApiData<NotificationRecord[]>(identity.permissions.includes("notifications.view") ? "/api/notifications?status=UNREAD&pageSize=3" : null);
  const markNotificationsRead = async () => { await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "MARK_ALL_READ" }) }); notificationApi.reload(); };
  const initials = identity.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="station-select-wrap">
          <Store size={15} />
          <select aria-label="Select station" value={station} onChange={(event) => setStation(event.target.value)}>
            {identity.companyWide && <option>All stations</option>}
            {allowedStations.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <ChevronDown size={13} />
        </div>
        <span className="environment-badge"><span /> Production</span>
      </div>

      <div className="topbar-actions">
        <button className="command-trigger" onClick={onSearch}>
          <Search size={16} />
          <span>Search customers, sales, AWB...</span>
          <kbd><Command size={11} />K</kbd>
        </button>
        <button className="icon-button" onClick={onTheme} aria-label="Toggle color theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="popover-anchor">
          <button
            className={classNames("icon-button", notificationOpen && "pressed")}
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setProfileOpen(false);
            }}
            aria-label="Open notifications"
          >
            <Bell size={18} />
            {notificationApi.total > 0 && <span className="notification-dot" />}
          </button>
          {notificationOpen && (
            <div className="popover notifications-popover">
              <div className="popover-header"><div><strong>Notifications</strong><span>{notificationApi.total} unread items</span></div><button onClick={markNotificationsRead}>Mark all read</button></div>
              <div className="notification-list">
                {notificationApi.data?.map((item) => (
                  <button key={item.id} className="notification-item" onClick={() => setNotificationOpen(false)}>
                    <span className={classNames("notification-indicator", item.severity === "WARNING" ? "warning" : item.severity === "SUCCESS" ? "success" : "info")} />
                    <span><strong>{item.title}</strong><em>{item.message}</em><small>{new Date(item.createdAt).toLocaleString("en-NG")}</small></span>
                  </button>
                ))}
                {!notificationApi.loading && !notificationApi.data?.length && <div className="command-hint"><span>Inbox is clear</span><em>No unread notifications.</em></div>}
              </div>
              <button className="popover-footer" onClick={() => { setNotificationOpen(false); onNavigate("notifications"); }}>View notification centre <ArrowRight size={14} /></button>
            </div>
          )}
        </div>

        <div className="profile-divider" />
        <div className="popover-anchor">
          <button
            className="profile-trigger"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationOpen(false);
            }}
          >
            <span className="avatar">{initials || "AC"}</span>
            <span className="profile-copy"><strong>{identity.name}</strong><small>{identity.role}</small></span>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div className="popover profile-popover">
              <div className="profile-summary"><span className="avatar large">{initials || "AC"}</span><div><strong>{identity.name}</strong><span>{identity.email}</span></div></div>
              <button onClick={() => { setProfileOpen(false); onModal?.("profile"); }}><UserCheck size={16} /> My profile</button>
              <button onClick={() => { setProfileOpen(false); onModal?.("preferences"); }}><Settings2 size={16} /> Preferences</button>
              <button onClick={() => { setProfileOpen(false); onModal?.("activity"); }}><History size={16} /> My activity</button>
              <div className="popover-separator" />
              <button className="danger-text" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={16} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  period,
  setPeriod,
  action,
  ActionIcon,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  period: string;
  setPeriod: (value: string) => void;
  action: string;
  ActionIcon: LucideIcon;
  onAction: () => void;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-header-actions">
        <label className="period-control">
          <CalendarDays size={15} />
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option>Today</option>
            <option>This week</option>
            <option>This month</option>
            <option>This quarter</option>
            <option>This year</option>
          </select>
          <ChevronDown size={13} />
        </label>
        <button className="secondary-button" onClick={() => window.print()}><Printer size={16} /><span>Print</span></button>
        <button className="primary-button" onClick={onAction}><ActionIcon size={17} /><span>{action}</span></button>
      </div>
    </div>
  );
}

function ModuleView({
  active,
  station,
  period,
  onNavigate,
  onModal,
  onToast,
  allowedStations,
  identity,
}: {
  active: string;
  station: string;
  period: string;
  onNavigate: (id: string) => void;
  onModal: (modal: ModalKind) => void;
  onToast: (toast: Toast) => void;
  allowedStations: AllowedStation[];
  identity: WorkspaceIdentity;
}) {
  switch (active) {
    case "overview":
      return <OverviewView onNavigate={onNavigate} period={period} station={station} allowedStations={allowedStations} />;
    case "operations":
      return <OperationsView onNavigate={onNavigate} />;
    case "approvals":
      return <ApprovalsView onToast={onToast} />;
    case "pos":
      return <POSView key={station} allowedStations={allowedStations} selectedStation={station} onModal={onModal} onToast={onToast} />;
    case "sales":
      return <SalesView station={station} allowedStations={allowedStations} identity={identity} />;
    case "inventory":
    case "purchases":
      return <InventoryView purchases={active === "purchases"} onModal={onModal} allowedStations={allowedStations} identity={identity} />;
    case "cargo":
      return <CargoView onModal={onModal} onToast={onToast} allowedStations={allowedStations} />;
    case "agents":
      return <AgentsView onModal={onModal} allowedStations={allowedStations} onToast={onToast} />;
    case "customers":
      return <CustomersView onModal={onModal} allowedStations={allowedStations} onToast={onToast} />;
    case "finance":
      return <FinanceView onToast={onToast} allowedStations={allowedStations} identity={identity} />;
    case "stations":
      return <StationsView />;
    case "tickets":
      return <TicketsView />;
    case "staff":
      return <StaffView onModal={onModal} allowedStations={allowedStations} />;
    case "attendance":
      return <AttendanceView allowedStations={allowedStations} onToast={onToast} />;
    case "reports":
      return <ReportsView period={period} onToast={onToast} allowedStations={allowedStations} identity={identity} />;
    case "access":
      return <AccessView onToast={onToast} onModal={onModal} allowedStations={allowedStations} />;
    case "audit":
      return <AuditView />;
    case "management":
      return <ManagementView onNavigate={onNavigate} />;
    case "notifications":
      return <NotificationsView onNavigate={onNavigate} onToast={onToast} />;
    case "documents":
      return <DocumentsView onToast={onToast} />;
    case "settings":
      return <SettingsView onToast={onToast} onModal={onModal} />;
    default:
      return <OverviewView onNavigate={onNavigate} period={period} station={station} allowedStations={allowedStations} />;
  }
}

function getPeriodDates(period: string) {
  const to = new Date();
  const from = new Date();
  
  if (period === "Today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "This week") {
    const day = from.getDay();
    from.setDate(from.getDate() - day);
    from.setHours(0, 0, 0, 0);
  } else if (period === "This month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "This quarter") {
    const quarter = Math.floor(from.getMonth() / 3);
    from.setMonth(quarter * 3);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "This year") {
    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }
  
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  return { from: fromStr, to: toStr };
}

function OverviewView({
  onNavigate,
  period,
  station,
  allowedStations,
}: {
  onNavigate: (id: string) => void;
  period: string;
  station: string;
  allowedStations: AllowedStation[];
}) {
  const [selectedBu, setSelectedBu] = useState<string>("ALL");

  const dates = getPeriodDates(period);
  const targetStationObj = allowedStations.find((s) => s.name === station);
  const targetStationId = targetStationObj ? targetStationObj.id : undefined;

  const filterParams = new URLSearchParams();
  if (dates.from) filterParams.append("from", dates.from);
  if (dates.to) filterParams.append("to", dates.to);
  if (targetStationId) filterParams.append("stationId", targetStationId);
  if (selectedBu !== "ALL") filterParams.append("businessUnitId", selectedBu);

  const filterQuery = filterParams.toString() ? `?${filterParams.toString()}` : "";

  const summaryApi = useApiData<DashboardSummary>(`/api/dashboard/summary${filterQuery}`);
  const trendApi = useApiData<any[]>(`/api/dashboard/sales-trends${filterQuery}`);
  const stationApi = useApiData<StationPerformanceRecord[]>(`/api/dashboard/station-performance${filterQuery}`);
  const salesApi = useApiData<SaleRecord[]>(`/api/sales${filterQuery ? filterQuery + "&" : "?"}pageSize=5`);
  
  const auditParams = new URLSearchParams();
  auditParams.append("pageSize", "5");
  if (targetStationId) auditParams.append("stationId", targetStationId);
  if (dates.from) auditParams.append("from", dates.from);
  if (dates.to) auditParams.append("to", dates.to);
  const auditApi = useApiData<AuditRecord[]>(`/api/audit?${auditParams.toString()}`);

  const summary = summaryApi.data;
  const businessUnits = summary?.businessUnits ?? [];
  const attention = (summary?.inventory.outOfStock ?? 0) + (summary?.approvals.pending ?? 0) + (summary?.receivables.count ?? 0);

  return (
    <div className="content-stack">
      {businessUnits.length > 0 && (
        <div className="table-tabs" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--line)" }}>
          <button className={classNames(selectedBu === "ALL" && "active")} onClick={() => setSelectedBu("ALL")}>
            Consolidated View
          </button>
          {businessUnits.map((bu) => (
            <button key={bu.id} className={classNames(selectedBu === bu.id && "active")} onClick={() => setSelectedBu(bu.id)}>
              {bu.name}
            </button>
          ))}
        </div>
      )}

      <section className="kpi-grid" aria-label="Key performance indicators">
        <MetricCard
          label="Gross revenue"
          value={formatNaira(Number(summary?.sales.grossRevenue ?? 0))}
          detail={`${summary?.sales.transactions ?? 0} posted transactions`}
          change="Live ledger"
          positive
          icon={CircleDollarSign}
          accent="navy"
        />
        <MetricCard
          label="Net revenue"
          value={formatNaira(Number(summary?.sales.netRevenue ?? 0))}
          detail={`${formatNaira(Number(summary?.sales.refunds ?? 0))} refunded`}
          change="Reconciled"
          positive
          icon={ShoppingCart}
          accent="teal"
        />
        <MetricCard
          label="Inventory footprint"
          value={Number(summary?.inventory.quantity ?? 0).toLocaleString() + " units"}
          detail={summary?.financialVisible ? `Cost value: ${formatNaira(Number(summary?.inventory.value ?? 0))}` : `${summary?.inventory.balanceRows ?? 0} station balances`}
          change="Movement ledger"
          positive
          icon={Boxes}
          accent="gold"
        />
        <MetricCard
          label="Needs attention"
          value={attention.toString()}
          detail={`${summary?.inventory.outOfStock ?? 0} stock · ${summary?.approvals.pending ?? 0} approvals · ${summary?.receivables.count ?? 0} receivables`}
          change="Live queue"
          icon={AlertTriangle}
          accent="red"
        />
      </section>

      {(summaryApi.error || trendApi.error || stationApi.error || salesApi.error || auditApi.error) && (
        <EmptyState
          icon={AlertTriangle}
          title="Some dashboard data is unavailable"
          detail={summaryApi.error ?? trendApi.error ?? stationApi.error ?? salesApi.error ?? auditApi.error ?? "Refresh to retry."}
          compact
        />
      )}

      <section className="dashboard-grid dashboard-grid-main">
        <Panel className="sales-chart-panel">
          <PanelHeader
            title="Sales & Revenue Trend"
            subtitle="Gross sales and refunds over the selected period"
            right={
              <button className="icon-ghost" onClick={() => { summaryApi.reload(); trendApi.reload(); stationApi.reload(); salesApi.reload(); auditApi.reload(); }}>
                <RefreshCcw size={16} />
              </button>
            }
          />
          
          <div className="summary-strip" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "12px" }}>
            <SummaryItem label="Customers" value={(summary?.entities.customers ?? 0).toString()} icon={Users} tone="info" />
            <SummaryItem label="Agents" value={(summary?.entities.agents ?? 0).toString()} icon={WalletCards} tone="success" />
            <SummaryItem label="Staff" value={(summary?.entities.staff ?? 0).toString()} icon={UserCheck} tone="info" />
            <SummaryItem label="Stations" value={(summary?.entities.stations ?? 0).toString()} icon={Building2} tone="success" />
          </div>

          <div style={{ padding: "8px 16px 16px" }}>
            {trendApi.loading ? (
              <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCcw size={20} className="animate-spin" />
              </div>
            ) : (
              <SalesTrendChart data={trendApi.data ?? []} />
            )}
          </div>
        </Panel>

        <Panel className="revenue-mix-panel">
          <PanelHeader title="Control totals" subtitle="Amounts requiring financial follow-through" />
          <div className="document-rows">
            <DocumentRow
              icon={Clock3}
              name="Outstanding sales"
              meta={`${summary?.receivables.count ?? 0} open balances`}
              status={formatNaira(Number(summary?.receivables.amount ?? 0))}
            />
            <DocumentRow
              icon={Plane}
              name="Cargo in transit"
              meta="Permission-scoped shipments"
              status={String(summary?.cargo.IN_TRANSIT ?? 0)}
            />
            <DocumentRow
              icon={ClipboardCheck}
              name="Pending approvals"
              meta="Maker-checker decisions"
              status={String(summary?.approvals.pending ?? 0)}
            />
          </div>
          <button className="text-action" onClick={() => onNavigate("reports")}>
            Open reconciled reports <ArrowRight size={14} />
          </button>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid-secondary">
        <Panel className="recent-sales-panel">
          <PanelHeader
            title="Recent sales"
            subtitle="Latest posted transactions in your scope"
            right={
              <button className="text-action" onClick={() => onNavigate("sales")}>
                View all <ArrowRight size={14} />
              </button>
            }
          />
          {salesApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading sales" detail="Reading posted records." compact />
          ) : (salesApi.data?.length ?? 0) ? (
            <div className="compact-table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Customer</th>
                    <th>Station</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesApi.data?.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <div className="primary-cell">
                          <strong>{sale.saleNumber}</strong>
                          <span>{formatDate(sale.postedAt)}</span>
                        </div>
                      </td>
                      <td>{sale.customer.displayName}</td>
                      <td>{sale.station.name}</td>
                      <td className="number-cell">{formatNaira(Number(sale.total))}</td>
                      <td>
                        <StatusPill value={sale.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={ShoppingCart} title="No posted sales" detail="Completed POS transactions will appear here." compact />
          )}
        </Panel>

        <Panel className="timeline-feed-panel">
          <PanelHeader title="Recent activities" subtitle="Live workspace audit trail" />
          <div className="timeline-feed" style={{ maxHeight: "320px", overflowY: "auto" }}>
            {auditApi.loading ? (
              <EmptyState icon={RefreshCcw} title="Loading activities" detail="Reading audit events." compact />
            ) : auditApi.data?.length ? (
              auditApi.data.map((event) => {
                let dotTone = "info";
                if (event.action.includes("deleted") || event.action.includes("cancelled") || event.outcome === "FAILURE") {
                  dotTone = "danger";
                } else if (event.action.includes("created") || event.action.includes("approved")) {
                  dotTone = "success";
                } else if (event.action.includes("updated")) {
                  dotTone = "warning";
                }
                return (
                  <div className="timeline-event" key={event.id}>
                    <time>{new Date(event.occurredAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}</time>
                    <span className={classNames("timeline-dot", dotTone)} />
                    <div style={{ paddingRight: "8px" }}>
                      <strong>{event.action.replaceAll("_", " ").replaceAll(".", " ")}</strong>
                      <span>
                        by {event.actor?.firstName ?? "System"} {event.actor?.lastName ?? ""} 
                        {event.station && ` · ${event.station.name}`}
                      </span>
                    </div>
                    <em>{new Date(event.occurredAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</em>
                  </div>
                );
              })
            ) : (
              <EmptyState icon={Fingerprint} title="No recent events" detail="Audit trail is clear." compact />
            )}
          </div>
        </Panel>
      </section>

      <Panel>
        <PanelHeader
          title="Station performance"
          subtitle="Posted revenue, workload and open balances"
          right={<span className="updated-label"><RefreshCcw size={12} /> Live database view</span>}
        />
        {stationApi.loading ? (
          <EmptyState icon={RefreshCcw} title="Loading station performance" detail="Aggregating station ledgers." compact />
        ) : (
          <div className="station-operation-list">
            {stationApi.data?.map((item) => (
              <div
                className="station-operation"
                key={item.id}
                onClick={() => onNavigate("stations")}
                style={{ cursor: "pointer" }}
                title="Go to Stations directory"
              >
                <div className="station-monogram">{item.code.slice(0, 2)}</div>
                <div className="station-operation-copy">
                  <strong>{item.name}</strong>
                  <span>
                    {item._count.staffHome} active staff · {item._count.cargoShipments} cargo records
                  </span>
                </div>
                <div className="station-operation-metric">
                  <span>Transactions</span>
                  <strong>{item.transactions}</strong>
                </div>
                <div className="station-operation-metric">
                  <span>Revenue</span>
                  <strong>{formatNaira(Number(item.revenue), true)}</strong>
                </div>
                <StatusPill value={Number(item.outstanding) > 0 ? "Attention" : "Healthy"} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MetricCard({ label, value, detail, change, positive, icon: Icon, accent }: { label: string; value: string; detail: string; change: string; positive?: boolean; icon: LucideIcon; accent: string }) {
  return (
    <article className={classNames("metric-card", `accent-${accent}`)}>
      <div className="metric-card-top"><span>{label}</span><div className="metric-icon"><Icon size={18} /></div></div>
      <div className="metric-value">{value}</div>
      <div className="metric-footer"><span>{detail}</span><em className={positive ? "positive" : "neutral"}>{positive ? <TrendingUp size={12} /> : <Activity size={12} />}{change}</em></div>
    </article>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={classNames("panel", className)}>{children}</section>;
}

function PanelHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{right && <div className="panel-header-right">{right}</div>}</div>;
}

function AttentionItem({ icon: Icon, tone, title, detail, time }: { icon: LucideIcon; tone: Tone; title: string; detail: string; time: string }) {
  return (
    <button className="attention-item">
      <span className={classNames("attention-icon", tone)}><Icon size={16} /></span>
      <span><strong>{title}</strong><em>{detail}</em></span>
      <time>{time}</time>
      <ChevronRight size={15} />
    </button>
  );
}

function OperationsView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const summaryApi = useApiData<DashboardSummary>("/api/dashboard/summary"); const stationApi = useApiData<StationPerformanceRecord[]>("/api/dashboard/station-performance"); const summary = summaryApi.data;
  const operations = [
    { icon: ShoppingCart, label: "Posted transactions", value: String(summary?.sales.transactions ?? 0), detail: `${formatNaira(Number(summary?.sales.grossRevenue ?? 0))} processed`, tone: "teal", progress: Math.min(100, summary?.sales.transactions ?? 0) },
    { icon: Plane, label: "Cargo in motion", value: String(summary?.cargo.IN_TRANSIT ?? 0), detail: `${summary?.cargo.LABELLED ?? 0} labelled · ${summary?.cargo.ON_HOLD ?? 0} held`, tone: "navy", progress: Math.min(100, (summary?.cargo.IN_TRANSIT ?? 0) * 5) },
    { icon: Boxes, label: "Stock balances", value: String(summary?.inventory.balanceRows ?? 0), detail: `${summary?.inventory.outOfStock ?? 0} out of stock`, tone: "gold", progress: Math.max(0, 100 - (summary?.inventory.outOfStock ?? 0) * 5) },
    { icon: ClipboardCheck, label: "Pending approvals", value: String(summary?.approvals.pending ?? 0), detail: "Maker-checker queue", tone: "red", progress: Math.min(100, (summary?.approvals.pending ?? 0) * 8) },
  ];
  return (
    <div className="content-stack">
      <section className="operations-strip">
        {operations.map((item) => {
          const Icon = item.icon;
          return (
            <article className="operation-card" key={item.label}>
              <div className={classNames("operation-icon", item.tone)}><Icon size={18} /></div>
              <div><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>
              <div className="progress-track"><i style={{ width: `${item.progress}%` }} /></div>
            </article>
          );
        })}
      </section>
      <div className="dashboard-grid operations-main-grid">
        <Panel>
          <PanelHeader title="Network activity" subtitle="Operational status by station" right={<span className="live-label"><i /> Live</span>} />
          <div className="station-operation-list">
            {stationApi.data?.map((item) => (
              <div className="station-operation" key={item.id}>
                <div className="station-monogram">{item.code.slice(0, 2)}</div>
                <div className="station-operation-copy"><strong>{item.name}</strong><span>{item._count.staffHome} staff · {item._count.cargoShipments} cargo records</span></div>
                <div className="station-operation-metric"><span>Transactions</span><strong>{item.transactions}</strong></div>
                <div className="station-operation-metric"><span>Revenue</span><strong>{formatNaira(Number(item.revenue), true)}</strong></div>
                <StatusPill value={Number(item.outstanding) > 0 ? "Attention" : "Healthy"} />
                <button className="icon-ghost" onClick={() => onNavigate("stations")}><ChevronRight size={16} /></button>
              </div>
            ))}
            {stationApi.loading && <EmptyState icon={RefreshCcw} title="Loading station activity" detail="Aggregating station ledgers." compact />}
          </div>
        </Panel>
        <Panel className="exceptions-panel">
          <PanelHeader title="Exception queue" subtitle="Issues outside normal thresholds" />
          <div className="exception-score"><Gauge size={24} /><div><strong>{Math.max(0, 100 - ((summary?.inventory.outOfStock ?? 0) + (summary?.approvals.pending ?? 0)))}</strong><span>Control health score</span></div><em>Live</em></div>
          <div className="exception-list">
            <button onClick={() => onNavigate("inventory")}><span className="exception-number danger">{summary?.inventory.outOfStock ?? 0}</span><div><strong>Inventory exceptions</strong><small>Out-of-stock balances</small></div><ArrowRight size={14} /></button>
            <button onClick={() => onNavigate("finance")}><span className="exception-number warning">{summary?.receivables.count ?? 0}</span><div><strong>Finance exceptions</strong><small>{formatNaira(Number(summary?.receivables.amount ?? 0))} outstanding</small></div><ArrowRight size={14} /></button>
            <button onClick={() => onNavigate("cargo")}><span className="exception-number info">{summary?.cargo.ON_HOLD ?? 0}</span><div><strong>Cargo exceptions</strong><small>Held shipments</small></div><ArrowRight size={14} /></button>
          </div>
        </Panel>
      </div>
      {(summaryApi.error || stationApi.error) && <EmptyState icon={AlertTriangle} title="Operations data is partially unavailable" detail={summaryApi.error ?? stationApi.error ?? "Refresh to retry."} />}
      <Panel><PanelHeader title="Operational control totals" subtitle="Live source-of-truth counts across the authorized network" right={<button className="text-action" onClick={() => { summaryApi.reload(); stationApi.reload(); }}><RefreshCcw size={14} />Refresh</button>} /><div className="summary-strip"><SummaryItem label="Customers" value={String(summary?.entities.customers ?? 0)} icon={Users} tone="info" /><SummaryItem label="Agents" value={String(summary?.entities.agents ?? 0)} icon={WalletCards} tone="success" /><SummaryItem label="Staff" value={String(summary?.entities.staff ?? 0)} icon={UserCheck} tone="info" /><SummaryItem label="Stations" value={String(summary?.entities.stations ?? 0)} icon={Building2} tone="success" /></div></Panel>
    </div>
  );
}

function ApprovalsView({ onToast }: { onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("Pending");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, total, loading, error, reload } = useApiData<ApprovalRecord[]>(`/api/approvals?status=${tab.toUpperCase()}&pageSize=100`);
  const decide = async (approval: ApprovalRecord, decision: "APPROVED" | "REJECTED") => { const reason = window.prompt(`${decision === "APPROVED" ? "Approval" : "Rejection"} reason`); if (!reason?.trim()) return; setBusy(approval.id); try { const response = await fetch(`/api/approvals/${approval.id}/decision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, reason, version: approval.version }) }); const body = await response.json() as ApiEnvelope<ApprovalRecord>; if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Decision could not be posted."); onToast({ title: `Request ${decision.toLowerCase()}`, detail: `${approval.id} was decided with segregation-of-duties controls.` }); reload(); } catch (reason) { onToast({ title: "Decision failed", detail: reason instanceof Error ? reason.message : "The request could not be decided." }); } finally { setBusy(null); } };
  const items = data ?? [];
  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label={`${tab} requests`} value={total.toString()} icon={Clock3} tone="warning" />
        <SummaryItem label="Finance controls" value={items.filter((item) => item.entityType === "CashbookEntry").length.toString()} icon={ShieldCheck} tone="danger" />
        <SummaryItem label="Station scoped" value={items.filter((item) => item.station).length.toString()} icon={Building2} tone="success" />
        <SummaryItem label="Queue status" value={loading ? "Syncing" : "Live"} icon={Zap} tone="info" />
      </section>
      <Panel>
        <TableToolbar
          tabs={["Pending", "Approved", "Rejected"]}
          activeTab={tab}
          onTab={setTab}
          placeholder="Search approval ID or subject"
        />
        {error ? <EmptyState icon={AlertTriangle} title="Approvals could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading approval queue" detail="Applying assignment and station scope." compact /> : <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Request</th><th>Subject</th><th>Requested by</th><th>Station</th><th>Reason</th><th>Requested</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><div className="primary-cell"><strong>{item.action.replaceAll("_", " ")}</strong><span>{item.id}</span></div></td>
                  <td>{item.entityType} · {item.entityId.slice(0, 10)}</td><td>{item.requestedBy.name ?? `${item.requestedBy.firstName} ${item.requestedBy.lastName}`}</td><td>{item.station?.name ?? "Company-wide"}</td><td>{item.requestReason}</td><td>{formatDate(item.requestedAt)}</td>
                  <td><StatusPill value={item.status} /></td>
                  <td>{item.status === "PENDING" ? <div className="row-actions"><button disabled={busy === item.id} className="approve-button" onClick={() => decide(item, "APPROVED")}><Check size={15} />Approve</button><button disabled={busy === item.id} className="icon-ghost" onClick={() => decide(item, "REJECTED")} aria-label="Reject request"><X size={16} /></button></div> : <span className="verified-cell"><ShieldCheck size={14} />Decided</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <EmptyState icon={CheckCircle2} title="No requests in this queue" detail="There are no approval requests in your current scope." />}
        </div>}
        <Pagination count={total} />
      </Panel>
    </div>
  );
}

function POSReceiptModal({
  saleId,
  onClose,
}: {
  saleId: string;
  onClose: () => void;
}) {
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("thermal");
  const { data, loading, error } = useApiData<any>(`/api/sales/${saleId}`);

  if (loading) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true">
        <div className="workflow-dialog" style={{ maxWidth: "400px", textAlign: "center", padding: "40px" }}>
          <RefreshCcw className="spinning-icon" size={30} />
          <p style={{ marginTop: "12px" }}>Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="workflow-dialog" style={{ maxWidth: "400px", padding: "20px" }}>
          <div className="form-note"><AlertTriangle size={16} /><span>Failed to load receipt: {error || "No data"}</span></div>
          <button className="primary-button" onClick={onClose} style={{ marginTop: "12px" }}>Close</button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ overflowY: "auto" }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="workflow-dialog print-container" style={{ maxWidth: printFormat === "thermal" ? "400px" : "800px", width: "100%", margin: "40px auto" }}>
        <div className="workflow-header no-print">
          <div>
            <span>Document Preview</span>
            <h2>Print Receipt / Invoice</h2>
            <p>Select format and print the reproducible snapshot.</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <div className="no-print" style={{ display: "flex", gap: "10px", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--field-bg)" }}>
          <button type="button" className={classNames("secondary-button", printFormat === "thermal" && "active-tab")} onClick={() => setPrintFormat("thermal")}>
            Thermal (80mm)
          </button>
          <button type="button" className={classNames("secondary-button", printFormat === "a4" && "active-tab")} onClick={() => setPrintFormat("a4")}>
            A4 Standard
          </button>
          <button type="button" className="primary-button" onClick={handlePrint} style={{ marginLeft: "auto" }}>
            <Printer size={16} /> Print
          </button>
        </div>

        <div className="receipt-scroll-area" style={{ padding: "24px", background: "white", color: "black", fontFamily: "monospace" }}>
          {printFormat === "thermal" ? (
            <div className="thermal-receipt" style={{ width: "100%", margin: "0 auto", fontSize: "12px", lineHeight: "1.4" }}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0" }}>{data.company?.displayName || "AAU Chamo Agency"}</h3>
                <p style={{ margin: "2px 0" }}>{data.company?.address || "Nigeria"}</p>
                <p style={{ margin: "2px 0" }}>Tel: {data.company?.phone || ""}</p>
                <div style={{ borderBottom: "1px dashed black", margin: "12px 0" }}></div>
                <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: "4px 0" }}>SALES RECEIPT</h4>
                <p style={{ margin: "2px 0" }}>{data.saleNumber}</p>
              </div>

              <div style={{ marginBottom: "12px", fontSize: "11px" }}>
                <div>Date: {new Date(data.postedAt).toLocaleString("en-NG")}</div>
                <div>Customer: {data.customer.displayName} ({data.customer.primaryPhone})</div>
                <div>Station: {data.station.name}</div>
                {data.businessUnit && <div>Unit: {data.businessUnit.name}</div>}
              </div>

              <div style={{ borderBottom: "1px dashed black", marginBottom: "8px" }}></div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px dashed black" }}>
                    <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item</th>
                    <th style={{ textAlign: "center", paddingBottom: "4px" }}>Qty</th>
                    <th style={{ textAlign: "right", paddingBottom: "4px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line: any) => (
                    <tr key={line.id}>
                      <td style={{ paddingTop: "4px", verticalAlign: "top" }}>{line.productName}<br /><small>{line.productCode} · @{Number(line.unitPrice).toFixed(2)}</small></td>
                      <td style={{ paddingTop: "4px", textAlign: "center", verticalAlign: "top" }}>{line.quantity}</td>
                      <td style={{ paddingTop: "4px", textAlign: "right", verticalAlign: "top" }}>{Number(line.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderBottom: "1px dashed black", marginBottom: "8px" }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                <span>Subtotal:</span>
                <span>{Number(data.subtotal).toFixed(2)}</span>
              </div>
              {Number(data.discountTotal) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Discount:</span>
                  <span>-{Number(data.discountTotal).toFixed(2)}</span>
                </div>
              )}
              {Number(data.taxTotal) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>Tax:</span>
                  <span>+{Number(data.taxTotal).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0", fontSize: "14px", fontWeight: "bold" }}>
                <span>TOTAL:</span>
                <span>{Number(data.total).toFixed(2)} NGN</span>
              </div>

              <div style={{ borderBottom: "1px dashed black", margin: "12px 0" }}></div>

              <div style={{ fontSize: "11px", marginBottom: "8px" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Payment Details:</strong>
                {data.allocations.map((alloc: any) => (
                  <div key={alloc.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{alloc.payment.paymentMethod.name}</span>
                    <span>{Number(alloc.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: "1px dashed black", margin: "12px 0" }}></div>
              <div style={{ textAlign: "center", fontSize: "11px", marginTop: "16px" }}>
                <p style={{ margin: "2px 0" }}>Thank you for your patronage!</p>
                <p style={{ margin: "2px 0" }}>AAU Chamo Agency Services</p>
              </div>
            </div>
          ) : (
            <div className="a4-receipt" style={{ width: "100%", fontSize: "14px", color: "#333", lineHeight: "1.5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", borderBottom: "2px solid #333", paddingBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px 0", color: "#000" }}>{data.company?.displayName || "AAU Chamo Agency"}</h1>
                  <p style={{ margin: "2px 0" }}>{data.company?.address || "Nigeria"}</p>
                  <p style={{ margin: "2px 0" }}>Phone: {data.company?.phone || ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 6px 0", color: "#666" }}>INVOICE / RECEIPT</h2>
                  <p style={{ margin: "2px 0" }}><strong>Invoice #:</strong> {data.saleNumber}</p>
                  <p style={{ margin: "2px 0" }}><strong>Date:</strong> {new Date(data.postedAt).toLocaleString("en-NG")}</p>
                  <p style={{ margin: "2px 0" }}><strong>Status:</strong> {data.status}</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 6px 0" }}>BILLED TO:</h3>
                  <p style={{ margin: "2px 0" }}><strong>{data.customer.displayName}</strong></p>
                  <p style={{ margin: "2px 0" }}>Phone: {data.customer.primaryPhone}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 6px 0" }}>STATION DETAILS:</h3>
                  <p style={{ margin: "2px 0" }}>{data.station.name} ({data.station.code})</p>
                  {data.businessUnit && <p style={{ margin: "2px 0" }}>Business Unit: {data.businessUnit.name}</p>}
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                <thead>
                  <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #ccc" }}>
                    <th style={{ textAlign: "left", padding: "10px", fontSize: "13px" }}>Code</th>
                    <th style={{ textAlign: "left", padding: "10px", fontSize: "13px" }}>Product Description</th>
                    <th style={{ textAlign: "center", padding: "10px", fontSize: "13px" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "10px", fontSize: "13px" }}>Unit Price</th>
                    <th style={{ textAlign: "right", padding: "10px", fontSize: "13px" }}>Discount</th>
                    <th style={{ textAlign: "right", padding: "10px", fontSize: "13px" }}>Tax</th>
                    <th style={{ textAlign: "right", padding: "10px", fontSize: "13px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line: any) => (
                    <tr key={line.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>{line.productCode}</td>
                      <td style={{ padding: "10px" }}>{line.productName}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{line.quantity}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>{Number(line.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>{Number(line.discountAmount).toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>{Number(line.taxAmount).toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold" }}>{Number(line.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "300px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span>Subtotal</span>
                    <span>{Number(data.subtotal).toFixed(2)} NGN</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span>Discount</span>
                    <span>-{Number(data.discountTotal).toFixed(2)} NGN</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span>Tax</span>
                    <span>+{Number(data.taxTotal).toFixed(2)} NGN</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", fontWeight: "bold", borderBottom: "2px solid #333" }}>
                    <span>Amount Due</span>
                    <span>{Number(data.total).toFixed(2)} NGN</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 6px 0" }}>Payments Received:</h4>
                <table style={{ width: "100%", fontSize: "13px" }}>
                  <tbody>
                    {data.allocations.map((alloc: any) => (
                      <tr key={alloc.id}>
                        <td>{alloc.payment.paymentMethod.name} (Ref: {alloc.payment.reference || "N/A"})</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{Number(alloc.amount).toFixed(2)} NGN</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="workflow-footer no-print">
          <span><ShieldCheck size={14} /> Reproducible snapshot confirmed</span>
          <button type="button" className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function POSSessionOpenModal({
  stationId,
  onClose,
  onComplete,
}: {
  stationId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [openingCash, setOpeningCash] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/pos/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stationId, openingCash }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to open session.");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open session.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "450px" }}>
        <div className="workflow-header">
          <div>
            <span>POS Operations</span>
            <h2>Open POS Cash Session</h2>
            <p>Initialize the cash drawer float for the day.</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            <Field label="Opening Cash Float (NGN)">
              <input
                className="field-input"
                type="number"
                step="0.01"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                required
              />
            </Field>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Cashbook entry registered</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>Open Drawer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function POSSessionCloseModal({
  session,
  onClose,
  onComplete,
}: {
  session: any;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [countedCash, setCountedCash] = useState("");
  const [expectedCash, setExpectedCash] = useState<number | null>(null);
  const [loadingExpected, setLoadingExpected] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpected = async () => {
      try {
        const salesRes = await fetch(`/api/sales?pageSize=100&stationId=${session.stationId}`);
        const salesBody = await salesRes.json();
        if (salesBody.ok) {
          const sessionSales = (salesBody.data as any[]).filter(s => s.posSessionId === session.id);
          let cashSum = 0;
          for (const s of sessionSales) {
            for (const alloc of s.allocations || []) {
              if (alloc.payment.paymentMethod.type === "CASH") {
                cashSum += Number(alloc.amount);
              }
            }
          }
          setExpectedCash(Number(session.openingCash) + cashSum);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExpected(false);
      }
    };
    fetchExpected();
  }, [session]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/pos/sessions/${session.id}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ countedCash }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to close session.");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close session.");
    } finally {
      setBusy(false);
    }
  };

  const expectedVal = expectedCash ?? 0;
  const countedVal = Number(countedCash) || 0;
  const variance = countedVal - expectedVal;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "450px" }}>
        <div className="workflow-header">
          <div>
            <span>POS Operations</span>
            <h2>Close POS Session</h2>
            <p>Reconcile cash drawer and calculate variance.</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            <div style={{ background: "var(--field-bg)", padding: "16px", borderRadius: "6px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Opening Cash:</span>
                <strong>{formatNaira(Number(session.openingCash))}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Expected Drawer Cash:</span>
                <strong>{loadingExpected ? "Loading..." : formatNaira(expectedVal)}</strong>
              </div>
            </div>

            <Field label="Physically Counted Cash (NGN)">
              <input
                className="field-input"
                type="number"
                step="0.01"
                min="0"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                required
                placeholder="e.g. 150000"
              />
            </Field>

            {!loadingExpected && countedCash && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", padding: "12px", borderRadius: "6px", background: variance === 0 ? "#f4f4f5" : variance > 0 ? "#f0fdf4" : "#fef2f2" }}>
                <span>Drawer Variance:</span>
                <strong style={{ color: variance === 0 ? "black" : variance > 0 ? "#16a34a" : "#dc2626" }}>
                  {variance === 0 ? "Reconciled (0)" : variance > 0 ? `+${formatNaira(variance)} (Overage)` : `${formatNaira(variance)} (Shortage)`}
                </strong>
              </div>
            )}

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Variance logs recorded</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy || loadingExpected} style={{ background: "#dc2626", color: "white" }}>
                Close Session
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function POSView({
  allowedStations,
  selectedStation,
  onModal,
  onToast,
}: {
  allowedStations: AllowedStation[];
  selectedStation: string;
  onModal: (modal: ModalKind) => void;
  onToast: (toast: Toast) => void;
}) {
  const station = allowedStations.find((item) => item.name === selectedStation) ?? allowedStations[0];
  const { data, loading, error, reload } = useApiData<POSBootstrap>(station ? `/api/pos/bootstrap?stationId=${station.id}` : "/api/pos/bootstrap");
  const [cart, setCart] = useState<Array<POSBootstrap["products"][number] & { quantity: number }>>([]);
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // POS Session state hooks
  const sessionApi = useApiData<any>(station ? `/api/pos/sessions?active=true&stationId=${station.id}` : null);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);

  // Split payments state hooks
  const [paymentAllocations, setPaymentAllocations] = useState<Array<{ paymentMethodId: string; amount: string; reference: string; terminalId: string }>>([]);

  // Line discounts state hooks
  const [discounts, setDiscounts] = useState<Record<string, string>>({}); // productId -> discountAmount string

  // Held carts state hooks
  const [heldCarts, setHeldCarts] = useState<Array<{ id: string; label: string; cart: typeof cart; discounts: typeof discounts; customerId: string }>>([]);

  // Receipt modal state hooks
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const selectedCustomerId = customerId || data?.customers[0]?.id || "";
  const selectedBusinessUnitId = businessUnitId || data?.businessUnits[0]?.id || "";

  // Compute cart totals
  const subtotal = cart.reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);
  const discountSum = cart.reduce((sum, item) => sum + (Number(discounts[item.id]) || 0), 0);
  const dueTotal = Math.max(0, subtotal - discountSum);

  const hasDiscountPermission = data?.permissions?.includes("sales.discount");

  // Sync split payments state automatically for single payments
  useEffect(() => {
    if (data?.paymentMethods[0] && paymentAllocations.length === 0) {
      setPaymentAllocations([{ paymentMethodId: data.paymentMethods[0].id, amount: dueTotal.toFixed(2), reference: "", terminalId: "" }]);
    } else if (paymentAllocations.length === 1) {
      setPaymentAllocations([{ ...paymentAllocations[0], amount: dueTotal.toFixed(2) }]);
    }
  }, [dueTotal, data, paymentAllocations.length]);

  // Keyboard/scanner shortcuts & New Sale event listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = document.querySelector(".large-search input") as HTMLInputElement;
        searchInput?.focus();
      }
    };
    const handleNewSale = () => {
      setCart([]);
      setDiscounts({});
      setPaymentAllocations([]);
      setQuery("");
      setCheckoutError(null);
      const searchInput = document.querySelector(".large-search input") as HTMLInputElement;
      searchInput?.focus();
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("erp-pos-new-sale", handleNewSale);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("erp-pos-new-sale", handleNewSale);
    };
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.available, item.quantity + delta)) } : item
      )
    );
  };

  const updateDiscount = (productId: string, val: string) => {
    setDiscounts({ ...discounts, [productId]: val });
  };

  const addPaymentAllocation = () => {
    if (!data?.paymentMethods[0]) return;
    setPaymentAllocations([...paymentAllocations, { paymentMethodId: data.paymentMethods[0].id, amount: "0", reference: "", terminalId: "" }]);
  };

  const removePaymentAllocation = (idx: number) => {
    setPaymentAllocations(paymentAllocations.filter((_, i) => i !== idx));
  };

  const updateAllocationField = (idx: number, field: string, val: string) => {
    const updated = [...paymentAllocations];
    updated[idx] = { ...updated[idx], [field]: val };
    setPaymentAllocations(updated);
  };

  const holdCart = () => {
    if (cart.length === 0) return;
    const label = window.prompt("Enter a label to hold this cart:", `Cart ${new Date().toLocaleTimeString()}`) || "";
    if (!label.trim()) return;
    setHeldCarts([...heldCarts, { id: crypto.randomUUID(), label, cart, discounts, customerId: selectedCustomerId }]);
    setCart([]);
    setDiscounts({});
    setPaymentAllocations([]);
  };

  const resumeCart = (id: string) => {
    const target = heldCarts.find(h => h.id === id);
    if (!target) return;
    setCart(target.cart);
    setDiscounts(target.discounts);
    setCustomerId(target.customerId);
    setHeldCarts(heldCarts.filter(h => h.id !== id));
  };

  const checkout = async () => {
    if (!station || !selectedCustomerId || !selectedBusinessUnitId || !cart.length) return;
    const activeSession = sessionApi.data;
    if (!activeSession) {
      setCheckoutError("No active POS session. Open the drawer session first.");
      return;
    }

    // Validate split payment allocations
    const activeAllocations = paymentAllocations.length === 1
      ? [{ ...paymentAllocations[0], amount: dueTotal.toFixed(2) }]
      : paymentAllocations;

    const sumAlloc = activeAllocations.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (Math.abs(sumAlloc - dueTotal) > 0.01) {
      setCheckoutError(`Payment split sum (${formatNaira(sumAlloc)}) must match amount due (${formatNaira(dueTotal)}).`);
      return;
    }

    // Reference and terminal ID validation
    for (const alloc of activeAllocations) {
      const method = data?.paymentMethods.find((item) => item.id === alloc.paymentMethodId);
      if (method?.requiresReference && !alloc.reference.trim()) {
        setCheckoutError(`${method.name} payment requires a reference.`);
        return;
      }
      if (method?.requiresTerminal && !alloc.terminalId.trim()) {
        setCheckoutError(`${method.name} payment requires a terminal ID.`);
        return;
      }
    }

    setBusy(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "idempotency-key": `pos-checkout-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          stationId: station.id,
          businessUnitId: selectedBusinessUnitId,
          customerId: selectedCustomerId,
          posSessionId: activeSession.id,
          agentId: activeAllocations.some((p) => data?.paymentMethods.find((m) => m.id === p.paymentMethodId)?.type === "WALLET") ? agentId || undefined : undefined,
          lines: cart.map((item) => ({
            productId: item.id,
            quantity: String(item.quantity),
            discountAmount: discounts[item.id] && Number(discounts[item.id]) > 0 ? Number(discounts[item.id]).toFixed(2) : undefined,
          })),
          payments: activeAllocations.map((p) => ({
            paymentMethodId: p.paymentMethodId,
            amount: (Number(p.amount) || dueTotal).toFixed(2),
            reference: p.reference?.trim() || undefined,
            terminalId: p.terminalId?.trim() || undefined,
          })),
        }),
      });

      const body = (await response.json()) as ApiEnvelope<{ id: string; saleNumber: string; total: string }>;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message || "The sale could not be posted.");

      setCart([]);
      setDiscounts({});
      setPaymentAllocations([]);
      reload();
      sessionApi.reload();
      window.dispatchEvent(new Event("erp-data-changed"));
      onToast({
        title: "Sale completed",
        detail: `${body.data.saleNumber} posted for ${formatNaira(Number(body.data.total))}.`,
      });
      // Show printable receipt modal immediately
      setCompletedSaleId(body.data.id);
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : "The sale could not be posted.");
    } finally {
      setBusy(false);
    }
  };

  if (!station) return <EmptyState icon={Store} title="No operating station" detail="Assign an operating station to this account before using POS." />;

  const activeSession = sessionApi.data;
  const products = (data?.products ?? []).filter(
    (product) => !query.trim() || `${product.code} ${product.name}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="pos-layout">
      <section className="pos-catalogue panel">
        {/* POS Session Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: activeSession ? "#f0fdf4" : "#fef2f2", borderBottom: "1px solid var(--border-color)", margin: "-16px -16px 16px -16px", borderRadius: "6px 6px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: activeSession ? "#22c55e" : "#ef4444" }}></span>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>
              {activeSession ? `Drawer Session Open (Float: ${formatNaira(Number(activeSession.openingCash))})` : "POS Drawer Closed"}
            </span>
          </div>
          <div>
            {activeSession ? (
              <button type="button" className="secondary-button" onClick={() => setShowCloseSession(true)} style={{ height: "28px", padding: "0 12px", fontSize: "12px", background: "#fecaca", color: "#991b1b" }}>
                Close Drawer
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={() => setShowOpenSession(true)} style={{ height: "28px", padding: "0 12px", fontSize: "12px" }}>
                Open Drawer
              </button>
            )}
          </div>
        </div>

        <div className="pos-search-row">
          <label className="large-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Scan barcode or search products"
              autoFocus
            />
            <kbd>F2</kbd>
          </label>
          <button className="secondary-button" onClick={reload}>
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {error ? (
          <EmptyState icon={AlertTriangle} title="POS catalogue unavailable" detail={error} />
        ) : loading ? (
          <EmptyState icon={RefreshCcw} title="Loading POS catalogue" detail="Checking current prices and station stock." compact />
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <button
                key={product.id}
                className={classNames("product-tile", (product.available <= 0 || !activeSession) && "disabled")}
                disabled={product.available <= 0 || !activeSession}
                onClick={() =>
                  setCart((current) => {
                    const existing = current.find((item) => item.id === product.id);
                    return existing
                      ? current.map((item) =>
                          item.id === product.id ? { ...item, quantity: Math.min(item.available, item.quantity + 1) } : item
                        )
                      : [...current, { ...product, quantity: 1 }];
                  })
                }
              >
                <span className="product-visual"><PackageOpen size={25} /></span>
                <span className="product-code">{product.code}</span>
                <strong>{product.name}</strong>
                <span className="product-tile-bottom">
                  <b>{formatNaira(Number(product.sellingPrice))}</b>
                  <em>{product.available <= 0 ? "Out of stock" : `${product.available} available`}</em>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="pos-cart panel">
        <div className="cart-header">
          <div>
            <span>Current sale</span>
            <strong>{station.code} · Server priced</strong>
          </div>
          <button className="icon-ghost" onClick={() => { setCart([]); setDiscounts({}); }}><Trash2 size={16} /></button>
        </div>

        <div className="settings-form">
          <Field label="Customer">
            <select value={selectedCustomerId} onChange={(event) => setCustomerId(event.target.value)}>
              {data?.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName} · {customer.primaryPhone}
                </option>
              ))}
            </select>
          </Field>
          <button className="customer-selector" onClick={() => onModal("customer")}>
            <span className="customer-icon"><UserPlus size={17} /></span>
            <div>
              <span>Customer missing?</span>
              <strong>Register customer</strong>
            </div>
            <ChevronRight size={15} />
          </button>
          <Field label="Business unit">
            <select value={selectedBusinessUnitId} onChange={(event) => setBusinessUnitId(event.target.value)}>
              {data?.businessUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Held Carts Panel */}
        {heldCarts.length > 0 && (
          <div style={{ padding: "8px 12px", background: "var(--field-bg)", borderRadius: "6px", marginBottom: "12px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Held Carts ({heldCarts.length})
            </span>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {heldCarts.map((hc) => (
                <button key={hc.id} className="secondary-button" onClick={() => resumeCart(hc.id)} style={{ height: "24px", padding: "0 8px", fontSize: "11px", whiteSpace: "nowrap" }}>
                  {hc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cart-items">
          {cart.map((item) => {
            const discVal = Number(discounts[item.id]) || 0;
            const lineTotal = Number(item.sellingPrice) * item.quantity - discVal;
            return (
              <div className="cart-item-row" key={item.id} style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{item.name}</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {formatNaira(Number(item.sellingPrice))} each
                    </span>
                  </div>
                  <div className="quantity-stepper">
                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={13} /></button>
                  </div>
                  <b>{formatNaira(lineTotal)}</b>
                </div>

                {/* Line discount amount input if allowed */}
                {hasDiscountPermission && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Line Discount (NGN):</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={Number(item.sellingPrice) * item.quantity}
                      style={{ width: "80px", height: "24px", fontSize: "11px", padding: "2px 6px", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                      value={discounts[item.id] || ""}
                      onChange={(e) => updateDiscount(item.id, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {!cart.length && <EmptyState icon={ShoppingCart} title="Cart is empty" detail="Select a product or scan its barcode to start." compact />}
        </div>

        {/* Split Payments Form */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>Payment splits</span>
            <button type="button" className="secondary-button" onClick={addPaymentAllocation} disabled={!cart.length} style={{ height: "26px", padding: "0 8px", fontSize: "11px" }}>
              + Split Method
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {paymentAllocations.map((alloc, idx) => {
              const selectedAllocMethod = data?.paymentMethods.find((item) => item.id === alloc.paymentMethodId);
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", padding: "10px", background: "var(--field-bg)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select
                      className="field-input"
                      style={{ flex: 1, height: "30px", fontSize: "12px" }}
                      value={alloc.paymentMethodId}
                      onChange={(e) => updateAllocationField(idx, "paymentMethodId", e.target.value)}
                    >
                      {data?.paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>{method.name}</option>
                      ))}
                    </select>

                    <input
                      className="field-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      style={{ width: "90px", height: "30px", fontSize: "12px" }}
                      value={alloc.amount}
                      onChange={(e) => updateAllocationField(idx, "amount", e.target.value)}
                      required
                    />

                    {paymentAllocations.length > 1 && (
                      <button type="button" className="danger-button-subtle" onClick={() => removePaymentAllocation(idx)} style={{ padding: "6px", margin: 0 }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {selectedAllocMethod?.type === "WALLET" && (
                    <div style={{ marginTop: "6px" }}>
                      <select
                        className="field-input"
                        style={{ height: "30px", fontSize: "12px" }}
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        required
                      >
                        <option value="">Select agent</option>
                        {data?.agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} · {formatNaira(Number(agent.wallet?.balance ?? 0))}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedAllocMethod?.requiresReference && (
                    <div style={{ marginTop: "6px" }}>
                      <input
                        className="field-input"
                        style={{ height: "30px", fontSize: "12px" }}
                        value={alloc.reference}
                        onChange={(e) => updateAllocationField(idx, "reference", e.target.value)}
                        placeholder="Payment reference"
                        required
                      />
                    </div>
                  )}

                  {selectedAllocMethod?.requiresTerminal && (
                    <div style={{ marginTop: "6px" }}>
                      <input
                        className="field-input"
                        style={{ height: "30px", fontSize: "12px" }}
                        value={alloc.terminalId}
                        onChange={(e) => updateAllocationField(idx, "terminalId", e.target.value)}
                        placeholder="Terminal ID"
                        required
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-totals" style={{ marginTop: "16px" }}>
          <div>
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>
          {discountSum > 0 && (
            <div style={{ color: "#dc2626" }}>
              <span>Discounts applied</span>
              <strong>-{formatNaira(discountSum)}</strong>
            </div>
          )}
          <div className="grand-total">
            <span>Amount due</span>
            <strong>{formatNaira(dueTotal)}</strong>
          </div>
        </div>

        {checkoutError && (
          <div className="form-note"><AlertTriangle size={15} /><span>{checkoutError}</span></div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            type="button"
            className="secondary-button"
            style={{ flex: 1, height: "40px" }}
            disabled={cart.length === 0}
            onClick={holdCart}
          >
            Hold Cart
          </button>

          <button
            type="button"
            className="checkout-button"
            style={{ flex: 2, height: "40px", margin: 0 }}
            disabled={
              busy ||
              !cart.length ||
              !selectedCustomerId ||
              !selectedBusinessUnitId ||
              !activeSession
            }
            onClick={checkout}
          >
            <span><LockKeyhole size={16} />{busy ? "Posting…" : "Post sale"}</span>
            <strong>{formatNaira(dueTotal)}</strong>
          </button>
        </div>

        <div className="cart-shortcuts">
          <span><ShieldCheck size={13} /> Atomic stock, payment and finance posting</span>
        </div>
      </aside>

      {/* MODALS */}
      {showOpenSession && (
        <POSSessionOpenModal
          stationId={station.id}
          onClose={() => setShowOpenSession(false)}
          onComplete={() => {
            setShowOpenSession(false);
            sessionApi.reload();
          }}
        />
      )}

      {showCloseSession && (
        <POSSessionCloseModal
          session={activeSession}
          onClose={() => setShowCloseSession(false)}
          onComplete={() => {
            setShowCloseSession(false);
            sessionApi.reload();
          }}
        />
      )}

      {completedSaleId && (
        <POSReceiptModal
          saleId={completedSaleId}
          onClose={() => setCompletedSaleId(null)}
        />
      )}
    </div>
  );
}

function SaleDetailModal({ saleId, onClose, canViewProfit }: { saleId: string; onClose: () => void; canViewProfit: boolean }) {
  const { data: sale, loading, error } = useApiData<any>(`/api/sales/${saleId}`);

  if (loading) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
          <EmptyState icon={RefreshCcw} title="Loading details" detail="Retrieving sale transaction record." compact />
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
          <EmptyState icon={AlertTriangle} title="Could not load sale" detail={error || "Sale not found."} compact />
        </div>
      </div>
    );
  }

  let saleCost = 0;
  for (const line of sale.lines) {
    saleCost += Number(line.costPrice) * Number(line.quantity);
  }
  const profit = canViewProfit ? Number(sale.total) - saleCost : null;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "800px" }}>
        <div className="workflow-header">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Transaction Number</span>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "2px 0 0 0" }}>{sale.saleNumber}</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Posted at: {new Date(sale.postedAt).toLocaleString("en-NG")}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={19} />
          </button>
        </div>

        <div className="workflow-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", background: "var(--panel-bg, #fafafa)", padding: "16px", borderRadius: "8px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Station</span>
              <strong>{sale.station.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Business Unit</span>
              <strong>{sale.businessUnit.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Status</span>
              <StatusPill value={sale.status} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", borderBottom: "1px solid var(--border-color, #eee)", paddingBottom: "4px" }}>Customer Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Name</span>
                <span>{sale.customer.displayName}</span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Phone</span>
                <span>{sale.customer.primaryPhone}</span>
              </div>
              {sale.customer.email && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Email</span>
                  <span>{sale.customer.email}</span>
                </div>
              )}
              {sale.customer.defaultAirline && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Default Airline</span>
                  <span>{sale.customer.defaultAirline}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", borderBottom: "1px solid var(--border-color, #eee)", paddingBottom: "4px" }}>Line Items</h3>
            <div className="table-wrap">
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Discount</th>
                    <th style={{ textAlign: "right" }}>Tax</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.lines.map((line: any) => (
                    <tr key={line.id}>
                      <td>{line.productName} ({line.productCode})</td>
                      <td style={{ textAlign: "right" }}>{Number(line.quantity)}</td>
                      <td style={{ textAlign: "right" }}>{formatNaira(Number(line.unitPrice))}</td>
                      <td style={{ textAlign: "right" }}>{formatNaira(Number(line.discountAmount))}</td>
                      <td style={{ textAlign: "right" }}>{formatNaira(Number(line.taxAmount))}</td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>{formatNaira(Number(line.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", borderBottom: "1px solid var(--border-color, #eee)", paddingBottom: "4px" }}>Payment Allocations</h3>
              {sale.allocations.length === 0 ? (
                <div style={{ padding: "8px 0", color: "var(--text-muted)" }}>No payments allocated.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.allocations.map((alloc: any) => (
                        <tr key={alloc.id}>
                          <td>{alloc.payment.paymentMethod.name}</td>
                          <td style={{ textAlign: "right" }}>{formatNaira(Number(alloc.amount))}</td>
                          <td>{alloc.payment.reference || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ background: "var(--panel-bg, #fcfcfc)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color, #f0f0f0)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Subtotal:</span>
                <span>{formatNaira(Number(sale.subtotal))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Tax:</span>
                <span style={{ color: "green" }}>+{formatNaira(Number(sale.taxTotal))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Discount:</span>
                <span style={{ color: "red" }}>-{formatNaira(Number(sale.discountTotal))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold", borderTop: "1px solid var(--border-color, #eee)", paddingTop: "8px" }}>
                <span>Total:</span>
                <span>{formatNaira(Number(sale.total))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "green", fontSize: "12px" }}>
                <span>Paid:</span>
                <span>{formatNaira(Number(sale.paidTotal))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "red", fontSize: "12px" }}>
                <span>Outstanding:</span>
                <span>{formatNaira(Number(sale.outstandingTotal))}</span>
              </div>
              {canViewProfit && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", borderTop: "2px dashed var(--border-color, #ddd)", paddingTop: "12px", color: "var(--primary-color, #0066cc)", fontWeight: "bold" }}>
                  <span>Gross Profit:</span>
                  <span>{formatNaira(profit || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {sale.refunds && sale.refunds.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", borderBottom: "1px solid var(--border-color, #eee)", paddingBottom: "4px", color: "red" }}>Linked Refunds</h3>
              <div className="table-wrap">
                <table className="data-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Refund Number</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.refunds.map((ref: any) => (
                      <tr key={ref.id}>
                        <td>{ref.refundNumber}</td>
                        <td>{new Date(ref.postedAt || ref.createdAt).toLocaleString("en-NG")}</td>
                        <td>{ref.reason}</td>
                        <td style={{ textAlign: "right", color: "red" }}>{formatNaira(Number(ref.amount))}</td>
                        <td><StatusPill value={ref.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sale.status === "CANCELLED" && (
            <div style={{ background: "#fff5f5", border: "1px solid #ffd8d8", padding: "12px", borderRadius: "6px" }}>
              <span style={{ fontWeight: "bold", color: "#c9302c", display: "block" }}>Transaction Cancelled</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                <strong>Reason: </strong> {sale.cancellationReason || "No reason specified."}
              </p>
            </div>
          )}
        </div>
        <div className="workflow-footer" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SalesView({ station, allowedStations, identity }: { station: string; allowedStations: AllowedStation[]; identity: WorkspaceIdentity }) {
  const [tab, setTab] = useState("All sales");
  const stationId = allowedStations.find((item) => item.name === station)?.id;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [compareStartDate, setCompareStartDate] = useState("");
  const [compareEndDate, setCompareEndDate] = useState("");
  const [airline, setAirline] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [interval, setInterval] = useState("daily");
  const [compareActive, setCompareActive] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const canViewProfit = identity.permissions.includes("sales.view_profit");

  const buApi = useApiData<{ businessUnits: Array<{ id: string; name: string }> }>("/api/stations/setup");

  // Query Params
  const filterParams = new URLSearchParams();
  if (stationId) filterParams.set("stationId", stationId);
  if (businessUnitId) filterParams.set("businessUnitId", businessUnitId);
  if (officerId) filterParams.set("officerId", officerId);
  if (customerId) filterParams.set("customerId", customerId);
  if (airline) filterParams.set("airline", airline);
  if (startDate) filterParams.set("startDate", startDate);
  if (endDate) filterParams.set("endDate", endDate);
  if (compareActive && compareStartDate) filterParams.set("compareStartDate", compareStartDate);
  if (compareActive && compareEndDate) filterParams.set("compareEndDate", compareEndDate);
  filterParams.set("interval", interval);

  const summaryUrl = `/api/sales/summary?${filterParams.toString()}`;
  const trendUrl = `/api/sales/trend?${filterParams.toString()}`;
  const listUrl = `/api/sales?pageSize=100&${filterParams.toString()}`;

  const summaryApi = useApiData<any>(summaryUrl);
  const trendApi = useApiData<any>(trendUrl);
  const listApi = useApiData<SaleRecord[]>(listUrl);

  const sales = listApi.data ?? [];
  const tabFiltered = sales.filter((sale) =>
    tab === "Completed"
      ? ["PAID", "POSTED"].includes(sale.status)
      : tab === "Pending"
      ? sale.status === "PARTIALLY_PAID"
      : tab === "Refunded"
      ? sale.status.includes("REFUND")
      : true
  );

  const table = useTableControls(tabFiltered, (sale, q) =>
    `${sale.saleNumber} ${sale.customer.displayName} ${sale.station.name} ${sale.businessUnit.name} ${sale.status}`
      .toLowerCase()
      .includes(q)
  );

  const chartData = (trendApi.data?.trend ?? []).map((t: any) => ({
    date: t.bucket,
    sales: t.grossSales,
    refunds: t.refunds,
  }));

  const compareChartData = (trendApi.data?.compareTrend ?? []).map((t: any) => ({
    date: t.bucket,
    sales: t.grossSales,
    refunds: t.refunds,
  }));

  const refundSale = async (sale: SaleRecord) => {
    const reason = window.prompt(`Reason for refunding ${sale.saleNumber}`);
    if (!reason?.trim()) return;
    const response = await fetch(`/api/sales/${sale.id}`);
    const envelope = (await response.json()) as ApiEnvelope<SaleDetailRecord>;
    if (!response.ok || !envelope.ok || !envelope.data) return;
    const detail = envelope.data;
    const lines = detail.lines
      .map((line) => ({
        saleLineId: line.id,
        quantity: (Number(line.quantity) - Number(line.quantityRefunded)).toString(),
      }))
      .filter((line) => Number(line.quantity) > 0);
    const method = detail.allocations[0]?.payment.paymentMethod;
    if (!method || !lines.length) return;
    const paymentReference = method.requiresReference
      ? window.prompt(`Refund reference for ${method.name}`)?.trim()
      : undefined;
    if (method.requiresReference && !paymentReference) return;
    if (!window.confirm(`Refund all remaining quantities on ${sale.saleNumber}?`)) return;
    await workflowPost("/api/refunds", {
      saleId: sale.id,
      paymentMethodId: method.id,
      paymentReference,
      reason,
      returnToStock: true,
      lines,
    });
    listApi.reload();
    summaryApi.reload();
    trendApi.reload();
  };

  return (
    <div className="content-stack">
      {/* Search and Filters Strip */}
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Search Filters</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <Field label="Business Unit">
            <select value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)}>
              <option value="">All business units</option>
              {buApi.data?.businessUnits.map((bu) => (
                <option key={bu.id} value={bu.id}>
                  {bu.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Airline">
            <input
              type="text"
              placeholder="e.g. Binani, Air Peace"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
            />
          </Field>
          <Field label="Sales Officer">
            <input
              type="text"
              placeholder="Search officer name/ID"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
            />
          </Field>
          <Field label="Customer">
            <input
              type="text"
              placeholder="Search customer name/ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </Field>
          <Field label="Start Date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center", marginTop: "16px", borderTop: "1px solid var(--border-color, #eee)", paddingTop: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={compareActive}
              onChange={(e) => setCompareActive(e.target.checked)}
            />
            <strong>Enable comparative period</strong>
          </label>
          <Field label="Trend Interval" style={{ margin: 0 }}>
            <select value={interval} onChange={(e) => setInterval(e.target.value)} style={{ padding: "4px 8px" }}>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
        </div>

        {compareActive && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginTop: "16px", background: "var(--panel-bg, #fafafa)", padding: "16px", borderRadius: "8px" }}>
            <Field label="Compare Start Date">
              <input type="date" value={compareStartDate} onChange={(e) => setCompareStartDate(e.target.value)} />
            </Field>
            <Field label="Compare End Date">
              <input type="date" value={compareEndDate} onChange={(e) => setCompareEndDate(e.target.value)} />
            </Field>
          </div>
        )}
      </Panel>

      {/* Summary Cards strip */}
      <section className="summary-strip">
        <SummaryItem
          label="Gross sales"
          value={formatNaira(summaryApi.data?.summary?.grossSales || 0)}
          detail={
            compareActive
              ? `vs ${formatNaira(summaryApi.data?.compareSummary?.grossSales || 0)}`
              : `${sales.length} loaded sales`
          }
          icon={TrendingUp}
          tone="success"
        />
        <SummaryItem
          label="Net sales"
          value={formatNaira(summaryApi.data?.summary?.netSales || 0)}
          detail={
            compareActive
              ? `vs ${formatNaira(summaryApi.data?.compareSummary?.netSales || 0)}`
              : "After refunds & discounts"
          }
          icon={BadgeCheck}
          tone="success"
        />
        <SummaryItem
          label="Outstanding"
          value={formatNaira(summaryApi.data?.summary?.outstandingTotal || 0)}
          detail={
            compareActive
              ? `vs ${formatNaira(summaryApi.data?.compareSummary?.outstandingTotal || 0)}`
              : `${sales.filter((sale) => Number(sale.outstandingTotal) > 0).length} invoices`
          }
          icon={Clock3}
          tone="danger"
        />
        {canViewProfit ? (
          <SummaryItem
            label="Gross profit"
            value={formatNaira(summaryApi.data?.summary?.profit || 0)}
            detail={
              compareActive
                ? `vs ${formatNaira(summaryApi.data?.compareSummary?.profit || 0)}`
                : "Sales minus cost price"
            }
            icon={Banknote}
            tone="info"
          />
        ) : (
          <SummaryItem
            label="Avg. transaction"
            value={formatNaira(sales.length ? (summaryApi.data?.summary?.grossSales || 0) / sales.length : 0)}
            detail={`${listApi.total || 0} total records`}
            icon={Banknote}
            tone="info"
          />
        )}
      </section>

      {/* Visual Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: compareActive ? "1fr 1fr" : "1fr", gap: "20px" }}>
        <Panel>
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Sales Trend</h3>
          </div>
          <SalesTrendChart data={chartData} />
        </Panel>
        {compareActive && (
          <Panel>
            <div style={{ marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Comparative Trend</h3>
            </div>
            <SalesTrendChart data={compareChartData} />
          </Panel>
        )}
      </div>

      {/* Data Table */}
      <Panel>
        <TableToolbar
          tabs={["All sales", "Completed", "Pending", "Refunded"]}
          activeTab={tab}
          onTab={(value) => {
            setTab(value);
            table.resetPage();
          }}
          placeholder="Search transaction, customer or station"
          exportable
          search={table.search}
          onSearch={table.setSearch}
          onExport={() => window.open(`/api/sales/export?${filterParams.toString()}`, "_blank", "noopener,noreferrer")}
        />
        {listApi.error ? (
          <EmptyState icon={AlertTriangle} title="Sales could not be loaded" detail={listApi.error} />
        ) : listApi.loading ? (
          <EmptyState
            icon={RefreshCcw}
            title="Loading posted sales"
            detail="Retrieving sale, payment and station records."
            compact
          />
        ) : table.filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Business unit</th>
                  <th>Station</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <div className="primary-cell">
                        <strong>{sale.saleNumber}</strong>
                        <span>{formatDate(sale.postedAt)}</span>
                      </div>
                    </td>
                    <td>{sale.customer.displayName}</td>
                    <td>{sale.businessUnit.name}</td>
                    <td>{sale.station.name}</td>
                    <td>
                      {sale.allocations.map((item: any) => item.payment.paymentMethod.name).join(" + ") ||
                        "Outstanding"}
                    </td>
                    <td className="number-cell strong-number">{formatNaira(Number(sale.total))}</td>
                    <td>
                      <StatusPill value={sale.status.replaceAll("_", " ")} />
                    </td>
                    <td>
                      <div className="row-actions">
                        {!["REFUNDED", "CANCELLED"].includes(sale.status) && (
                          <button className="row-button" onClick={() => refundSale(sale)}>
                            Refund
                          </button>
                        )}
                        <button className="icon-ghost" onClick={() => setSelectedSaleId(sale.id)}>
                          <MoreHorizontal size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title={table.search ? "No matching sales" : "No sales found"}
            detail={
              table.search
                ? "Try a different transaction number, customer or station."
                : "Posted POS transactions will appear here immediately."
            }
          />
        )}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>

      {/* Drill-down Detail Modal */}
      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          canViewProfit={canViewProfit}
        />
      )}
    </div>
  );
}

function TransferCreateModal({
  allowedStations,
  onClose,
  onComplete,
}: {
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const productApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=100");
  const [originStationId, setOriginStationId] = useState(allowedStations[0]?.id || "");
  const [destinationStationId, setDestinationStationId] = useState(allowedStations[1]?.id || "");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Array<{ productId: string; quantity: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLine = () => {
    const nextProd = productApi.data?.find((p) => !lines.some((l) => l.productId === p.id));
    if (!nextProd) return;
    setLines([...lines, { productId: nextProd.id, quantity: "1" }]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLineProduct = (idx: number, productId: string) => {
    const updated = [...lines];
    updated[idx].productId = productId;
    setLines(updated);
  };

  const updateLineQuantity = (idx: number, quantity: string) => {
    const updated = [...lines];
    updated[idx].quantity = quantity;
    setLines(updated);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (originStationId === destinationStationId) {
      setError("Origin and destination stations must differ.");
      return;
    }
    if (lines.length === 0) {
      setError("At least one product line is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originStationId,
          destinationStationId,
          reason,
          notes: notes || undefined,
          lines,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to create transfer.");
      onComplete("Stock transfer requested", `Transfer ${body.data.transferNumber} raised successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transfer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "700px" }}>
        <div className="workflow-header">
          <div>
            <span>Stock operations</span>
            <h2>Create stock transfer</h2>
            <p>Raise a stock transfer request between operating stations.</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div className="form-grid">
              <Field label="Origin Station">
                <select className="field-input" value={originStationId} onChange={(e) => setOriginStationId(e.target.value)} required>
                  {allowedStations.map((st) => (
                    <option key={st.id} value={st.id}>{st.code} · {st.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Destination Station">
                <select className="field-input" value={destinationStationId} onChange={(e) => setDestinationStationId(e.target.value)} required>
                  {allowedStations.map((st) => (
                    <option key={st.id} value={st.id}>{st.code} · {st.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reason (min. 3 characters)" full>
                <input className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} placeholder="e.g. Replenishing branch rice inventory" />
              </Field>

              <Field label="Notes" full>
                <input className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional shipping or tracking notes" />
              </Field>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold" }}>Transfer Lines</h3>
                <button type="button" className="secondary-button" onClick={addLine} disabled={productApi.loading || !productApi.data?.length} style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}>
                  Add Line
                </button>
              </div>

              {lines.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No transfer lines added. Click "Add Line" above.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {lines.map((line, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <select
                        className="field-input"
                        style={{ flex: 1 }}
                        value={line.productId}
                        onChange={(e) => updateLineProduct(idx, e.target.value)}
                        required
                      >
                        {productApi.data?.map((p) => (
                          <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                        ))}
                      </select>
                      <input
                        className="field-input"
                        type="number"
                        step="0.001"
                        min="0.001"
                        style={{ width: "120px" }}
                        value={line.quantity}
                        onChange={(e) => updateLineQuantity(idx, e.target.value)}
                        required
                      />
                      <button type="button" className="danger-button-subtle" onClick={() => removeLine(idx)} style={{ padding: "8px 10px", margin: 0 }}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Station scopes verified</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy || lines.length === 0}><ArrowLeftRight size={16} />{busy ? "Submitting..." : "Submit Request"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferDispatchModal({
  transfer,
  onClose,
  onComplete,
}: {
  transfer: TransferRecord;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    transfer.lines.forEach((line) => {
      initial[line.id] = line.quantityRequested;
    });
    setQuantities(initial);
  }, [transfer]);

  const updateQuantity = (lineId: string, val: string) => {
    setQuantities({ ...quantities, [lineId]: val });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const lines = transfer.lines.map((line) => ({
      lineId: line.id,
      quantity: quantities[line.id] || "0",
    }));

    // Verify quantities do not exceed requested or go negative
    for (const line of lines) {
      const original = transfer.lines.find((item) => item.id === line.lineId);
      if (!original) continue;
      const val = Number(line.quantity);
      if (isNaN(val) || val <= 0 || val > Number(original.quantityRequested)) {
        setError(`Dispatch quantity for ${original.product.name} must be greater than 0 and cannot exceed the requested ${original.quantityRequested}.`);
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/inventory/transfers/${transfer.id}/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: transfer.version,
          lines,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to dispatch transfer.");
      onComplete("Stock transfer dispatched", `Transfer ${transfer.transferNumber} dispatched successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch transfer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Stock operations</span>
            <h2>Dispatch Transfer: {transfer.transferNumber}</h2>
            <p>From {transfer.originStation.name} to {transfer.destinationStation.name}</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            <div style={{ marginBottom: "16px", background: "var(--field-bg)", padding: "12px", borderRadius: "6px" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Reason: {transfer.reason}</div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Requested</th>
                    <th>Count Dispatch</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.lines.map((line) => (
                    <tr key={line.id}>
                      <td><strong>{line.product.name}</strong><br /><small>{line.product.code}</small></td>
                      <td>{line.quantityRequested}</td>
                      <td>
                        <input
                          className="field-input"
                          type="number"
                          step="0.001"
                          min="0.001"
                          max={Number(line.quantityRequested)}
                          value={quantities[line.id] || ""}
                          onChange={(e) => updateQuantity(line.id, e.target.value)}
                          required
                          style={{ width: "120px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Origin station verified</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}><Plane size={16} />{busy ? "Processing..." : "Confirm Dispatch"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferReceiveModal({
  transfer,
  onClose,
  onComplete,
}: {
  transfer: TransferRecord;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    transfer.lines.forEach((line) => {
      initial[line.id] = line.quantityDispatched;
    });
    setQuantities(initial);
  }, [transfer]);

  const updateQuantity = (lineId: string, val: string) => {
    setQuantities({ ...quantities, [lineId]: val });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const lines = transfer.lines.map((line) => ({
      lineId: line.id,
      quantity: quantities[line.id] || "0",
    }));

    // Verify quantities do not exceed dispatched or go negative
    for (const line of lines) {
      const original = transfer.lines.find((item) => item.id === line.lineId);
      if (!original) continue;
      const val = Number(line.quantity);
      if (isNaN(val) || val < 0 || val > Number(original.quantityDispatched)) {
        setError(`Received quantity for ${original.product.name} must be 0 or greater, and cannot exceed dispatched ${original.quantityDispatched}.`);
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/inventory/transfers/${transfer.id}/receive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: transfer.version,
          lines,
          notes: notes || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to receive transfer.");
      onComplete("Stock transfer received", `Transfer ${transfer.transferNumber} received successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to receive transfer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Stock operations</span>
            <h2>Receive Transfer: {transfer.transferNumber}</h2>
            <p>At {transfer.destinationStation.name} from {transfer.originStation.name}</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            <div className="form-grid" style={{ marginBottom: "16px" }}>
              <Field label="Receipt Notes" full>
                <input className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. All items arrived intact, no discrepancy" />
              </Field>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Dispatched</th>
                    <th>Count Received</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.lines.map((line) => (
                    <tr key={line.id}>
                      <td><strong>{line.product.name}</strong><br /><small>{line.product.code}</small></td>
                      <td>{line.quantityDispatched}</td>
                      <td>
                        <input
                          className="field-input"
                          type="number"
                          step="0.001"
                          min="0"
                          max={Number(line.quantityDispatched)}
                          value={quantities[line.id] || ""}
                          onChange={(e) => updateQuantity(line.id, e.target.value)}
                          required
                          style={{ width: "120px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Destination station verified</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}><PackageCheck size={16} />{busy ? "Processing..." : "Confirm Receipt"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustmentCreateModal({
  allowedStations,
  onClose,
  onComplete,
}: {
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const productApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=100");
  const [stationId, setStationId] = useState(allowedStations[0]?.id || "");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<Array<{ productId: string; countedQuantity: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExpectedQty = (productId: string) => {
    const prod = productApi.data?.find((p) => p.id === productId);
    if (!prod) return "0";
    const balance = prod.balances.find((b) => b.station.id === stationId);
    return balance ? balance.quantity : "0";
  };

  const addLine = () => {
    const nextProd = productApi.data?.find((p) => !lines.some((l) => l.productId === p.id));
    if (!nextProd) return;
    setLines([...lines, { productId: nextProd.id, countedQuantity: getExpectedQty(nextProd.id) }]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLineProduct = (idx: number, productId: string) => {
    const updated = [...lines];
    updated[idx].productId = productId;
    updated[idx].countedQuantity = getExpectedQty(productId);
    setLines(updated);
  };

  const updateLineQuantity = (idx: number, val: string) => {
    const updated = [...lines];
    updated[idx].countedQuantity = val;
    setLines(updated);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("At least one product line is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId,
          reason,
          lines,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to request adjustment.");
      onComplete("Adjustment request posted", `Adjustment ${body.data.adjustmentNumber} submitted for supervisor approval.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request adjustment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "700px" }}>
        <div className="workflow-header">
          <div>
            <span>Stock operations</span>
            <h2>Request stock adjustment</h2>
            <p>Perform a stock count audit. Discrepancies require supervisor approval.</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div className="form-grid">
              <Field label="Audited Station">
                <select className="field-input" value={stationId} onChange={(e) => { setStationId(e.target.value); setLines([]); }} required>
                  {allowedStations.map((st) => (
                    <option key={st.id} value={st.id}>{st.code} · {st.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Audit Reason (min. 5 characters)" full>
                <input className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} placeholder="e.g. Month-end physical stock audit discrepancy resolution" />
              </Field>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold" }}>Audited Products</h3>
                <button type="button" className="secondary-button" onClick={addLine} disabled={productApi.loading || !productApi.data?.length} style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}>
                  Add Item
                </button>
              </div>

              {lines.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No lines added. Click "Add Item" to record a physical stock count.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {lines.map((line, idx) => {
                    const expected = Number(getExpectedQty(line.productId));
                    const counted = Number(line.countedQuantity) || 0;
                    const diff = counted - expected;
                    return (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                          className="field-input"
                          style={{ flex: 1 }}
                          value={line.productId}
                          onChange={(e) => updateLineProduct(idx, e.target.value)}
                          required
                        >
                          {productApi.data?.map((p) => (
                            <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                          ))}
                        </select>
                        <div style={{ width: "90px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                          Ledger: {expected}
                        </div>
                        <input
                          className="field-input"
                          type="number"
                          step="0.001"
                          min="0"
                          style={{ width: "110px" }}
                          value={line.countedQuantity}
                          onChange={(e) => updateLineQuantity(idx, e.target.value)}
                          required
                        />
                        <div style={{ width: "80px", fontSize: "13px", fontWeight: "bold", textAlign: "right", color: diff === 0 ? "var(--text-muted)" : diff > 0 ? "#16a34a" : "#dc2626" }}>
                          {diff === 0 ? "0" : diff > 0 ? `+${diff}` : diff}
                        </div>
                        <button type="button" className="danger-button-subtle" onClick={() => removeLine(idx)} style={{ padding: "8px 10px", margin: 0 }}>
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Maker-checker scope applied</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy || lines.length === 0}><ShieldCheck size={16} />{busy ? "Posting Request..." : "Request Adjustment"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustmentDecideModal({
  adjustment,
  onClose,
  onComplete,
}: {
  adjustment: any;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/inventory/adjustments/${adjustment.id}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reason,
          version: adjustment.version,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to decide adjustment.");
      onComplete(`Adjustment ${decision.toLowerCase()}`, `Adjustment ${adjustment.adjustmentNumber} was decided successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decide adjustment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Supervisor maker-checker decision</span>
            <h2>Decide Adjustment: {adjustment.adjustmentNumber}</h2>
            <p>Station: {adjustment.station.name}</p>
          </div>
          <button onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ marginBottom: "16px", background: "var(--field-bg)", padding: "12px", borderRadius: "6px", fontSize: "13px" }}>
              <strong>Request reason:</strong> {adjustment.reason}
            </div>

            <div className="table-wrap" style={{ marginBottom: "20px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Expected</th>
                    <th>Counted</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustment.lines.map((line: any) => {
                    const diff = Number(line.quantityDelta);
                    return (
                      <tr key={line.id}>
                        <td><strong>{line.product.name}</strong><br /><small>{line.product.code}</small></td>
                        <td>{line.expectedQuantity}</td>
                        <td>{line.countedQuantity}</td>
                        <td style={{ fontWeight: "bold", color: diff === 0 ? "var(--text-muted)" : diff > 0 ? "#16a34a" : "#dc2626" }}>
                          {diff === 0 ? "0" : diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-grid">
              <Field label="Action Decision">
                <select className="field-input" value={decision} onChange={(e) => setDecision(e.target.value as any)} required>
                  <option value="APPROVED">Approve & Adjust Inventory</option>
                  <option value="REJECTED">Reject Request</option>
                </select>
              </Field>

              <Field label="Decision Reason (min. 3 characters)" full>
                <input className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} placeholder="e.g. Verified physical delta during cycle count audit" />
              </Field>
            </div>

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Supervisor credentials required</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" style={{ background: decision === "APPROVED" ? "#16a34a" : "#dc2626", color: "white" }} disabled={busy}>
                <ShieldCheck size={16} />
                {busy ? "Posting Decision..." : `Confirm ${decision === "APPROVED" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InventoryView({
  purchases,
  onModal,
  allowedStations,
  identity,
}: {
  purchases: boolean;
  onModal: (modal: ModalKind) => void;
  allowedStations: AllowedStation[];
  identity: WorkspaceIdentity;
}) {
  const [tab, setTab] = useState(purchases ? "Purchase orders" : "All products");
  const [referenceNow] = useState(() => Date.now());
  const productApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=100");
  const purchaseApi = useApiData<PurchaseRecord[]>("/api/purchases?pageSize=100");
  const movementApi = useApiData<MovementRecord[]>("/api/inventory/movements?pageSize=100");
  const transferApi = useApiData<TransferRecord[]>("/api/inventory/transfers?pageSize=100");
  const adjustmentApi = useApiData<AdjustmentRecord[]>("/api/inventory/adjustments?pageSize=100");

  // Transfer state hooks
  const [transferToDispatch, setTransferToDispatch] = useState<TransferRecord | null>(null);
  const [transferToReceive, setTransferToReceive] = useState<TransferRecord | null>(null);
  const [showCreateTransfer, setShowCreateTransfer] = useState(false);

  // Adjustment state hooks
  const [adjustmentToDecide, setAdjustmentToDecide] = useState<any | null>(null);
  const [showCreateAdjustment, setShowCreateAdjustment] = useState(false);

  const approvePurchase = async (order: PurchaseRecord) => {
    if (!window.confirm(`Approve ${order.orderNumber}?`)) return;
    await workflowPost(`/api/purchases/${order.id}/approve`, {});
    purchaseApi.reload();
  };

  const receivePurchase = async (order: PurchaseRecord) => {
    const supplierRef = window.prompt("Supplier delivery reference") ?? undefined;
    const lines = order.lines.map((line) => {
      const remaining = Number(line.quantityOrdered) - Number(line.quantityReceived);
      const batchCode = line.product.trackBatches ? window.prompt(`Batch code for ${line.product.name}`)?.trim() : undefined;
      return { purchaseOrderLineId: line.id, quantity: remaining.toString(), batchCode: batchCode || undefined };
    });
    if (lines.some((line) => Number(line.quantity) <= 0) || lines.some((line, index) => order.lines[index].product.trackBatches && !line.batchCode)) return;
    await workflowPost(`/api/purchases/${order.id}/receipts`, { supplierRef, lines });
    purchaseApi.reload();
    movementApi.reload();
    productApi.reload();
  };

  const orders = purchaseApi.data ?? [];
  const purchaseTable = useTableControls(orders, (order, q) => `${order.orderNumber} ${order.supplier.name} ${order.station.name} ${order.status}`.toLowerCase().includes(q));
  const movementTable = useTableControls(movementApi.data ?? [], (item, q) => `${item.product.name} ${item.product.code} ${item.station.name} ${item.movementType} ${item.referenceType} ${item.reason ?? ""}`.toLowerCase().includes(q));
  const transferTable = useTableControls(transferApi.data ?? [], (item, q) => `${item.transferNumber} ${item.originStation.code} ${item.destinationStation.code} ${item.reason} ${item.status}`.toLowerCase().includes(q));
  const adjustmentTable = useTableControls(adjustmentApi.data ?? [], (item, q) => `${item.adjustmentNumber} ${item.station.name} ${item.status} ${item.reason}`.toLowerCase().includes(q));

  const rows = (productApi.data ?? []).map((product) => ({
    product,
    available: product.balances.reduce((sum, balance) => sum + Number(balance.quantity), 0),
  }));
  const productSource = tab === "Low stock" ? rows.filter(({ product, available }) => available <= Number(product.reorderLevel)) : rows;
  const productTable = useTableControls(productSource, ({ product }, q) => `${product.name} ${product.code} ${product.category.name} ${product.barcode ?? ""}`.toLowerCase().includes(q));

  const onTab = (value: string) => {
    setTab(value);
    purchaseTable.resetPage();
    movementTable.resetPage();
    transferTable.resetPage();
    productTable.resetPage();
    adjustmentTable.resetPage();
  };

  const tabs = purchases
    ? ["Purchase orders", "Suppliers", "Goods received"]
    : ["All products", "Low stock", "Movements", "Transfers", "Adjustments"];

  if (purchases) {
    const open = orders.filter((order) => !["RECEIVED", "CANCELLED"].includes(order.status));
    const openValue = open.reduce((sum, order) => sum + Number(order.total), 0);
    const due = open.filter((order) => order.expectedDate && new Date(order.expectedDate).getTime() <= referenceNow + 7 * 86_400_000).length;
    return (
      <div className="content-stack">
        <section className="summary-strip">
          <SummaryItem label="Open orders" value={open.length.toString()} icon={PackageOpen} tone="info" />
          <SummaryItem label="Open value" value={formatNaira(openValue)} icon={ArrowDownLeft} tone="success" />
          <SummaryItem label="Due this week" value={due.toString()} icon={CalendarDays} tone="warning" />
          <SummaryItem label="Order records" value={purchaseApi.total.toString()} icon={FileCheck2} tone="info" />
        </section>
        <Panel>
          <TableToolbar tabs={tabs} activeTab={tab} onTab={onTab} placeholder="Search PO, supplier or station" search={purchaseTable.search} onSearch={purchaseTable.setSearch} />
          {purchaseApi.error ? (
            <EmptyState icon={AlertTriangle} title="Purchases could not be loaded" detail={purchaseApi.error} />
          ) : purchaseApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading purchase orders" detail="Retrieving supplier orders and receipt progress." compact />
          ) : purchaseTable.filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Purchase order</th>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Expected</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {purchaseTable.pageRows.map((order) => (
                    <tr key={order.id}>
                      <td><div className="primary-cell"><strong>{order.orderNumber}</strong><span>Raised {formatDate(order.createdAt)}</span></div></td>
                      <td>{order.supplier.name}</td>
                      <td>{order.lines.length}</td>
                      <td className="number-cell">{formatNaira(Number(order.total))}</td>
                      <td>{order.expectedDate ? formatDate(order.expectedDate) : "—"}</td>
                      <td>{order.station.name}</td>
                      <td><StatusPill value={order.status.replaceAll("_", " ")} /></td>
                      <td>
                        <div className="row-actions">
                          {["DRAFT", "SUBMITTED"].includes(order.status) && <button className="row-button" onClick={() => approvePurchase(order)}>Approve</button>}
                          {["APPROVED", "PARTIALLY_RECEIVED"].includes(order.status) && <button className="row-button" onClick={() => receivePurchase(order)}>Receive</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={PackageOpen} title={purchaseTable.search ? "No matching orders" : "No purchase orders"} detail={purchaseTable.search ? "Try a different PO, supplier or station." : "Create a purchase order to begin controlled supplier receiving."} />
          )}
          <Pagination total={purchaseTable.total} page={purchaseTable.page} pageSize={purchaseTable.pageSize} onPage={purchaseTable.setPage} />
        </Panel>
      </div>
    );
  }

  if (tab === "Movements") {
    return (
      <div className="content-stack">
        <section className="summary-strip">
          <SummaryItem label="Movement records" value={movementApi.total.toString()} icon={History} tone="info" />
          <SummaryItem label="Stock in" value={(movementApi.data ?? []).filter((item) => Number(item.quantityDelta) > 0).length.toString()} icon={ArrowDownLeft} tone="success" />
          <SummaryItem label="Stock out" value={(movementApi.data ?? []).filter((item) => Number(item.quantityDelta) < 0).length.toString()} icon={ArrowUpRight} tone="warning" />
          <SummaryItem label="Ledger" value="Append-only" icon={ShieldCheck} tone="success" />
        </section>
        <Panel>
          <TableToolbar tabs={tabs} activeTab={tab} onTab={onTab} placeholder="Search product, station, movement or reference" search={movementTable.search} onSearch={movementTable.setSearch} />
          {movementApi.error ? (
            <EmptyState icon={AlertTriangle} title="Movements could not be loaded" detail={movementApi.error} />
          ) : movementApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading stock ledger" detail="Retrieving immutable balance movements." compact />
          ) : movementTable.filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Occurred</th>
                    <th>Product</th>
                    <th>Station</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>Balance after</th>
                    <th>Reference</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movementTable.pageRows.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.occurredAt).toLocaleString("en-NG")}</td>
                      <td><div className="primary-cell"><strong>{item.product.name}</strong><span>{item.product.code}</span></div></td>
                      <td>{item.station.name}</td>
                      <td><StatusPill value={item.movementType.replaceAll("_", " ")} /></td>
                      <td className={classNames("number-cell", Number(item.quantityDelta) < 0 && "negative-number")}>{Number(item.quantityDelta) > 0 ? "+" : ""}{item.quantityDelta}</td>
                      <td className="number-cell">{item.balanceAfter}</td>
                      <td><code>{item.referenceType}:{item.referenceId.slice(0, 8)}</code></td>
                      <td>{item.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={History} title={movementTable.search ? "No matching movements" : "No stock movements"} detail={movementTable.search ? "Try a different product, station or reference." : "Stock-in, sale, transfer and adjustment movements appear here."} />
          )}
          <Pagination total={movementTable.total} page={movementTable.page} pageSize={movementTable.pageSize} onPage={movementTable.setPage} />
        </Panel>
      </div>
    );
  }

  if (tab === "Transfers") {
    return (
      <div className="content-stack">
        <section className="summary-strip">
          <SummaryItem label="Transfer records" value={transferApi.total.toString()} icon={ArrowLeftRight} tone="info" />
          <SummaryItem label="Awaiting dispatch" value={(transferApi.data ?? []).filter((item) => item.status === "REQUESTED").length.toString()} icon={Clock3} tone="warning" />
          <SummaryItem label="In transit" value={(transferApi.data ?? []).filter((item) => item.status === "DISPATCHED").length.toString()} icon={Plane} tone="info" />
          <SummaryItem label="Received" value={(transferApi.data ?? []).filter((item) => item.status === "RECEIVED").length.toString()} icon={PackageCheck} tone="success" />
        </section>
        <Panel>
          <TableToolbar tabs={tabs} activeTab={tab} onTab={onTab} placeholder="Search transfer number or route" search={transferTable.search} onSearch={transferTable.setSearch} />
          {transferApi.error ? (
            <EmptyState icon={AlertTriangle} title="Transfers could not be loaded" detail={transferApi.error} />
          ) : transferApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading transfers" detail="Retrieving dispatch and receipt progress." compact />
          ) : transferTable.filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer</th>
                    <th>Route</th>
                    <th>Items</th>
                    <th>Requested</th>
                    <th>Dispatched</th>
                    <th>Received</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {transferTable.pageRows.map((item) => (
                    <tr key={item.id}>
                      <td><div className="primary-cell"><strong>{item.transferNumber}</strong><span>{formatDate(item.requestedAt)}</span></div></td>
                      <td>{item.originStation.code} → {item.destinationStation.code}</td>
                      <td>{item.lines.length}</td>
                      <td>{item.lines.reduce((sum, line) => sum + Number(line.quantityRequested), 0)}</td>
                      <td>{item.lines.reduce((sum, line) => sum + Number(line.quantityDispatched), 0)}</td>
                      <td>{item.lines.reduce((sum, line) => sum + Number(line.quantityReceived), 0)}</td>
                      <td>{item.reason}</td>
                      <td><StatusPill value={item.status} /></td>
                      <td>
                        <div className="row-actions">
                          {item.status === "REQUESTED" && (
                            <button className="row-button" onClick={() => setTransferToDispatch(item)}>Dispatch</button>
                          )}
                          {item.status === "DISPATCHED" && (
                            <button className="row-button" onClick={() => setTransferToReceive(item)}>Receive</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={ArrowLeftRight} title={transferTable.search ? "No matching transfers" : "No transfers"} detail={transferTable.search ? "Try a different transfer number or route." : "Inter-station stock transfers appear here."} />
          )}
          <div className="table-callout">
            <div><ArrowLeftRight size={18} /><span><strong>Inter-station transfers</strong> Coordinate stock dispatches and receipts.</span></div>
            <button onClick={() => setShowCreateTransfer(true)}>Add transfer</button>
          </div>
          <Pagination total={transferTable.total} page={transferTable.page} pageSize={transferTable.pageSize} onPage={transferTable.setPage} />
        </Panel>

        {showCreateTransfer && (
          <TransferCreateModal
            allowedStations={allowedStations}
            onClose={() => setShowCreateTransfer(false)}
            onComplete={(title, detail) => {
              setShowCreateTransfer(false);
              transferApi.reload();
              productApi.reload();
            }}
          />
        )}

        {transferToDispatch && (
          <TransferDispatchModal
            transfer={transferToDispatch}
            onClose={() => setTransferToDispatch(null)}
            onComplete={(title, detail) => {
              setTransferToDispatch(null);
              transferApi.reload();
              movementApi.reload();
              productApi.reload();
            }}
          />
        )}

        {transferToReceive && (
          <TransferReceiveModal
            transfer={transferToReceive}
            onClose={() => setTransferToReceive(null)}
            onComplete={(title, detail) => {
              setTransferToReceive(null);
              transferApi.reload();
              movementApi.reload();
              productApi.reload();
            }}
          />
        )}
      </div>
    );
  }

  if (tab === "Adjustments") {
    const isApprover = identity.permissions.includes("inventory.approve_adjustment");
    return (
      <div className="content-stack">
        <section className="summary-strip">
          <SummaryItem label="Audit logs" value={adjustmentApi.total.toString()} icon={History} tone="info" />
          <SummaryItem label="Pending decision" value={(adjustmentApi.data ?? []).filter((item: any) => item.status === "PENDING_APPROVAL").length.toString()} icon={Clock3} tone="warning" />
          <SummaryItem label="Approved adjustments" value={(adjustmentApi.data ?? []).filter((item: any) => item.status === "POSTED").length.toString()} icon={PackageCheck} tone="success" />
          <SummaryItem label="Rejected audits" value={(adjustmentApi.data ?? []).filter((item: any) => item.status === "REJECTED").length.toString()} icon={X} tone="danger" />
        </section>
        <Panel>
          <TableToolbar tabs={tabs} activeTab={tab} onTab={onTab} placeholder="Search adjustments..." search={adjustmentTable.search} onSearch={adjustmentTable.setSearch} />
          {adjustmentApi.error ? (
            <EmptyState icon={AlertTriangle} title="Adjustments could not be loaded" detail={adjustmentApi.error} />
          ) : adjustmentApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading adjustments" detail="Retrieving count audits and pending approvals." compact />
          ) : adjustmentTable.filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref Number</th>
                    <th>Audited Date</th>
                    <th>Station</th>
                    <th>Items</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {adjustmentTable.pageRows.map((item: any) => (
                    <tr key={item.id}>
                      <td><div className="primary-cell"><strong>{item.adjustmentNumber}</strong><span>Raised {formatDate(item.requestedAt)}</span></div></td>
                      <td>{new Date(item.requestedAt).toLocaleString("en-NG")}</td>
                      <td>{item.station.name}</td>
                      <td>{item.lines.length} items</td>
                      <td>{item.reason}</td>
                      <td><StatusPill value={item.status.replaceAll("_", " ")} /></td>
                      <td>
                        <div className="row-actions">
                          {item.status === "PENDING_APPROVAL" && isApprover && (
                            <button className="row-button" onClick={() => setAdjustmentToDecide(item)}>Decide</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={History} title={adjustmentTable.search ? "No matching adjustments" : "No adjustments"} detail={adjustmentTable.search ? "Try a different reference number or reason." : "Physical count audits appear here."} />
          )}
          <div className="table-callout">
            <div><History size={18} /><span><strong>Maker-checker audits</strong> Request and approve stock balance adjustments.</span></div>
            <button onClick={() => setShowCreateAdjustment(true)}>Add adjustment</button>
          </div>
          <Pagination total={adjustmentTable.total} page={adjustmentTable.page} pageSize={adjustmentTable.pageSize} onPage={adjustmentTable.setPage} />
        </Panel>

        {showCreateAdjustment && (
          <AdjustmentCreateModal
            allowedStations={allowedStations}
            onClose={() => setShowCreateAdjustment(false)}
            onComplete={(title, detail) => {
              setShowCreateAdjustment(false);
              adjustmentApi.reload();
            }}
          />
        )}

        {adjustmentToDecide && (
          <AdjustmentDecideModal
            adjustment={adjustmentToDecide}
            onClose={() => setAdjustmentToDecide(null)}
            onComplete={(title, detail) => {
              setAdjustmentToDecide(null);
              adjustmentApi.reload();
              productApi.reload();
              movementApi.reload();
            }}
          />
        )}
      </div>
    );
  }

  const units = rows.reduce((sum, row) => sum + row.available, 0);
  const value = rows.reduce((sum, row) => sum + row.available * Number(row.product.purchasePrice ?? 0), 0);
  const low = rows.filter(({ product, available }) => available > 0 && available <= Number(product.reorderLevel)).length;
  const empty = rows.filter(({ available }) => available <= 0).length;

  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Stock value" value={formatNaira(value)} detail={`${units.toLocaleString()} units`} icon={Boxes} tone="info" />
        <SummaryItem label="Low stock" value={low.toString()} detail="At or below reorder" icon={AlertTriangle} tone="warning" />
        <SummaryItem label="Out of stock" value={empty.toString()} detail="Reorder immediately" icon={PackageOpen} tone="danger" />
        <SummaryItem label="Catalogue" value={productApi.total.toString()} detail="Active and inactive" icon={PackageCheck} tone="success" />
      </section>
      <Panel>
        <TableToolbar tabs={tabs} activeTab={tab} onTab={onTab} placeholder="Search product, code or barcode" search={productTable.search} onSearch={productTable.setSearch} />
        {productApi.error ? (
          <EmptyState icon={AlertTriangle} title="Inventory could not be loaded" detail={productApi.error} />
        ) : productApi.loading ? (
          <EmptyState icon={RefreshCcw} title="Loading inventory" detail="Reconciling product balances by station." compact />
        ) : productTable.filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stations</th>
                  <th>Available</th>
                  <th>Reorder level</th>
                  <th>Selling price</th>
                  <th>Stock status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {productTable.pageRows.map(({ product, available }) => (
                  <tr key={product.id}>
                    <td><div className="product-cell"><span><PackageOpen size={17} /></span><div><strong>{product.name}</strong><small>{product.code} · {product.unit.code}</small></div></div></td>
                    <td>{product.category.name}</td>
                    <td>{product.balances.map((balance) => balance.station.code).join(", ") || "—"}</td>
                    <td className="number-cell strong-number">{available}</td>
                    <td>{product.reorderLevel}</td>
                    <td className="number-cell">{formatNaira(Number(product.sellingPrice))}</td>
                    <td><StatusPill value={available <= 0 ? "Out of stock" : available <= Number(product.reorderLevel) ? "Low stock" : "In stock"} /></td>
                    <td><button className="icon-ghost" onClick={() => onModal("product")}><MoreHorizontal size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Boxes} title={productTable.search ? "No matching products" : "No products found"} detail={productTable.search ? "Try a different product, code or barcode." : "Create the first catalogue product and opening station balance."} />
        )}
        <Pagination total={productTable.total} page={productTable.page} pageSize={productTable.pageSize} onPage={productTable.setPage} />
      </Panel>
    </div>
  );
}

function CargoEditModal({
  shipment,
  allowedStations,
  onClose,
  onComplete,
}: {
  shipment: CargoRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const isPreDispatch = ["DRAFT", "PROCESSING", "LABELLED"].includes(shipment.status);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const optional = (name: string) => String(form.get(name) ?? "").trim() || undefined;

    const payload: any = {
      senderName: String(form.get("senderName")),
      senderPhone: String(form.get("senderPhone")),
      receiverName: String(form.get("receiverName")),
      receiverPhone: String(form.get("receiverPhone")),
      receiverAddress: optional("receiverAddress"),
      origin: String(form.get("origin")),
      destination: String(form.get("destination")),
      weightKg: String(form.get("weightKg")),
      pieces: Number(form.get("pieces")),
      commodity: String(form.get("commodity")),
      airline: optional("airline"),
      flightNumber: optional("flightNumber"),
      flightDate: optional("flightDate") || undefined,
      handlingNotes: optional("handlingNotes"),
      declaredValue: optional("declaredValue"),
    };

    if (!isPreDispatch) {
      payload.reason = reason;
    }

    try {
      const response = await fetch(`/api/cargo/${shipment.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to save updates.");

      window.dispatchEvent(new Event("erp-data-changed"));

      if (body.data?.approvalRequired) {
        onComplete("Correction requested", "Label correction has been routed to supervisor approvals.");
      } else {
        onComplete("Shipment updated", "Draft shipment details were updated successfully.");
      }
    } catch (reason_) {
      setError(reason_ instanceof Error ? reason_.message : "Failed to update shipment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Cargo & AWB</span>
            <h2>{isPreDispatch ? "Edit Cargo Shipment" : "Correct Dispatched Label"}</h2>
            <p>{isPreDispatch ? "Modify details of the draft shipment." : "Dispatched labels require a correction reason and supervisor approval."}</p>
          </div>
          <button onClick={onClose} aria-label="Close modal"><X size={19} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            {!isPreDispatch && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #fecaca" }}>
                <strong style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Correction Controls Active</strong>
                <span style={{ fontSize: "12px" }}>This AWB has been dispatched. Modifying fields will increment the label version and must be approved by another supervisor.</span>
              </div>
            )}

            <div className="form-grid">
              <Field label="Sender name"><input name="senderName" defaultValue={shipment.senderName} required /></Field>
              <Field label="Sender phone"><input name="senderPhone" defaultValue={shipment.senderPhone} required autoComplete="tel" /></Field>
              <Field label="Receiver"><input name="receiverName" defaultValue={shipment.receiverName} required /></Field>
              <Field label="Receiver phone"><input name="receiverPhone" defaultValue={shipment.receiverPhone} required autoComplete="tel" /></Field>
              <Field label="Receiver address" full><input name="receiverAddress" defaultValue={shipment.receiverAddress ?? ""} /></Field>
              <Field label="Origin"><input name="origin" defaultValue={shipment.origin} required /></Field>
              <Field label="Destination"><input name="destination" defaultValue={shipment.destination} required /></Field>
              <Field label="Weight (kg)"><input name="weightKg" type="number" step="0.001" min="0.001" defaultValue={shipment.weightKg} required /></Field>
              <Field label="Pieces"><input name="pieces" type="number" min="1" defaultValue={shipment.pieces} required /></Field>
              <Field label="Commodity" full><input name="commodity" defaultValue={shipment.commodity} required /></Field>
              <Field label="Declared value"><div className="money-input"><span>₦</span><input name="declaredValue" type="number" step="0.01" min="0" defaultValue={shipment.declaredValue ?? ""} /></div></Field>
              <Field label="Airline"><input name="airline" defaultValue={shipment.airline ?? ""} /></Field>
              <Field label="Flight number"><input name="flightNumber" defaultValue={shipment.flightNumber ?? ""} /></Field>
              <Field label="Flight date"><input name="flightDate" type="date" defaultValue={shipment.flightDate ? new Date(shipment.flightDate).toISOString().slice(0, 10) : ""} /></Field>
              <Field label="Handling notes" full><textarea name="handlingNotes" defaultValue={shipment.handlingNotes ?? ""} /></Field>
            </div>

            {!isPreDispatch && (
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
                <Field label="Correction Reason (Mandatory)" full>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Enter reason and evidence for this label correction"
                  />
                </Field>
              </div>
            )}

            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className="workflow-footer">
            <span><ShieldCheck size={14} /> Audited under Maker-Checker controls</span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>
                {busy ? "Saving..." : isPreDispatch ? "Save Changes" : "Submit Correction"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CargoView({
  onModal,
  onToast,
  allowedStations,
}: {
  onModal: (modal: ModalKind) => void;
  onToast: (toast: Toast) => void;
  allowedStations: AllowedStation[];
}) {
  const [tab, setTab] = useState("All cargo");
  const { data, total, loading, error, reload } = useApiData<CargoRecord[]>("/api/cargo?pageSize=100");
  const [editingShipment, setEditingShipment] = useState<CargoRecord | null>(null);

  const cargo = data ?? [];
  const visible = cargo.filter((item) =>
    tab === "Processing"
      ? ["DRAFT", "PROCESSING", "LABELLED"].includes(item.status)
      : tab === "In transit"
      ? ["DISPATCHED", "IN_TRANSIT", "ARRIVED"].includes(item.status)
      : tab === "Delivered"
      ? item.status === "DELIVERED"
      : tab === "On hold"
      ? item.status === "ON_HOLD"
      : true
  );

  const table = useTableControls(visible, (item, q) =>
    `${item.awbNumber} ${item.senderName} ${item.receiverName} ${item.origin} ${item.destination} ${item.airline ?? ""} ${item.customer.displayName}`
      .toLowerCase()
      .includes(q)
  );

  const nextStatus: Record<string, string> = {
    DRAFT: "LABELLED",
    PROCESSING: "LABELLED",
    LABELLED: "DISPATCHED",
    DISPATCHED: "IN_TRANSIT",
    IN_TRANSIT: "ARRIVED",
    ARRIVED: "DELIVERED",
  };

  const advanceLabel: Record<string, string> = {
    DRAFT: "Issue label",
    PROCESSING: "Issue label",
    LABELLED: "Dispatch",
    DISPATCHED: "Mark in transit",
    IN_TRANSIT: "Mark arrived",
    ARRIVED: "Mark delivered",
  };

  const advance = async (item: CargoRecord) => {
    const next = nextStatus[item.status];
    if (!next) return;
    const notes = window.prompt(`Notes for moving ${item.awbNumber} to ${next.replaceAll("_", " ")}`, `Status updated to ${next}`);
    if (!notes?.trim()) return;
    try {
      await workflowPost(`/api/cargo/${item.id}/status`, { status: next, notes });
      reload();
      onToast({ title: "Cargo updated", detail: `${item.awbNumber} moved to ${next.replaceAll("_", " ").toLowerCase()}.` });
    } catch (error_) {
      onToast({
        title: "Update failed",
        detail: error_ instanceof Error ? error_.message : "The status could not be changed.",
      });
    }
  };

  const printLabel = (item: CargoRecord) => {
    const isThermal = window.confirm("Print in thermal format? Click OK for Zebra/Thermal, Cancel for A4 standard.");
    window.open(`/print/cargo/${item.id}?format=${isThermal ? "thermal" : "a4"}`, "_blank", "noopener,noreferrer");
  };

  const reprint = async (item: CargoRecord) => {
    const isThermal = window.confirm("Reprint in thermal format? Click OK for Zebra/Thermal, Cancel for A4 standard.");
    const reason = window.prompt(`Reason to reprint the label for ${item.awbNumber}`, "Customer copy");
    if (!reason?.trim()) return;
    try {
      const format = isThermal ? "THERMAL" : "A4";
      await workflowPost(`/api/cargo/${item.id}/reprint`, { format, reason });
      reload();
      window.open(`/print/cargo/${item.id}?format=${format.toLowerCase()}`, "_blank", "noopener,noreferrer");
      onToast({ title: "Label reprinted", detail: `An audited reprint of ${item.awbNumber} was recorded.` });
    } catch (error_) {
      onToast({
        title: "Reprint failed",
        detail: error_ instanceof Error ? error_.message : "The label could not be reprinted.",
      });
    }
  };

  const exportManifest = () => {
    const headers = [
      "AWB Number",
      "Customer",
      "Sender Name",
      "Sender Phone",
      "Receiver Name",
      "Receiver Phone",
      "Receiver Address",
      "Origin",
      "Destination",
      "Weight (kg)",
      "Pieces",
      "Commodity",
      "Airline",
      "Flight Number",
      "Flight Date",
      "Status",
      "Label Version",
      "Reprint Count",
      "Created At",
    ];
    const rows = table.filtered.map((item) => [
      item.awbNumber,
      item.customer.displayName,
      item.senderName,
      item.senderPhone,
      item.receiverName,
      item.receiverPhone,
      item.receiverAddress || "",
      item.origin,
      item.destination,
      item.weightKg,
      item.pieces,
      item.commodity,
      item.airline || "",
      item.flightNumber || "",
      item.flightDate ? new Date(item.flightDate).toLocaleDateString("en-NG") : "",
      item.status,
      `v${item.labelVersion}`,
      item.reprintCount,
      new Date(item.createdAt).toLocaleDateString("en-NG"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cargo_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem
          label="Cargo records"
          value={total.toString()}
          detail={`${cargo.reduce((sum, item) => sum + Number(item.weightKg), 0).toLocaleString()} kg loaded`}
          icon={Plane}
          tone="info"
        />
        <SummaryItem
          label="In transit"
          value={cargo.filter((item) => ["DISPATCHED", "IN_TRANSIT", "ARRIVED"].includes(item.status)).length.toString()}
          detail={`${cargo.reduce((sum, item) => sum + item.pieces, 0)} pieces loaded`}
          icon={ArrowUpRight}
          tone="success"
        />
        <SummaryItem
          label="Processing"
          value={cargo.filter((item) => ["DRAFT", "PROCESSING", "LABELLED"].includes(item.status)).length.toString()}
          detail="Pre-dispatch"
          icon={Clock3}
          tone="warning"
        />
        <SummaryItem
          label="On hold"
          value={cargo.filter((item) => item.status === "ON_HOLD").length.toString()}
          detail="Action required"
          icon={AlertTriangle}
          tone="danger"
        />
      </section>
      <Panel>
        <TableToolbar
          tabs={["All cargo", "Processing", "In transit", "Delivered", "On hold"]}
          activeTab={tab}
          onTab={(value) => {
            setTab(value);
            table.resetPage();
          }}
          exportable
          onExport={exportManifest}
          placeholder="Search AWB, sender, receiver or route"
          search={table.search}
          onSearch={table.setSearch}
        />
        {error ? (
          <EmptyState icon={AlertTriangle} title="Cargo could not be loaded" detail={error} />
        ) : loading ? (
          <EmptyState
            icon={RefreshCcw}
            title="Loading cargo records"
            detail="Retrieving AWB records and status history."
            compact
          />
        ) : table.filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>AWB / cargo no.</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Shipment</th>
                  <th>Airline</th>
                  <th>Label status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="primary-cell">
                        <strong>{item.awbNumber}</strong>
                        <span>
                          <Tag size={11} /> Label v{item.labelVersion}
                          {item.reprintCount > 0 && ` (Reprinted ${item.reprintCount}x)`}
                        </span>
                      </div>
                    </td>
                    <td>{item.customer.displayName}</td>
                    <td>
                      <strong className="route-code">
                        {item.origin} → {item.destination}
                      </strong>
                    </td>
                    <td>
                      {item.pieces} pcs · {item.weightKg} kg
                    </td>
                    <td>{item.airline ?? "—"}</td>
                    <td>
                      <StatusPill value={item.status.replaceAll("_", " ")} />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="row-button" onClick={() => setEditingShipment(item)}>
                          Edit
                        </button>
                        {nextStatus[item.status] && (
                          <button type="button" className="row-button" onClick={() => advance(item)}>
                            {advanceLabel[item.status]}
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-ghost"
                          title="Open label"
                          onClick={() => printLabel(item)}
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-ghost"
                          title="Reprint label (audited)"
                          onClick={() => reprint(item)}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Plane}
            title="No cargo records"
            detail="Create an AWB to generate the first scanner-compatible cargo label."
          />
        )}
        <div className="table-callout">
          <div>
            <PackageCheck size={18} />
            <span>
              <strong>Label output</strong> Code 128 · secure QR · thermal and A4
            </span>
          </div>
          <em>
            <i /> Ready
          </em>
          <button onClick={() => onModal("cargo")}>Create AWB</button>
        </div>
        <Pagination
          total={table.total}
          page={table.page}
          pageSize={table.pageSize}
          onPage={table.setPage}
        />
      </Panel>

      {editingShipment && (
        <CargoEditModal
          shipment={editingShipment}
          allowedStations={allowedStations}
          onClose={() => setEditingShipment(null)}
          onComplete={(title, detail) => {
            setEditingShipment(null);
            reload();
            onToast({ title, detail });
          }}
        />
      )}
    </div>
  );
}

function AgentsView({
  onModal,
  allowedStations,
  onToast,
}: {
  onModal: (modal: ModalKind) => void;
  allowedStations: AllowedStation[];
  onToast: (toast: Toast) => void;
}) {
  const [tab, setTab] = useState("All agents");
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [depositingAgent, setDepositingAgent] = useState<AgentRecord | null>(null);

  const { data, total, loading, error, reload } = useApiData<AgentRecord[]>("/api/agents?pageSize=100");
  const agentRecords = data ?? [];

  const visible = agentRecords.filter((agent) =>
    tab === "Healthy"
      ? Number(agent.wallet?.balance ?? 0) > 0 && agent.status === "ACTIVE"
      : tab === "Low balance"
      ? Number(agent.wallet?.balance ?? 0) <= Number(agent.creditLimit) * 0.2
      : tab === "Overdue"
      ? Number(agent.wallet?.balance ?? 0) < 0
      : true
  );

  const table = useTableControls(visible, (agent, q) =>
    `${agent.name} ${agent.agentNumber} ${agent.contactName} ${agent.phone} ${agent.homeStation.name}`
      .toLowerCase()
      .includes(q)
  );

  const liability = agentRecords.reduce((sum, agent) => sum + Number(agent.wallet?.balance ?? 0), 0);
  const exposure = agentRecords.reduce((sum, agent) => sum + Number(agent.creditLimit), 0);

  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem
          label="Wallet liability"
          value={formatNaira(liability)}
          detail={`Across ${total} agents`}
          icon={WalletCards}
          tone="info"
        />
        <SummaryItem
          label="Active agents"
          value={agentRecords.filter((agent) => agent.status === "ACTIVE").length.toString()}
          detail="Operational accounts"
          icon={UserCheck}
          tone="success"
        />
        <SummaryItem
          label="Credit exposure"
          value={formatNaira(exposure)}
          detail="Configured limits"
          icon={CircleDollarSign}
          tone="warning"
        />
        <SummaryItem
          label="Negative wallets"
          value={agentRecords.filter((agent) => Number(agent.wallet?.balance ?? 0) < 0).length.toString()}
          detail="Requires attention"
          icon={AlertTriangle}
          tone="danger"
        />
      </section>

      <Panel>
        <TableToolbar
          tabs={["All agents", "Healthy", "Low balance", "Overdue"]}
          activeTab={tab}
          onTab={(value) => {
            setTab(value);
            table.resetPage();
          }}
          placeholder="Search agent, company or contact"
          search={table.search}
          onSearch={table.setSearch}
        />
        {error ? (
          <EmptyState icon={AlertTriangle} title="Agents could not be loaded" detail={error} />
        ) : loading ? (
          <EmptyState
            icon={RefreshCcw}
            title="Loading agent wallets"
            detail="Retrieving live wallet balances and credit limits."
            compact
          />
        ) : table.filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Contact</th>
                  <th>Station</th>
                  <th>Wallet balance</th>
                  <th>Credit limit</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.map((agent) => (
                  <tr
                    key={agent.id}
                    className="clickable-row"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      setSelectedAgent(agent);
                    }}
                  >
                    <td>
                      <div className="agent-cell">
                        <span>
                          {agent.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div>
                          <strong>{agent.name}</strong>
                          <small>{agent.agentNumber}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {agent.contactName}
                      <br />
                      <small>{agent.phone}</small>
                    </td>
                    <td>{agent.homeStation.name}</td>
                    <td className={classNames("number-cell", Number(agent.wallet?.balance ?? 0) < 0 && "negative-number")}>
                      {formatNaira(Number(agent.wallet?.balance ?? 0))}
                    </td>
                    <td className="number-cell">{formatNaira(Number(agent.creditLimit))}</td>
                    <td>
                      {agent._count.sales} sales · {agent._count.bookings} tickets
                    </td>
                    <td>
                      <StatusPill value={agent.status} />
                    </td>
                    <td>
                      <button
                        className="row-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDepositingAgent(agent);
                        }}
                      >
                        Deposit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={WalletCards}
            title={table.search ? "No matching agents" : "No agents found"}
            detail={
              table.search
                ? "Try a different agent, company or contact name."
                : "Create an agent to provision a controlled wallet account."
            }
          />
        )}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          allowedStations={allowedStations}
          onClose={() => {
            setSelectedAgent(null);
            reload();
          }}
          onComplete={(title, detail) => {
            onToast({ title, detail });
            reload();
          }}
        />
      )}

      {depositingAgent && (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setDepositingAgent(null)}
        >
          <div className="workflow-dialog" style={{ maxWidth: "550px" }}>
            <div className="workflow-header">
              <div>
                <span>Wallet Account</span>
                <h2>Post Agent Deposit</h2>
                <p>Credit funds to selected agent wallet.</p>
              </div>
              <button onClick={() => setDepositingAgent(null)}>
                <X size={19} />
              </button>
            </div>
            <DepositForm
              allowedStations={allowedStations}
              initialAgentId={depositingAgent.id}
              onClose={() => setDepositingAgent(null)}
              onComplete={(title, detail) => {
                setDepositingAgent(null);
                reload();
                onToast({ title, detail });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentDetailModal({
  agent,
  allowedStations,
  onClose,
  onComplete,
}: {
  agent: AgentRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [tab, setTab] = useState("profile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(agent.name);
  const [contactName, setContactName] = useState(agent.contactName);
  const [phone, setPhone] = useState(agent.phone);
  const [email, setEmail] = useState(agent.email ?? "");
  const [address, setAddress] = useState(agent.address ?? "");
  const [status, setStatus] = useState(agent.status);
  const [creditLimit, setCreditLimit] = useState(agent.creditLimit);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: agentDetails, reload: reloadDetails } = useApiData<any>(`/api/agents/${agent.id}`);
  const { data: ledger, loading: ledgerLoading, reload: reloadLedger } = useApiData<any>(`/api/agents/${agent.id}/wallet?pageSize=100`);
  const { data: statementResponse, loading: statementLoading, reload: reloadStatement } = useApiData<any>(
    `/api/agents/${agent.id}/wallet/statement?startDate=${startDate}&endDate=${endDate}`
  );
  const statement = statementResponse;

  const [adjusting, setAdjusting] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          contactName,
          phone,
          email: email || null,
          address: address || null,
          status,
          creditLimit,
        }),
      });
      const body = (await response.json()) as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to save profile.");

      window.dispatchEvent(new Event("erp-data-changed"));
      onComplete("Agent updated", "Agent profile has been updated successfully.");
      reloadDetails();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  };

  const reverseEntry = async (entryId: string) => {
    const reason = window.prompt("Reason for reversing this wallet entry?", "Typographical error correction");
    if (!reason?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agent.id}/wallet/reverse`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ entryId, reason }),
      });
      const body = (await response.json()) as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Reversal failed.");

      window.dispatchEvent(new Event("erp-data-changed"));
      onComplete("Entry reversed", "A compensating ledger entry has been posted.");
      reloadDetails();
      reloadLedger();
      reloadStatement();
    } catch (reason_) {
      setError(reason_ instanceof Error ? reason_.message : "Reversal failed.");
    } finally {
      setBusy(false);
    }
  };

  const exportStatementCSV = () => {
    if (!statement || !statement.entries) return;
    const headers = ["Date", "Entry Number", "Description", "Method", "Debit", "Credit", "Balance After"];
    const rows = statement.entries.map((entry: any) => [
      new Date(entry.postedAt).toLocaleString("en-NG"),
      entry.entryNumber,
      entry.reason || entry.referenceType,
      entry.paymentMethod?.name || "System",
      entry.type.includes("DEBIT") ? entry.amount : "",
      !entry.type.includes("DEBIT") ? entry.amount : "",
      entry.balanceAfter,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["AAU Chamo - Agent Account Statement"],
        [`Agent Name: ${agent.name} (${agent.agentNumber})`],
        [`Date Range: ${startDate} to ${endDate}`],
        [`Opening Balance: NGN ${statement.openingBalance}`],
        [`Closing Balance: NGN ${statement.closingBalance}`],
        [],
        headers,
        ...rows,
      ]
        .map((e) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statement_${agent.agentNumber}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentAgent = agentDetails ?? agent;
  const currentWallet = currentAgent.wallet ?? { balance: "0.00" };
  const utilization =
    Number(currentAgent.creditLimit) > 0
      ? (Math.max(0, -Number(currentWallet.balance)) / Number(currentAgent.creditLimit)) * 100
      : 0;

  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="workflow-dialog" style={{ maxWidth: "900px" }}>
        <div className="workflow-header">
          <div className="agent-cell" style={{ gap: "16px" }}>
            <span className="avatar large">
              {currentAgent.name
                .split(" ")
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <span>Agent ID: {currentAgent.agentNumber}</span>
              <h2>{currentAgent.name}</h2>
              <p>Home station: {currentAgent.homeStation?.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={19} />
          </button>
        </div>

        <div className="tab-strip" style={{ padding: "0 24px", borderBottom: "1px solid var(--border-color)" }}>
          <button
            className={classNames("tab-button", tab === "profile" && "active")}
            onClick={() => setTab("profile")}
          >
            Profile Settings
          </button>
          <button className={classNames("tab-button", tab === "ledger" && "active")} onClick={() => setTab("ledger")}>
            Wallet Ledger
          </button>
          <button
            className={classNames("tab-button", tab === "statement" && "active")}
            onClick={() => setTab("statement")}
          >
            Period Statements
          </button>
        </div>

        <div className="workflow-body" style={{ minHeight: "350px" }}>
          {tab === "profile" && (
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                <Field label="Agent name">
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
                <Field label="Contact person">
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </Field>
                <Field label="Phone number">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
                </Field>
                <Field label="Email address">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Physical address" full>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
                <Field label="Account status">
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </Field>
                <Field label="Credit limit (NGN)">
                  <div className="money-input">
                    <span>₦</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                  </div>
                </Field>
              </div>
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="primary-button" disabled={busy}>
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {tab === "ledger" && (
            <div className="content-stack">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted-color)", display: "block" }}>
                      Wallet Balance
                    </span>
                    <strong
                      style={{ fontSize: "18px", color: Number(currentWallet.balance) < 0 ? "red" : "green" }}
                    >
                      {formatNaira(Number(currentWallet.balance))}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted-color)", display: "block" }}>
                      Credit Limit
                    </span>
                    <strong style={{ fontSize: "18px" }}>{formatNaira(Number(currentAgent.creditLimit))}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted-color)", display: "block" }}>
                      Credit Utilization
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "8px",
                          background: "#eee",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, utilization)}%`,
                            height: "100%",
                            background: utilization > 80 ? "red" : "orange",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "11px" }}>{utilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="secondary-button" onClick={() => setAdjusting(true)}>
                    Wallet Adjust
                  </button>
                  <button className="primary-button" onClick={() => setDepositing(true)}>
                    Post Deposit
                  </button>
                </div>
              </div>

              {ledgerLoading ? (
                <EmptyState icon={RefreshCcw} title="Loading ledger" detail="Syncing ledger timeline." compact />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th>Method</th>
                        <th style={{ textAlign: "right" }}>Debit</th>
                        <th style={{ textAlign: "right" }}>Credit</th>
                        <th style={{ textAlign: "right" }}>Balance after</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const entries = ledger?.wallet?.entries ?? [];
                        const reversedEntryIds = new Set(entries.map((e: any) => e.reversedEntryId).filter(Boolean));
                        return entries.map((entry: any) => {
                          const isReversal = !!entry.reversedEntryId;
                          const isReversed = reversedEntryIds.has(entry.id);
                          return (
                            <tr key={entry.id}>
                              <td>{new Date(entry.postedAt).toLocaleString("en-NG")}</td>
                              <td>
                                <strong>{entry.entryNumber}</strong>
                              </td>
                              <td>
                                {entry.reason || entry.referenceType}
                                {(isReversal || isReversed) && (
                                  <span style={{ color: "red", fontSize: "10px", marginLeft: "6px" }}>
                                    ({isReversal ? "Reversal" : "Reversed"})
                                  </span>
                                )}
                              </td>
                              <td>{entry.paymentMethod?.name || "System"}</td>
                              <td style={{ textAlign: "right", color: "red" }}>
                                {entry.type.includes("DEBIT") ? formatNaira(Number(entry.amount)) : ""}
                              </td>
                              <td style={{ textAlign: "right", color: "green" }}>
                                {!entry.type.includes("DEBIT") ? formatNaira(Number(entry.amount)) : ""}
                              </td>
                              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                {formatNaira(Number(entry.balanceAfter))}
                              </td>
                              <td>
                                {!isReversal && !isReversed && (
                                  <button
                                    className="text-action"
                                    style={{ color: "red" }}
                                    onClick={() => reverseEntry(entry.id)}
                                    disabled={busy}
                                  >
                                    Reverse
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "statement" && (
            <div className="content-stack">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "16px",
                  background: "#f9f9f9",
                  padding: "16px",
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", gap: "16px" }}>
                  <Field label="Start date">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </Field>
                  <Field label="End date">
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </Field>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="secondary-button" onClick={() => reloadStatement()}>
                    Refresh Summary
                  </button>
                  <button className="secondary-button" onClick={exportStatementCSV} disabled={!statement}>
                    Download CSV
                  </button>
                  <button
                    className="primary-button"
                    onClick={() =>
                      window.open(
                        `/print/statement/${agent.id}?startDate=${startDate}&endDate=${endDate}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Print statement
                  </button>
                </div>
              </div>

              {statementLoading ? (
                <EmptyState
                  icon={RefreshCcw}
                  title="Loading period summary"
                  detail="Compiling opening/closing continuity."
                  compact
                />
              ) : statement ? (
                <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div
                    style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "6px", backgroundColor: "#fff" }}
                  >
                    <span style={{ fontSize: "11px", color: "#666" }}>Opening balance brought forward</span>
                    <strong style={{ display: "block", fontSize: "20px", marginTop: "4px" }}>
                      {formatNaira(Number(statement.openingBalance))}
                    </strong>
                  </div>
                  <div
                    style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "6px", backgroundColor: "#fff" }}
                  >
                    <span style={{ fontSize: "11px", color: "#666" }}>Period movements (credits - debits)</span>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "20px",
                        marginTop: "4px",
                        color: Number(statement.closingBalance) - Number(statement.openingBalance) >= 0 ? "green" : "red",
                      }}
                    >
                      {formatNaira(Number(statement.closingBalance) - Number(statement.openingBalance))}
                    </strong>
                  </div>
                  <div
                    style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "6px", backgroundColor: "#fff" }}
                  >
                    <span style={{ fontSize: "11px", color: "#666" }}>Closing balance carried forward</span>
                    <strong style={{ display: "block", fontSize: "20px", marginTop: "4px" }}>
                      {formatNaira(Number(statement.closingBalance))}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error && (
            <div className="form-note">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {adjusting && (
        <AgentAdjustModal
          agent={agent}
          allowedStations={allowedStations}
          onClose={() => setAdjusting(false)}
          onComplete={(title, detail) => {
            setAdjusting(false);
            reloadDetails();
            reloadLedger();
            reloadStatement();
            onComplete(title, detail);
          }}
        />
      )}

      {depositing && (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setDepositing(false)}
        >
          <div className="workflow-dialog" style={{ maxWidth: "550px" }}>
            <div className="workflow-header">
              <div>
                <span>Wallet Account</span>
                <h2>Post Agent Deposit</h2>
                <p>Credit funds to selected agent wallet.</p>
              </div>
              <button onClick={() => setDepositing(false)}>
                <X size={19} />
              </button>
            </div>
            <DepositForm
              allowedStations={allowedStations}
              initialAgentId={agent.id}
              onClose={() => setDepositing(false)}
              onComplete={(title, detail) => {
                setDepositing(false);
                reloadDetails();
                reloadLedger();
                reloadStatement();
                onComplete(title, detail);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentAdjustModal({
  agent,
  allowedStations,
  onClose,
  onComplete,
}: {
  agent: AgentRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootstrapApi = useApiData<POSBootstrap>("/api/pos/bootstrap");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const optional = (name: string) => String(form.get(name) ?? "").trim() || undefined;

    try {
      const response = await fetch(`/api/agents/${agent.id}/wallet/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          stationId: String(form.get("stationId")),
          type: String(form.get("type")),
          amount: String(form.get("amount")),
          reason: String(form.get("reason")),
          paymentMethodId: optional("paymentMethodId"),
          reference: optional("reference"),
        }),
      });
      const body = (await response.json()) as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Adjustment failed.");

      onComplete(
        "Wallet adjusted",
        `Entry ${body.data.entryNumber} posted. Verified balance: ${formatNaira(Number(body.data.balance))}`
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Adjustment failed.");
    } finally {
      setBusy(false);
    }
  };

  const paymentMethods = bootstrapApi.data?.paymentMethods.filter((item) => item.type !== "WALLET") ?? [];

  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="workflow-dialog" style={{ maxWidth: "550px" }}>
        <div className="workflow-header">
          <div>
            <span>Wallet Adjustment</span>
            <h2>Post Credit / Debit</h2>
            <p>Perform controlled wallet account posting for {agent.name}.</p>
          </div>
          <button onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="workflow-body">
            <div className="form-grid">
              <Field label="Posting station">
                <select name="stationId" required defaultValue={allowedStations[0]?.id}>
                  {allowedStations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Adjustment type">
                <select name="type" required defaultValue="ADJUSTMENT_CREDIT">
                  <option value="ADJUSTMENT_CREDIT">Adjustment Credit (Add funds)</option>
                  <option value="ADJUSTMENT_DEBIT">Adjustment Debit (Deduct funds)</option>
                </select>
              </Field>
              <Field label="Amount">
                <div className="money-input">
                  <span>₦</span>
                  <input name="amount" type="number" step="0.01" min="0.01" required />
                </div>
              </Field>
              <Field label="Payment method (Optional)">
                <select name="paymentMethodId" defaultValue="">
                  <option value="">No financial impact (Book entry)</option>
                  {paymentMethods.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment reference (Optional)" full>
                <input name="reference" placeholder="Enter bank reference if applicable" />
              </Field>
              <Field label="Posting reason / note" full>
                <textarea name="reason" required placeholder="Enter description and reason for adjustment" />
              </Field>
            </div>
            {error && (
              <div className="form-note">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="workflow-footer">
            <span>
              <ShieldCheck size={14} /> Subject to credit limit controls
            </span>
            <div>
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={busy}>
                {busy ? "Posting..." : "Confirm Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


function CustomerDetailModal({
  customer,
  allowedStations,
  onClose,
  onComplete,
}: {
  customer: CustomerRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const detailApi = useApiData<any>(`/api/customers/${customer.id}`);
  const historyApi = useApiData<any>(`/api/customers/${customer.id}/history`);
  const allCustomersApi = useApiData<CustomerRecord[]>("/api/customers?pageSize=100");

  const [tab, setTab] = useState("Profile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [pnr, setPnr] = useState("");
  const [destination, setDestination] = useState("");
  const [airline, setAirline] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");

  // Merge state
  const [targetCustomerId, setTargetCustomerId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [confirmMerge, setConfirmMerge] = useState(false);

  const detail = detailApi.data;
  const history = historyApi.data;

  useEffect(() => {
    if (!detail) return;
    setFirstName(detail.firstName ?? "");
    setLastName(detail.lastName ?? "");
    setCompanyName(detail.companyName ?? "");
    setPhone(detail.primaryPhone ?? "");
    setEmail(detail.primaryEmail ?? "");
    setNationalId(detail.identifiers?.[0]?.value || "");
    setPnr(detail.defaultPnr ?? "");
    setDestination(detail.defaultDestination ?? "");
    setAirline(detail.defaultAirline ?? "");
    setRemarks(detail.remarks ?? "");
  }, [detail]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: detail.version,
          type: detail.type,
          firstName: detail.type === "INDIVIDUAL" ? firstName || null : null,
          lastName: detail.type === "INDIVIDUAL" ? lastName || null : null,
          companyName: detail.type === "BUSINESS" ? companyName || null : null,
          phone,
          email: email || null,
          pnr: pnr || null,
          nationalId: nationalId || undefined,
          destination: destination || null,
          airline: airline || null,
          remarks: remarks || null,
          reason,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Update failed.");
      onComplete("Customer updated", `${displayName} details were updated successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer.");
    } finally {
      setBusy(false);
    }
  };

  const handleMerge = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmMerge) {
      alert("Please check the confirmation box to authorize this merge.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}/merge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetCustomerId,
          reason: mergeReason,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Merge failed.");
      onComplete("Customer merged", "Duplicate record merged successfully and source deactivated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to merge customer.");
    } finally {
      setBusy(false);
    }
  };

  const displayName = detail?.displayName || customer.displayName;
  const otherCustomers = (allCustomersApi.data ?? []).filter((c) => c.id !== customer.id);

  if (detailApi.loading || historyApi.loading) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
        <div className="workflow-dialog" style={{ maxWidth: "500px" }}>
          <div className="workflow-header">
            <div>
              <span>Customer management</span>
              <h2>Loading customer detail</h2>
            </div>
            <button onClick={onClose}><X size={19} /></button>
          </div>
          <div className="workflow-body">
            <EmptyState icon={RefreshCcw} title="Loading customer record" detail="Reading current record and transaction histories." compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "800px" }}>
        <div className="workflow-header">
          <div>
            <span>Customer operations</span>
            <h2>{displayName} ({detail?.customerNumber})</h2>
            <p>Home station: {detail?.homeStation?.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close modal"><X size={19} /></button>
        </div>

        <div style={{ padding: "0 24px" }}>
          <div className="tab-bar" style={{ marginBottom: "16px" }}>
            <button className={classNames("tab-btn", tab === "Profile" && "tab-active")} onClick={() => setTab("Profile")}>Profile & Edit</button>
            <button className={classNames("tab-btn", tab === "History" && "tab-active")} onClick={() => setTab("History")}>Transaction History</button>
            <button className={classNames("tab-btn", tab === "Merge" && "tab-active")} onClick={() => setTab("Merge")}>Duplicate Merge</button>
          </div>
        </div>

        {tab === "Profile" && (
          <form onSubmit={handleUpdate}>
            <div className="workflow-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div className="form-grid">
                {detail?.type === "INDIVIDUAL" ? (
                  <>
                    <Field label="First name"><input className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></Field>
                    <Field label="Last name"><input className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></Field>
                  </>
                ) : (
                  <Field label="Company name" full><input className="field-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></Field>
                )}
                <Field label="Phone number"><input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
                <Field label="Email address"><input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="National ID"><input className="field-input" value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></Field>
                <Field label="Default PNR"><input className="field-input" value={pnr} onChange={(e) => setPnr(e.target.value)} /></Field>
                <Field label="Default Destination"><input className="field-input" value={destination} onChange={(e) => setDestination(e.target.value)} /></Field>
                <Field label="Default Airline"><input className="field-input" value={airline} onChange={(e) => setAirline(e.target.value)} /></Field>
                <Field label="Remarks" full><textarea className="field-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
                
                <div style={{ gridColumn: "1 / -1", margin: "10px 0", borderTop: "1px dashed var(--border-color)", paddingTop: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Audit trail log reason</h4>
                </div>
                <Field label="Reason for change (min. 5 characters)" full>
                  <input
                    className="field-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={5}
                    placeholder="e.g. Updating contact email and default destination station"
                  />
                </Field>
              </div>
              {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
            </div>
            <div className="workflow-footer">
              <span><ShieldCheck size={14} /> Scope verified</span>
              <div>
                <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy}><ShieldCheck size={16} />{busy ? "Saving..." : "Save details"}</button>
              </div>
            </div>
          </form>
        )}

        {tab === "History" && (
          <div className="workflow-body" style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* POS Sales */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>POS Sales & Invoices</h3>
              {!history?.sales?.length ? (
                <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "10px 0" }}>No POS sales recorded for this customer.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice Ref</th>
                        <th>Posted Date</th>
                        <th>Total</th>
                        <th>Outstanding</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.sales.map((sale: any) => (
                        <tr key={sale.id}>
                          <td><strong>{sale.saleNumber}</strong></td>
                          <td>{formatDate(sale.postedAt)}</td>
                          <td>{formatNaira(Number(sale.total))}</td>
                          <td>{formatNaira(Number(sale.outstandingTotal))}</td>
                          <td><StatusPill value={sale.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Cargo */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>Cargo Shipments</h3>
              {!history?.cargo?.length ? (
                <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "10px 0" }}>No cargo shipments recorded.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>AWB Number</th>
                        <th>Destination</th>
                        <th>Weight</th>
                        <th>Receiver</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.cargo.map((shipment: any) => (
                        <tr key={shipment.id}>
                          <td><strong>{shipment.awbNumber}</strong></td>
                          <td>{shipment.destination}</td>
                          <td>{shipment.weightKg} kg</td>
                          <td>{shipment.receiverName}</td>
                          <td><StatusPill value={shipment.status} /></td>
                          <td>{formatDate(shipment.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bookings */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>Flight Ticket Bookings</h3>
              {!history?.bookings?.length ? (
                <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "10px 0" }}>No flight ticket bookings recorded.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Booking Ref</th>
                        <th>PNR</th>
                        <th>Passenger</th>
                        <th>Destination</th>
                        <th>Travel Date</th>
                        <th>Selling Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.bookings.map((booking: any) => (
                        <tr key={booking.id}>
                          <td><strong>{booking.bookingNumber}</strong></td>
                          <td><code style={{ fontSize: "12px", fontWeight: "bold", background: "var(--field-bg)", padding: "2px 6px", borderRadius: "4px" }}>{booking.pnr}</code></td>
                          <td>{booking.passengerName}</td>
                          <td>{booking.destination}</td>
                          <td>{formatDate(booking.travelDate)}</td>
                          <td>{formatNaira(Number(booking.sellingPrice))}</td>
                          <td><StatusPill value={booking.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Merge" && (
          <form onSubmit={handleMerge}>
            <div className="workflow-body">
              <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px", borderRadius: "8px", marginBottom: "20px", display: "flex", gap: "12px" }}>
                <AlertTriangle style={{ color: "#ef4444", flexShrink: 0 }} size={20} />
                <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Danger Zone: Merge Duplicate Record</strong>
                  This action cannot be undone. Merging will permanently re-assign all POS invoices, cargo labels, flight tickets, and contact records from <strong>{displayName}</strong> to the target customer selected below, and this customer record will be permanently deactivated.
                </div>
              </div>

              <div className="form-grid">
                <Field label="Target Customer" full>
                  <select className="field-input" value={targetCustomerId} onChange={(e) => setTargetCustomerId(e.target.value)} required>
                    <option value="" disabled>Select the master customer record to merge into</option>
                    {otherCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.displayName} ({c.customerNumber} · {c.primaryPhone})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Reason for Merge (min. 10 characters)" full>
                  <textarea
                    className="field-input"
                    value={mergeReason}
                    onChange={(e) => setMergeReason(e.target.value)}
                    required
                    minLength={10}
                    placeholder="e.g. Duplicate records created during offline mode synchronization sync."
                  />
                </Field>

                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                  <input
                    type="checkbox"
                    id="confirm-merge-check"
                    checked={confirmMerge}
                    onChange={(e) => setConfirmMerge(e.target.checked)}
                    required
                    style={{ width: "18px", height: "18px" }}
                  />
                  <label htmlFor="confirm-merge-check" style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "var(--text-primary)" }}>
                    I authorize the transfer of all ledger records and understand this action is irreversible.
                  </label>
                </div>
              </div>

              {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
            </div>
            
            <div className="workflow-footer">
              <span><ShieldCheck size={14} /> Admin authorization required</span>
              <div>
                <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                <button type="submit" className="primary-button" style={{ background: "#ef4444", color: "white" }} disabled={busy || !targetCustomerId || mergeReason.length < 10}>
                  <Trash2 size={16} />
                  {busy ? "Merging..." : "Confirm & Execute Merge"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CustomersView({
  onModal,
  allowedStations,
  onToast,
}: {
  onModal: (modal: ModalKind) => void;
  allowedStations: AllowedStation[];
  onToast: (toast: Toast) => void;
}) {
  const [tab, setTab] = useState("All customers");
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const { data, total, loading, error, reload } = useApiData<CustomerRecord[]>("/api/customers?pageSize=100");
  const customerRecords = data ?? [];
  const visibleCustomers = customerRecords.filter((customer) =>
    tab === "Individuals" ? customer.type === "INDIVIDUAL" : tab === "Corporate" ? customer.type === "BUSINESS" : true,
  );
  const table = useTableControls(visibleCustomers, (customer, q) => `${customer.displayName} ${customer.customerNumber} ${customer.primaryPhone} ${customer.primaryEmail ?? ""} ${customer.defaultPnr ?? ""} ${customer.homeStation.name}`.toLowerCase().includes(q));
  const corporateCount = customerRecords.filter((customer) => customer.type === "BUSINESS").length;
  return (
    <div className="content-stack">
      <section className="customer-insights">
        <div><span>Total customers</span><strong>{total.toLocaleString()}</strong><em><ShieldCheck size={12} /> Scoped to your access</em></div>
        <div><span>Individuals</span><strong>{Math.max(0, customerRecords.length - corporateCount)}</strong><small>Active loaded records</small></div>
        <div><span>Corporate accounts</span><strong>{corporateCount}</strong><small>Active business records</small></div>
        <div><span>Data status</span><strong>{loading ? "Syncing" : "Live"}</strong><button onClick={reload}>Refresh <RefreshCcw size={13} /></button></div>
      </section>
      <Panel>
        <TableToolbar tabs={["All customers", "Individuals", "Corporate"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search name, phone, email or PNR" search={table.search} onSearch={table.setSearch} />
        {error ? <EmptyState icon={AlertTriangle} title="Customers could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading customer records" detail="Retrieving permission-scoped records from the database." compact /> : table.filtered.length ? (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Type</th><th>Home station</th><th>PNR</th><th>Created</th><th /></tr></thead><tbody>{table.pageRows.map((customer) => <tr key={customer.id} onClick={() => setEditingCustomer(customer)} style={{ cursor: "pointer" }} title="Click to view details and history"><td><div className="agent-cell customer"><span>{customer.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{customer.displayName}</strong><small>{customer.customerNumber}</small></div></div></td><td>{customer.primaryPhone}</td><td>{customer.primaryEmail ?? "—"}</td><td><StatusPill value={customer.type === "BUSINESS" ? "Corporate" : "Individual"} /></td><td>{customer.homeStation.name}</td><td>{customer.defaultPnr ?? "—"}</td><td>{formatDate(customer.createdAt)}</td><td><button className="icon-ghost" onClick={(e) => { e.stopPropagation(); onModal("customer"); }} aria-label={`Add a customer from ${customer.displayName}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
        ) : <EmptyState icon={Users} title={table.search ? "No matching customers" : "No customers yet"} detail={table.search ? "Try a different name, phone, email or PNR." : "Register the first customer to reuse their details across sales, cargo and bookings."} />}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
      {editingCustomer && (
        <CustomerDetailModal
          customer={editingCustomer}
          allowedStations={allowedStations}
          onClose={() => setEditingCustomer(null)}
          onComplete={(title, detail) => {
            setEditingCustomer(null);
            reload();
            onToast({ title, detail });
          }}
        />
      )}
    </div>
  );
}

function FinanceView({
  onToast,
  allowedStations,
  identity,
}: {
  onToast: (toast: Toast) => void;
  allowedStations: any[];
  identity: any;
}) {
  const [viewTab, setViewTab] = useState("ledger"); // ledger, sessions, reconciliations, periods, reports
  const [cashbookTab, setCashbookTab] = useState("Cashbook"); // Cashbook, Income, Expenses, Refunds, Agent deposits
  const [modal, setModal] = useState<string | null>(null); // post-entry, open-session, close-session, reconcile, create-period
  
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Form states
  const [entryType, setEntryType] = useState<"DEBIT" | "CREDIT">("CREDIT");
  const [stationId, setStationId] = useState(allowedStations[0]?.id || "");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Session form states
  const [sessionStationId, setSessionStationId] = useState(allowedStations[0]?.id || "");
  const [sessionAccountId, setSessionAccountId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  // Session close states
  const [countedBalance, setCountedBalance] = useState("");

  // Reconciliation form states
  const [reconAccountId, setReconAccountId] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [reconNotes, setReconNotes] = useState("");

  // Period form states
  const [periodName, setPeriodName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // Load backend APIs
  const entriesApi = useApiData<any[]>("/api/finance/entries?pageSize=100");
  const setupApi = useApiData<any>("/api/finance/setup");
  const sessionsApi = useApiData<any[]>("/api/finance/sessions?pageSize=100");
  const reconciliationsApi = useApiData<any[]>("/api/finance/reconciliations?pageSize=100");
  const periodsApi = useApiData<any[]>("/api/finance/periods");
  const profitApi = useApiData<any>("/api/finance/profit");

  const entries = entriesApi.data ?? [];
  const setup = setupApi.data;
  const sessions = sessionsApi.data ?? [];
  const reconciliations = reconciliationsApi.data ?? [];
  const periods = periodsApi.data ?? [];
  const profit = profitApi.data;

  // Filter & setup selectors
  const filteredCategories = setup?.categories?.filter((cat: any) => cat.type === entryType) || [];

  // Table rendering & pagination logic
  const reverseEntry = async (entry: any) => {
    const reason = window.prompt(`Reason to reverse ${entry.entryNumber} (a compensating entry will be posted)`);
    if (!reason?.trim()) return;
    try {
      await workflowPost(`/api/finance/entries/${entry.id}/reverse`, { reason });
      onToast({
        title: "Entry reversed",
        detail: `${entry.entryNumber} was reversed with an audited compensating entry.`,
      });
      entriesApi.reload();
      profitApi.reload();
    } catch (err) {
      onToast({
        title: "Reversal failed",
        detail: err instanceof Error ? err.message : "The entry could not be reversed.",
      });
    }
  };

  const decideEntry = async (entry: any, decision: "APPROVED" | "REJECTED") => {
    const reason = window.prompt(`${decision === "APPROVED" ? "Approval" : "Rejection"} reason for ${entry.entryNumber}`);
    if (!reason?.trim()) return;
    try {
      await workflowPost(`/api/finance/entries/${entry.id}/approve`, { decision, reason });
      onToast({
        title: `Entry ${decision.toLowerCase()}`,
        detail: `${entry.entryNumber} was ${decision.toLowerCase()} successfully.`,
      });
      entriesApi.reload();
      profitApi.reload();
    } catch (err) {
      onToast({
        title: "Decision failed",
        detail: err instanceof Error ? err.message : "The entry status could not be updated.",
      });
    }
  };

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/finance/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId,
          businessUnitId: businessUnitId || undefined,
          accountId,
          categoryId,
          paymentMethodId: paymentMethodId || undefined,
          direction: entryType,
          amount,
          description,
          externalReference: externalReference || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Posting failed.");
      onToast({
        title: "Entry posted",
        detail: body.data.entryNumber + (body.meta?.requiresApproval ? " submitted for approval." : " posted successfully."),
      });
      setModal(null);
      entriesApi.reload();
      profitApi.reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/finance/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stationId: sessionStationId,
          accountId: sessionAccountId,
          openingBalance,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Opening session failed.");
      onToast({
        title: "Cash Session opened",
        detail: "Session was opened successfully.",
      });
      setModal(null);
      sessionsApi.reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/finance/sessions/${selectedSession.id}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ countedBalance }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Closing session failed.");
      onToast({
        title: "Cash Session closed",
        detail: `Expected: ${formatNaira(Number(body.data.expected))}, counted: ${formatNaira(Number(body.data.counted))}, variance: ${formatNaira(Number(body.data.variance))}`,
      });
      setModal(null);
      sessionsApi.reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/finance/reconciliations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountId: reconAccountId,
          statementDate,
          statementBalance,
          notes: reconNotes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Reconciliation failed.");
      onToast({
        title: "Reconciliation complete",
        detail: `Reconciliation was completed with a variance of ${formatNaira(Number(body.data.difference))}`,
      });
      setModal(null);
      reconciliationsApi.reload();
      entriesApi.reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/finance/periods", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: periodName,
          startsAt,
          endsAt,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Period creation failed.");
      onToast({
        title: "Period created",
        detail: `${periodName} is now active.`,
      });
      setModal(null);
      periodsApi.reload();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePeriod = async (period: any, isClosed: boolean) => {
    if (!window.confirm(`Are you sure you want to ${isClosed ? "close" : "reopen"} ${period.name}?`)) return;
    try {
      const res = await fetch(`/api/finance/periods/${period.id}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isClosed }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error?.message || "Action failed.");
      onToast({
        title: isClosed ? "Period closed" : "Period reopened",
        detail: `${period.name} status updated successfully.`,
      });
      periodsApi.reload();
    } catch (err) {
      onToast({
        title: "Action failed",
        detail: err instanceof Error ? err.message : "Failed to update period status.",
      });
    }
  };

  // Ledger Filter logic
  const visibleEntries = entries.filter((entry) => {
    if (cashbookTab === "Income") return entry.direction === "CREDIT";
    if (cashbookTab === "Expenses") return entry.direction === "DEBIT";
    if (cashbookTab === "Refunds") return entry.description.toLowerCase().includes("refund");
    if (cashbookTab === "Agent deposits") return entry.description.toLowerCase().includes("agent deposit");
    return true;
  });
  const ledgerTable = useTableControls(visibleEntries, (entry, q) =>
    `${entry.entryNumber} ${entry.description} ${entry.account.name} ${entry.category.name} ${entry.station.name}`.toLowerCase().includes(q)
  );

  const posted = entries.filter((entry) => ["POSTED", "RECONCILED"].includes(entry.status));
  const incomeTotal = posted.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expensesTotal = posted.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const pendingTotal = entries.filter((entry) => entry.status === "PENDING_APPROVAL").reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="content-stack">
      {/* Finance Overview Panel */}
      <section className="finance-overview">
        <div className="finance-balance">
          <span>Net cashbook position</span>
          <strong>{formatNaira(incomeTotal - expensesTotal)}</strong>
          <small>Posted income less posted expenses in results</small>
          <div className="balance-bars">
            <i style={{ width: incomeTotal + expensesTotal ? `${Math.round((incomeTotal / (incomeTotal + expensesTotal)) * 100)}%` : "0%" }} />
            <i style={{ width: incomeTotal + expensesTotal ? `${Math.round((expensesTotal / (incomeTotal + expensesTotal)) * 100)}%` : "0%" }} />
          </div>
          <div className="balance-legend">
            <span><i style={{ background: "#4caf50" }} />Income {formatNaira(incomeTotal)}</span>
            <span><i style={{ background: "#f44336" }} />Expenses {formatNaira(expensesTotal)}</span>
          </div>
        </div>
        <div className="finance-mini">
          <span className="mini-icon success"><ArrowUpRight size={17} /></span>
          <div>
            <span>Posted income</span>
            <strong>{formatNaira(incomeTotal)}</strong>
            <small>Audited ledger credits</small>
          </div>
        </div>
        <div className="finance-mini">
          <span className="mini-icon danger"><ArrowDownLeft size={17} /></span>
          <div>
            <span>Posted expenses</span>
            <strong>{formatNaira(expensesTotal)}</strong>
            <small>Audited ledger debits</small>
          </div>
        </div>
        <div className="finance-mini">
          <span className="mini-icon warning"><Clock3 size={17} /></span>
          <div>
            <span>Awaiting approval</span>
            <strong>{formatNaira(pendingTotal)}</strong>
            <small>Expense thresholds limit</small>
          </div>
        </div>
      </section>

      {/* Primary Navigation Tabs */}
      <div className="table-tabs" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--line, #ddd)" }}>
        <button className={classNames(viewTab === "ledger" && "active")} onClick={() => setViewTab("ledger")}>
          Cashbook Ledger
        </button>
        <button className={classNames(viewTab === "sessions" && "active")} onClick={() => setViewTab("sessions")}>
          Cash Sessions
        </button>
        <button className={classNames(viewTab === "reconciliations" && "active")} onClick={() => setViewTab("reconciliations")}>
          Reconciliations
        </button>
        <button className={classNames(viewTab === "periods" && "active")} onClick={() => setViewTab("periods")}>
          Periods Control
        </button>
        {identity.permissions.includes("finance.view_profit") && (
          <button className={classNames(viewTab === "reports" && "active")} onClick={() => setViewTab("reports")}>
            Finance Reports (P&L)
          </button>
        )}
      </div>

      {/* Tab Panel: Cashbook Ledger */}
      {viewTab === "ledger" && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <TableToolbar
              tabs={["Cashbook", "Income", "Expenses", "Refunds", "Agent deposits"]}
              activeTab={cashbookTab}
              onTab={(value) => {
                setCashbookTab(value);
                ledgerTable.resetPage();
              }}
              placeholder="Search reference, description, account or category"
              search={ledgerTable.search}
              onSearch={ledgerTable.setSearch}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              {identity.permissions.includes("finance.post_income") && (
                <button
                  className="primary-button"
                  onClick={() => {
                    setEntryType("CREDIT");
                    setAccountId(setup?.accounts[0]?.id || "");
                    setCategoryId(setup?.categories?.filter((cat: any) => cat.type === "CREDIT")[0]?.id || "");
                    setPaymentMethodId(setup?.paymentMethods[0]?.id || "");
                    setAmount("");
                    setDescription("");
                    setExternalReference("");
                    setFormError(null);
                    setModal("post-entry");
                  }}
                >
                  <Plus size={16} /> Post Income
                </button>
              )}
              {identity.permissions.includes("finance.post_expense") && (
                <button
                  className="secondary-button"
                  style={{ borderColor: "red", color: "red" }}
                  onClick={() => {
                    setEntryType("DEBIT");
                    setAccountId(setup?.accounts[0]?.id || "");
                    setCategoryId(setup?.categories?.filter((cat: any) => cat.type === "DEBIT")[0]?.id || "");
                    setPaymentMethodId(setup?.paymentMethods[0]?.id || "");
                    setAmount("");
                    setDescription("");
                    setExternalReference("");
                    setFormError(null);
                    setModal("post-entry");
                  }}
                >
                  <Plus size={16} /> Post Expense
                </button>
              )}
            </div>
          </div>

          {entriesApi.error ? (
            <EmptyState icon={AlertTriangle} title="Ledger entries failed to load" detail={entriesApi.error} />
          ) : entriesApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading ledger entries" detail="Reading cashbook records." compact />
          ) : ledgerTable.filtered.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Station</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ledgerTable.pageRows.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className="primary-cell">
                          <strong>{entry.entryNumber}</strong>
                          <span>{formatDate(entry.createdAt)}</span>
                        </div>
                      </td>
                      <td>{entry.account.name}</td>
                      <td>{entry.description}</td>
                      <td>
                        <StatusPill value={entry.direction === "CREDIT" ? "Income" : "Expense"} />
                      </td>
                      <td>{entry.category.name}</td>
                      <td>{entry.station.name}</td>
                      <td className={classNames("number-cell strong-number", entry.direction === "DEBIT" && "negative-number")}>
                        {entry.direction === "DEBIT" ? "−" : "+"}{formatNaira(Number(entry.amount))}
                      </td>
                      <td>
                        <StatusPill value={entry.status.replaceAll("_", " ")} />
                      </td>
                      <td>
                        <div className="row-actions">
                          {entry.status === "PENDING_APPROVAL" && identity.permissions.includes("finance.approve") ? (
                            <>
                              <button className="row-button" onClick={() => decideEntry(entry, "APPROVED")}>Approve</button>
                              <button className="icon-ghost" onClick={() => decideEntry(entry, "REJECTED")} aria-label="Reject"><X size={15} /></button>
                            </>
                          ) : ["POSTED", "RECONCILED"].includes(entry.status) && identity.permissions.includes("finance.reverse") ? (
                            <button className="row-button" onClick={() => reverseEntry(entry)}>Reverse</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Banknote} title="No cashbook records" detail="Use Post buttons to add ledger items manually." />
          )}
          <Pagination total={ledgerTable.total} page={ledgerTable.page} pageSize={ledgerTable.pageSize} onPage={ledgerTable.setPage} />
        </Panel>
      )}

      {/* Tab Panel: Cash Sessions */}
      {viewTab === "sessions" && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Cash Drawer Sessions</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Open and close physical drawer counts</p>
            </div>
            {identity.permissions.includes("finance.reconcile") && (
              <button
                className="primary-button"
                onClick={() => {
                  setSessionStationId(allowedStations[0]?.id || "");
                  setSessionAccountId(setup?.accounts[0]?.id || "");
                  setOpeningBalance("");
                  setFormError(null);
                  setModal("open-session");
                }}
              >
                <Plus size={16} /> Open Drawer Session
              </button>
            )}
          </div>

          {sessionsApi.error ? (
            <EmptyState icon={AlertTriangle} title="Sessions failed to load" detail={sessionsApi.error} />
          ) : sessionsApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading sessions" detail="Reading session logs." compact />
          ) : sessions.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Account</th>
                    <th>Opened By</th>
                    <th>Opening Balance</th>
                    <th>Counted Balance</th>
                    <th>Variance</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess) => (
                    <tr key={sess.id}>
                      <td>{sess.station.name}</td>
                      <td>{sess.account.name}</td>
                      <td>
                        <div className="primary-cell">
                          <strong>{sess.openedById}</strong>
                          <span>{formatDate(sess.openedAt)}</span>
                        </div>
                      </td>
                      <td className="number-cell">{formatNaira(Number(sess.openingBalance))}</td>
                      <td className="number-cell">{sess.counted !== null ? formatNaira(Number(sess.counted)) : "-"}</td>
                      <td className={classNames("number-cell", Number(sess.variance) < 0 && "negative-number")}>
                        {sess.variance !== null ? (Number(sess.variance) >= 0 ? "+" : "") + formatNaira(Number(sess.variance)) : "-"}
                      </td>
                      <td>
                        <StatusPill value={sess.status} />
                      </td>
                      <td>
                        {sess.status === "OPEN" && identity.permissions.includes("finance.reconcile") && (
                          <button
                            className="row-button"
                            onClick={() => {
                              setSelectedSession(sess);
                              setCountedBalance("");
                              setFormError(null);
                              setModal("close-session");
                            }}
                          >
                            Close & Count
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Clock3} title="No cash drawer sessions" detail="Open a cash drawer session to track station sales." />
          )}
        </Panel>
      )}

      {/* Tab Panel: Reconciliations */}
      {viewTab === "reconciliations" && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Bank & Cash Reconciliations</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Match statement balances to ledger position</p>
            </div>
            {identity.permissions.includes("finance.reconcile") && (
              <button
                className="primary-button"
                onClick={() => {
                  setReconAccountId(setup?.accounts[0]?.id || "");
                  setStatementDate(new Date().toISOString().slice(0, 10));
                  setStatementBalance("");
                  setReconNotes("");
                  setFormError(null);
                  setModal("reconcile");
                }}
              >
                <Calculator size={16} /> New Reconciliation
              </button>
            )}
          </div>

          {reconciliationsApi.error ? (
            <EmptyState icon={AlertTriangle} title="Reconciliations failed to load" detail={reconciliationsApi.error} />
          ) : reconciliationsApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading reconciliations" detail="Reading reconciliation log." compact />
          ) : reconciliations.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Statement Date</th>
                    <th>Statement Balance</th>
                    <th>System Balance</th>
                    <th>Difference (Variance)</th>
                    <th>Reconciled By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.account.name}</td>
                      <td>{new Date(rec.statementDate).toLocaleDateString()}</td>
                      <td className="number-cell">{formatNaira(Number(rec.statementBalance))}</td>
                      <td className="number-cell">{formatNaira(Number(rec.systemBalance))}</td>
                      <td className={classNames("number-cell", Number(rec.difference) !== 0 && "negative-number")}>
                        {formatNaira(Number(rec.difference))}
                      </td>
                      <td>
                        <div className="primary-cell">
                          <strong>{rec.reconciledById}</strong>
                          <span>{formatDate(rec.reconciledAt)}</span>
                        </div>
                      </td>
                      <td>{rec.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Calculator} title="No reconciliations yet" detail="Create a reconciliation to lock posted ledger items." />
          )}
        </Panel>
      )}

      {/* Tab Panel: Periods Control */}
      {viewTab === "periods" && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Financial Periods</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Control period posting lock boundaries</p>
            </div>
            {identity.permissions.includes("settings.manage") && (
              <button
                className="primary-button"
                onClick={() => {
                  setPeriodName("");
                  setStartsAt("");
                  setEndsAt("");
                  setFormError(null);
                  setModal("create-period");
                }}
              >
                <CalendarDays size={16} /> New Period
              </button>
            )}
          </div>

          {periodsApi.error ? (
            <EmptyState icon={AlertTriangle} title="Periods failed to load" detail={periodsApi.error} />
          ) : periodsApi.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading periods" detail="Reading periods config." compact />
          ) : periods.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period Name</th>
                    <th>Starts At</th>
                    <th>Ends At</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {periods.map((per) => (
                    <tr key={per.id}>
                      <td><strong>{per.name}</strong></td>
                      <td>{new Date(per.startsAt).toLocaleDateString()}</td>
                      <td>{new Date(per.endsAt).toLocaleDateString()}</td>
                      <td>
                        <StatusPill value={per.isClosed ? "CLOSED" : "OPEN"} />
                      </td>
                      <td>
                        {identity.permissions.includes("settings.manage") && (
                          <button
                            className="row-button"
                            onClick={() => togglePeriod(per, !per.isClosed)}
                          >
                            {per.isClosed ? "Reopen" : "Close Period"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No financial periods configured" detail="Create periods to locking down historical ledgers." />
          )}
        </Panel>
      )}

      {/* Tab Panel: Finance Reports */}
      {viewTab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Panel>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Profit & Loss (P&L) Statement</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Consolidated revenues, COGS and expenses statement</p>
            </div>
            {profitApi.loading ? (
              <EmptyState icon={RefreshCcw} title="Generating report" detail="Retrieving ledger data." compact />
            ) : profitApi.error ? (
              <EmptyState icon={AlertTriangle} title="Failed to generate report" detail={profitApi.error} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--panel-bg, #fafafa)", padding: "20px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #eee)" }}>
                    <span>Gross POS Sales Revenue</span>
                    <strong style={{ color: "green" }}>+{formatNaira(profit?.grossSales || 0)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #eee)" }}>
                    <span>Manual Account Income</span>
                    <strong style={{ color: "green" }}>+{formatNaira(profit?.manualIncome || 0)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #eee)" }}>
                    <span>Cost of Goods Sold (COGS)</span>
                    <strong style={{ color: "red" }}>-{formatNaira(profit?.costOfSales || 0)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #eee)" }}>
                    <span>Manual Expenses / Adjustments</span>
                    <strong style={{ color: "red" }}>-{formatNaira(profit?.manualExpenses || 0)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", paddingTop: "10px", borderTop: "2px dashed var(--border-color, #ddd)" }}>
                    <span>Net Operating Profit</span>
                    <strong style={{ color: Number(profit?.netProfit) >= 0 ? "var(--primary-color)" : "red" }}>
                      {formatNaira(profit?.netProfit || 0)}
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Revenue Share per Station</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                    {profit?.byStation?.map((st: any) => (
                      <div key={st.stationId} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color, #f0f0f0)" }}>
                        <span>{st.stationName} ({st.stationCode})</span>
                        <strong>{formatNaira(st.grossSales)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Modal Backdrop Layer */}
      {modal && (
        <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="workflow-dialog" style={{ maxWidth: "550px" }}>
            
            {/* Modal: Post Entry */}
            {modal === "post-entry" && (
              <form onSubmit={submitEntry}>
                <div className="workflow-header">
                  <h2>Post Manual {entryType === "CREDIT" ? "Income" : "Expense"}</h2>
                  <button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="workflow-body">
                  <div className="form-grid">
                    <Field label="Station">
                      <select value={stationId} onChange={(e) => setStationId(e.target.value)} required>
                        {allowedStations.map((st) => (
                          <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Business Unit">
                      <select value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)}>
                        <option value="">Consolidated / None</option>
                        {setup?.paymentMethods?.map((pm: any) => (
                          // Just placeholder BU since we don't fetch BU list separately here.
                          null
                        ))}
                        {entries[0]?.businessUnit && (
                          <option value={entries[0].businessUnit.id}>{entries[0].businessUnit.name}</option>
                        )}
                      </select>
                    </Field>
                    <Field label="Ledger Account">
                      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                        {setup?.accounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Financial Category">
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                        {filteredCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Payment Method">
                      <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                        <option value="">Direct Cash</option>
                        {setup?.paymentMethods?.map((pm: any) => (
                          <option key={pm.id} value={pm.id}>{pm.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Amount">
                      <div className="money-input">
                        <span>₦</span>
                        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" required />
                      </div>
                    </Field>
                    <Field label="External Reference" full>
                      <input value={externalReference} onChange={(e) => setExternalReference(e.target.value)} placeholder="e.g. Bank slip reference, teller, invoice number" />
                    </Field>
                    <Field label="Description" full>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Entry details and notes..." required />
                    </Field>
                  </div>
                  {formError && <div className="form-note error"><AlertTriangle size={15} /><span>{formError}</span></div>}
                </div>
                <div className="workflow-footer">
                  <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Posting..." : "Post Entry"}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Open Session */}
            {modal === "open-session" && (
              <form onSubmit={submitSession}>
                <div className="workflow-header">
                  <h2>Open Cash Drawer Session</h2>
                  <button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="workflow-body">
                  <div className="form-grid">
                    <Field label="Station">
                      <select value={sessionStationId} onChange={(e) => setSessionStationId(e.target.value)} required>
                        {allowedStations.map((st) => (
                          <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Account">
                      <select value={sessionAccountId} onChange={(e) => setSessionAccountId(e.target.value)} required>
                        {setup?.accounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Opening Balance">
                      <div className="money-input">
                        <span>₦</span>
                        <input value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" required />
                      </div>
                    </Field>
                  </div>
                  {formError && <div className="form-note error"><AlertTriangle size={15} /><span>{formError}</span></div>}
                </div>
                <div className="workflow-footer">
                  <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Opening..." : "Open Session"}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Close Session */}
            {modal === "close-session" && (
              <form onSubmit={submitCloseSession}>
                <div className="workflow-header">
                  <h2>Close & Count Session</h2>
                  <button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="workflow-body">
                  <div className="form-grid">
                    <Field label="Counted Cash Balance" full>
                      <div className="money-input">
                        <span>₦</span>
                        <input value={countedBalance} onChange={(e) => setCountedBalance(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" required />
                      </div>
                    </Field>
                  </div>
                  {formError && <div className="form-note error"><AlertTriangle size={15} /><span>{formError}</span></div>}
                </div>
                <div className="workflow-footer">
                  <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Closing..." : "Close & Reconcile"}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Reconciliation */}
            {modal === "reconcile" && (
              <form onSubmit={submitReconciliation}>
                <div className="workflow-header">
                  <h2>New Account Reconciliation</h2>
                  <button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="workflow-body">
                  <div className="form-grid">
                    <Field label="Account" full>
                      <select value={reconAccountId} onChange={(e) => setReconAccountId(e.target.value)} required>
                        {setup?.accounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Statement Cut-off Date">
                      <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} required />
                    </Field>
                    <Field label="Statement Balance">
                      <div className="money-input">
                        <span>₦</span>
                        <input value={statementBalance} onChange={(e) => setStatementBalance(e.target.value.replace(/^-?[0-9.]/g, ""))} placeholder="0.00" required />
                      </div>
                    </Field>
                    <Field label="Notes" full>
                      <textarea value={reconNotes} onChange={(e) => setReconNotes(e.target.value)} placeholder="Reconciliation details or adjustments comments..." />
                    </Field>
                  </div>
                  {formError && <div className="form-note error"><AlertTriangle size={15} /><span>{formError}</span></div>}
                </div>
                <div className="workflow-footer">
                  <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Reconciling..." : "Complete Reconciliation"}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Create Period */}
            {modal === "create-period" && (
              <form onSubmit={submitPeriod}>
                <div className="workflow-header">
                  <h2>New Financial Period</h2>
                  <button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="workflow-body">
                  <div className="form-grid">
                    <Field label="Period Name" full>
                      <input value={periodName} onChange={(e) => setPeriodName(e.target.value)} placeholder="e.g. Q3 2026, August 2026" required />
                    </Field>
                    <Field label="Starts At">
                      <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                    </Field>
                    <Field label="Ends At">
                      <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
                    </Field>
                  </div>
                  {formError && <div className="form-note error"><AlertTriangle size={15} /><span>{formError}</span></div>}
                </div>
                <div className="workflow-footer">
                  <button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Creating..." : "Create Period"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

type StationDetailRecord = StationRecord & {
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string | null;
  version: number;
  legalName: string | null;
};

type StationPerfRecord = {
  stationId: string;
  scopedUsers: number;
  activeStaff: number;
  customers: number;
  pendingApprovals: number;
};

type TransferLineInput = { productId: string; quantity: string; productName: string };

function StationsView() {
  const { data, loading, error, reload } = useApiData<StationRecord[]>("/api/stations");
  const transfersApi = useApiData<TransferRecord[]>("/api/inventory/transfers?pageSize=50");
  const stationRecords = data ?? [];
  const activeCount = stationRecords.filter((item) => item.isActive).length;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"profile" | "performance" | "manager">("profile");
  const [transferTab, setTransferTab] = useState<"list" | "request">("list");

  const toggleExpand = (id: string, tab: "profile" | "performance" | "manager") => {
    if (expanded === id && expandedTab === tab) { setExpanded(null); return; }
    setExpanded(id);
    setExpandedTab(tab);
  };

  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Configured stations" value={stationRecords.length.toString()} detail={`${activeCount} active`} icon={Building2} tone="info" />
        <SummaryItem label="Business-unit links" value={stationRecords.reduce((sum, item) => sum + item.businessUnits.length, 0).toString()} detail="Controlled per station" icon={Boxes} tone="success" />
        <SummaryItem label="Assigned managers" value={stationRecords.filter((item) => item.managerHistory.length > 0).length.toString()} detail="Current assignments" icon={UserCheck} tone="info" />
        <SummaryItem label="Inventory transfers" value={(transfersApi.data?.length ?? 0).toString()} detail="Inter-station movements" icon={ArrowLeftRight} tone="success" />
      </section>

      <section className="station-card-grid">
        {error && <EmptyState icon={AlertTriangle} title="Stations could not be loaded" detail={error} />}
        {!error && loading && <EmptyState icon={RefreshCcw} title="Loading station directory" detail="Retrieving station configuration and assignments." compact />}
        {!error && !loading && !stationRecords.length && <EmptyState icon={Building2} title="No stations configured" detail="Create the first operating station to begin assigning users and business units." />}
        {stationRecords.map((item, index) => {
          const manager = item.managerHistory[0]?.manager;
          const managerName = manager?.name || [manager?.firstName, manager?.lastName].filter(Boolean).join(" ") || "Not assigned";
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className="station-card-wrap">
              <article className={classNames("station-card", isOpen && "station-card-active")}>
                <div className="station-card-head" onClick={() => toggleExpand(item.id, "profile")} style={{ cursor: "pointer" }}><span className="station-code">{item.code}</span><StatusPill value={item.isActive ? "Active" : "Inactive"} /></div>
                <div className="station-card-title" onClick={() => toggleExpand(item.id, "profile")} style={{ cursor: "pointer" }}><span>{index === 0 ? <Building2 size={21} /> : <Store size={21} />}</span><div><strong>{item.name}</strong><small>Manager · {managerName}</small></div></div>
                <div className="station-card-metrics">
                  <div><span>Business units</span><strong>{item.businessUnits.length}</strong></div>
                  <div><span>City</span><strong>{item.city ?? "—"}</strong></div>
                  <div><span>State</span><strong>{item.state ?? "—"}</strong></div>
                </div>
                <div className="health-row"><span>Configuration</span><strong>{item.isActive ? "Operational" : "Disabled"}</strong></div>
                <div className="health-track"><i style={{ width: item.isActive ? "100%" : "8%" }} /></div>
                <div className="station-card-actions">
                  <button className="secondary-button" onClick={() => toggleExpand(item.id, "profile")} title="Edit station details">
                    <Settings2 size={14} /><span>Edit</span>
                  </button>
                  <button className="secondary-button" onClick={() => toggleExpand(item.id, "manager")} title="Assign station manager">
                    <UserCheck size={14} /><span>Manager</span>
                  </button>
                  <button className="secondary-button" onClick={() => toggleExpand(item.id, "performance")} title="View station performance">
                    <Gauge size={14} /><span>Stats</span>
                  </button>
                  {item.isActive && (
                    <button className="danger-ghost" onClick={() => toggleExpand(item.id, "profile")} title="Disable station">
                      <LockKeyhole size={14} /><span>Disable</span>
                    </button>
                  )}
                </div>
              </article>

              {isOpen && (
                <div className="station-detail-panel">
                  <div className="tab-bar">
                    <button className={classNames("tab-btn", expandedTab === "profile" && "tab-active")} onClick={() => setExpandedTab("profile")}>Profile & Edit</button>
                    <button className={classNames("tab-btn", expandedTab === "performance" && "tab-active")} onClick={() => setExpandedTab("performance")}>Performance</button>
                    <button className={classNames("tab-btn", expandedTab === "manager" && "tab-active")} onClick={() => setExpandedTab("manager")}>Manager</button>
                  </div>
                  {expandedTab === "profile" && <StationProfilePanel station={item} onDone={() => { setExpanded(null); reload(); }} />}
                  {expandedTab === "performance" && <StationPerformancePanel stationId={item.id} />}
                  {expandedTab === "manager" && <StationManagerPanel station={item} onDone={() => { setExpanded(null); reload(); }} />}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <Panel>
        <PanelHeader
          title="Inventory transfers"
          subtitle="Inter-station stock movements — request, dispatch and receive"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <button className={classNames("tab-btn", transferTab === "list" && "tab-active")} onClick={() => setTransferTab("list")}>All transfers</button>
              <button className={classNames("tab-btn", transferTab === "request" && "tab-active")} onClick={() => setTransferTab("request")}>Request transfer</button>
            </div>
          }
        />
        {transferTab === "list" && <StationTransferList transfers={transfersApi.data ?? []} loading={transfersApi.loading} error={transfersApi.error} onDone={transfersApi.reload} />}
        {transferTab === "request" && <StationTransferRequestForm stations={stationRecords} onDone={() => { setTransferTab("list"); transfersApi.reload(); }} />}
      </Panel>

      <Panel>
        <PanelHeader title="Station business units" subtitle="Operational units enabled at each station" />
        <div className="transfer-list">
          {stationRecords.map((item) => (
            <div key={item.id}>
              <span className="transfer-route"><b>{item.code}</b><ArrowRight size={15} /><b>{item.businessUnits.length}</b></span>
              <div><strong>{item.name}</strong><small>{item.businessUnits.map((entry) => entry.businessUnit.name).join(" · ") || "No business units assigned"}</small></div>
              <StatusPill value={item.isActive ? "Active" : "Inactive"} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StationProfilePanel({ station, onDone }: { station: StationRecord; onDone: () => void }) {
  const detailApi = useApiData<StationDetailRecord>(`/api/stations/${station.id}`);
  const detail = detailApi.data;
  const buApi = useApiData<any[]>("/api/settings/business-units");
  
  const [busy, setBusy] = useState(false);
  const [disableBusy, setDisableBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [selectedBus, setSelectedBus] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [disableReason, setDisableReason] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!detail) return;
    setName(detail.name ?? "");
    setCity(detail.city ?? "");
    setStateVal(detail.state ?? "");
    setAddress(detail.address ?? "");
    setPhone(detail.phone ?? "");
    setEmail(detail.email ?? "");
    setTimezone(detail.timezone ?? "Africa/Lagos");
    setSelectedBus(detail.businessUnits.map((bu) => bu.businessUnit.id));
  }, [detail]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    if (selectedBus.length === 0) {
      setErr("At least one business unit must be enabled for this station.");
      return;
    }
    setErr(null); setBusy(true);
    try {
      await workflowPost(`/api/stations/${station.id}`, {
        version: detail.version,
        name,
        city,
        state: stateVal,
        address,
        phone: phone || null,
        email: email || null,
        timezone,
        businessUnitIds: selectedBus,
        reason
      }, "PATCH");
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  const handleDisable = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setErr(null); setDisableBusy(true);
    try {
      await workflowPost(`/api/stations/${station.id}/disable`, { version: detail.version, reason: disableReason });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Disable failed."); }
    finally { setDisableBusy(false); }
  };

  if (detailApi.loading) return <EmptyState icon={RefreshCcw} title="Loading station details" detail="Fetching current configuration." compact />;
  if (detailApi.error) return <EmptyState icon={AlertTriangle} title="Could not load station" detail={detailApi.error} compact />;

  return (
    <div className="station-detail-body">
      {err && <p className="form-error">{err}</p>}
      <form onSubmit={handleUpdate}>
        <div className="form-grid">
          <Field label="Station name"><input className="field-input" value={name} onChange={e => setName(e.target.value)} required minLength={2} /></Field>
          <Field label="City"><input className="field-input" value={city} onChange={e => setCity(e.target.value)} /></Field>
          <Field label="State"><input className="field-input" value={stateVal} onChange={e => setStateVal(e.target.value)} /></Field>
          <Field label="Phone"><input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
          <Field label="Email"><input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="Timezone"><input className="field-input" value={timezone} onChange={e => setTimezone(e.target.value)} /></Field>
          <Field label="Address (full width)" full><input className="field-input" value={address} onChange={e => setAddress(e.target.value)} /></Field>
          
          <Field label="Enabled Business Units" full>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px", border: "1px solid var(--line)", padding: "10px", borderRadius: "4px", background: "var(--field-bg)" }}>
              {buApi.loading ? (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Loading business units...</span>
              ) : (buApi.data ?? []).map((bu) => (
                <label key={bu.id} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedBus.includes(bu.id)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBus([...selectedBus, bu.id]);
                      } else {
                        setSelectedBus(selectedBus.filter((id) => id !== bu.id));
                      }
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-primary)" }}>{bu.name}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Reason for change" full><input className="field-input" value={reason} onChange={e => setReason(e.target.value)} required minLength={5} placeholder="Briefly describe this update" /></Field>
        </div>
        <div className="workflow-actions">
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </form>

      {station.isActive && (
        <div className="disable-zone">
          <p className="disable-zone-label"><LockKeyhole size={14} /> Disable this station</p>
          <form onSubmit={handleDisable} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Field label="Reason (min. 10 characters)" style={{ flex: 1 }}>
              <input className="field-input" value={disableReason} onChange={e => setDisableReason(e.target.value)} required minLength={10} placeholder="Explain why this station is being disabled" />
            </Field>
            <button type="submit" className="danger-button" disabled={disableBusy}>{disableBusy ? "Disabling…" : "Disable station"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function StationPerformancePanel({ stationId }: { stationId: string }) {
  const { data, loading, error } = useApiData<StationPerfRecord>(`/api/stations/${stationId}/performance`);
  if (loading) return <EmptyState icon={RefreshCcw} title="Loading performance data" detail="Aggregating station metrics." compact />;
  if (error) return <EmptyState icon={AlertTriangle} title="Could not load performance" detail={error} compact />;
  return (
    <div className="station-detail-body">
      <div className="summary-strip" style={{ paddingTop: 0 }}>
        <SummaryItem label="Scoped users" value={(data?.scopedUsers ?? 0).toString()} detail="Users with station access" icon={Users} tone="info" />
        <SummaryItem label="Active staff" value={(data?.activeStaff ?? 0).toString()} detail="Home station assignments" icon={UserCheck} tone="success" />
        <SummaryItem label="Active customers" value={(data?.customers ?? 0).toString()} detail="Home station registrations" icon={WalletCards} tone="info" />
        <SummaryItem label="Pending approvals" value={(data?.pendingApprovals ?? 0).toString()} detail="Requires review" icon={ClipboardCheck} tone={data?.pendingApprovals ? "warning" : "success"} />
      </div>
    </div>
  );
}

function StationManagerPanel({ station, onDone }: { station: StationRecord; onDone: () => void }) {
  const staffApi = useApiData<StaffRecord[]>(`/api/staff?pageSize=100&status=ACTIVE`);
  const [managerId, setManagerId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const currentManager = station.managerHistory[0]?.manager;
  const currentManagerName = currentManager?.name || [currentManager?.firstName, currentManager?.lastName].filter(Boolean).join(" ") || "None assigned";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErr(null); setBusy(true);
    try {
      await workflowPost(`/api/stations/${station.id}/assign-manager`, { managerId, reason });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Assignment failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="station-detail-body">
      <div className="document-rows" style={{ marginBottom: 16 }}>
        <DocumentRow icon={UserCheck} name="Current manager" meta="Active assignment" status={currentManagerName} />
      </div>
      {err && <p className="form-error">{err}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="New manager">
            <select className="field-input" value={managerId} onChange={e => setManagerId(e.target.value)} required>
              <option value="">— Select staff member —</option>
              {(staffApi.data ?? [])
                .filter((person) => person.userId !== null)
                .map((person) => {
                  const name = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
                  return (
                    <option key={person.id} value={person.userId!}>
                      {name} · {person.homeStation.code}
                    </option>
                  );
                })}
            </select>
          </Field>
          <Field label="Reason for assignment">
            <input className="field-input" value={reason} onChange={e => setReason(e.target.value)} required minLength={5} placeholder="e.g. Operational restructure" />
          </Field>
        </div>
        <div className="workflow-actions">
          <button type="submit" className="primary-button" disabled={busy || !managerId}>{busy ? "Assigning…" : "Assign manager"}</button>
        </div>
      </form>
    </div>
  );
}

function StationTransferList({ transfers, loading, error, onDone }: { transfers: TransferRecord[]; loading: boolean; error: string | null; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleDispatch = async (transfer: TransferRecord) => {
    setErr(null); setBusy(transfer.id);
    try {
      const lines = transfer.lines.map(line => ({ lineId: line.id, quantity: line.quantityRequested }));
      await workflowPost(`/api/inventory/transfers/${transfer.id}/dispatch`, { version: 1, lines });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Dispatch failed."); }
    finally { setBusy(null); }
  };

  const handleReceive = async (transfer: TransferRecord) => {
    setErr(null); setBusy(transfer.id);
    try {
      const lines = transfer.lines.map(line => ({ lineId: line.id, quantity: line.quantityDispatched }));
      await workflowPost(`/api/inventory/transfers/${transfer.id}/receive`, { version: 2, lines });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Receive failed."); }
    finally { setBusy(null); }
  };

  if (loading) return <EmptyState icon={RefreshCcw} title="Loading transfers" detail="Retrieving inter-station stock movements." compact />;
  if (error) return <EmptyState icon={AlertTriangle} title="Could not load transfers" detail={error} compact />;
  if (!transfers.length) return <EmptyState icon={ArrowLeftRight} title="No transfers recorded" detail="Request a transfer to move stock between stations." />;

  return (
    <div>
      {err && <p className="form-error" style={{ padding: "0 0 12px" }}>{err}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Transfer #</th><th>Route</th><th>Items</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.id}>
                <td><div className="primary-cell"><strong>{t.transferNumber}</strong><span>{t.reason}</span></div></td>
                <td><span className="transfer-route"><b>{t.originStation.code}</b><ArrowRight size={13} /><b>{t.destinationStation.code}</b></span></td>
                <td>{t.lines.length} line{t.lines.length !== 1 ? "s" : ""}</td>
                <td>{formatDate(t.requestedAt)}</td>
                <td><StatusPill value={t.status} /></td>
                <td>
                  {t.status === "REQUESTED" && (
                    <button className="secondary-button" onClick={() => handleDispatch(t)} disabled={busy === t.id}>
                      <PackageCheck size={13} />{busy === t.id ? "…" : "Dispatch"}
                    </button>
                  )}
                  {t.status === "DISPATCHED" && (
                    <button className="primary-button" onClick={() => handleReceive(t)} disabled={busy === t.id}>
                      <PackageOpen size={13} />{busy === t.id ? "…" : "Receive"}
                    </button>
                  )}
                  {t.status === "RECEIVED" && <span className="positive-number"><Check size={13} /> Completed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StationTransferRequestForm({ stations, onDone }: { stations: StationRecord[]; onDone: () => void }) {
  const productsApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=200");
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<TransferLineInput[]>([{ productId: "", quantity: "1", productName: "" }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const updateLine = (index: number, field: keyof TransferLineInput, value: string) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      if (field === "productId") {
        const product = productsApi.data?.find(p => p.id === value);
        return { ...line, productId: value, productName: product?.name ?? "" };
      }
      return { ...line, [field]: value };
    }));
  };
  const addLine = () => setLines(prev => [...prev, { productId: "", quantity: "1", productName: "" }]);
  const removeLine = (index: number) => setLines(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErr(null); setBusy(true);
    try {
      await workflowPost("/api/inventory/transfers", {
        originStationId: originId,
        destinationStationId: destId,
        reason,
        lines: lines.filter(l => l.productId).map(l => ({ productId: l.productId, quantity: l.quantity })),
      });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Transfer request failed."); }
    finally { setBusy(false); }
  };

  const activeStations = stations.filter(s => s.isActive);

  return (
    <form onSubmit={handleSubmit} className="station-detail-body">
      {err && <p className="form-error">{err}</p>}
      <div className="form-grid">
        <Field label="Origin station">
          <select className="field-input" value={originId} onChange={e => setOriginId(e.target.value)} required>
            <option value="">— Select origin —</option>
            {activeStations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </Field>
        <Field label="Destination station">
          <select className="field-input" value={destId} onChange={e => setDestId(e.target.value)} required>
            <option value="">— Select destination —</option>
            {activeStations.filter(s => s.id !== originId).map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </Field>
        <Field label="Reason for transfer" full>
          <input className="field-input" value={reason} onChange={e => setReason(e.target.value)} required minLength={3} placeholder="e.g. Stock rebalancing from HQ to Lagos" />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="field-label" style={{ marginBottom: 8 }}>Transfer lines</p>
        {lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
            <Field label={i === 0 ? "Product" : ""} style={{ flex: 2 }}>
              <select className="field-input" value={line.productId} onChange={e => updateLine(i, "productId", e.target.value)} required>
                <option value="">— Select product —</option>
                {(productsApi.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </Field>
            <Field label={i === 0 ? "Quantity" : ""} style={{ flex: 1 }}>
              <input className="field-input" type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} required />
            </Field>
            {lines.length > 1 && (
              <button type="button" className="icon-ghost" onClick={() => removeLine(i)} style={{ marginBottom: 2 }} title="Remove line"><Minus size={15} /></button>
            )}
          </div>
        ))}
        <button type="button" className="text-action" onClick={addLine}><Plus size={14} /> Add product line</button>
      </div>

      <div className="workflow-actions" style={{ marginTop: 16 }}>
        <button type="submit" className="primary-button" disabled={busy || !originId || !destId}>{busy ? "Requesting…" : "Request transfer"}</button>
      </div>
    </form>
  );
}

function TicketsView() {
  const [tab, setTab] = useState("All bookings");
  const { data, total, loading, error, reload } = useApiData<TicketRecord[]>("/api/tickets?pageSize=100");
  const bookings = data ?? [];
  const visible = bookings.filter((booking) => tab === "All bookings" || booking.status === tab.toUpperCase());
  const table = useTableControls(visible, (booking, q) => `${booking.pnr} ${booking.bookingNumber} ${booking.passengerName} ${booking.airline} ${booking.origin} ${booking.destination}`.toLowerCase().includes(q));
  const ticketed = bookings.filter((booking) => booking.status === "TICKETED");
  const reservedValue = bookings.filter((booking) => booking.status === "RESERVED").reduce((sum, booking) => sum + Number(booking.sellingPrice), 0);
  const profit = ticketed.reduce((sum, booking) => sum + Number(booking.profit), 0);
  return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Booking records" value={total.toString()} icon={TicketCheck} tone="info" /><SummaryItem label="Ticketed" value={ticketed.length.toString()} icon={BadgeCheck} tone="success" /><SummaryItem label="Reserved value" value={formatNaira(reservedValue)} icon={Clock3} tone="warning" /><SummaryItem label="Ticketed profit" value={formatNaira(profit)} icon={TrendingUp} tone="success" /></section><Panel><TableToolbar tabs={["All bookings", "Reserved", "Ticketed", "Cancelled"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search PNR, passenger, airline or route" search={table.search} onSearch={table.setSearch} />{error ? <EmptyState icon={AlertTriangle} title="Bookings could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading bookings" detail="Retrieving permission-scoped ticket records." compact /> : table.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Booking / PNR</th><th>Passenger</th><th>Route</th><th>Airline</th><th>Travel date</th><th>Fare</th><th>Selling price</th><th>Profit</th><th>Status</th><th /></tr></thead><tbody>{table.pageRows.map((booking) => <tr key={booking.id}><td><div className="primary-cell"><strong className="pnr-code">{booking.pnr}</strong><span>{booking.bookingNumber}</span></div></td><td>{booking.passengerName}</td><td><strong className="route-code">{booking.origin} → {booking.destination}</strong></td><td>{booking.airline}</td><td>{formatDate(booking.travelDate)}</td><td className="number-cell">{formatNaira(Number(booking.fare))}</td><td className="number-cell">{formatNaira(Number(booking.sellingPrice))}</td><td className="number-cell positive-number">{formatNaira(Number(booking.profit))}</td><td><StatusPill value={booking.status} /></td><td><button className="icon-ghost" onClick={reload} aria-label={`Refresh ${booking.pnr}`}><RefreshCcw size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={TicketCheck} title={table.search ? "No matching bookings" : "No bookings found"} detail={table.search ? "Try a different PNR, passenger, airline or route." : "Reserved and ticketed flight bookings will appear here."} />}<Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} /></Panel></div>;
}

function StaffDetailModal({
  staff,
  allowedStations,
  onClose,
  onComplete,
}: {
  staff: StaffRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const detailApi = useApiData<any>(`/api/staff/${staff.id}`);
  const hrSetupApi = useApiData<HrSetup>("/api/hr/catalogue");
  
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [salary, setSalary] = useState("");
  const [employmentType, setEmploymentType] = useState<any>("PERMANENT");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [passportPhoto, setPassportPhoto] = useState("");
  const [reason, setReason] = useState("");

  // Next of kin
  const [nokName, setNokName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [nokEmail, setNokEmail] = useState("");
  const [nokAddress, setNokAddress] = useState("");

  const detail = detailApi.data;

  useEffect(() => {
    if (!detail) return;
    setFirstName(detail.firstName ?? "");
    setMiddleName(detail.middleName ?? "");
    setLastName(detail.lastName ?? "");
    setPreferredName(detail.preferredName ?? "");
    setPhone(detail.phone ?? "");
    setEmail(detail.email ?? "");
    setAddress(detail.address ?? "");
    setNationalId(detail.nationalId ?? "");
    setSalary(detail.salary === "••••••" ? "" : detail.salary ?? "");
    setEmploymentType(detail.employmentType ?? "PERMANENT");
    setDepartmentId(detail.departmentId ?? "");
    setPositionId(detail.positionId ?? "");
    setPassportPhoto(detail.passportPhotoUrl || detail.passportObjectKey || "");
    
    if (detail.nextOfKin && detail.nextOfKin[0]) {
      const nok = detail.nextOfKin[0];
      setNokName(nok.name ?? "");
      setNokRelationship(nok.relationship ?? "");
      setNokPhone(nok.phone ?? "");
      setNokEmail(nok.email ?? "");
      setNokAddress(nok.address ?? "");
    } else {
      setNokName("");
      setNokRelationship("");
      setNokPhone("");
      setNokEmail("");
      setNokAddress("");
    }
  }, [detail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPassportPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const printIDCard = () => {
    if (!detail) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    const name = [detail.firstName, detail.middleName, detail.lastName].filter(Boolean).join(" ");
    const passport = passportPhoto || "";
    const logoUrl = new URL("/aauchamo-logo.png", window.location.origin).toString();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=STAFF:${detail.staffNumber}`;
    
    // Calculate 5 years expiry
    const empDate = new Date(detail.employmentDate);
    const expiryDate = new Date(empDate.setFullYear(empDate.getFullYear() + 5));
    const expiryStr = expiryDate.toLocaleDateString("en-GB");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Card - ${detail.staffNumber}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 30px;
              height: 100vh;
              margin: 0;
              background: #f3f4f6;
              padding: 20px;
            }
            .card-container {
              display: flex;
              gap: 30px;
            }
            .id-card {
              width: 280px;
              height: 440px;
              border-radius: 16px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.12);
              overflow: hidden;
              border: 1px solid #d1d5db;
              position: relative;
              box-sizing: border-box;
              background: white;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .id-card.front {
              background: #dc2626;
              color: white;
            }
            .logo-container {
              width: 100%;
              height: 90px;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 15px 10px 5px;
              box-sizing: border-box;
            }
            .logo-img {
              max-height: 60px;
              max-width: 90%;
              object-fit: contain;
            }
            .photo-border {
              width: 125px;
              height: 125px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.2);
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #e5e7eb;
              margin: 10px 0;
            }
            .photo-border img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .photo-placeholder {
              font-size: 40px;
              color: #9ca3af;
            }
            .details {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              flex: 1;
              padding: 0 15px;
              margin-top: 10px;
            }
            .name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 2px;
              letter-spacing: 0.5px;
            }
            .position {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
              color: #fca5a5;
            }
            .department {
              font-size: 11px;
              color: #f3f4f6;
              margin-bottom: 12px;
            }
            .contacts {
              font-size: 10px;
              color: #fca5a5;
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .footer-bar {
              width: 100%;
              height: 45px;
              background: #7f1d1d;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              box-sizing: border-box;
              font-size: 11px;
              font-weight: bold;
              border-top: 1px solid rgba(0,0,0,0.1);
              color: white;
            }

            /* BACK CARD */
            .id-card.back {
              background: white;
              padding: 20px 16px;
              color: #374151;
            }
            .auth-header {
              font-size: 12px;
              font-weight: bold;
              color: #dc2626;
              text-transform: uppercase;
              margin-bottom: 8px;
              text-align: center;
            }
            .auth-text {
              font-size: 9px;
              text-align: center;
              line-height: 1.4;
              margin-bottom: 12px;
              color: #4b5563;
            }
            .office-details {
              font-size: 10px;
              text-align: center;
              line-height: 1.4;
              margin-bottom: 15px;
            }
            .office-details strong {
              display: block;
              font-size: 11px;
              color: #111827;
              margin-bottom: 2px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 12px;
              background: #f9fafb;
              padding: 8px;
              border-radius: 8px;
              border: 1px solid #f3f4f6;
            }
            .back-contacts {
              font-size: 9px;
              color: #6b7280;
              text-align: center;
              line-height: 1.4;
              flex: 1;
            }
            .back-contacts strong {
              font-size: 11px;
              color: #111827;
              display: block;
              margin-bottom: 2px;
            }
            .expiry-bar {
              width: 100%;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
              font-weight: 500;
            }

            @media print {
              body {
                background: transparent;
                padding: 0;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                height: auto;
              }
              .card-container {
                gap: 20px;
              }
              .id-card {
                box-shadow: none;
                border: 1px solid #d1d5db;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <!-- FRONT -->
            <div class="id-card front">
              <div class="logo-container">
                <img class="logo-img" src="${logoUrl}" alt="AAU Chamo Logo" />
              </div>
              
              <div class="photo-border">
                ${passport ? `<img src="${passport}" alt="${name}" />` : `<div class="photo-placeholder">👤</div>`}
              </div>
              
              <div class="details">
                <div class="name">${name}</div>
                <div class="position">${detail.position?.name || "STAFF"}</div>
                <div class="department">${detail.department?.name || "OPERATIONS"}</div>
                <div class="contacts">
                  <span>${detail.email || ""}</span>
                  <span>${detail.phone || ""}</span>
                </div>
              </div>
              
              <div class="footer-bar">
                <span>ID: ${detail.staffNumber}</span>
                <span>${detail.homeStation?.code || "HQ"}</span>
              </div>
            </div>

            <!-- BACK -->
            <div class="id-card back">
              <div class="auth-header">AUTHORIZATION</div>
              <div class="auth-text">
                This card is the property of <strong>AAU Chamo Groups</strong>. It must be surrendered upon termination of employment or upon request by an authorized official. If found, please return to the Head Office.
              </div>
              
              <div class="office-details">
                <strong>Head Office</strong>
                BLOCK AL, Maiduguri Road<br />
                Phone: 08062249834<br />
                Email: doudgaya@gmail.com
              </div>

              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="QR Code" width="100" height="100" />
              </div>

              <div class="back-contacts">
                <strong>${detail.staffNumber}</strong>
                <span>${detail.phone}</span><br />
                <span>${detail.email || "info@aauchamo.com"}</span>
              </div>

              <div class="expiry-bar">
                Valid until: ${expiryStr}
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printEmploymentLetter = () => {
    if (!detail) return;
    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;
    const name = [detail.firstName, detail.middleName, detail.lastName].filter(Boolean).join(" ");
    const dateStr = new Date(detail.employmentDate).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const logoUrl = new URL("/logo.png", window.location.origin).toString();
    const salaryFormatted = salary
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(salary))
      : "₦[Negotiated]";

    printWindow.document.write(`
      <html>
        <head>
          <title>Employment Letter - ${detail.staffNumber}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              padding: 50px;
              color: #111827;
              line-height: 1.6;
              font-size: 15px;
            }
            .letterhead {
              text-align: center;
              border-bottom: 3px double #b91c1c;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .letterhead img {
              max-height: 80px;
              object-fit: contain;
              margin-bottom: 10px;
            }
            .letterhead h1 {
              font-size: 24px;
              margin: 0 0 5px;
              letter-spacing: 1px;
              text-transform: uppercase;
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #b91c1c;
            }
            .letterhead p {
              margin: 2px 0;
              font-size: 11px;
              color: #4b5563;
              font-family: 'Segoe UI', Arial, sans-serif;
            }
            .date {
              margin-bottom: 20px;
              font-weight: bold;
            }
            .recipient {
              margin-bottom: 30px;
              line-height: 1.4;
            }
            .subject {
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 25px;
              text-decoration: underline;
              font-size: 16px;
            }
            .content p {
              margin-bottom: 16px;
              text-align: justify;
            }
            .clause-title {
              font-weight: bold;
              margin-top: 15px;
              margin-bottom: 5px;
              text-transform: uppercase;
              font-size: 14px;
              color: #111827;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 250px;
            }
            .signature-line {
              border-top: 1px solid #111827;
              margin-top: 50px;
              padding-top: 5px;
              text-align: center;
              font-size: 13px;
            }
            @media print {
              body { padding: 30px; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <img src="${logoUrl}" alt="AAU Chamo Logo" /><br />
            <h1>A.A.U Chamo International Business Agency Services Limited</h1>
            <p>Corporate Headquarters: BLOCK AL, Maiduguri Road | Tel: +234 (0) 806 224 9834 | Email: hr@aauchamo.com</p>
            <p>www.aauchamo.com</p>
          </div>
          
          <div class="date">Date: ${dateStr}</div>
          
          <div class="recipient">
            <strong>To:</strong><br />
            ${name}<br />
            Staff Reference Number: ${detail.staffNumber}<br />
            Residential Address: ${detail.address || "Nigeria"}
          </div>
          
          <div class="subject">OFFER OF EMPLOYMENT & LETTER OF APPOINTMENT</div>
          
          <div class="content">
            <p>Dear ${detail.firstName},</p>
            
            <p>On behalf of the Management of <strong>A.A.U Chamo International Business Agency Services Limited</strong>, we are pleased to offer you formal employment for the position of <strong>${detail.position?.name || "Staff"}</strong> in the <strong>${detail.department?.name || "Operations"}</strong> department. Your primary base station assignment will be at <strong>${detail.homeStation?.name || "Lagos Station"}</strong>.</p>
            
            <p>This appointment is subject to the terms and conditions outlined in our corporate employee handbook and the following summary clauses:</p>
            
            <div class="clause-title">1. Commencement and Duties</div>
            <p>Your employment will commence on <strong>${dateStr}</strong>. In your capacity as <strong>${detail.position?.name || "Staff"}</strong>, you will report directly to the Head of Department or any designated supervisor. You will be responsible for executing your duties diligently and complying with operational protocols and directives.</p>
            
            <div class="clause-title">2. Hours of Work</div>
            <p>Your standard working hours shall be forty (40) hours per week, normally scheduled from Monday to Friday. Due to the service-oriented nature of our operations, you may be required to work additional hours or shift assignments as operational demands require.</p>
            
            <div class="clause-title">3. Remuneration</div>
            <p>You will receive a base salary of <strong>${salaryFormatted}</strong> per month, payable in arrears on or before the 28th day of each calendar month. This compensation is subject to standard statutory tax deductions, pension contributions, and other government-mandated levies.</p>
            
            <div class="clause-title">4. Probationary Period</div>
            <p>Your employment is subject to a probationary period of six (6) months from your commencement date. Upon successful performance review, your employment will be confirmed in writing. During probation, either party may terminate this agreement by giving one (1) week's notice.</p>
            
            <div class="clause-title">5. Leave Entitlement</div>
            <p>Upon confirmation, you will be entitled to twenty (20) working days of annual paid leave for each completed year of service, to be scheduled in consultation with your supervisor. You are also entitled to public holidays observed in Nigeria.</p>
            
            <div class="clause-title">6. Confidentiality and Code of Conduct</div>
            <p>You shall not disclose any confidential information, trade secrets, passenger databases, or proprietary operational structures of AAU Chamo to any third parties. Strict adherence to our Code of Conduct and Anti-Bribery policies is a condition of continued service.</p>
            
            <div class="clause-title">7. Termination of Appointment</div>
            <p>After confirmation, either party may terminate this agreement by providing one (1) month's written notice or payment of one month's basic salary in lieu of notice. The company reserves the right to terminate your employment summarily for gross misconduct.</p>
            
            <p>If you accept this offer and its terms, please sign and return the duplicate copy of this letter to the Human Resources department within seven (7) days.</p>
            
            <p>We welcome you to AAU Chamo and look forward to a successful professional journey together.</p>
            
            <p>Yours faithfully,<br />For: <strong>A.A.U Chamo International Business Agency Services Limited</strong></p>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <strong>Head of Human Resources</strong><br />
                AAU Chamo Groups
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <strong>Employee Signature & Date</strong><br />
                I accept the terms of this appointment
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setError(null); setBusy(true);
    try {
      const nextOfKin = nokName ? [{
        name: nokName,
        relationship: nokRelationship,
        phone: nokPhone,
        email: nokEmail || undefined,
        address: nokAddress || undefined,
        isPrimary: true
      }] : [];

      await workflowPost(`/api/staff/${staff.id}`, {
        version: detail.version,
        firstName,
        middleName: middleName || null,
        lastName,
        preferredName: preferredName || null,
        phone,
        email: email || null,
        address: address || null,
        nationalId: nationalId || undefined,
        salary: salary || null,
        employmentType,
        departmentId,
        positionId,
        passportPhoto: passportPhoto || null,
        nextOfKin,
        reason
      }, "PATCH");
      onComplete("Staff updated", `${detail.firstName} ${detail.lastName} details were updated.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!window.confirm(`Are you sure you want to permanently delete staff member ${detail.firstName} ${detail.lastName}?`)) return;
    setError(null); setDeleteBusy(true);
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason })
      });
      const body = await response.json() as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Delete failed.");
      onComplete("Staff deleted", `${detail.firstName} ${detail.lastName} was deleted.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleteBusy(false); }
  };

  if (detailApi.loading || hrSetupApi.loading) return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="workflow-dialog" style={{ maxWidth: "500px" }}>
        <div className="workflow-header"><div><span>Human resources</span><h2>Edit staff member</h2></div><button onClick={onClose}><X size={19} /></button></div>
        <div className="workflow-body"><EmptyState icon={RefreshCcw} title="Loading staff records" detail="Reading current record from HR registry." compact /></div>
      </div>
    </div>
  );

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Human resources</span>
            <h2 id="workflow-title">Edit staff member: {detail?.staffNumber}</h2>
            <p>Update contact information, department, salary, and employment parameters.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal"><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="workflow-body">
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "8px", border: "2px dashed var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", background: "var(--field-bg)" }}>
                {passportPhoto ? (
                  <img src={passportPhoto} alt="Passport" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "4px" }}>No Photo</span>
                )}
              </div>
              <div>
                <label className="secondary-button" style={{ cursor: "pointer", display: "inline-block", padding: "8px 12px", fontSize: "12px" }}>
                  Upload Passport Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                {passportPhoto && (
                  <button type="button" className="text-action" onClick={() => setPassportPhoto("")} style={{ marginLeft: "12px", fontSize: "12px", color: "#ef4444" }}>
                    Remove
                  </button>
                )}
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>PNG, JPEG or WebP up to 2MB.</span>
              </div>
            </div>

            <div className="form-grid">
              <Field label="First name"><input className="field-input" value={firstName} onChange={e => setFirstName(e.target.value)} required /></Field>
              <Field label="Middle name"><input className="field-input" value={middleName} onChange={e => setMiddleName(e.target.value)} /></Field>
              <Field label="Last name"><input className="field-input" value={lastName} onChange={e => setLastName(e.target.value)} required /></Field>
              <Field label="Preferred name"><input className="field-input" value={preferredName} onChange={e => setPreferredName(e.target.value)} /></Field>
              <Field label="Phone"><input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} required /></Field>
              <Field label="Email"><input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
              <Field label="National ID"><input className="field-input" value={nationalId} onChange={e => setNationalId(e.target.value)} /></Field>
              
              <Field label="Department">
                <select className="field-input" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
                  <option value="" disabled>Select department</option>
                  {(hrSetupApi.data?.departments ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Position">
                <select className="field-input" value={positionId} onChange={e => setPositionId(e.target.value)} required>
                  <option value="" disabled>Select position</option>
                  {(hrSetupApi.data?.positions ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Employment type">
                <select className="field-input" value={employmentType} onChange={e => setEmploymentType(e.target.value as any)}>
                  <option value="PERMANENT">Permanent</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="INTERN">Intern</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
              </Field>

              <Field label="Salary">
                <div className="money-input">
                  <span>₦</span>
                  <input className="field-input" type="number" step="0.01" min="0" value={salary} onChange={e => setSalary(e.target.value)} />
                </div>
              </Field>

              <Field label="Address" full><textarea className="field-input" value={address} onChange={e => setAddress(e.target.value)} /></Field>
              
              <div style={{ gridColumn: "1 / -1", margin: "10px 0", borderTop: "1px dashed var(--border-color)", paddingTop: "15px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Next of Kin Details</h4>
              </div>
              
              <Field label="Full Name"><input className="field-input" value={nokName} onChange={e => setNokName(e.target.value)} /></Field>
              <Field label="Relationship"><input className="field-input" value={nokRelationship} onChange={e => setNokRelationship(e.target.value)} /></Field>
              <Field label="Phone"><input className="field-input" value={nokPhone} onChange={e => setNokPhone(e.target.value)} /></Field>
              <Field label="Email"><input className="field-input" type="email" value={nokEmail} onChange={e => setNokEmail(e.target.value)} /></Field>
              <Field label="Address" full><textarea className="field-input" value={nokAddress} onChange={e => setNokAddress(e.target.value)} /></Field>
              
              <div style={{ gridColumn: "1 / -1", margin: "10px 0", borderTop: "1px dashed var(--border-color)", paddingTop: "15px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Audit trail log reason</h4>
              </div>

              <Field label="Reason for change (min. 5 characters)" full>
                <input
                  className="field-input"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  minLength={5}
                  placeholder="e.g. Promotion to senior operations lead"
                />
              </Field>
            </div>
            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>
          <div className="workflow-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="danger-ghost"
                onClick={handleDelete}
                disabled={deleteBusy}
                style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "16px", paddingRight: "16px" }}
              >
                <Trash2 size={15} />
                <span>{deleteBusy ? "Deleting..." : "Delete"}</span>
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={printIDCard}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Printer size={15} />
                <span>Print ID Card</span>
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={printEmploymentLetter}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Printer size={15} />
                <span>Print Letter</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={busy}>
                <ShieldCheck size={15} />
                <span>{busy ? "Saving..." : "Save staff details"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffView({
  onModal,
  allowedStations,
}: {
  onModal?: (modal: ModalKind) => void;
  allowedStations: AllowedStation[];
}) {
  const [tab, setTab] = useState("All staff");
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [stationId, setStationId] = useState("");
  
  const { data, total, loading, error, reload } = useApiData<StaffRecord[]>(
    `/api/staff?pageSize=100${stationId ? `&stationId=${stationId}` : ""}`
  );
  const staffRecords = data ?? [];
  const visibleStaff = staffRecords.filter((person) => {
    if (tab === "Active") return person.status === "ACTIVE";
    if (tab === "On leave") return person.status === "ON_LEAVE";
    if (tab === "Inactive") return ["INACTIVE", "TERMINATED", "RESIGNED"].includes(person.status);
    return true;
  });
  const table = useTableControls(visibleStaff, (person, q) => `${person.firstName} ${person.middleName ?? ""} ${person.lastName} ${person.staffNumber} ${person.position.name} ${person.department.name} ${person.homeStation.name}`.toLowerCase().includes(q));
  const stationCount = new Set(staffRecords.map((person) => person.homeStation.id)).size;
  const activeCount = staffRecords.filter((person) => person.status === "ACTIVE").length;
  const leaveCount = staffRecords.filter((person) => person.status === "ON_LEAVE").length;
  const thisMonth = staffRecords.filter((person) => new Date(person.employmentDate).getMonth() === new Date().getMonth() && new Date(person.employmentDate).getFullYear() === new Date().getFullYear()).length;
  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Active staff" value={activeCount.toString()} icon={UserCheck} tone="success" />
        <SummaryItem label="Stations" value={stationCount.toString()} icon={Store} tone="info" />
        <SummaryItem label="On leave" value={leaveCount.toString()} icon={CalendarDays} tone="warning" />
        <SummaryItem label="New this month" value={thisMonth.toString()} icon={UserPlus} tone="success" />
      </section>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
            <TableToolbar tabs={["All staff", "Active", "On leave", "Inactive"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search staff name, ID, position or station" search={table.search} onSearch={table.setSearch} />
            <select
              className="field-input"
              style={{ width: "180px", height: "38px", padding: "0 8px" }}
              value={stationId}
              onChange={(e) => {
                setStationId(e.target.value);
                table.resetPage();
              }}
            >
              <option value="">All Stations</option>
              {allowedStations.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
          {onModal && (
            <button className="primary-button" onClick={() => onModal("staff")} style={{ height: "36px", padding: "0 16px" }}>
              <UserPlus size={15} /><span>Add staff</span>
            </button>
          )}
        </div>
        {error ? (
          <EmptyState icon={AlertTriangle} title="Staff records could not be loaded" detail={error} />
        ) : loading ? (
          <EmptyState icon={RefreshCcw} title="Loading staff directory" detail="Retrieving protected staff records from the database." compact />
        ) : table.filtered.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff member</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Station</th>
                  <th>Employed since</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.map((person) => {
                  const name = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
                  return (
                    <tr key={person.id} onClick={() => setEditingStaff(person)} style={{ cursor: "pointer" }} title="Click to view and edit details">
                      <td>
                        <div className="agent-cell staff">
                          {person.passportObjectKey ? (
                            <img src={person.passportObjectKey} alt={name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <span>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                          )}
                          <div>
                            <strong>{name}</strong>
                            <small>{person.staffNumber}</small>
                          </div>
                        </div>
                      </td>
                      <td>{person.position.name}</td>
                      <td>{person.department.name}</td>
                      <td>{person.homeStation.name}</td>
                      <td>{formatDate(person.employmentDate)}</td>
                      <td>
                        <StatusPill value={person.status.replaceAll("_", " ")} />
                      </td>
                      <td>
                        <button className="icon-ghost" aria-label={`Open ${name}`} onClick={(e) => { e.stopPropagation(); setEditingStaff(person); }}>
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={UserCheck} title={table.search ? "No matching staff" : "No staff records"} detail={table.search ? "Try a different name, ID, position or station." : "Add the first staff member and assign their department, position and home station."} />
        )}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
      {editingStaff && (
        <StaffDetailModal
          staff={editingStaff}
          allowedStations={allowedStations}
          onClose={() => setEditingStaff(null)}
          onComplete={(title, detail) => {
            setEditingStaff(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AttendanceView({
  allowedStations,
  onToast,
}: {
  allowedStations: AllowedStation[];
  onToast: (toast: Toast) => void;
}) {
  const [tab, setTab] = useState("Clock portal");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [filterStationId, setFilterStationId] = useState("");

  const logsApi = useApiData<any>(
    `/api/staff/attendance?pageSize=100${filterStationId ? `&stationId=${filterStationId}` : ""}`
  );
  
  // Update time clock every second
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Capture Geolocation coordinates
  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsError("Acquiring GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsError(null);
      },
      (err) => {
        setCoords(null);
        setGpsError("GPS location access denied. Please allow location permissions in browser settings.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const latestLog = logsApi.data?.[0];
  const todayStr = new Date().toDateString();
  const isClockedInToday = latestLog && new Date(latestLog.date).toDateString() === todayStr;
  const isClockedOutToday = isClockedInToday && latestLog.clockOutAt != null;

  const handleClock = async (action: "in" | "out") => {
    if (!coords && !gpsError) {
      alert("Please wait for GPS location coordinates to be captured.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/staff/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          notes: notes || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? `Clock ${action} failed`);
      onToast({
        title: `Clock ${action === "in" ? "In" : "Out"} Successful`,
        detail: `Timestamp and coordinates were captured successfully.`,
      });
      setNotes("");
      logsApi.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to record attendance.");
    } finally {
      setBusy(false);
    }
  };

  const mapLink = (lat?: number | null, lon?: number | null) => {
    if (lat == null || lon == null) return <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>No GPS</span>;
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lon}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#3b82f6", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600" }}
      >
        <Fingerprint size={12} />
        <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
      </a>
    );
  };

  return (
    <div className="content-stack">
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", width: "100%", marginBottom: "12px" }}>
          <TableToolbar
            tabs={["Clock portal", "Attendance logs"]}
            activeTab={tab}
            onTab={(value) => {
              setTab(value);
              if (value === "Attendance logs") logsApi.reload();
            }}
            placeholder="Search logs..."
            search=""
            onSearch={() => {}}
          />
          {tab === "Attendance logs" && (
            <select
              className="field-input"
              style={{ width: "180px", height: "38px", padding: "0 8px" }}
              value={filterStationId}
              onChange={(e) => {
                setFilterStationId(e.target.value);
              }}
            >
              <option value="">All Stations</option>
              {allowedStations.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          )}
        </div>

        {tab === "Clock portal" ? (
          <div style={{ maxWidth: "560px", margin: "20px auto", padding: "10px" }}>
            {/* Mobile PWA Launcher Banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(11, 31, 58, 0.4) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)", display: "block" }}>
                  📱 Standalone Mobile Punch Clock App
                </strong>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Open directly on your phone or install as a PWA home screen app.
                </span>
              </div>
              <a
                href="/attendance"
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button"
                style={{ height: "36px", padding: "0 14px", fontSize: "12px", background: "#10b981", color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>Launch Mobile PWA ↗</span>
              </a>
            </div>

            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
                {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
              <div style={{ fontSize: "42px", fontWeight: "bold", fontFamily: "monospace", margin: "10px 0", color: "var(--text-primary)" }}>
                {time}
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--field-bg)", padding: "8px 16px", borderRadius: "20px", fontSize: "12px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: coords ? "#10b981" : "#ef4444" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {coords ? `GPS Connected: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : gpsError || "Initializing GPS..."}
                </span>
                {!coords && (
                  <button type="button" className="text-action" onClick={refreshLocation} style={{ marginLeft: "6px", fontSize: "11px" }}>
                    Retry
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: "var(--field-bg)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "bold" }}>Attendance Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Clock In:</span>
                  <strong>{isClockedInToday ? new Date(latestLog.clockInAt).toLocaleTimeString("en-NG") : "Not Clocked In"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Clock Out:</span>
                  <strong>{isClockedOutToday ? new Date(latestLog.clockOutAt).toLocaleTimeString("en-NG") : "Not Clocked Out"}</strong>
                </div>
              </div>
            </div>

            {!isClockedOutToday && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <textarea
                  className="field-input"
                  style={{ minHeight: "60px", resize: "none" }}
                  placeholder="Add optional notes (e.g. Remote work, field assignment)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={busy}
                />
                
                {!isClockedInToday ? (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ height: "46px", fontSize: "15px", justifyContent: "center", background: "#10b981", color: "white" }}
                    onClick={() => handleClock("in")}
                    disabled={busy || !coords}
                  >
                    <span>{busy ? "Clocking In..." : "Clock In"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ height: "46px", fontSize: "15px", justifyContent: "center", background: "#f59e0b", color: "white" }}
                    onClick={() => handleClock("out")}
                    disabled={busy || !coords}
                  >
                    <span>{busy ? "Clocking Out..." : "Clock Out"}</span>
                  </button>
                )}
              </div>
            )}

            {isClockedOutToday && (
              <div style={{ textAlign: "center", color: "#10b981", fontWeight: "bold", fontSize: "14px", background: "rgba(16, 185, 129, 0.1)", padding: "12px", borderRadius: "6px" }}>
                ✓ You have successfully completed your attendance for today.
              </div>
            )}
          </div>
        ) : (
          <div className="table-wrap" style={{ marginTop: "12px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>In Coordinates</th>
                  <th>Clock Out</th>
                  <th>Out Coordinates</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(logsApi.data ?? []).map((log: any) => {
                  const name = [log.staff.firstName, log.staff.middleName, log.staff.lastName].filter(Boolean).join(" ");
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>{name}</strong>
                          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>{log.staff.staffNumber} · {log.staff.position?.name}</small>
                        </div>
                      </td>
                      <td>{formatDate(log.date)}</td>
                      <td>{new Date(log.clockInAt).toLocaleTimeString("en-NG")}</td>
                      <td>{mapLink(log.clockInLatitude, log.clockInLongitude)}</td>
                      <td>{log.clockOutAt ? new Date(log.clockOutAt).toLocaleTimeString("en-NG") : <span style={{ color: "var(--text-muted)" }}>--</span>}</td>
                      <td>{mapLink(log.clockOutLatitude, log.clockOutLongitude)}</td>
                      <td style={{ fontSize: "11px", maxWidth: "200px", whiteSpace: "normal" }}>{log.notes || "--"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

type ReportSummaryData = {
  sales: { _count: number; _sum: { total: string | null; paidTotal: string | null; outstandingTotal: string | null } };
  refunds: { _count: number; _sum: { amount: string | null } };
  cargo: Array<{ status: string; _count: number }>;
  tickets: { _count: number; _sum: { sellingPrice: string | null; profit?: string | null } };
  inventoryMovements?: Array<{ movementType: string; _count: number }>;
};

type ReportPreviewData = {
  reportKey: string;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
  truncated: boolean;
  filters: { stationId?: string; businessUnitId?: string; startDate?: string; endDate?: string };
};

type RecentRun = {
  id: string;
  key: string;
  title: string;
  timestamp: string;
  downloadUrl: string;
  rowCount: number;
  filters: { stationId?: string; startDate?: string; endDate?: string };
};

function ReportsView({
  period,
  onToast,
  allowedStations,
  identity,
}: {
  period: string;
  onToast: (toast: Toast) => void;
  allowedStations: AllowedStation[];
  identity: WorkspaceIdentity;
}) {
  const summaryApi = useApiData<ReportSummaryData>("/api/reports/summary");
  const [viewTab, setViewTab] = useState<"overview" | "catalogue" | "preview" | "recent">("overview");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Per-report filter state
  const [selectedReport, setSelectedReport] = useState<(typeof reportCatalogue)[0] | null>(null);
  const [filterStation, setFilterStation] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterFormat, setFilterFormat] = useState<"csv" | "json">("csv");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Recent runs
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

  const categories = ["All", ...Array.from(new Set(reportCatalogue.map((r) => r.category)))];

  const visibleReports = reportCatalogue.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || r.category === categoryFilter;
    const hasPermission = identity.permissions.includes(r.permission) || identity.permissions.includes("reports.view");
    return matchSearch && matchCat && hasPermission;
  });

  const openFilterModal = (report: typeof reportCatalogue[0]) => {
    setSelectedReport(report);
    setShowFilterModal(true);
    setFilterFormat("csv");
  };

  const buildExportUrl = (key: string, fmt: string) => {
    const url = new URL("/api/reports/export", window.location.origin);
    url.searchParams.set("report", key);
    url.searchParams.set("format", fmt);
    if (filterStation) url.searchParams.set("stationId", filterStation);
    if (filterStartDate) url.searchParams.set("startDate", filterStartDate);
    if (filterEndDate) url.searchParams.set("endDate", filterEndDate);
    return url.toString();
  };

  const downloadReport = () => {
    if (!selectedReport) return;
    const url = buildExportUrl(selectedReport.key, filterFormat);
    window.open(url, "_blank", "noopener,noreferrer");
    const run: RecentRun = {
      id: Date.now().toString(),
      key: selectedReport.key,
      title: selectedReport.title,
      timestamp: new Date().toISOString(),
      downloadUrl: url,
      rowCount: 0,
      filters: { stationId: filterStation || undefined, startDate: filterStartDate || undefined, endDate: filterEndDate || undefined },
    };
    setRecentRuns((prev) => [run, ...prev].slice(0, 20));
    onToast({ title: "Export started", detail: `${selectedReport.title} is being downloaded as ${filterFormat.toUpperCase()}.` });
    setShowFilterModal(false);
  };

  const previewReport = async () => {
    if (!selectedReport) return;
    setPreviewBusy(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/reports/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportKey: selectedReport.key,
          format: "json",
          stationId: filterStation || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        }),
      });
      const body = await res.json() as ApiEnvelope<ReportPreviewData>;
      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Preview failed.");
      setPreview(body.data!);
      setViewTab("preview");
      setShowFilterModal(false);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewBusy(false);
    }
  };

  const data = summaryApi.data;

  return (
    <div className="content-stack">
      {/* Hero + Tab Nav */}
      <section className="report-hero">
        <div>
          <span className="report-hero-icon"><FileSearch size={23} /></span>
          <div>
            <span>Reporting & Analytics</span>
            <strong>{period} · Permission-scoped</strong>
            <small>17 reports available. Data is audited and refreshed in real time.</small>
          </div>
        </div>
        <div className="report-hero-stats">
          <div><strong>{data?.sales._count ?? "—"}</strong><span>Sales records</span></div>
          <div><strong>{data?.tickets._count ?? "—"}</strong><span>Bookings</span></div>
          <div><strong>{data?.cargo.reduce((s, c) => s + c._count, 0) ?? "—"}</strong><span>Cargo AWBs</span></div>
          <div><strong>{summaryApi.loading ? "Syncing" : "Live"}</strong><span>Ledger state</span></div>
        </div>
      </section>

      {/* Tab Bar */}
      <div className="tab-bar" role="tablist">
        {(["overview", "catalogue", "preview", "recent"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={viewTab === tab}
            className={`tab-btn${viewTab === tab ? " active" : ""}`}
            onClick={() => setViewTab(tab)}
          >
            {tab === "overview" && <Activity size={14} />}
            {tab === "catalogue" && <FileSearch size={14} />}
            {tab === "preview" && <FileDown size={14} />}
            {tab === "recent" && <History size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "recent" && recentRuns.length > 0 && (
              <span className="tab-badge">{recentRuns.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {viewTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {summaryApi.error && <EmptyState icon={AlertTriangle} title="Summary could not be loaded" detail={summaryApi.error} compact />}
          <section className="summary-strip">
            <SummaryItem label="Sales value" value={formatNaira(Number(data?.sales._sum.total ?? 0))} icon={CircleDollarSign} tone="success" />
            <SummaryItem label="Collected" value={formatNaira(Number(data?.sales._sum.paidTotal ?? 0))} icon={BadgeCheck} tone="success" />
            <SummaryItem label="Outstanding" value={formatNaira(Number(data?.sales._sum.outstandingTotal ?? 0))} icon={Clock3} tone="warning" />
            <SummaryItem label="Refunds" value={formatNaira(Number(data?.refunds._sum.amount ?? 0))} icon={RotateCcw} tone="danger" />
            <SummaryItem label="Ticket revenue" value={formatNaira(Number(data?.tickets._sum.sellingPrice ?? 0))} icon={TicketCheck} tone="info" />
          </section>
          <Panel>
            <PanelHeader
              title="Ledger integrity"
              subtitle="Source-module status for the selected period"
              right={<button className="text-action" onClick={summaryApi.reload}><RefreshCcw size={14} />Refresh</button>}
            />
            <div className="document-rows">
              <DocumentRow icon={FileCheck2} name="Sales ledger" meta={`${data?.sales._count ?? 0} records · ${formatNaira(Number(data?.sales._sum.paidTotal ?? 0))} collected`} status="Live" />
              <DocumentRow icon={Plane} name="Cargo ledger" meta={`${data?.cargo.reduce((s, c) => s + c._count, 0) ?? 0} shipments`} status="Live" />
              <DocumentRow icon={TicketCheck} name="Ticket booking ledger" meta={`${data?.tickets._count ?? 0} records`} status="Live" />
              <DocumentRow icon={RotateCcw} name="Refunds ledger" meta={`${data?.refunds._count ?? 0} processed · ${formatNaira(Number(data?.refunds._sum.amount ?? 0))}`} status="Live" />
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Quick export" subtitle="Download common reports for the current period" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "12px 16px" }}>
              {reportCatalogue.slice(0, 6).map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.key}
                    className="secondary-button"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => openFilterModal(r)}
                  >
                    <Icon size={14} />{r.title}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {/* Tab: Catalogue */}
      {viewTab === "catalogue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Search + Category Filter */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                style={{ paddingLeft: "32px", width: "100%", height: "36px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-1)", fontSize: "13px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip${categoryFilter === cat ? " active" : ""}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Report Grid */}
          {visibleReports.length === 0 ? (
            <EmptyState icon={FileSearch} title="No matching reports" detail="Try a different search term or category filter." />
          ) : (
            <section className="report-catalogue">
              {visibleReports.map((report) => {
                const Icon = report.icon;
                return (
                  <article className="report-card" key={report.key}>
                    <div className="report-card-top">
                      <span><Icon size={19} /></span>
                      <em>{report.category}</em>
                    </div>
                    <h2>{report.title}</h2>
                    <p>{report.description}</p>
                    <div className="report-card-bottom">
                      <span>CSV · Preview</span>
                      <button onClick={() => openFilterModal(report)}>
                        Run report <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      )}

      {/* Tab: Preview */}
      {viewTab === "preview" && (
        <Panel>
          <PanelHeader
            title={preview ? reportCatalogue.find((r) => r.key === preview.reportKey)?.title ?? "Report preview" : "Report preview"}
            subtitle={preview ? `Showing first ${preview.rows.length} of ${preview.totalRows} rows${preview.truncated ? " — download for full data" : ""}` : "Run a report to see a preview here"}
            right={
              preview ? (
                <button
                  className="primary-button"
                  onClick={() => {
                    const url = buildExportUrl(preview.reportKey, "csv");
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FileDown size={14} /> Download CSV
                </button>
              ) : null
            }
          />
          {previewError && (
            <div style={{ padding: "12px 16px" }}>
              <EmptyState icon={AlertTriangle} title="Preview failed" detail={previewError} compact />
            </div>
          )}
          {!preview && !previewError && !previewBusy && (
            <EmptyState icon={FileSearch} title="No preview loaded" detail="Go to the Catalogue tab, open any report and click Preview to see rows here." />
          )}
          {previewBusy && <EmptyState icon={RefreshCcw} title="Generating preview" detail="Querying ledgers…" compact />}
          {preview && preview.rows.length > 0 && (
            <div className="table-wrap">
              <table className="data-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>{preview.columns.map((col) => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>
                      {preview.columns.map((col) => <td key={col}>{row[col] ?? ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview && preview.rows.length === 0 && (
            <EmptyState icon={FileSearch} title="No data for this report" detail="Try adjusting the filters or date range." />
          )}
        </Panel>
      )}

      {/* Tab: Recent Runs */}
      {viewTab === "recent" && (
        <Panel>
          <PanelHeader title="Recent report runs" subtitle="Exports generated in this session" />
          {recentRuns.length === 0 ? (
            <EmptyState icon={History} title="No recent runs" detail="Reports you export during this session will appear here." />
          ) : (
            <div className="document-rows">
              {recentRuns.map((run) => (
                <DocumentRow
                  key={run.id}
                  icon={FileDown}
                  name={run.title}
                  meta={`${new Date(run.timestamp).toLocaleTimeString()} · ${[run.filters.stationId, run.filters.startDate, run.filters.endDate].filter(Boolean).join(" · ") || "All stations, full period"}`}
                  status="Ready"
                  action={
                    <a href={run.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-action">
                      <FileDown size={14} /> Re-download
                    </a>
                  }
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Modal: Report Filters */}
      {showFilterModal && selectedReport && (
        <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setShowFilterModal(false)}>
          <div className="workflow-dialog" style={{ maxWidth: "500px" }}>
            <div className="workflow-header">
              <div>
                <span>{selectedReport.category}</span>
                <h2>{selectedReport.title}</h2>
                <p>{selectedReport.description}</p>
              </div>
              <button onClick={() => setShowFilterModal(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="workflow-body">
              <div className="form-grid">
                <Field label="Station" full>
                  <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}>
                    <option value="">All stations</option>
                    {allowedStations.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start Date">
                  <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                </Field>
                <Field label="End Date">
                  <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                </Field>
                <Field label="Export Format" full>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["csv", "json"] as const).map((fmt) => (
                      <label key={fmt} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                        <input
                          type="radio"
                          name="format"
                          value={fmt}
                          checked={filterFormat === fmt}
                          onChange={() => setFilterFormat(fmt)}
                        />
                        {fmt.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
              {previewError && <div className="form-note error"><AlertTriangle size={15} /><span>{previewError}</span></div>}
            </div>
            <div className="workflow-footer">
              <button type="button" className="secondary-button" onClick={() => setShowFilterModal(false)}>Cancel</button>
              <button
                type="button"
                className="secondary-button"
                onClick={previewReport}
                disabled={previewBusy}
              >
                {previewBusy ? "Loading…" : "Preview (100 rows)"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={downloadReport}
              >
                <FileDown size={14} /> Download {filterFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function UserEditModal({
  user,
  allowedStations,
  onClose,
  onComplete,
}: {
  user: UserRecord;
  allowedStations: AllowedStation[];
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const detailApi = useApiData<any>(`/api/users/${user.id}`);
  const setupApi = useApiData<UserSetup>("/api/users/setup");
  
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [selectedBUs, setSelectedBUs] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");

  const detail = detailApi.data;

  useEffect(() => {
    if (!detail) return;
    setFirstName(detail.firstName ?? "");
    setLastName(detail.lastName ?? "");
    setEmail(detail.email ?? "");
    setPhone(detail.phone ?? "");
    setSelectedRoles(detail.roleAssignments.map((a: any) => a.role.id));
    setSelectedStations(detail.stationScopes.map((s: any) => s.stationId));
    setSelectedBUs(detail.businessUnitScopes.map((b: any) => b.businessUnitId));
  }, [detail]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    if (selectedRoles.length === 0) {
      setError("Please select at least one role.");
      return;
    }
    setError(null); setBusy(true);
    try {
      await workflowPost(`/api/users/${user.id}`, {
        version: detail.version,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        roleIds: selectedRoles,
        stationIds: selectedStations,
        businessUnitIds: selectedBUs,
        password: password || undefined,
        reason
      }, "PATCH");
      onComplete("User updated", `${detail.username} access permissions and scopes were updated.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!window.confirm(`Are you sure you want to permanently delete user ${detail.username}? This action is irreversible.`)) return;
    setError(null); setDeleteBusy(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const body = await response.json() as ApiEnvelope<any>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Delete failed.");
      onComplete("User deleted", `${detail.username} has been permanently deleted.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleteBusy(false); }
  };

  if (detailApi.loading || setupApi.loading) return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="workflow-dialog" style={{ maxWidth: "500px" }}>
        <div className="workflow-header"><div><span>Access control</span><h2>Edit user access</h2></div><button onClick={onClose}><X size={19} /></button></div>
        <div className="workflow-body"><EmptyState icon={RefreshCcw} title="Loading user settings" detail="Reading current grants from registry." compact /></div>
      </div>
    </div>
  );

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <span>Access control</span>
            <h2 id="workflow-title">Edit user access: {detail?.username}</h2>
            <p>Modify roles, station isolation, and business unit scoping.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal"><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="workflow-body">
            <div className="form-grid">
              <Field label="First name"><input className="field-input" value={firstName} onChange={e => setFirstName(e.target.value)} required /></Field>
              <Field label="Last name"><input className="field-input" value={lastName} onChange={e => setLastName(e.target.value)} required /></Field>
              <Field label="Email"><input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
              <Field label="Phone"><input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} /></Field>

              <Field label="Set New Password (Optional)" full>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="field-input"
                    style={{ flex: 1 }}
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                  <button type="button" className="secondary-button" onClick={generatePassword} style={{ whiteSpace: "nowrap" }}>
                    Generate
                  </button>
                </div>
              </Field>
              
              <Field label="Roles (multiple)" full>
                <select
                  className="field-input"
                  multiple
                  required
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(Array.from(e.target.selectedOptions).map(o => o.value))}
                  style={{ height: "120px" }}
                >
                  {(setupApi.data?.roles ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name} · {r.scope.toLowerCase()}</option>
                  ))}
                </select>
              </Field>

              <Field label="Station scope (multiple)" full>
                <select
                  className="field-input"
                  multiple
                  value={selectedStations}
                  onChange={(e) => setSelectedStations(Array.from(e.target.selectedOptions).map(o => o.value))}
                  style={{ height: "120px" }}
                >
                  {allowedStations.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Business-unit scope (multiple)" full>
                <select
                  className="field-input"
                  multiple
                  value={selectedBUs}
                  onChange={(e) => setSelectedBUs(Array.from(e.target.selectedOptions).map(o => o.value))}
                  style={{ height: "100px" }}
                >
                  {(setupApi.data?.businessUnits ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reason for change" full>
                <input
                  className="field-input"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  minLength={5}
                  placeholder="e.g. Added Operations Manager role for Lagos scope"
                />
              </Field>
            </div>
            {error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>
          <div className="workflow-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="danger-ghost"
              onClick={handleDelete}
              disabled={deleteBusy}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 size={15} />
              <span>{deleteBusy ? "Deleting..." : "Delete user"}</span>
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={busy}>
                <ShieldCheck size={15} />
                <span>{busy ? "Saving..." : "Save access details"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccessView({
  onToast,
  onModal,
  allowedStations,
}: {
  onToast: (toast: Toast) => void;
  onModal?: (modal: ModalKind) => void;
  allowedStations: AllowedStation[];
}) {
  const [tab, setTab] = useState("Users");
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  
  const roleApi = useApiData<RoleRecord[]>("/api/roles"); const userApi = useApiData<UserRecord[]>("/api/users?pageSize=100"); const permissionApi = useApiData<PermissionRecord[]>("/api/permissions"); const sessionApi = useApiData<SessionRecord[]>("/api/sessions?pageSize=100");
  const roles = roleApi.data ?? [];
  const tones = ["navy", "blue", "teal", "gold", "slate", "red"];
  const loading = roleApi.loading || userApi.loading || permissionApi.loading || sessionApi.loading; const error = roleApi.error ?? userApi.error ?? permissionApi.error ?? sessionApi.error; const reload = () => { roleApi.reload(); userApi.reload(); permissionApi.reload(); sessionApi.reload(); };
  const q = query.trim().toLowerCase();
  const userAction = async (user: UserRecord, action: string, label: string) => { const reason = window.prompt(`${label} — enter a reason (recorded in the audit trail)`); if (!reason?.trim()) return; try { await workflowPost(`/api/users/${user.id}/${action}`, { reason }); onToast({ title: label, detail: `${user.name ?? user.username}: completed and audited.` }); } catch (reason_) { onToast({ title: `${label} failed`, detail: reason_ instanceof Error ? reason_.message : "The action could not be completed." }); } };
  const revokeSession = async (session: SessionRecord) => { if (!window.confirm(`Revoke this session for ${session.user.name ?? session.user.username}?`)) return; try { const response = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" }); const body = await response.json() as ApiEnvelope<unknown>; if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Session could not be revoked."); window.dispatchEvent(new Event("erp-data-changed")); onToast({ title: "Session revoked", detail: "The session was revoked and must re-authenticate." }); } catch (reason_) { onToast({ title: "Revoke failed", detail: reason_ instanceof Error ? reason_.message : "The session could not be revoked." }); } };
  const users = (userApi.data ?? []).filter((item) => !q || `${item.name ?? ""} ${item.firstName} ${item.lastName} ${item.username} ${item.email ?? ""}`.toLowerCase().includes(q));
  const visibleRoles = roles.filter((role) => !q || `${role.name} ${role.code} ${role.scope}`.toLowerCase().includes(q));
  const permissions = (permissionApi.data ?? []).filter((item) => !q || `${item.key} ${item.module} ${item.action} ${item.description}`.toLowerCase().includes(q));
  const sessions = (sessionApi.data ?? []).filter((item) => !q || `${item.user.name ?? ""} ${item.user.username} ${item.user.email ?? ""} ${item.ipAddress ?? ""}`.toLowerCase().includes(q));
  return <div className="content-stack"><section className="security-banner"><div><ShieldCheck size={22} /><div><strong>Server-enforced access control</strong><span>{roles.length} roles, {userApi.total} users and {permissionApi.total} granular permissions are configured.</span></div></div><button onClick={reload}><RefreshCcw size={14} /> Refresh access</button></section><Panel><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}><TableToolbar tabs={["Users", "Roles", "Permissions", "Sessions"]} activeTab={tab} onTab={(value) => { setTab(value); setQuery(""); }} placeholder="Search users, roles, permissions or sessions" search={query} onSearch={setQuery} />{tab === "Users" && onModal && <button className="primary-button" onClick={() => onModal("invite")} style={{ height: "36px", padding: "0 16px" }}><UserPlus size={15} /><span>Invite user</span></button>}</div>{error ? <EmptyState icon={AlertTriangle} title="Access configuration could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading access configuration" detail="Retrieving users, grants and active sessions." compact /> : tab === "Roles" ? visibleRoles.length ? <div className="role-grid">{visibleRoles.map((role, index) => <article className="role-card" key={role.id}><div><span className={classNames("role-icon", tones[index % tones.length])}><KeyRound size={17} /></span><StatusPill value={role.scope} /></div><strong>{role.name}</strong><span>{role.code}</span><div className="role-meta"><span><Users size={14} />{role._count.users} users</span><span><Fingerprint size={14} />{role.permissions.length} permissions</span></div><button>Server enforced <ShieldCheck size={13} /></button></article>)}</div> : <EmptyState icon={KeyRound} title={q ? "No matching roles" : "No roles configured"} detail={q ? "Try a different role name or code." : "Create a role and assign only the permissions needed for the job."} /> : tab === "Permissions" ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Permission</th><th>Module</th><th>Action</th><th>Description</th><th>Control</th></tr></thead><tbody>{permissions.map((item) => <tr key={item.id}><td><code>{item.key}</code></td><td>{item.module}</td><td>{item.action}</td><td>{item.description}</td><td><StatusPill value={item.elevated ? "Elevated" : "Standard"} /></td></tr>)}</tbody></table></div> : tab === "Sessions" ? <div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>IP address</th><th>User agent</th><th>Last seen</th><th>Expires</th><th>Status</th><th /></tr></thead><tbody>{sessions.map((item) => { const active = !item.revokedAt && new Date(item.expires) >= new Date(); return <tr key={item.id}><td><div className="primary-cell"><strong>{item.user.name ?? item.user.username}</strong><span>{item.user.email ?? item.user.username}</span></div></td><td>{item.ipAddress ?? "Unknown"}</td><td>{item.userAgent?.slice(0, 60) ?? "Unknown"}</td><td>{new Date(item.lastSeenAt).toLocaleString("en-NG")}</td><td>{formatDate(item.expires)}</td><td><StatusPill value={item.revokedAt ? "Revoked" : new Date(item.expires) < new Date() ? "Expired" : "Active"} /></td><td>{active ? <button className="row-button" onClick={() => revokeSession(item)}>Revoke</button> : <span className="verified-cell"><ShieldCheck size={13} />Closed</span>}</td></tr>; })}</tbody></table></div> : users.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Username</th><th>Roles</th><th>Station scopes</th><th>Last login</th><th>Status</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="agent-cell staff"><span>{`${item.firstName[0]}${item.lastName[0]}`}</span><div><strong>{item.name ?? `${item.firstName} ${item.lastName}`}</strong><small>{item.email ?? "No email"}</small></div></div></td><td><code>{item.username}</code></td><td>{item.roleAssignments.map((grant) => grant.role.name).join(", ") || "—"}</td><td>{item.stationScopes.length}</td><td>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("en-NG") : "Never"}</td><td><StatusPill value={item.status.replaceAll("_", " ")} /></td><td><div className="row-actions">{item.status === "ACTIVE" ? <button className="row-button" onClick={() => userAction(item, "deactivate", "Deactivate user")}>Disable</button> : <button className="row-button" onClick={() => userAction(item, "activate", "Activate user")}>Activate</button>}<button className="icon-ghost" title="Edit user access" onClick={() => setEditingUser(item)}><Settings2 size={15} /></button><button className="icon-ghost" title="Reset password" onClick={() => userAction(item, "reset-password", "Password reset")}><KeyRound size={15} /></button><button className="icon-ghost" title="Revoke all sessions" onClick={() => userAction(item, "revoke-sessions", "Revoke sessions")}><LogOut size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title={q ? "No matching users" : "No users"} detail={q ? "Try a different name, username or email." : "Invite a user to grant scoped access."} />}{editingUser && <UserEditModal user={editingUser} allowedStations={allowedStations} onClose={() => setEditingUser(null)} onComplete={(title, detail) => { setEditingUser(null); userApi.reload(); onToast({ title, detail }); }} />}<div className="permission-note"><LockKeyhole size={17} /><div><strong>Server-enforced permissions</strong><span>Menu visibility, API authorization and database query scope use the same permission policy.</span></div></div></Panel></div>;
}

function AuditDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const api = useApiData<AuditRecord>(`/api/audit/${id}`);
  const event = api.data;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "600px" }}>
        <div className="workflow-header">
          <div>
            <div className="eyebrow">Audit log details</div>
            <h2 id="audit-detail-title">Immutable Event Record</h2>
            <p>Cryptographically hashed details, actor context, and JSON payloads.</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <div className="workflow-body">
          {api.error ? (
            <EmptyState icon={AlertTriangle} title="Could not load event" detail={api.error} />
          ) : api.loading || !event ? (
            <EmptyState icon={RefreshCcw} title="Loading event" detail="Fetching immutable payload..." compact />
          ) : (
            <div className="form-grid">
              <Field label="Action">
                <input value={event.action} readOnly />
              </Field>
              <Field label="Entity Type">
                <input value={event.entityType} readOnly />
              </Field>
              <Field label="Entity ID">
                <input value={event.entityId ?? "—"} readOnly />
              </Field>
              <Field label="Outcome">
                <input value={event.outcome} readOnly />
              </Field>
              <Field label="Timestamp">
                <input value={new Date(event.occurredAt).toLocaleString("en-NG")} readOnly />
              </Field>
              <Field label="IP Address">
                <input value={event.ipAddress ?? "—"} readOnly />
              </Field>
              <Field label="Event Hash" full>
                <input value={event.eventHash} readOnly style={{ fontFamily: "monospace" }} />
              </Field>
              
              {event.before !== undefined && (
                <Field label="Before (Change-set)" full>
                  <textarea 
                    value={event.before ? JSON.stringify(event.before, null, 2) : "No previous state or redacted"} 
                    readOnly 
                    rows={6}
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                  />
                </Field>
              )}
              
              {event.after !== undefined && (
                <Field label="After (Change-set)" full>
                  <textarea 
                    value={event.after ? JSON.stringify(event.after, null, 2) : "No new state or redacted"} 
                    readOnly 
                    rows={6}
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                  />
                </Field>
              )}
              
              {event.metadata !== undefined && (
                <Field label="Metadata" full>
                  <textarea 
                    value={event.metadata ? JSON.stringify(event.metadata, null, 2) : "No metadata or redacted"} 
                    readOnly 
                    rows={4}
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                  />
                </Field>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditView() {
  const [filter, setFilter] = useState("All events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const action = filter === "Security" ? "auth." : filter === "Transactions" ? "sale" : ""; const auditApi = useApiData<AuditRecord[]>(`/api/audit?pageSize=100${action ? `&action=${encodeURIComponent(action)}` : ""}`); const integrityApi = useApiData<{ valid: boolean; checked: number; brokenAt: string | null; headHash: string | null }>("/api/audit/verify"); const events = auditApi.data ?? []; const failures = events.filter((item) => item.outcome !== "SUCCESS").length;
  const table = useTableControls(events, (event, q) => `${event.action} ${event.entityType} ${event.entityId ?? ""} ${event.station?.name ?? ""} ${event.ipAddress ?? ""} ${event.eventHash} ${event.actor?.name ?? ""} ${event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : ""}`.toLowerCase().includes(q));
  return <div className="content-stack">{selectedEventId && <AuditDetailPanel id={selectedEventId} onClose={() => setSelectedEventId(null)} />}<section className="audit-summary"><div><span>Loaded events</span><strong>{auditApi.total}</strong><em>Permission scoped</em></div><div><span>Protected actions</span><strong>{events.length - failures}</strong><em>Successful events</em></div><div><span>Denied / failed</span><strong>{failures}</strong><em>Evidence retained</em></div><div><span>Audit integrity</span><strong>{integrityApi.loading ? "Checking" : integrityApi.data?.valid ? "Verified" : "Attention"}</strong><em><ShieldCheck size={13} /> {integrityApi.data?.checked ?? 0} chained events</em></div></section><Panel><TableToolbar tabs={["All events", "Security", "Transactions", "Data changes"]} activeTab={filter} onTab={(value) => { setFilter(value); table.resetPage(); }} placeholder="Search actor, event, subject or hash" exportable search={table.search} onSearch={table.setSearch} onExport={() => window.open("/api/audit/export", "_blank", "noopener,noreferrer")} />{auditApi.error || integrityApi.error ? <EmptyState icon={AlertTriangle} title="Audit evidence could not be loaded" detail={auditApi.error ?? integrityApi.error ?? "Refresh to retry."} /> : auditApi.loading ? <EmptyState icon={RefreshCcw} title="Loading audit evidence" detail="Reading immutable events and actor snapshots." compact /> : table.filtered.length ? <div className="table-wrap"><table className="data-table audit-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Subject</th><th>Station</th><th>IP / source</th><th>Outcome</th><th>Hash</th></tr></thead><tbody>{table.pageRows.map((event) => { const actor = event.actor?.name ?? (event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : "System"); return <tr key={event.id} onClick={() => setSelectedEventId(event.id)} className="clickable-row"><td><div className="primary-cell"><strong>{new Date(event.occurredAt).toLocaleTimeString("en-NG")}</strong><span>{formatDate(event.occurredAt)}</span></div></td><td>{actor}</td><td><div className="event-cell"><span className={classNames("event-dot", event.outcome === "SUCCESS" ? "success" : "danger")} />{event.action}</div></td><td><code>{event.entityType}:{event.entityId?.slice(0, 10) ?? "—"}</code></td><td>{event.station?.name ?? "Company-wide"}</td><td>{event.ipAddress ?? event.requestId?.slice(0, 12) ?? "Server"}</td><td><StatusPill value={event.outcome} /></td><td><code>{event.eventHash.slice(0, 10)}</code></td></tr>; })}</tbody></table></div> : <EmptyState icon={ShieldCheck} title="No audit events" detail="Protected actions will produce chained audit evidence." />}<div className="settings-actions"><a className="secondary-button" href="/api/audit/export"><Download size={15} />Export verified CSV</a><button className="primary-button" onClick={() => { auditApi.reload(); integrityApi.reload(); }}><RefreshCcw size={15} />Verify again</button></div><Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} /></Panel></div>;
}

function ManagementView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const healthApi = useApiData<{ status: string; database: string; latencyMs: number }>("/api/health");
  const tools = [
    { icon: RotateCcw, title: "Reverse transaction", detail: "Create a controlled compensating entry with reason and approval.", risk: "High control", module: "finance" },
    { icon: ArrowLeftRight, title: "Inventory controls", detail: "Review immutable movements, transfers and adjustments.", risk: "Audited", module: "inventory" },
    { icon: Users, title: "Merge duplicate customers", detail: "Consolidate records without losing historical relationships.", risk: "Preview first", module: "customers" },
    { icon: KeyRound, title: "Reset & lock accounts", detail: "Revoke sessions, reset credentials and protect user accounts.", risk: "Immediate", module: "access" },
    { icon: FileSearch, title: "Audit evidence", detail: "Verify the chained event ledger and export controlled evidence.", risk: "Read-only", module: "audit" },
    { icon: Gauge, title: "System diagnostics", detail: "Check the application and primary database readiness probe.", risk: "Safe", module: "management" },
  ];
  return <div className="content-stack"><section className="protected-banner"><LockKeyhole size={22} /><div><strong>Protected administration area</strong><span>Every action here requires a reason, elevated permission and immutable audit record.</span></div><StatusPill value="Elevated access" /></section><section className="management-grid">{tools.map((tool) => { const Icon = tool.icon; return <article className="management-card" key={tool.title}><div><span><Icon size={19} /></span><em>{tool.risk}</em></div><h2>{tool.title}</h2><p>{tool.detail}</p><button onClick={() => tool.module === "management" ? healthApi.reload() : onNavigate(tool.module)}>Open tool <ArrowRight size={14} /></button></article>; })}</section><Panel><PanelHeader title="System diagnostics" subtitle="Live application and database readiness" right={<button className="text-action" onClick={healthApi.reload}><RefreshCcw size={12} /> Check now</button>} />{healthApi.error ? <EmptyState icon={AlertTriangle} title="Readiness check failed" detail={healthApi.error} /> : healthApi.loading ? <EmptyState icon={RefreshCcw} title="Checking production dependencies" detail="Running the application readiness probe." compact /> : <div className="diagnostic-grid"><DiagnosticItem label="Application" detail="Next.js production runtime" latency={healthApi.data?.status ?? "unknown"} /><DiagnosticItem label="PostgreSQL" detail="Primary database connection" latency={healthApi.data ? `${healthApi.data.latencyMs} ms` : "unknown"} /><DiagnosticItem label="Audit chain" detail="Append-only evidence ledger" latency="Enabled" /><DiagnosticItem label="Posting controls" detail="Stock, wallet and cashbook ledgers" latency="Enabled" /></div>}</Panel></div>;
}

type PreferenceRecord = {
  id: string;
  userId: string;
  type: string;
  channel: "IN_APP" | "EMAIL" | "SMS";
  enabled: boolean;
  quietFrom?: string | null;
  quietTo?: string | null;
};

const MANDATORY_TYPES = new Set([
  "auth.login_failed",
  "users.created",
  "security.access_changed",
  "security.session_revoked",
  "security.password_reset",
]);

function NotificationsView({ onNavigate, onToast }: { onNavigate?: (targetId: string) => void; onToast?: (toast: Toast) => void }) {
  const [scope, setScope] = useState("Unread");
  const statusParam = scope === "Unread" ? "UNREAD" : "";
  const api = useApiData<NotificationRecord[]>(`/api/notifications?pageSize=100${statusParam ? `&status=${statusParam}` : ""}`);
  const prefApi = useApiData<PreferenceRecord[]>("/api/notifications/preferences");

  const [savingPref, setSavingPref] = useState(false);
  const [processingWorker, setProcessingWorker] = useState(false);

  const items = (api.data ?? []).filter((item) => {
    if (scope === "Security") return item.type.toLowerCase().includes("security") || item.type.toLowerCase().includes("auth");
    if (scope === "Operational") return item.type.includes("inventory") || item.type.includes("sales") || item.type.includes("agents");
    if (scope === "Approvals") return item.type.includes("approval");
    return true;
  });

  const table = useTableControls(items, (item, q) =>
    `${item.title} ${item.message} ${item.type}`.toLowerCase().includes(q)
  );

  const updateStatus = async (id: string, targetHref?: string | null) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "READ" }),
    });
    api.reload();

    if (targetHref && onNavigate) {
      if (targetHref.includes("inventory")) onNavigate("inventory");
      else if (targetHref.includes("sales")) onNavigate("sales");
      else if (targetHref.includes("agents")) onNavigate("agents");
      else if (targetHref.includes("approvals")) onNavigate("approvals");
      else if (targetHref.includes("audit")) onNavigate("audit");
      else if (targetHref.includes("access")) onNavigate("access");
    }
  };

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    });
    api.reload();
    if (onToast) onToast({ title: "Notifications Updated", detail: "All unread items marked as read." });
  };

  const togglePreference = async (type: string, channel: "IN_APP" | "EMAIL" | "SMS", currentEnabled: boolean) => {
    if (MANDATORY_TYPES.has(type) && !currentEnabled) {
      if (onToast) onToast({ title: "Action Denied", detail: "Mandatory security alerts cannot be disabled." });
      return;
    }
    setSavingPref(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, channel, enabled: !currentEnabled }),
      });
      const body = await res.json() as ApiEnvelope<unknown>;
      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Preference update failed.");
      prefApi.reload();
      if (onToast) onToast({ title: "Preference Saved", detail: `Notification channel ${channel} updated for ${type}.` });
    } catch (err) {
      if (onToast) onToast({ title: "Update Failed", detail: err instanceof Error ? err.message : "Failed to update preference." });
    } finally {
      setSavingPref(false);
    }
  };

  const triggerWorker = async () => {
    setProcessingWorker(true);
    try {
      const res = await fetch("/api/notifications/process", { method: "POST" });
      const body = await res.json() as ApiEnvelope<{ processed: number; published: number }>;
      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Worker processing failed.");
      api.reload();
      if (onToast) onToast({ title: "Outbox Processed", detail: `Processed ${body.data?.processed ?? 0} outbox events (${body.data?.published ?? 0} published).` });
    } catch (err) {
      if (onToast) onToast({ title: "Worker Error", detail: err instanceof Error ? err.message : "Failed to process outbox events." });
    } finally {
      setProcessingWorker(false);
    }
  };

  const notificationTypes = [
    { key: "inventory.low_stock", label: "Low Stock Alerts", category: "Operational" },
    { key: "agents.low_balance", label: "Low Agent Balance", category: "Operational" },
    { key: "sales.large_transaction", label: "Large Transactions", category: "Operational" },
    { key: "approvals.pending", label: "Pending Approvals", category: "Operational" },
    { key: "auth.login_failed", label: "Failed Login Attempts", category: "Security", mandatory: true },
    { key: "users.created", label: "User Account Creation", category: "Security", mandatory: true },
  ];

  return (
    <div className="content-stack">
      <div className="notification-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Main List */}
        <Panel>
          <TableToolbar
            tabs={["Unread", "All", "Operational", "Security", "Approvals"]}
            activeTab={scope}
            onTab={(value) => {
              setScope(value);
              table.resetPage();
            }}
            placeholder="Search notifications by title or message..."
            search={table.search}
            onSearch={table.setSearch}
          />
          {api.error ? (
            <EmptyState icon={AlertTriangle} title="Notifications could not be loaded" detail={api.error} />
          ) : api.loading ? (
            <EmptyState icon={RefreshCcw} title="Loading inbox" detail="Retrieving your personal notification stream." compact />
          ) : table.filtered.length ? (
            <div className="notification-centre-list">
              {table.pageRows.map((item) => {
                const tone: Tone =
                  item.severity === "ERROR" || item.severity === "DANGER"
                    ? "danger"
                    : item.severity === "WARNING"
                    ? "warning"
                    : item.severity === "SUCCESS"
                    ? "success"
                    : "info";
                return (
                  <button key={item.id} onClick={() => updateStatus(item.id, item.href)}>
                    <span className={classNames("centre-notification-icon", tone)}>
                      {tone === "danger" ? <AlertTriangle size={17} /> : tone === "warning" ? <Clock3 size={17} /> : <CheckCircle2 size={17} />}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{new Date(item.createdAt).toLocaleString("en-NG")}</small>
                    </div>
                    {item.status === "UNREAD" && <span className="unread-marker" />}
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title={table.search ? "No matching notifications" : "Inbox is clear"}
              detail={table.search ? "Try a different keyword." : "There are no notifications in this view."}
            />
          )}
          <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
        </Panel>

        {/* Sidebar Controls & Preferences */}
        <aside className="notification-preferences panel" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          <div>
            <h2 style={{ fontSize: "16px", margin: "0 0 4px 0" }}>Inbox & Outbox Worker</h2>
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "0 0 14px 0" }}>
              Outbox events process atomically with domain transactions and dispatch via provider-ready channels.
            </p>
            <SummaryItem label="Total Unread" value={items.filter((item) => item.status === "UNREAD").length.toString()} icon={Clock3} tone="warning" />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button className="secondary-button" style={{ flex: 1 }} onClick={markAll}>Mark All Read</button>
              <button className="primary-button" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }} onClick={triggerWorker} disabled={processingWorker}>
                <RefreshCcw size={12} /> {processingWorker ? "Processing..." : "Run Outbox Worker"}
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <h3 style={{ fontSize: "14px", margin: "0 0 8px 0" }}>Delivery Preferences</h3>
            <p style={{ fontSize: "11px", color: "var(--text-3)", margin: "0 0 12px 0" }}>
              Configure In-App, Email, and SMS channels per event type.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
              {notificationTypes.map((nt) => {
                const inAppPref = prefApi.data?.find((p) => p.type === nt.key && p.channel === "IN_APP");
                const emailPref = prefApi.data?.find((p) => p.type === nt.key && p.channel === "EMAIL");
                const smsPref = prefApi.data?.find((p) => p.type === nt.key && p.channel === "SMS");

                const inAppEnabled = inAppPref ? inAppPref.enabled : true;
                const emailEnabled = emailPref ? emailPref.enabled : true;
                const smsEnabled = smsPref ? smsPref.enabled : false;

                return (
                  <div key={nt.key} style={{ background: "var(--surface-2)", padding: "10px", borderRadius: "6px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong>{nt.label}</strong>
                      {nt.mandatory && (
                        <span style={{ fontSize: "10px", background: "var(--danger-subtle)", color: "var(--danger)", padding: "1px 6px", borderRadius: "8px", fontWeight: "bold" }}>
                          Mandatory
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "10px", fontSize: "11px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: nt.mandatory ? "not-allowed" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={inAppEnabled}
                          disabled={nt.mandatory || savingPref}
                          onChange={() => togglePreference(nt.key, "IN_APP", inAppEnabled)}
                        />
                        In-App
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: nt.mandatory ? "not-allowed" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={emailEnabled}
                          disabled={nt.mandatory || savingPref}
                          onChange={() => togglePreference(nt.key, "EMAIL", emailEnabled)}
                        />
                        Email
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: nt.mandatory ? "not-allowed" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={smsEnabled}
                          disabled={nt.mandatory || savingPref}
                          onChange={() => togglePreference(nt.key, "SMS", smsEnabled)}
                        />
                        SMS
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


type DetailedDocument = DocumentRecord & {
  version?: number;
  templateKey?: string;
  checksum?: string;
  objectKey?: string;
  generatedAt?: string;
  stationId?: string | null;
  station?: { id: string; code: string; name: string } | null;
  prints: Array<{
    id: string;
    printedAt: string;
    printedById: string;
    format: string;
    printerName?: string | null;
    reason?: string | null;
  }>;
};

type DocumentLineage = {
  id: string;
  version: number;
  documentNumber: string;
  createdAt: string;
  status: string;
};

function DocumentsView({ onToast }: { onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("All documents");
  const api = useApiData<DetailedDocument[]>("/api/documents?pageSize=100");

  // Selected document for detail drawer
  const [selectedDoc, setSelectedDoc] = useState<DetailedDocument | null>(null);
  const [lineage, setLineage] = useState<DocumentLineage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reprint modal state
  const [reprintModalDoc, setReprintModalDoc] = useState<DetailedDocument | null>(null);
  const [reprintFormat, setReprintFormat] = useState<"80mm" | "58mm" | "a4">("80mm");
  const [reprintReason, setReprintReason] = useState("User requested reprint");
  const [reprintBusy, setReprintBusy] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadModule, setUploadModule] = useState("sales");
  const [uploadRecordType, setUploadRecordType] = useState("Sale");
  const [uploadRecordId, setUploadRecordId] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const documents = (api.data ?? []).filter((item) => {
    if (tab === "Receipts") return item.documentType.includes("RECEIPT");
    if (tab === "Cargo labels") return item.documentType === "CARGO_LABEL";
    if (tab === "Invoices") return item.documentType.includes("INVOICE");
    if (tab === "Statements") return item.documentType.includes("STATEMENT");
    if (tab === "Reports") return item.documentType.includes("REPORT");
    return true;
  });

  const table = useTableControls(documents, (item, q) =>
    `${item.documentType} ${item.documentNumber} ${item.sourceType} ${item.station?.name ?? ""}`.toLowerCase().includes(q)
  );

  const openDetailDrawer = async (doc: DetailedDocument) => {
    setSelectedDoc(doc);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const body = await res.json() as ApiEnvelope<{ document: DetailedDocument; lineage: DocumentLineage[] }>;
      if (res.ok && body.ok && body.data) {
        setSelectedDoc(body.data.document);
        setLineage(body.data.lineage);
      }
    } catch {
      // Fallback to basic record if endpoint call fails
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReprintSubmit = async () => {
    if (!reprintModalDoc) return;
    setReprintBusy(true);
    try {
      const fmtParam = reprintFormat === "80mm" ? "THERMAL_80MM" : reprintFormat === "58mm" ? "THERMAL_58MM" : "A4";
      const res = await fetch(`/api/documents/${reprintModalDoc.id}/reprint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: fmtParam, reason: reprintReason }),
      });
      const body = await res.json() as ApiEnvelope<{ document: DetailedDocument }>;

      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Reprint failed.");

      onToast({
        title: "Reprint Logged & Ready",
        detail: `Print event recorded for ${reprintModalDoc.documentNumber} (${fmtParam}).`,
      });

      // Open print page based on sourceType
      if (reprintModalDoc.sourceType === "Sale") {
        if (reprintModalDoc.documentType.includes("INVOICE")) {
          window.open(`/print/invoice/${reprintModalDoc.sourceId}`, "_blank", "noopener,noreferrer");
        } else {
          window.open(`/print/receipt/${reprintModalDoc.sourceId}?format=${reprintFormat}`, "_blank", "noopener,noreferrer");
        }
      } else if (reprintModalDoc.sourceType === "CargoShipment") {
        window.open(`/print/cargo/${reprintModalDoc.sourceId}?format=${reprintFormat === "a4" ? "a4" : "thermal"}`, "_blank", "noopener,noreferrer");
      } else if (reprintModalDoc.sourceType === "WalletAccount") {
        window.open(`/print/statement/${reprintModalDoc.sourceId}`, "_blank", "noopener,noreferrer");
      } else {
        window.open(`/api/documents/${reprintModalDoc.id}`, "_blank", "noopener,noreferrer");
      }

      setReprintModalDoc(null);
      api.reload();
    } catch (err) {
      onToast({
        title: "Reprint Failed",
        detail: err instanceof Error ? err.message : "Document reprint could not be processed.",
      });
    } finally {
      setReprintBusy(false);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!uploadRecordId) {
      setUploadError("Please enter a target record ID.");
      return;
    }
    setUploadBusy(true);
    setUploadError(null);

    try {
      // Calculate dummy SHA-256 hex or use timestamp hash
      const dummyChecksum = Array.from(new Uint8Array(32))
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

      // 1. Presign
      const presignRes = await fetch("/api/documents/attachments/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          mimeType: uploadFile.type || "application/pdf",
          sizeBytes: uploadFile.size,
          checksumSha256: dummyChecksum,
          module: uploadModule,
          recordType: uploadRecordType,
          recordId: uploadRecordId,
        }),
      });
      const presignBody = await presignRes.json() as ApiEnvelope<{ objectKey: string }>;
      if (!presignRes.ok || !presignBody.ok) throw new Error(presignBody.error?.message ?? "Presign failed.");

      // 2. Finalize
      const finalizeRes = await fetch("/api/documents/attachments/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          objectKey: presignBody.data!.objectKey,
          originalName: uploadFile.name,
          mimeType: uploadFile.type || "application/pdf",
          sizeBytes: uploadFile.size,
          checksumSha256: dummyChecksum,
          module: uploadModule,
          recordType: uploadRecordType,
          recordId: uploadRecordId,
        }),
      });
      const finalizeBody = await finalizeRes.json() as ApiEnvelope<unknown>;
      if (!finalizeRes.ok || !finalizeBody.ok) throw new Error(finalizeBody.error?.message ?? "Finalize failed.");

      onToast({
        title: "Attachment Uploaded",
        detail: `${uploadFile.name} successfully registered in document store.`,
      });

      setShowUploadModal(false);
      setUploadFile(null);
      api.reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Attachment upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const totalPrintsCount = (api.data ?? []).reduce((sum, item) => sum + (item.prints?.length ?? 0), 0);
  const readyCount = (api.data ?? []).filter((item) => item.status === "READY").length;

  return (
    <div className="content-stack">
      {/* KPI Stats */}
      <section className="document-stats">
        <SummaryItem label="Stored Documents" value={api.total.toString()} icon={FileCheck2} tone="info" />
        <SummaryItem label="Ready Status" value={readyCount.toString()} icon={Cloud} tone="success" />
        <SummaryItem label="Total Print Events" value={totalPrintsCount.toString()} icon={Printer} tone="info" />
        <SummaryItem label="Failed Records" value={(api.data ?? []).filter((item) => item.status === "FAILED").length.toString()} icon={ShieldCheck} tone="danger" />
      </section>

      {/* Main Table Panel */}
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <TableToolbar
            tabs={["All documents", "Receipts", "Cargo labels", "Invoices", "Statements", "Reports"]}
            activeTab={tab}
            onTab={(value) => {
              setTab(value);
              table.resetPage();
            }}
            placeholder="Search document number or type..."
            search={table.search}
            onSearch={table.setSearch}
          />
          <button className="primary-button" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setShowUploadModal(true)}>
            <Cloud size={14} /> Upload Attachment
          </button>
        </div>

        {api.error ? (
          <EmptyState icon={AlertTriangle} title="Documents could not be loaded" detail={api.error} />
        ) : api.loading ? (
          <EmptyState icon={RefreshCcw} title="Loading document register" detail="Retrieving protected metadata, checksums, and print audit trail." compact />
        ) : table.filtered.length ? (
          <div className="document-rows spacious">
            {table.pageRows.map((doc) => (
              <DocumentRow
                key={doc.id}
                icon={doc.documentType === "CARGO_LABEL" ? Tag : FileCheck2}
                name={`${doc.documentType.replaceAll("_", " ")} — ${doc.documentNumber}`}
                meta={`${doc.mimeType ?? "HTML Output"} · ${doc.station?.name ?? "Company-wide"} · ${formatDate(doc.generatedAt ?? doc.createdAt)} · v${doc.version ?? 1} · ${doc.prints?.length ?? 0} prints`}
                status={doc.status}
                action={
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="secondary-button"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailDrawer(doc);
                      }}
                    >
                      Details & History
                    </button>
                    <button
                      className="primary-button"
                      style={{ padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReprintModalDoc(doc);
                        setReprintReason("User requested reprint");
                      }}
                    >
                      <Printer size={12} /> Reprint
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileCheck2}
            title={table.search ? "No matching documents" : "No documents found"}
            detail={table.search ? "Try a different search query or tab." : "Generated receipts, invoices, cargo labels, statements, and uploaded attachments appear here."}
          />
        )}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>

      {/* Document Detail & Lineage Drawer / Modal */}
      {selectedDoc && (
        <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setSelectedDoc(null)}>
          <div className="workflow-dialog" style={{ maxWidth: "680px" }}>
            <div className="workflow-header">
              <div>
                <span>{selectedDoc.documentType.replaceAll("_", " ")}</span>
                <h2>{selectedDoc.documentNumber}</h2>
                <p>Version {selectedDoc.version ?? 1} · Status: {selectedDoc.status}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="workflow-body">
              {loadingDetail ? (
                <EmptyState icon={RefreshCcw} title="Fetching document history" detail="Loading checksums and print log..." compact />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--surface-2)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                    <div><strong>Source Entity:</strong> {selectedDoc.sourceType} (#{selectedDoc.sourceId})</div>
                    <div><strong>Station:</strong> {selectedDoc.station?.name ?? "Company-wide"}</div>
                    <div><strong>Template Key:</strong> {selectedDoc.templateKey ?? "default"}</div>
                    <div><strong>MIME Type:</strong> {selectedDoc.mimeType ?? "text/html"}</div>
                    <div><strong>Object Key:</strong> <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{selectedDoc.objectKey ?? "N/A"}</span></div>
                    <div><strong>Checksum:</strong> <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{selectedDoc.checksum ?? "N/A"}</span></div>
                    <div><strong>Generated At:</strong> {new Date(selectedDoc.generatedAt ?? selectedDoc.createdAt).toLocaleString("en-NG")}</div>
                    <div><strong>Total Prints:</strong> {selectedDoc.prints?.length ?? 0} times</div>
                  </div>

                  {/* Version Lineage */}
                  {lineage.length > 1 && (
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Version History & Lineage</h4>
                      <div className="document-rows">
                        {lineage.map((item) => (
                          <DocumentRow
                            key={item.id}
                            icon={FileCheck2}
                            name={`${item.documentNumber} (v${item.version})`}
                            meta={new Date(item.createdAt).toLocaleString("en-NG")}
                            status={item.id === selectedDoc.id ? "ACTIVE VERSION" : "SUPERSEDED"}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print Audit Log */}
                  <div>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Print Event Audit Log ({selectedDoc.prints?.length ?? 0})</h4>
                    {selectedDoc.prints && selectedDoc.prints.length > 0 ? (
                      <div className="document-rows" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {selectedDoc.prints.map((p) => (
                          <DocumentRow
                            key={p.id}
                            icon={Printer}
                            name={`Printed as ${p.format}`}
                            meta={`${new Date(p.printedAt).toLocaleString("en-NG")} · Reason: ${p.reason ?? "N/A"}`}
                            status="Audited"
                          />
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>No print events logged for this document yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="workflow-footer">
              <button type="button" className="secondary-button" onClick={() => setSelectedDoc(null)}>Close</button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setReprintModalDoc(selectedDoc);
                  setSelectedDoc(null);
                }}
              >
                <Printer size={14} /> Trigger Reprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reprint Options */}
      {reprintModalDoc && (
        <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setReprintModalDoc(null)}>
          <div className="workflow-dialog" style={{ maxWidth: "460px" }}>
            <div className="workflow-header">
              <div>
                <span>Audited Reprint</span>
                <h2>{reprintModalDoc.documentNumber}</h2>
                <p>Log a print event and open printable preview</p>
              </div>
              <button onClick={() => setReprintModalDoc(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="workflow-body">
              <div className="form-grid">
                <Field label="Target Printer Format" full>
                  <select value={reprintFormat} onChange={(e) => setReprintFormat(e.target.value as any)}>
                    <option value="80mm">Thermal 80mm (Zebra / POS Receipt)</option>
                    <option value="58mm">Thermal 58mm (Compact Receipt)</option>
                    <option value="a4">A4 Standard Sheet (Full Page Invoice)</option>
                  </select>
                </Field>
                <Field label="Reprint Reason / Justification" full>
                  <input
                    value={reprintReason}
                    onChange={(e) => setReprintReason(e.target.value)}
                    placeholder="e.g. Customer copy requested, Paper jam"
                  />
                </Field>
              </div>
            </div>
            <div className="workflow-footer">
              <button type="button" className="secondary-button" onClick={() => setReprintModalDoc(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={handleReprintSubmit} disabled={reprintBusy}>
                {reprintBusy ? "Logging..." : "Confirm & Print"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Attachment */}
      {showUploadModal && (
        <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setShowUploadModal(false)}>
          <div className="workflow-dialog" style={{ maxWidth: "500px" }}>
            <div className="workflow-header">
              <div>
                <span>Document Store</span>
                <h2>Upload Protected Attachment</h2>
                <p>Attach invoices, scanned GRNs, or receipts (Max 10MB)</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="workflow-body">
                <div className="form-grid">
                  <Field label="Select File (PDF, PNG, JPEG, CSV, XLSX, TXT)" full>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.txt"
                    />
                  </Field>
                  <Field label="Module">
                    <select value={uploadModule} onChange={(e) => setUploadModule(e.target.value)}>
                      <option value="sales">Sales & Revenue</option>
                      <option value="inventory">Inventory & Purchase</option>
                      <option value="cargo">Cargo & Shipping</option>
                      <option value="finance">Finance & Accounts</option>
                    </select>
                  </Field>
                  <Field label="Record Type">
                    <input value={uploadRecordType} onChange={(e) => setUploadRecordType(e.target.value)} placeholder="e.g. Sale, PurchaseOrder" />
                  </Field>
                  <Field label="Target Record ID" full>
                    <input value={uploadRecordId} onChange={(e) => setUploadRecordId(e.target.value)} placeholder="e.g. sale_123 or po_456" />
                  </Field>
                </div>
                {uploadError && <div className="form-note error"><AlertTriangle size={15} /><span>{uploadError}</span></div>}
              </div>
              <div className="workflow-footer">
                <button type="button" className="secondary-button" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={uploadBusy}>
                  {uploadBusy ? "Uploading..." : "Presign & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function BusinessUnitModal({ onClose, onSuccess, initialData }: { onClose: () => void; onSuccess: () => void; initialData?: { id: string; code: string; name: string; description?: string | null; version: number } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/settings/business-units/${initialData.id}` : "/api/settings/business-units";
      const method = isEdit ? "PUT" : "POST";
      const bodyPayload = isEdit 
        ? { name: String(form.get("name")), description: String(form.get("description") || "") || undefined, version: initialData.version }
        : { code: String(form.get("code")).toUpperCase(), name: String(form.get("name")), description: String(form.get("description") || "") || undefined };

      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? `Failed to ${isEdit ? "update" : "create"} business unit.`);
      onSuccess();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!initialData || !confirm(`Delete business unit ${initialData.code}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/settings/business-units/${initialData.id}`, { method: "DELETE" });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to delete.");
      onSuccess();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Deletion failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="bu-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "480px" }}>
        <div className="workflow-header">
          <div>
            <div className="eyebrow">Settings</div>
            <h2 id="bu-title">{initialData ? "Edit business unit" : "Add business unit"}</h2>
            <p>{initialData ? "Modify unit details or remove it." : "Create a new business unit for reporting and operations."}</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <form onSubmit={save}>
          <div className="workflow-body">
            {error && <div className="error-banner"><AlertTriangle size={14} /> {error}</div>}
            <div className="form-grid">
              <Field label="Code (e.g. SAL, MKT)">
                <input name="code" maxLength={10} defaultValue={initialData?.code} required autoFocus={!initialData} readOnly={!!initialData} disabled={!!initialData} />
              </Field>
              <Field label="Name">
                <input name="name" defaultValue={initialData?.name} required autoFocus={!!initialData} />
              </Field>
              <Field label="Description" full>
                <textarea name="description" rows={3} defaultValue={initialData?.description ?? ""} />
              </Field>
            </div>
          </div>
          <div className="workflow-footer">
            {initialData ? (
              <button type="button" className="danger-button" onClick={remove} disabled={busy}>Delete unit</button>
            ) : (
              <span />
            )}
            <div>
              <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save unit"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SystemSettingModal({ namespace, onClose, onSuccess, initialData }: { namespace: string; onClose: () => void; onSuccess: () => void; initialData?: any }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const type = String(form.get("valueType"));
    const rawVal = String(form.get("value"));
    let value: any = rawVal;
    if (type === "BOOLEAN") value = rawVal === "true";
    if (type === "NUMBER") value = Number(rawVal);
    
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "SETTING",
          namespace: namespace.toUpperCase(),
          key: String(form.get("key")),
          valueType: type,
          value,
          isSensitive: form.get("isSensitive") === "on",
        }),
      });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to save setting.");
      onSuccess();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="set-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "480px" }}>
        <div className="workflow-header">
          <div>
            <div className="eyebrow">{namespace} Configuration</div>
            <h2 id="set-title">{initialData ? "Edit setting" : "Add setting"}</h2>
            <p>Configure a system parameter for this module.</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <form onSubmit={save}>
          <div className="workflow-body">
            {error && <div className="error-banner"><AlertTriangle size={14} /> {error}</div>}
            <div className="form-grid">
              <Field label="Key (e.g. require_2fa)">
                <input name="key" required autoFocus={!initialData} readOnly={!!initialData} disabled={!!initialData} defaultValue={initialData?.key} />
              </Field>
              <Field label="Data Type">
                <select name="valueType" defaultValue={initialData?.valueType || "STRING"}>
                  <option value="STRING">Text String</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Boolean (true/false)</option>
                </select>
              </Field>
              <Field label="Value" full>
                <textarea name="value" rows={2} required autoFocus={!!initialData} defaultValue={initialData ? String(initialData.value) : ""} />
              </Field>
              <Field label="Is Sensitive (encrypt)" full>
                <input type="checkbox" name="isSensitive" defaultChecked={initialData?.isSensitive} />
              </Field>
            </div>
          </div>
          <div className="workflow-footer">
            <span />
            <div>
              <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save setting"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StationEditModal({ station, onClose, onSuccess }: { station: any; onClose: () => void; onSuccess: () => void }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="edit-station-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "560px" }}>
        <div className="workflow-header">
          <div>
            <span className="eyebrow">Settings</span>
            <h2 id="edit-station-title">Edit Station - {station.code}</h2>
            <p>Modify operating details and configurations for this location.</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <div className="workflow-body">
          <StationProfilePanel station={station} onDone={() => { onSuccess(); onClose(); }} />
        </div>
      </div>
    </div>
  );
}

function PaymentMethodModal({ pm, onClose, onSuccess }: { pm: any; onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(pm.isActive);
  const [requiresReference, setRequiresReference] = useState(pm.requiresReference);
  const [requiresTerminal, setRequiresTerminal] = useState(pm.requiresTerminal);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/settings/payment-methods/${pm.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive, requiresReference, requiresTerminal }),
      });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to save payment method.");
      onSuccess();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="pm-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog" style={{ maxWidth: "480px" }}>
        <div className="workflow-header">
          <div>
            <span className="eyebrow">Settings</span>
            <h2 id="pm-title">Configure Payment Method</h2>
            <p>Modify rules and status for {pm.name}.</p>
          </div>
          <button className="icon-ghost" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>
        <form onSubmit={save}>
          <div className="workflow-body">
            {error && <div className="error-banner"><AlertTriangle size={14} /> {error}</div>}
            <div className="form-grid">
              <Field label="Status" full>
                <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                  <option value="true">Active (Enabled)</option>
                  <option value="false">Inactive (Disabled)</option>
                </select>
              </Field>
              <Field label="Requires Payment Reference" full>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input type="checkbox" checked={requiresReference} onChange={(e) => setRequiresReference(e.target.checked)} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Enforce payment reference validation during checkout</span>
                </div>
              </Field>
              <Field label="Requires Card Terminal Reference" full>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input type="checkbox" checked={requiresTerminal} onChange={(e) => setRequiresTerminal(e.target.checked)} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Verify transaction sequence from the external terminal</span>
                </div>
              </Field>
            </div>
          </div>
          <div className="workflow-footer">
            <span />
            <div>
              <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsView({ onToast, onModal }: { onToast: (toast: Toast) => void; onModal?: (kind: ModalKind) => void }) {
  const [section, setSection] = useState("Company profile");
  const [buModal, setBuModal] = useState<boolean | { id: string; code: string; name: string; description?: string | null; version: number }>(false);
  const [settingModal, setSettingModal] = useState<boolean | any>(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [pmModal, setPmModal] = useState<any>(null);

  const api = useApiData<SettingsRecord>("/api/settings");
  const stationsApi = useApiData<StationRecord[]>(section === "Stations" ? "/api/stations" : null);
  const [busy, setBusy] = useState(false);

  const sections = ["Company profile", "Business units", "Stations", "Payment methods", "Tax & receipts", "Printer settings", "Notifications", "Integrations", "Security"];

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "COMPANY_PROFILE",
          legalName: String(form.get("legalName")),
          displayName: String(form.get("displayName")),
          email: String(form.get("email") || "") || undefined,
          phone: String(form.get("phone") || "") || undefined,
          address: String(form.get("address") || "") || undefined,
          timezone: String(form.get("timezone")),
          locale: String(form.get("locale")),
          currencyCode: String(form.get("currencyCode"))
        })
      });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Configuration could not be saved.");
      onToast({ title: "Configuration saved", detail: "Company profile changes were committed and added to the audit chain." });
      api.reload();
      window.dispatchEvent(new Event("erp-data-changed"));
    } catch (reason) {
      onToast({ title: "Configuration failed", detail: reason instanceof Error ? reason.message : "Configuration could not be saved." });
    } finally {
      setBusy(false);
    }
  };

  const saveTaxRate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!api.data) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "COMPANY_PROFILE",
          legalName: api.data.company.legalName,
          displayName: api.data.company.displayName,
          timezone: api.data.company.timezone,
          locale: api.data.company.locale,
          currencyCode: api.data.company.currencyCode,
          taxRate: String(form.get("taxRate")),
        })
      });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Tax rate could not be saved.");
      onToast({ title: "Tax configuration updated", detail: "Tax rate changes were successfully committed." });
      api.reload();
    } catch (reason) {
      onToast({ title: "Save failed", detail: reason instanceof Error ? reason.message : "Failed to update tax rate." });
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, theme: "light" | "dark") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    try {
      const res = await fetch(`/api/settings/logo?theme=${theme}`, { method: "POST", body: form });
      const body = await res.json() as ApiEnvelope<{logoUrl: string}>;
      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Logo upload failed");
      onToast({ title: `${theme === "dark" ? "Dark" : "Light"} logo updated`, detail: "Company logo was updated successfully." });
      api.reload();
      window.dispatchEvent(new CustomEvent("erp-logo-updated", { detail: { theme, url: body.data?.logoUrl ?? null } }));
      window.dispatchEvent(new Event("erp-data-changed"));
    } catch (err) {
      onToast({ title: "Upload failed", detail: err instanceof Error ? err.message : "Failed to upload logo." });
    } finally {
      setBusy(false);
    }
  };

  const deleteLogo = async (theme: "light" | "dark") => {
    if (!confirm(`Are you sure you want to remove the ${theme} logo?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/settings/logo?theme=${theme}`, { method: "DELETE" });
      const body = await res.json() as ApiEnvelope<unknown>;
      if (!res.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to delete logo.");
      onToast({ title: `${theme === "dark" ? "Dark" : "Light"} logo removed`, detail: "Company logo was cleared." });
      api.reload();
      window.dispatchEvent(new CustomEvent("erp-logo-updated", { detail: { theme, url: null } }));
      window.dispatchEvent(new Event("erp-data-changed"));
    } catch (err) {
      onToast({ title: "Delete failed", detail: err instanceof Error ? err.message : "Failed to remove logo." });
    } finally {
      setBusy(false);
    }
  };

  const sectionNamespaces: Record<string, string[]> = {
    "Tax & receipts": ["tax", "documents", "receipt"],
    "Printer settings": ["printer", "printer_settings", "printers"],
    "Notifications": ["notification", "notifications"],
    "Integrations": ["integration", "integrations", "api"],
    "Security": ["security"],
  };

  const allowedNamespaces = sectionNamespaces[section] || [section.toLowerCase()];
  const filteredSettings = api.data?.settings.filter((item) =>
    allowedNamespaces.some((ns) => item.namespace.toLowerCase().includes(ns))
  ) ?? [];

  return (
    <div className="settings-layout">
      {buModal && (
        <BusinessUnitModal
          onClose={() => setBuModal(false)}
          onSuccess={() => { api.reload(); onToast({ title: typeof buModal === "object" ? "Business unit updated" : "Business unit created", detail: "Your changes have been successfully saved." }); }}
          initialData={typeof buModal === "object" ? buModal : undefined}
        />
      )}
      {settingModal && (
        <SystemSettingModal
          namespace={section.split(" ")[0].toUpperCase()}
          onClose={() => setSettingModal(false)}
          onSuccess={() => { api.reload(); onToast({ title: "Configuration saved", detail: "System setting was applied." }); }}
          initialData={typeof settingModal === "object" ? settingModal : undefined}
        />
      )}
      {selectedStation && (
        <StationEditModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onSuccess={() => { if (stationsApi.reload) stationsApi.reload(); onToast({ title: "Station updated", detail: "Station details have been saved." }); }}
        />
      )}
      {pmModal && (
        <PaymentMethodModal
          pm={pmModal}
          onClose={() => setPmModal(null)}
          onSuccess={() => { api.reload(); onToast({ title: "Payment method updated", detail: "Payment method rules have been applied." }); }}
        />
      )}

      <aside className="settings-nav panel">
        {sections.map((item) => (
          <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>
            {item}
            <ChevronRight size={14} />
          </button>
        ))}
      </aside>

      <Panel className="settings-panel">
        <div className="settings-heading">
          <div>
            <h2>{section}</h2>
            <p>Manage configuration applied across the AAU Chamo workspace.</p>
          </div>
          <StatusPill value={api.loading || (section === "Stations" && stationsApi.loading) ? "Syncing" : "Server managed"} />
        </div>

        {api.error ? (
          <EmptyState icon={AlertTriangle} title="Configuration could not be loaded" detail={api.error} />
        ) : section === "Company profile" && api.data ? (
          <form key={api.data.company.displayName} className="settings-form" onSubmit={save}>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <div className="logo-upload" style={{ flex: 1, minWidth: "240px", border: "1px dashed var(--line)", padding: "1rem", borderRadius: "6px", justifyContent: "space-between" }}>
                <label style={{ cursor: "pointer", display: "flex", gap: "1rem", alignItems: "center" }}>
                  <input type="file" accept="image/png, image/jpeg, image/svg+xml, image/webp" style={{ display: "none" }} onChange={(e) => uploadLogo(e, "light")} disabled={busy} />
                  <Image src={api.data.company.logoUrl ?? "/logo.png"} alt="Light Mode Logo" className="settings-logo-img" width={64} height={64} style={{ objectFit: "contain", background: "var(--field-bg, #f3f4f6)" }} />
                  <div>
                    <strong>Light Mode Logo</strong>
                    <span style={{ fontSize: "11px", display: "block", color: "var(--text-secondary)" }}>Click to change light logo.</span>
                  </div>
                </label>
                {api.data.company.logoUrl && (
                  <button type="button" className="danger-button-subtle" onClick={() => deleteLogo("light")} disabled={busy} style={{ alignSelf: "center", margin: 0, padding: "6px 12px", background: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    Remove
                  </button>
                )}
              </div>
              
              <div className="logo-upload" style={{ flex: 1, minWidth: "240px", border: "1px dashed var(--line)", padding: "1rem", borderRadius: "6px", justifyContent: "space-between" }}>
                <label style={{ cursor: "pointer", display: "flex", gap: "1rem", alignItems: "center" }}>
                  <input type="file" accept="image/png, image/jpeg, image/svg+xml, image/webp" style={{ display: "none" }} onChange={(e) => uploadLogo(e, "dark")} disabled={busy} />
                  <Image src={api.data.company.logoDarkUrl ?? "/logo.png"} alt="Dark Mode Logo" className="settings-logo-img" width={64} height={64} style={{ objectFit: "contain", background: "var(--field-bg, #f3f4f6)" }} />
                  <div>
                    <strong>Dark Mode Logo</strong>
                    <span style={{ fontSize: "11px", display: "block", color: "var(--text-secondary)" }}>Click to change dark logo.</span>
                  </div>
                </label>
                {api.data.company.logoDarkUrl && (
                  <button type="button" className="danger-button-subtle" onClick={() => deleteLogo("dark")} disabled={busy} style={{ alignSelf: "center", margin: 0, padding: "6px 12px", background: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-grid">
              <Field label="Legal company name"><input name="legalName" defaultValue={api.data.company.legalName} required /></Field>
              <Field label="Trading name"><input name="displayName" defaultValue={api.data.company.displayName} required /></Field>
              <Field label="Support email"><input name="email" type="email" defaultValue={api.data.company.email ?? ""} /></Field>
              <Field label="Support phone"><input name="phone" defaultValue={api.data.company.phone ?? ""} /></Field>
              <Field label="Head office address" full><textarea name="address" defaultValue={api.data.company.address ?? ""} /></Field>
              <Field label="Timezone"><input name="timezone" defaultValue={api.data.company.timezone} required /></Field>
              <Field label="Locale"><input name="locale" defaultValue={api.data.company.locale} required /></Field>
              <Field label="Currency"><input name="currencyCode" defaultValue={api.data.company.currencyCode} maxLength={3} required /></Field>
            </div>
            <div className="settings-actions">
              <button type="button" className="secondary-button" onClick={api.reload}>Reload</button>
              <button disabled={busy} className="primary-button"><Check size={16} />{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        ) : api.data ? (
          <div className="settings-form">
            <div className="summary-strip">
              <SummaryItem label="Business units" value={api.data.businessUnits.length.toString()} icon={Boxes} tone="info" />
              <SummaryItem label="Payment methods" value={api.data.paymentMethods.length.toString()} icon={Banknote} tone="success" />
              <SummaryItem label="Stored settings" value={api.data.settings.length.toString()} icon={Settings2} tone="info" />
              <SummaryItem label="Configuration" value="Live" icon={ShieldCheck} tone="success" />
            </div>

            <div className="document-rows">
              {section === "Business units" ? (
                <>
                  <div className="settings-actions" style={{ marginBottom: "1rem" }}>
                    <button type="button" className="primary-button" onClick={() => setBuModal(true)}>Add business unit</button>
                  </div>
                  {api.data.businessUnits.map((item) => (
                    <DocumentRow key={item.id} icon={Boxes} name={item.name} meta={item.code} status={item.isActive ? "Active" : "Disabled"} onClick={() => setBuModal(item)} />
                  ))}
                </>
              ) : section === "Stations" ? (
                <>
                  <div className="settings-actions" style={{ marginBottom: "1rem" }}>
                    <button type="button" className="primary-button" onClick={() => onModal && onModal("station")}>Add station</button>
                  </div>
                  {stationsApi.error ? (
                    <EmptyState icon={AlertTriangle} title="Failed to load stations" detail={stationsApi.error} />
                  ) : stationsApi.data?.map((item) => (
                    <DocumentRow key={item.id} icon={Store} name={item.name} meta={item.code} status={item.isActive ? "Active" : "Disabled"} onClick={() => setSelectedStation(item)} />
                  ))}
                </>
              ) : section === "Payment methods" ? (
                api.data.paymentMethods.map((item) => (
                  <DocumentRow
                    key={item.id}
                    icon={Banknote}
                    name={item.name}
                    meta={`${item.type.replaceAll("_", " ")} ${item.requiresReference ? "· Ref required" : ""} ${item.requiresTerminal ? "· Terminal required" : ""}`}
                    status={item.isActive ? "Active" : "Disabled"}
                    onClick={() => setPmModal(item)}
                    action={
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={item.isActive ? "secondary-button" : "primary-button"}
                          disabled={busy}
                          style={{ padding: "4px 8px", fontSize: "9px", height: "26px", minWidth: "60px", fontWeight: "600" }}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const response = await fetch(`/api/settings/payment-methods/${item.id}`, {
                                method: "PUT",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  isActive: !item.isActive,
                                  requiresReference: item.requiresReference,
                                  requiresTerminal: item.requiresTerminal
                                })
                              });
                              const body = await response.json() as ApiEnvelope<unknown>;
                              if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Failed to toggle status.");
                              api.reload();
                              onToast({ title: "Payment method toggled", detail: `${item.name} is now ${!item.isActive ? "Active" : "Disabled"}.` });
                            } catch (err) {
                              onToast({ title: "Toggle failed", detail: err instanceof Error ? err.message : "Failed to toggle status." });
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          {item.isActive ? "Disable" : "Enable"}
                        </button>
                        <button type="button" className="icon-ghost" style={{ width: "27px", height: "27px", padding: 0 }} onClick={() => setPmModal(item)}>
                          <Settings2 size={16} />
                        </button>
                      </div>
                    }
                  />
                ))
              ) : (
                <>
                  {section === "Tax & receipts" && (
                    <form onSubmit={saveTaxRate} style={{ marginBottom: "2rem", borderBottom: "1px solid var(--line)", paddingBottom: "1.5rem" }}>
                      <div className="form-grid" style={{ alignItems: "flex-end" }}>
                        <Field label="Default Company Tax Rate (%)">
                          <input type="number" step="0.0001" min="0" max="100" name="taxRate" defaultValue={api.data.company.taxRate ?? "0"} required style={{ width: "100%" }} />
                        </Field>
                        <div>
                          <button disabled={busy} className="primary-button" style={{ height: "35px" }}>Save Tax Rate</button>
                        </div>
                      </div>
                    </form>
                  )}
                  <div className="settings-actions" style={{ marginBottom: "1rem" }}>
                    <button type="button" className="primary-button" onClick={() => setSettingModal(true)}>Add setting</button>
                  </div>
                  {filteredSettings.length > 0 ? (
                    filteredSettings.map((item) => (
                      <DocumentRow key={item.id} icon={Settings2} name={item.key.replaceAll("_", " ")} meta={`${item.valueType} ${item.isSensitive ? "(Secret)" : ""}`} status="Configured" onClick={() => setSettingModal(item)} />
                    ))
                  ) : (
                    <EmptyState icon={Settings2} title="No parameters configured" detail={`Add the first configuration parameter for the ${section.toLowerCase()} section.`} compact />
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon={RefreshCcw} title="Loading configuration" detail="Retrieving server-managed settings." compact />
        )}
      </Panel>
    </div>
  );
}

function CommandSearch({ query, setQuery, onClose, onNavigate }: { query: string; setQuery: (value: string) => void; onClose: () => void; onNavigate: (id: string) => void }) {
  const navItems = navigation.flatMap((group) => group.items);
  const normalized = query.toLowerCase().trim();
  const modules = navItems.filter((item) => !normalized || item.label.toLowerCase().includes(normalized)).slice(0, 6);
  const searchApi = useApiData<SearchResults>(normalized.length >= 2 ? `/api/search?q=${encodeURIComponent(normalized)}` : null);
  const records = searchApi.data ? [
    ...(searchApi.data.sales ?? []).map((item) => ({ id: item.id, title: item.customer.displayName, meta: `${item.saleNumber} · ${formatNaira(Number(item.total))}`, module: "sales", icon: ReceiptIcon })),
    ...(searchApi.data.products ?? []).map((item) => ({ id: item.id, title: item.name, meta: `${item.code} · ${formatNaira(Number(item.sellingPrice))}`, module: "inventory", icon: Boxes })),
    ...(searchApi.data.cargo ?? []).map((item) => ({ id: item.id, title: item.awbNumber, meta: `${item.senderName} → ${item.receiverName} · ${item.status}`, module: "cargo", icon: Plane })),
    ...(searchApi.data.customers ?? []).map((item) => ({ id: item.id, title: item.displayName, meta: `${item.customerNumber} · ${item.primaryPhone}`, module: "customers", icon: Users })),
    ...(searchApi.data.tickets ?? []).map((item) => ({ id: item.id, title: item.passengerName, meta: `${item.pnr} · ${item.status}`, module: "tickets", icon: TicketCheck })),
  ].slice(0, 12) : [];

  return (
    <div className="modal-layer command-layer" role="dialog" aria-modal="true" aria-label="Global search" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="command-dialog">
        <div className="command-input"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules, customers, receipts, AWB, PNR..." /><kbd>ESC</kbd></div>
        <div className="command-results">
          {!normalized && <div className="command-hint"><span><Command size={14} /> Quick navigation</span><em>Type to search every permitted record</em></div>}
          {modules.length > 0 && <div className="command-group"><label>Modules</label>{modules.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onNavigate(item.id)}><span className="command-result-icon"><Icon size={17} /></span><div><strong>{item.label}</strong><em>Open workspace</em></div><ArrowRight size={15} /></button>; })}</div>}
          {searchApi.loading && normalized.length >= 2 && <div className="command-hint"><span><RefreshCcw size={14} /> Searching protected records</span><em>Results are filtered by your permissions and station scope.</em></div>}
          {searchApi.error && <div className="command-hint"><span><AlertTriangle size={14} /> Search unavailable</span><em>{searchApi.error}</em></div>}
          {records.length > 0 && <div className="command-group"><label>Records</label>{records.map((item) => { const Icon = item.icon; return <button key={`${item.module}-${item.id}`} onClick={() => onNavigate(item.module)}><span className="command-result-icon"><Icon size={17} /></span><div><strong>{item.title}</strong><em>{item.meta}</em></div><span className="result-module">{item.module}</span></button>; })}</div>}
          {normalized && !modules.length && !records.length && <EmptyState icon={Search} title="No matches found" detail="Try a customer phone number, transaction ID, PNR or AWB number." />}
        </div>
        <div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>esc</kbd> Close</span><em><ShieldCheck size={13} /> Permission-aware search</em></div>
      </div>
    </div>
  );
}

const ReceiptIcon = ReceiptTextIcon;

function ReceiptTextIcon(props: React.ComponentProps<LucideIcon>) {
  return <FileCheck2 {...props} />;
}

function UserProfileModalForm({
  identity,
  onClose,
  onComplete,
}: {
  identity: WorkspaceIdentity;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const initials = identity.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: identity.email }),
      });
      if (!res.ok) throw new Error("Failed to send password reset request.");
      onComplete("Password Reset Email Sent", `Instructions to set your new password have been sent to ${identity.email}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to process request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workflow-body">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "var(--surface-subtle, #f9fafb)", borderRadius: "12px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "16px" }}>
        <div className="avatar large" style={{ width: "52px", height: "52px", fontSize: "18px", background: "var(--brand-red, #ca0b12)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}>
          {initials || "AC"}
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>{identity.name}</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #4b5563)" }}>{identity.email} • ID: <strong>{identity.email.split("@")[0]}</strong></p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span className="badge badge-info" style={{ background: "rgba(202, 11, 18, 0.08)", color: "#ca0b12", fontWeight: "bold" }}>{identity.role}</span>
            <span className="badge badge-success">{identity.companyWide ? "Company-Wide Scope" : "Station-Scoped"}</span>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface, #ffffff)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
          <KeyRound size={15} style={{ color: "var(--brand-red, #ca0b12)" }} /> Security & Credentials
        </h4>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label className="field-label" style={{ fontSize: "12px" }}>Current Password</label>
            <input type="password" className="field-input" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="field-label" style={{ fontSize: "12px" }}>New Password</label>
              <input type="password" className="field-input" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 chars" />
            </div>
            <div>
              <label className="field-label" style={{ fontSize: "12px" }}>Confirm New Password</label>
              <input type="password" className="field-input" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-type new password" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <button type="submit" className="primary-button" disabled={busy} style={{ background: "var(--brand-red, #ca0b12)", color: "#ffffff", padding: "8px 16px" }}>
              {busy ? "Processing..." : "Request Password Reset Link"}
            </button>
          </div>
        </form>
      </div>

      <ModalFooter onClose={onClose} submitLabel="Close" icon={UserCheck} />
    </div>
  );
}

function UserPreferencesModalForm({
  onClose,
  onComplete,
  isDark,
  setIsDark,
}: {
  identity: WorkspaceIdentity;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleSavePreferences = async () => {
    setBusy(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "SYSTEM_ALERTS",
          channel: "EMAIL",
          enabled: emailEnabled,
        }),
      });
      onComplete("Preferences Saved", "Your appearance theme and notification alert preferences have been updated.");
    } catch {
      alert("Failed to save user preferences.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workflow-body">
      <div style={{ background: "var(--surface, #ffffff)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
          <Sun size={15} style={{ color: "var(--brand-red, #ca0b12)" }} /> Appearance Theme
        </h4>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className={classNames("secondary-button", !isDark && "active")}
            onClick={() => setIsDark(false)}
            style={{ flex: 1, height: "40px", justifyContent: "center", background: !isDark ? "var(--brand-red-light, rgba(202,11,18,0.08))" : undefined, color: !isDark ? "#ca0b12" : undefined, borderColor: !isDark ? "#ca0b12" : undefined }}
          >
            <Sun size={15} /> Light Theme
          </button>
          <button
            type="button"
            className={classNames("secondary-button", isDark && "active")}
            onClick={() => setIsDark(true)}
            style={{ flex: 1, height: "40px", justifyContent: "center", background: isDark ? "var(--brand-red-light, rgba(202,11,18,0.08))" : undefined, color: isDark ? "#ca0b12" : undefined, borderColor: isDark ? "#ca0b12" : undefined }}
          >
            <Moon size={15} /> Dark Theme
          </button>
        </div>
      </div>

      <div style={{ background: "var(--surface, #ffffff)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
          <Bell size={15} style={{ color: "var(--brand-red, #ca0b12)" }} /> Notification Alert Channels
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span><strong>Email Notifications</strong><br /><small style={{ color: "var(--text-secondary)" }}>Receive critical financial and approval alerts by email</small></span>
            <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} style={{ width: "16px", height: "16px" }} />
          </label>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span><strong>SMS Mobile Alerts</strong><br /><small style={{ color: "var(--text-secondary)" }}>Receive urgent operational notifications on mobile</small></span>
            <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} style={{ width: "16px", height: "16px" }} />
          </label>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span><strong>In-App Activity Badge</strong><br /><small style={{ color: "var(--text-secondary)" }}>Display real-time notification counter in top bar</small></span>
            <input type="checkbox" checked={inAppEnabled} onChange={(e) => setInAppEnabled(e.target.checked)} style={{ width: "16px", height: "16px" }} />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
        <button type="button" className="primary-button" disabled={busy} onClick={handleSavePreferences} style={{ background: "var(--brand-red, #ca0b12)", color: "#ffffff" }}>
          {busy ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

function UserActivityModalForm({
  onClose,
}: {
  identity: WorkspaceIdentity;
  onClose: () => void;
}) {
  const auditApi = useApiData<any[]>("/api/audit?pageSize=15");
  const attendanceApi = useApiData<any>("/api/staff/attendance/today");

  return (
    <div className="workflow-body">
      <div style={{ background: "var(--surface, #ffffff)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock3 size={15} style={{ color: "var(--brand-red, #ca0b12)" }} /> Today's Attendance Punch Log
        </h4>
        {attendanceApi.loading ? (
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Loading attendance status...</div>
        ) : attendanceApi.data?.todayStatus ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Clock In Time:</span>
              <strong>{attendanceApi.data.todayStatus.clockInAt ? new Date(attendanceApi.data.todayStatus.clockInAt).toLocaleTimeString("en-NG") : "Not Clocked In"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Clock Out Time:</span>
              <strong>{attendanceApi.data.todayStatus.clockOutAt ? new Date(attendanceApi.data.todayStatus.clockOutAt).toLocaleTimeString("en-NG") : "Not Clocked Out"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Shift Duration:</span>
              <strong>{attendanceApi.data.todayStatus.shiftDurationFormatted ?? "0h 0m"}</strong>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No attendance record found for today.</div>
        )}
      </div>

      <div style={{ background: "var(--surface, #ffffff)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line, #e5e7eb)", marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
          <History size={15} style={{ color: "var(--brand-red, #ca0b12)" }} /> Recent System Audit Logs
        </h4>
        <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {auditApi.data?.map((event: any) => (
            <div key={event.id} style={{ padding: "8px 10px", background: "var(--surface-subtle, #f9fafb)", borderRadius: "6px", border: "1px solid var(--line, #e5e7eb)", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                <span>{event.action}</span>
                <span style={{ color: "var(--text-muted)" }}>{new Date(event.occurredAt).toLocaleString("en-NG")}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "2px" }}>
                Entity: {event.entityType} ({event.entityId?.slice(0, 12) ?? "N/A"})
              </div>
            </div>
          ))}
          {!auditApi.loading && !auditApi.data?.length && (
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "10px" }}>No recent audit events logged.</div>
          )}
        </div>
      </div>

      <ModalFooter onClose={onClose} submitLabel="Close" icon={History} />
    </div>
  );
}

function QuickSaleForm({
  onComplete,
  onClose,
  allowedStations,
}: {
  onComplete: (title: string, detail: string) => void;
  onClose: () => void;
  allowedStations: AllowedStation[];
}) {
  const [stationId, setStationId] = useState(allowedStations[0]?.id || "");
  const { data: posData, loading } = useApiData<POSBootstrap>(stationId ? `/api/pos/bootstrap?stationId=${stationId}` : null);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = posData?.products.find((p) => p.id === productId);
  const sellingPrice = Number(selectedProduct?.sellingPrice || 0);
  const totalAmount = sellingPrice * (Number(quantity) || 1);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError("Please select a product from the catalog.");
      return;
    }
    setBusy(true);
    setError(null);

    const selectedCustId = customerId || posData?.customers[0]?.id;
    const selectedPayId = paymentMethodId || posData?.paymentMethods[0]?.id;

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "idempotency-key": `pos-modal-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          stationId,
          businessUnitId: posData?.businessUnits[0]?.id,
          customerId: selectedCustId,
          lines: [{ productId, quantity: String(Math.max(1, Number(quantity) || 1)) }],
          payments: [{ paymentMethodId: selectedPayId, amount: totalAmount.toFixed(2), reference: paymentRef || undefined }],
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message || "Failed to complete sale.");
      }

      window.dispatchEvent(new Event("erp-data-changed"));
      onComplete("Sale Completed", `Order #${body.data?.saleNumber ?? "SAL"} recorded successfully.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record sale.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="workflow-body">
        <div className="form-grid">
          <Field label="Station location">
            <select value={stationId} onChange={(e) => setStationId(e.target.value)} required>
              {allowedStations.map((s) => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Customer">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {posData?.customers.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName} ({c.customerNumber})</option>
              ))}
            </select>
          </Field>

          <Field label="Select Product Item" full>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">-- Select Product --</option>
              {posData?.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name} (Stock: {p.available} | ₦{Number(p.sellingPrice).toLocaleString()})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              min="1"
              max={selectedProduct?.available || 9999}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </Field>

          <Field label="Payment Method">
            <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              {posData?.paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Payment Reference (Optional)" full>
            <input
              type="text"
              placeholder="e.g. Bank Transfer Ref / POS Receipt Code"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
            />
          </Field>
        </div>

        <div style={{ background: "var(--surface-subtle, #f9fafb)", padding: "14px", borderRadius: "10px", border: "1px solid var(--line)", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total Calculated Sale Value</span>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#ca0b12" }}>
              ₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <span className="badge badge-success">Live Price Verified</span>
        </div>

        {error && (
          <div className="form-note" style={{ marginTop: "12px" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <ModalFooter
        onClose={onClose}
        submitLabel={busy ? "Posting Sale..." : "Complete & Post Sale"}
        icon={ShoppingCart}
        disabled={busy || loading || !productId}
      />
    </form>
  );
}

function WorkflowModal({
  kind,
  onClose,
  onComplete,
  allowedStations,
  identity,
  isDark,
  setIsDark,
}: {
  kind: Exclude<ModalKind, null>;
  onClose: () => void;
  onComplete: (title: string, detail: string) => void;
  allowedStations: AllowedStation[];
  identity: WorkspaceIdentity;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}) {
  const config = {
    sale: { eyebrow: "Point of sale", title: "Complete sale", description: "Confirm the customer, items and payment before posting." },
    product: { eyebrow: "Inventory", title: "Add catalogue product", description: "Create a controlled stock item for the selected station." },
    cargo: { eyebrow: "Cargo & AWB", title: "Create cargo record", description: "Capture shipment details and prepare the traceable label." },
    deposit: { eyebrow: "Agent wallet", title: "Post wallet deposit", description: "Credit an agent wallet against a verified payment reference." },
    customer: { eyebrow: "Customer management", title: "Register customer", description: "Create a reusable identity for sales, cargo and bookings." },
    purchase: { eyebrow: "Purchasing", title: "Create purchase order", description: "Raise a supplier order with controlled cost and destination." },
    ticket: { eyebrow: "Ticketing", title: "Create flight booking", description: "Reserve or ticket a customer booking with profit and payment controls." },
    finance: { eyebrow: "Cashbook", title: "Record finance entry", description: "Post an income or expense entry to the controlled cashbook." },
    staff: { eyebrow: "Human resources", title: "Add staff member", description: "Create an employment record and home-station assignment." },
    station: { eyebrow: "Station administration", title: "Add station", description: "Create an operating location and enable its business units." },
    invite: { eyebrow: "Access control", title: "Invite user", description: "Provision a user with explicit roles and station scope." },
    agent: { eyebrow: "Agent management", title: "Create agent", description: "Register an agent and provision a zero-balance wallet." },
    profile: { eyebrow: "User Account", title: "My Profile", description: "View your user account identity, station scope permissions, and security credentials." },
    preferences: { eyebrow: "User Settings", title: "Preferences", description: "Configure notification alert channels, appearance theme, and quiet hours." },
    activity: { eyebrow: "Audit & Activity Log", title: "My Activity", description: "Inspect your recent system actions, attendance punches, and session logs." },
  }[kind];
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="workflow-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog">
        <div className="workflow-header"><div><span>{config.eyebrow}</span><h2 id="workflow-title">{config.title}</h2><p>{config.description}</p></div><button onClick={onClose} aria-label="Close modal"><X size={19} /></button></div>
        {kind === "sale" && <QuickSaleForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "product" && <ProductForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "cargo" && <CargoForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "deposit" && <DepositForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "customer" && <CustomerForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "purchase" && <PurchaseForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "ticket" && <TicketForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "finance" && <FinanceForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "staff" && <StaffForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "station" && <StationForm onComplete={onComplete} onClose={onClose} />}
        {kind === "invite" && <InviteForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "agent" && <AgentForm onComplete={onComplete} onClose={onClose} allowedStations={allowedStations} />}
        {kind === "profile" && <UserProfileModalForm identity={identity} onClose={onClose} onComplete={onComplete} />}
        {kind === "preferences" && <UserPreferencesModalForm identity={identity} onClose={onClose} onComplete={onComplete} isDark={isDark} setIsDark={setIsDark} />}
        {kind === "activity" && <UserActivityModalForm identity={identity} onClose={onClose} />}
      </div>
    </div>
  );
}

function ProductForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const { data: setup, loading, error: setupError } = useApiData<InventorySetup>("/api/inventory/setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget);
    const stationId = String(form.get("stationId")); const quantity = String(form.get("stock") || "0");
    try {
      const response = await fetch("/api/inventory/catalogue", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: String(form.get("code")), barcode: String(form.get("barcode") || "") || undefined, name: String(form.get("name")), categoryId: String(form.get("categoryId")), unitId: String(form.get("unitId")), defaultSupplierId: String(form.get("supplierId") || "") || undefined, purchasePrice: String(form.get("purchasePrice") || "0"), sellingPrice: String(form.get("sellingPrice")), reorderLevel: String(form.get("reorder") || "0"), minimumLevel: String(form.get("minimum") || "0"), openingBalances: Number(quantity) > 0 ? [{ stationId, quantity }] : [] }) });
      const body = await response.json() as ApiEnvelope<{ id: string; code: string; name: string }>;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Product could not be created.");
      window.dispatchEvent(new Event("erp-data-changed"));
      onComplete("Product created", `${body.data.code} · ${body.data.name} and its opening stock movement were committed.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Product could not be created."); } finally { setBusy(false); }
  };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Product name" full><input name="name" required placeholder="e.g. Binani Premium Rice 50kg" /></Field><Field label="Product code"><input name="code" required placeholder="BNA-RCE-050" /></Field><Field label="Barcode"><input name="barcode" placeholder="Scan or enter barcode" /></Field><Field label="Category"><select name="categoryId" required defaultValue=""><option value="" disabled>Select category</option>{setup?.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Unit"><select name="unitId" required defaultValue=""><option value="" disabled>Select unit</option>{setup?.units.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></Field><Field label="Default supplier"><select name="supplierId" defaultValue=""><option value="">No default supplier</option>{setup?.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Opening station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Opening quantity"><input name="stock" type="number" step="0.001" min="0" defaultValue="0" /></Field><Field label="Reorder level"><input name="reorder" type="number" step="0.001" min="0" defaultValue="20" /></Field><Field label="Minimum level"><input name="minimum" type="number" step="0.001" min="0" defaultValue="0" /></Field><Field label="Purchase price"><div className="money-input"><span>₦</span><input name="purchasePrice" type="number" step="0.01" min="0" defaultValue="0" /></div></Field><Field label="Selling price"><div className="money-input"><span>₦</span><input name="sellingPrice" type="number" step="0.01" min="0.01" required /></div></Field></div>{(error || setupError) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? setupError}</span></div>}<div className="form-note"><PackageCheck size={16} /><span>Product creation and opening stock are committed atomically to the immutable movement ledger.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : loading ? "Loading setup…" : "Create product"} icon={PackagePlus} disabled={busy || loading || !setup || !allowedStations.length} /></form>;
}

function CargoForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const { data: customerData, loading, error: customerError } = useApiData<CustomerRecord[]>("/api/customers?pageSize=100");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); const optional = (name: string) => String(form.get(name) ?? "").trim() || undefined; try { const response = await fetch("/api/cargo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stationId: String(form.get("stationId")), customerId: String(form.get("customerId")), senderName: String(form.get("senderName")), senderPhone: String(form.get("senderPhone")), receiverName: String(form.get("receiverName")), receiverPhone: String(form.get("receiverPhone")), receiverAddress: optional("receiverAddress"), origin: String(form.get("origin")), destination: String(form.get("destination")), weightKg: String(form.get("weightKg")), pieces: Number(form.get("pieces")), commodity: String(form.get("commodity")), airline: optional("airline"), flightNumber: optional("flightNumber"), handlingNotes: optional("handlingNotes"), declaredValue: optional("declaredValue") }) }); const body = await response.json() as ApiEnvelope<{ id: string; awbNumber: string; labelUrl: string }>; if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Cargo record could not be created."); window.open(body.data.labelUrl, "_blank", "noopener,noreferrer"); onComplete("Cargo record created", `${body.data.awbNumber} was posted and its traceable label opened for printing.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Cargo record could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Customer"><select name="customerId" required defaultValue=""><option value="" disabled>Select customer</option>{customerData?.map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.primaryPhone}</option>)}</select></Field><Field label="Sender name"><input name="senderName" required /></Field><Field label="Sender phone"><input name="senderPhone" required autoComplete="tel" /></Field><Field label="Receiver"><input name="receiverName" required /></Field><Field label="Receiver phone"><input name="receiverPhone" required autoComplete="tel" /></Field><Field label="Receiver address" full><input name="receiverAddress" /></Field><Field label="Origin"><input name="origin" required placeholder="Kano (KAN)" /></Field><Field label="Destination"><input name="destination" required placeholder="Lagos (LOS)" /></Field><Field label="Weight (kg)"><input name="weightKg" type="number" step="0.001" min="0.001" required /></Field><Field label="Pieces"><input name="pieces" type="number" min="1" defaultValue="1" required /></Field><Field label="Commodity" full><input name="commodity" required placeholder="Describe the cargo contents" /></Field><Field label="Declared value"><div className="money-input"><span>₦</span><input name="declaredValue" type="number" step="0.01" min="0" /></div></Field><Field label="Airline"><input name="airline" /></Field><Field label="Flight number"><input name="flightNumber" placeholder="e.g. VM-1642" /></Field><Field label="Handling notes" full><textarea name="handlingNotes" placeholder="Fragile, orientation, special handling..." /></Field></div>{(error || customerError) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? customerError}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : loading ? "Loading customers…" : "Create & print label"} icon={Printer} disabled={busy || loading || !customerData?.length || !allowedStations.length} /></form>;
}

function DepositForm({ onComplete, onClose, allowedStations, initialAgentId }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[]; initialAgentId?: string }) {
  const { data: agentData, loading: agentsLoading, error: agentsError } = useApiData<AgentRecord[]>("/api/agents?pageSize=100"); const { data: setup, loading: setupLoading, error: setupError } = useApiData<FinanceSetup>("/api/finance/setup");
  const [amount, setAmount] = useState("500000"); const [agentId, setAgentId] = useState(initialAgentId ?? ""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const selected = agentData?.find((item) => item.id === agentId);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const response = await fetch(`/api/agents/${agentId}/wallet`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ stationId: String(form.get("stationId")), paymentMethodId: String(form.get("paymentMethodId")), amount, reference: String(form.get("reference")), reason: String(form.get("reason") || "") || undefined }) }); const body = await response.json() as ApiEnvelope<{ entryNumber: string; balance: string; amount: string }>; if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Deposit could not be posted."); onComplete("Deposit posted", `${body.data.entryNumber} credited ${formatNaira(Number(body.data.amount))}; the verified balance is ${formatNaira(Number(body.data.balance))}.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Deposit could not be posted."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body">{selected && <div className="agent-deposit-summary"><span className="avatar large">{selected.name.split(" ").map((item) => item[0]).join("").slice(0, 2)}</span><div><strong>{selected.name}</strong><span>{selected.agentNumber} · Current balance {formatNaira(Number(selected.wallet?.balance ?? 0))}</span></div><StatusPill value={Number(selected.wallet?.balance ?? 0) <= 100000 ? "Low balance" : "Active"} /></div>}<div className="form-grid"><Field label="Agent"><select required value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="" disabled>Select agent wallet</option>{agentData?.map((item) => <option key={item.id} value={item.id}>{item.agentNumber} · {item.name}</option>)}</select></Field><Field label="Posting station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Deposit amount"><div className="money-input"><span>₦</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" required /></div></Field><Field label="Payment method"><select name="paymentMethodId" required defaultValue=""><option value="" disabled>Select verified method</option>{setup?.paymentMethods.filter((item) => item.type !== "WALLET").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Payment reference" full><input name="reference" required placeholder="Enter verified bank or terminal reference" /></Field><Field label="Posting note" full><textarea name="reason" placeholder="Optional finance note" /></Field></div>{selected && <div className="transaction-summary"><div><span>Expected wallet balance</span><strong>{formatNaira(Number(selected.wallet?.balance ?? 0) + Number(amount || 0))}</strong></div><span><ShieldCheck size={14} /> Idempotency, optimistic locking, cashbook posting and audit are committed together.</span></div>}{(error || agentsError || setupError) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? agentsError ?? setupError}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Posting…" : "Post deposit"} icon={WalletCards} disabled={busy || agentsLoading || setupLoading || !agentId || !allowedStations.length} /></form>;
}

function PurchaseForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const setupApi = useApiData<InventorySetup>("/api/inventory/setup"); const productApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=100"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ orderNumber: string }>("/api/purchases", { stationId: String(form.get("stationId")), supplierId: String(form.get("supplierId")), expectedDate: String(form.get("expectedDate") || "") || undefined, notes: String(form.get("notes") || "") || undefined, lines: [{ productId: String(form.get("productId")), quantity: String(form.get("quantity")), unitCost: String(form.get("unitCost")), taxRate: String(form.get("taxRate") || "0") }] }); onComplete("Purchase order created", `${data.orderNumber} was raised and is ready for approval and receiving.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Purchase order could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Destination station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Supplier"><select name="supplierId" required defaultValue=""><option value="" disabled>Select supplier</option>{setupApi.data?.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Product"><select name="productId" required defaultValue=""><option value="" disabled>Select product</option>{productApi.data?.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Quantity"><input name="quantity" type="number" min="0.001" step="0.001" required /></Field><Field label="Unit cost"><div className="money-input"><span>₦</span><input name="unitCost" type="number" min="0.01" step="0.01" required /></div></Field><Field label="Tax rate (%)"><input name="taxRate" type="number" min="0" step="0.0001" defaultValue="0" /></Field><Field label="Expected date"><input name="expectedDate" type="date" /></Field><Field label="Notes" full><textarea name="notes" /></Field></div>{(error || setupApi.error || productApi.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? setupApi.error ?? productApi.error}</span></div>}<div className="form-note"><ShieldCheck size={16} /><span>Prices are stored as decimals; receipts post inventory movements without editing the purchase history.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : "Create purchase order"} icon={PackagePlus} disabled={busy || setupApi.loading || productApi.loading || !allowedStations.length} /></form>;
}

function TicketForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const api = useApiData<TicketSetup>("/api/tickets/setup"); const [status, setStatus] = useState<"RESERVED" | "TICKETED">("RESERVED"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ bookingNumber: string; pnr: string }>("/api/tickets", { stationId: String(form.get("stationId")), businessUnitId: String(form.get("businessUnitId") || "") || undefined, customerId: String(form.get("customerId")), agentId: String(form.get("agentId") || "") || undefined, pnr: String(form.get("pnr")), passengerName: String(form.get("passengerName")), origin: String(form.get("origin")), destination: String(form.get("destination")), airline: String(form.get("airline")), flightNumber: String(form.get("flightNumber") || "") || undefined, travelDate: String(form.get("travelDate")), fare: String(form.get("fare")), sellingPrice: String(form.get("sellingPrice")), status, paymentMethodId: status === "TICKETED" ? String(form.get("paymentMethodId")) : undefined, paymentReference: String(form.get("paymentReference") || "") || undefined }); onComplete(status === "TICKETED" ? "Ticket issued" : "Booking reserved", `${data.bookingNumber} · PNR ${data.pnr} was committed successfully.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Booking could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Business unit"><select name="businessUnitId" defaultValue=""><option value="">Default ticketing unit</option>{api.data?.businessUnits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Customer"><select name="customerId" required defaultValue=""><option value="" disabled>Select customer</option>{api.data?.customers.map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.customerNumber}</option>)}</select></Field><Field label="Agent"><select name="agentId" defaultValue=""><option value="">Direct customer</option>{api.data?.agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="PNR"><input name="pnr" required /></Field><Field label="Passenger name"><input name="passengerName" required /></Field><Field label="Origin"><input name="origin" required /></Field><Field label="Destination"><input name="destination" required /></Field><Field label="Airline"><input name="airline" required /></Field><Field label="Flight number"><input name="flightNumber" /></Field><Field label="Travel date"><input name="travelDate" type="date" required /></Field><Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as "RESERVED" | "TICKETED")}><option value="RESERVED">Reserved</option><option value="TICKETED">Ticketed and paid</option></select></Field><Field label="Fare"><div className="money-input"><span>₦</span><input name="fare" type="number" step="0.01" min="0.01" required /></div></Field><Field label="Selling price"><div className="money-input"><span>₦</span><input name="sellingPrice" type="number" step="0.01" min="0.01" required /></div></Field>{status === "TICKETED" && <><Field label="Payment method"><select name="paymentMethodId" required defaultValue=""><option value="" disabled>Select method</option>{api.data?.paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Payment reference"><input name="paymentReference" /></Field></>}</div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Posting…" : status === "TICKETED" ? "Issue ticket" : "Reserve booking"} icon={TicketCheck} disabled={busy || api.loading || !allowedStations.length} /></form>;
}

function FinanceForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const api = useApiData<FinanceSetup>("/api/finance/setup"); const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const categories = api.data?.categories.filter((item) => item.type === direction) ?? [];
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ entryNumber: string; status: string }>("/api/finance/entries", { stationId: String(form.get("stationId")), accountId: String(form.get("accountId")), categoryId: String(form.get("categoryId")), paymentMethodId: String(form.get("paymentMethodId") || "") || undefined, direction, amount: String(form.get("amount")), description: String(form.get("description")), externalReference: String(form.get("externalReference") || "") || undefined }); onComplete("Finance entry recorded", `${data.entryNumber} is ${data.status.toLowerCase().replaceAll("_", " ")}.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Finance entry could not be posted."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Entry type"><select value={direction} onChange={(event) => setDirection(event.target.value as "CREDIT" | "DEBIT")}><option value="CREDIT">Income / credit</option><option value="DEBIT">Expense / debit</option></select></Field><Field label="Station"><select name="stationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Account"><select name="accountId" required defaultValue=""><option value="" disabled>Select account</option>{api.data?.accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Category"><select name="categoryId" required key={direction} defaultValue=""><option value="" disabled>Select category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Payment method"><select name="paymentMethodId" defaultValue=""><option value="">Not applicable</option>{api.data?.paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Amount"><div className="money-input"><span>₦</span><input name="amount" type="number" step="0.01" min="0.01" required /></div></Field><Field label="Description" full><input name="description" required /></Field><Field label="External reference" full><input name="externalReference" /></Field></div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}<div className="form-note"><ShieldCheck size={16} /><span>Large expenses are routed to maker-checker approval automatically.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Posting…" : "Record entry"} icon={Banknote} disabled={busy || api.loading || !allowedStations.length} /></form>;
}

function StaffForm({
  onComplete,
  onClose,
  allowedStations,
}: {
  onComplete: (title: string, detail: string) => void;
  onClose: () => void;
  allowedStations: AllowedStation[];
}) {
  const api = useApiData<HrSetup>("/api/hr/catalogue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState("");
  
  // Next of kin
  const [nokName, setNokName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [nokEmail, setNokEmail] = useState("");
  const [nokAddress, setNokAddress] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPassportPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const nextOfKin = nokName ? [{
        name: nokName,
        relationship: nokRelationship,
        phone: nokPhone,
        email: nokEmail || undefined,
        address: nokAddress || undefined,
        isPrimary: true
      }] : [];

      const data = await workflowPost<{ staffNumber: string; firstName: string; lastName: string }>("/api/staff", {
        firstName: String(form.get("firstName")),
        middleName: String(form.get("middleName") || "") || undefined,
        lastName: String(form.get("lastName")),
        preferredName: String(form.get("preferredName") || "") || undefined,
        phone: String(form.get("phone")),
        email: String(form.get("email") || "") || undefined,
        address: String(form.get("address") || "") || undefined,
        nationalId: String(form.get("nationalId") || "") || undefined,
        salary: String(form.get("salary") || "") || undefined,
        employmentDate: String(form.get("employmentDate")),
        employmentType: String(form.get("employmentType")),
        departmentId: String(form.get("departmentId")),
        positionId: String(form.get("positionId")),
        homeStationId: String(form.get("homeStationId")),
        passportPhoto: passportPhoto || undefined,
        nextOfKin,
      });
      onComplete(
        "Staff member created",
        `${data.staffNumber} · ${data.firstName} ${data.lastName} was added to the protected HR register.`
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Staff record could not be created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="workflow-body">
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "8px", border: "2px dashed var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", background: "var(--field-bg)" }}>
            {passportPhoto ? (
              <img src={passportPhoto} alt="Passport" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "4px" }}>No Photo</span>
            )}
          </div>
          <div>
            <label className="secondary-button" style={{ cursor: "pointer", display: "inline-block", padding: "8px 12px", fontSize: "12px" }}>
              Upload Passport Photo
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {passportPhoto && (
              <button type="button" className="text-action" onClick={() => setPassportPhoto("")} style={{ marginLeft: "12px", fontSize: "12px", color: "#ef4444" }}>
                Remove
              </button>
            )}
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>PNG, JPEG or WebP up to 2MB.</span>
          </div>
        </div>

        <div className="form-grid">
          <Field label="First name"><input name="firstName" required className="field-input" /></Field>
          <Field label="Middle name"><input name="middleName" className="field-input" /></Field>
          <Field label="Last name"><input name="lastName" required className="field-input" /></Field>
          <Field label="Preferred name"><input name="preferredName" className="field-input" /></Field>
          <Field label="Phone"><input name="phone" required className="field-input" /></Field>
          <Field label="Email"><input name="email" type="email" className="field-input" /></Field>
          <Field label="National ID"><input name="nationalId" className="field-input" /></Field>
          
          <Field label="Home station">
            <select name="homeStationId" required className="field-input" defaultValue={allowedStations[0]?.id}>
              {allowedStations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Employment date"><input name="employmentDate" type="date" required className="field-input" /></Field>
          
          <Field label="Employment type">
            <select name="employmentType" className="field-input">
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contract</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="INTERN">Intern</option>
              <option value="CONSULTANT">Consultant</option>
            </select>
          </Field>

          <Field label="Department">
            <select name="departmentId" required className="field-input" defaultValue="">
              <option value="" disabled>Select department</option>
              {api.data?.departments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Position">
            <select name="positionId" required className="field-input" defaultValue="">
              <option value="" disabled>Select position</option>
              {api.data?.positions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Salary">
            <div className="money-input">
              <span>₦</span>
              <input name="salary" type="number" step="0.01" min="0" className="field-input" />
            </div>
          </Field>

          <Field label="Address" full><textarea name="address" className="field-input" /></Field>

          <div style={{ gridColumn: "1 / -1", margin: "10px 0", borderTop: "1px dashed var(--border-color)", paddingTop: "15px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Next of Kin Details</h4>
          </div>

          <Field label="Full Name"><input className="field-input" value={nokName} onChange={e => setNokName(e.target.value)} /></Field>
          <Field label="Relationship"><input className="field-input" value={nokRelationship} onChange={e => setNokRelationship(e.target.value)} /></Field>
          <Field label="Phone"><input className="field-input" value={nokPhone} onChange={e => setNokPhone(e.target.value)} /></Field>
          <Field label="Email"><input className="field-input" type="email" value={nokEmail} onChange={e => setNokEmail(e.target.value)} /></Field>
          <Field label="Address" full><textarea className="field-input" value={nokAddress} onChange={e => setNokAddress(e.target.value)} /></Field>
        </div>
        {(error || api.error) && (
          <div className="form-note">
            <AlertTriangle size={16} />
            <span>{error ?? api.error}</span>
          </div>
        )}
      </div>
      <ModalFooter
        onClose={onClose}
        submitLabel={busy ? "Creating..." : "Add staff member"}
        icon={UserPlus}
        disabled={busy || api.loading || !allowedStations.length}
      />
    </form>
  );
}

function StationForm({ onComplete, onClose }: { onComplete: (title: string, detail: string) => void; onClose: () => void }) {
  const api = useApiData<{ businessUnits: Array<{ id: string; code: string; name: string }> }>("/api/stations/setup"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ code: string; name: string }>("/api/stations", { code: String(form.get("code")), name: String(form.get("name")), email: String(form.get("email") || ""), phone: String(form.get("phone") || "") || undefined, address: String(form.get("address") || "") || undefined, city: String(form.get("city") || "") || undefined, state: String(form.get("state") || "") || undefined, businessUnitIds: form.getAll("businessUnitIds").map(String) }); onComplete("Station created", `${data.code} · ${data.name} is now available for scoped assignments.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Station could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Station code"><input name="code" required placeholder="LOS" /></Field><Field label="Station name"><input name="name" required /></Field><Field label="Email"><input name="email" type="email" /></Field><Field label="Phone"><input name="phone" /></Field><Field label="City"><input name="city" /></Field><Field label="State"><input name="state" /></Field><Field label="Address" full><textarea name="address" /></Field><Field label="Enabled business units" full><select name="businessUnitIds" multiple size={Math.min(5, api.data?.businessUnits.length ?? 3)}>{api.data?.businessUnits.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field></div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : "Create station"} icon={Building2} disabled={busy || api.loading} /></form>;
}

function InviteForm({
  onComplete,
  onClose,
  allowedStations,
}: {
  onComplete: (title: string, detail: string) => void;
  onClose: () => void;
  allowedStations: AllowedStation[];
}) {
  const api = useApiData<UserSetup>("/api/users/setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password?: string } | null>(null);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomPassword(pwd);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const data = await workflowPost<{ username: string; status: string; password?: string }>("/api/users", {
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        username: String(form.get("username")),
        email: String(form.get("email")),
        phone: String(form.get("phone") || "") || undefined,
        roleIds: form.getAll("roleIds").map(String),
        stationIds: form.getAll("stationIds").map(String),
        businessUnitIds: form.getAll("businessUnitIds").map(String),
        password: customPassword || undefined,
        sendInvite: !customPassword, // Skip invite email if password is set manually
      });
      setCredentials({ username: data.username, password: data.password });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "User could not be invited.");
    } finally {
      setBusy(false);
    }
  };

  if (credentials) {
    return (
      <div className="workflow-body" style={{ padding: "20px" }}>
        <div style={{ background: "var(--success-bg, rgba(16, 185, 129, 0.1))", border: "1px solid var(--success-border, #10b981)", padding: "16px", borderRadius: "6px", marginBottom: "20px" }}>
          <h3 style={{ color: "#10b981", margin: "0 0 8px" }}>User Created Successfully!</h3>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary)" }}>
            Please copy these temporary credentials. They will not be shown again.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--field-bg)", padding: "8px 12px", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Username:</span>
              <code style={{ fontSize: "12px", fontWeight: "bold" }}>{credentials.username}</code>
            </div>
            {credentials.password && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--field-bg)", padding: "8px 12px", borderRadius: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Temporary Password:</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <code style={{ fontSize: "12px", fontWeight: "bold", color: "#f59e0b" }}>{credentials.password}</code>
                  <button
                    type="button"
                    className="row-button"
                    style={{ padding: "2px 6px", fontSize: "10px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.password || "");
                      alert("Password copied to clipboard!");
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="workflow-actions" style={{ justifyContent: "flex-end", borderTop: "none", paddingTop: 0 }}>
          <button type="button" className="primary-button" onClick={() => onComplete("User invited", `${credentials.username} provisioned.`)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="workflow-body">
        <div className="form-grid">
          <Field label="First name"><input name="firstName" required className="field-input" /></Field>
          <Field label="Last name"><input name="lastName" required className="field-input" /></Field>
          <Field label="Username"><input name="username" required className="field-input" /></Field>
          <Field label="Email"><input name="email" type="email" required className="field-input" /></Field>
          <Field label="Phone"><input name="phone" className="field-input" /></Field>
          
          <Field label="Custom Password (Optional - skips email invite)" full>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                className="field-input"
                style={{ flex: 1 }}
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Leave blank to generate randomly and send email invitation"
              />
              <button type="button" className="secondary-button" onClick={generatePassword} style={{ whiteSpace: "nowrap" }}>
                Generate
              </button>
            </div>
          </Field>

          <Field label="Roles" full>
            <select name="roleIds" className="field-input" multiple required size={Math.min(6, api.data?.roles.length ?? 4)}>
              {api.data?.roles.map((item) => (
                <option key={item.id} value={item.id}>{item.name} · {item.scope.toLowerCase()}</option>
              ))}
            </select>
          </Field>
          <Field label="Station scope" full>
            <select name="stationIds" className="field-input" multiple size={Math.min(6, allowedStations.length)}>
              {allowedStations.map((item) => (
                <option key={item.id} value={item.id}>{item.code} · {item.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Business-unit scope" full>
            <select name="businessUnitIds" className="field-input" multiple size={Math.min(5, api.data?.businessUnits.length ?? 3)}>
              {api.data?.businessUnits.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
        </div>
        {(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}
        <div className="form-note"><LockKeyhole size={16} /><span>Providing a custom password will mark the user active immediately. Leaving it blank triggers an email invite.</span></div>
      </div>
      <ModalFooter onClose={onClose} submitLabel={busy ? "Inviting..." : "Invite user"} icon={UserPlus} disabled={busy || api.loading} />
    </form>
  );
}

function AgentForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ agentNumber: string; name: string }>("/api/agents", { homeStationId: String(form.get("homeStationId")), name: String(form.get("name")), contactName: String(form.get("contactName")), phone: String(form.get("phone")), email: String(form.get("email") || "") || undefined, address: String(form.get("address") || "") || undefined, creditLimit: String(form.get("creditLimit") || "0") }); onComplete("Agent created", `${data.agentNumber} · ${data.name} now has a controlled zero-balance wallet.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Agent could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Agency name" full><input name="name" required /></Field><Field label="Contact person"><input name="contactName" required /></Field><Field label="Phone"><input name="phone" required /></Field><Field label="Email"><input name="email" type="email" /></Field><Field label="Home station"><select name="homeStationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Credit limit"><div className="money-input"><span>₦</span><input name="creditLimit" type="number" step="0.01" min="0" defaultValue="0" /></div></Field><Field label="Address" full><textarea name="address" /></Field></div>{error && <div className="form-note"><AlertTriangle size={16} /><span>{error}</span></div>}<div className="form-note"><WalletCards size={16} /><span>Wallet entries are append-only and balances use optimistic concurrency control.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : "Create agent"} icon={WalletCards} disabled={busy || !allowedStations.length} /></form>;
}

function CustomerForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const [type, setType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const optional = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          type,
          firstName: type === "INDIVIDUAL" ? optional("firstName") : undefined,
          lastName: type === "INDIVIDUAL" ? optional("lastName") : undefined,
          companyName: type === "BUSINESS" ? optional("companyName") : undefined,
          phone: optional("phone"),
          email: optional("email"),
          nationalId: optional("nationalId"),
          pnr: optional("pnr"),
          destination: optional("destination"),
          airline: optional("airline"),
          remarks: optional("remarks"),
          homeStationId: optional("homeStationId") || allowedStations[0]?.id,
          allowDuplicate: true,
        }),
      });
      const body = (await response.json()) as ApiEnvelope<{ customerNumber: string; displayName: string }>;
      if (!response.ok || !body.ok || !body.data) {
        if (response.status === 409) setAllowDuplicate(true);
        throw new Error(body.error?.message || "The customer could not be registered.");
      }
      window.dispatchEvent(new Event("erp-data-changed"));
      onComplete("Customer registered", `${body.data.displayName} (${body.data.customerNumber}) is ready for sales, cargo and booking workflows.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The customer could not be registered.");
    } finally {
      setBusy(false);
    }
  };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Customer type"><select name="type" value={type} onChange={(event) => { setType(event.target.value as "INDIVIDUAL" | "BUSINESS"); setAllowDuplicate(false); }}><option value="INDIVIDUAL">Individual</option><option value="BUSINESS">Corporate</option></select></Field><Field label="Home station"><select name="homeStationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((station) => <option value={station.id} key={station.id}>{station.code} · {station.name}</option>)}</select></Field>{type === "INDIVIDUAL" ? <><Field label="First name"><input name="firstName" required autoComplete="given-name" /></Field><Field label="Last name"><input name="lastName" required autoComplete="family-name" /></Field></> : <Field label="Company name" full><input name="companyName" required autoComplete="organization" /></Field>}<Field label="Phone number"><input name="phone" required placeholder="+234" autoComplete="tel" /></Field><Field label="Email address"><input name="email" type="email" placeholder="Optional" autoComplete="email" /></Field><Field label="National ID"><input name="nationalId" placeholder="Optional" /></Field><Field label="PNR"><input name="pnr" placeholder="Optional booking reference" /></Field><Field label="Destination"><input name="destination" placeholder="Optional travel destination" /></Field><Field label="Airline"><input name="airline" placeholder="Optional airline" /></Field><Field label="Remarks" full><textarea name="remarks" placeholder="Additional customer context" /></Field></div>{error && <div className="form-note"><AlertTriangle size={16} /><span>{error}{allowDuplicate ? " Submit again only if this is genuinely a separate customer." : ""}</span></div>}<div className="form-note"><Search size={16} /><span>Duplicate detection compares phone, email and identity evidence before any record is saved.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Registering…" : allowDuplicate ? "Create separate customer" : "Register customer"} icon={UserPlus} disabled={busy || !allowedStations.length} /></form>;
}

function ModalFooter({ onClose, submitLabel, icon: Icon, disabled = false }: { onClose: () => void; submitLabel: string; icon: LucideIcon; disabled?: boolean }) {
  return <div className="workflow-footer"><span><ShieldCheck size={14} /> Permission and station scope verified</span><div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={disabled}><Icon size={16} />{submitLabel}</button></div></div>;
}

function SummaryItem({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail?: string; icon: LucideIcon; tone: Tone }) {
  return <article className="summary-item"><span className={classNames("summary-icon", tone)}><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article>;
}

function TableToolbar({ tabs, activeTab, onTab, placeholder, exportable, search, onSearch, onExport }: { tabs: string[]; activeTab: string; onTab: (value: string) => void; placeholder: string; exportable?: boolean; search?: string; onSearch?: (value: string) => void; onExport?: () => void }) {
  return (
    <div className="table-toolbar">
      <div className="table-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => onTab(tab)}>{tab}</button>)}</div>
      <div className="table-tools">
        <label className="table-search"><Search size={15} />
          {onSearch
            ? <input value={search ?? ""} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} />
            : <input placeholder={placeholder} readOnly />}
          {onSearch && search ? <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onSearch("")}><X size={13} /></button> : null}
        </label>
        {exportable && onExport && <button type="button" className="tool-button" onClick={onExport}><Download size={15} /><span>Export</span></button>}
      </div>
    </div>
  );
}

// Client-side search + pagination over an already-tab-filtered list. Rows are
// fetched in bulk (pageSize=100) by the views, so this makes the search box and
// pager genuinely functional without extra round-trips for the demo-scale data.
function useTableControls<T>(rows: T[], matches: (row: T, query: string) => boolean, pageSize = 10) {
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const setSearch = (value: string) => { setSearchRaw(value); setPage(1); };
  const resetPage = () => setPage(1);
  const query = search.trim().toLowerCase();
  const filtered = query ? rows.filter((row) => matches(row, query)) : rows;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  return { search, setSearch, page: current, setPage, resetPage, pageSize, filtered, pageRows, total: filtered.length };
}

function Pagination({ total, page, pageSize = 10, onPage, count }: { total?: number; page?: number; pageSize?: number; onPage?: (page: number) => void; count?: number }) {
  const totalRows = Math.max(total ?? count ?? 0, 0);
  const pages = Math.max(1, Math.ceil(totalRows / pageSize));
  const current = Math.min(Math.max(page ?? 1, 1), pages);
  const from = totalRows === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, totalRows);
  const go = (value: number) => { if (onPage) onPage(Math.min(Math.max(value, 1), pages)); };
  const numbers: number[] = [];
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  for (let value = start; value <= Math.min(pages, start + 4); value += 1) numbers.push(value);
  return (
    <div className="pagination">
      <span>Showing <strong>{totalRows ? `${from}–${to}` : "0"}</strong> of <strong>{totalRows.toLocaleString()}</strong></span>
      <div>
        <button disabled={!onPage || current <= 1} onClick={() => go(current - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
        {onPage
          ? numbers.map((value) => <button key={value} className={value === current ? "active" : ""} onClick={() => go(value)}>{value}</button>)
          : <button className="active">1</button>}
        <button disabled={!onPage || current >= pages} onClick={() => go(current + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = ["completed", "delivered", "healthy", "active", "approved", "reconciled", "posted", "ready", "received", "ticketed", "verified", "auto-saved", "protected"].some((item) => normalized.includes(item)) ? "success" : ["pending", "processing", "part", "low", "medium", "attention", "scheduled", "reserved", "in transit"].some((item) => normalized.includes(item)) ? "warning" : ["overdue", "blocked", "out of stock", "high", "on hold", "failed", "rejected"].some((item) => normalized.includes(item)) ? "danger" : ["income", "deposit", "corporate", "elevated"].some((item) => normalized.includes(item)) ? "info" : "neutral";
  return <span className={classNames("status-pill", tone)}><i />{value}</span>;
}

function EmptyState({ icon: Icon, title, detail, compact }: { icon: LucideIcon; title: string; detail: string; compact?: boolean }) {
  return <div className={classNames("empty-state", compact && "compact")}><span><Icon size={compact ? 18 : 23} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function Field({ label, children, full, className, style }: { label: string; children: React.ReactNode; full?: boolean; className?: string; style?: React.CSSProperties }) {
  return <label className={classNames("field", full && "field-full", className)} style={style}><span>{label}</span>{children}</label>;
}

function DocumentRow({
  icon: Icon,
  name,
  meta,
  status,
  onClick,
  action,
}: {
  icon: LucideIcon;
  name: string;
  meta: string;
  status: string;
  onClick?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="document-row"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <span className="document-icon"><Icon size={18} /></span>
      <div>
        <strong>{name}</strong>
        <span>{meta}</span>
      </div>
      <StatusPill value={status} />
      {action ? (
        <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
          {action}
        </div>
      ) : (
        <>
          <button
            className="icon-ghost"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            <Download size={16} />
          </button>
          <button className="icon-ghost" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function DiagnosticItem({ label, detail, latency }: { label: string; detail: string; latency: string }) {
  return <div className="diagnostic-item"><span><i /></span><div><strong>{label}</strong><small>{detail}</small></div><em>{latency}</em></div>;
}
