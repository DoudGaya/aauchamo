"use client";

import Image from "next/image";

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

type ModalKind = "sale" | "product" | "cargo" | "deposit" | "customer" | "purchase" | "ticket" | "finance" | "staff" | "station" | "invite" | "agent" | null;

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
type CargoRecord = { id: string; awbNumber: string; senderName: string; receiverName: string; origin: string; destination: string; pieces: number; weightKg: string; airline: string | null; status: string; createdAt: string; customer: { displayName: string }; station: AllowedStation };
type AgentRecord = { id: string; agentNumber: string; name: string; contactName: string; phone: string; creditLimit: string; status: string; homeStation: AllowedStation; wallet: { balance: string } | null; _count: { sales: number; bookings: number } };
type FinanceRecord = { id: string; entryNumber: string; direction: string; amount: string; description: string; status: string; createdAt: string; account: { name: string }; category: { name: string }; station: AllowedStation };
type TicketRecord = { id: string; bookingNumber: string; pnr: string; passengerName: string; origin: string; destination: string; airline: string; travelDate: string; fare: string; sellingPrice: string; profit: string; status: string; station: AllowedStation };
type POSBootstrap = { products: Array<{ id: string; code: string; name: string; sellingPrice: string; available: number; unit: { code: string } }>; customers: Array<{ id: string; customerNumber: string; displayName: string; primaryPhone: string }>; paymentMethods: Array<{ id: string; name: string; type: string; requiresReference: boolean; requiresTerminal: boolean }>; businessUnits: Array<{ id: string; code: string; name: string }>; agents: Array<{ id: string; name: string; agentNumber: string; wallet: { balance: string } | null }> };
type InventorySetup = { categories: Array<{ id: string; code: string; name: string }>; units: Array<{ id: string; code: string; name: string }>; suppliers: Array<{ id: string; supplierNumber: string; name: string }> };
type FinanceSetup = { accounts: Array<{ id: string; code: string; name: string }>; categories: Array<{ id: string; code: string; name: string; type: string }>; paymentMethods: Array<{ id: string; name: string; type: string }> };
type DashboardSummary = { sales: { grossRevenue: string; refunds: string; netRevenue: string; transactions: number; outstanding: string }; inventory: { quantity: string; balanceRows: number; outOfStock: number; value?: string }; entities: { customers: number; agents: number; staff: number; stations: number }; cargo: Record<string, number>; approvals: { pending: number }; receivables: { count: number; amount: string }; financialVisible?: boolean; businessUnits?: Array<{ id: string; code: string; name: string }> };
type StationPerformanceRecord = { id: string; code: string; name: string; revenue: string; outstanding: string; transactions: number; _count: { staffHome: number; cargoShipments: number } };
type ApprovalRecord = { id: string; entityType: string; entityId: string; action: string; status: string; requestReason: string; requestedAt: string; payload: Record<string, unknown> | null; version: number; station: AllowedStation | null; requestedBy: { id: string; name: string | null; firstName: string; lastName: string } };
type AuditRecord = { id: string; action: string; entityType: string; entityId: string | null; outcome: string; requestId: string | null; ipAddress: string | null; eventHash: string; occurredAt: string; actor: { name: string | null; firstName: string; lastName: string; username: string } | null; station: AllowedStation | null; before?: any; after?: any; metadata?: any; };
type NotificationRecord = { id: string; type: string; severity: string; title: string; message: string; href: string | null; status: string; createdAt: string };
type DocumentRecord = { id: string; documentType: string; documentNumber: string; sourceType: string; sourceId: string; status: string; mimeType: string | null; generatedAt: string | null; createdAt: string; station: AllowedStation | null; prints: Array<{ id: string; format: string; printedAt: string }> };
type SettingsRecord = { company: { legalName: string; displayName: string; email: string | null; phone: string | null; address: string | null; timezone: string; currencyCode: string; locale: string; logoUrl?: string; logoDarkUrl?: string; taxRate?: string | null }; businessUnits: Array<{ id: string; code: string; name: string; description?: string | null; isActive: boolean; version: number }>; paymentMethods: Array<{ id: string; name: string; type: string; isActive: boolean; requiresReference: boolean; requiresTerminal: boolean }>; settings: Array<{ id: string; namespace: string; key: string; value: unknown; valueType: string; isSensitive: boolean }> };
type SearchResults = { customers?: Array<{ id: string; customerNumber: string; displayName: string; primaryPhone: string }>; sales?: Array<{ id: string; saleNumber: string; total: string; customer: { displayName: string } }>; products?: Array<{ id: string; code: string; name: string; sellingPrice: string }>; cargo?: Array<{ id: string; awbNumber: string; senderName: string; receiverName: string; status: string }>; tickets?: Array<{ id: string; bookingNumber: string; pnr: string; passengerName: string; status: string }> };
type TicketSetup = { customers: Array<{ id: string; customerNumber: string; displayName: string }>; agents: Array<{ id: string; agentNumber: string; name: string }>; paymentMethods: Array<{ id: string; name: string; type: string; requiresReference: boolean }>; businessUnits: Array<{ id: string; code: string; name: string }> };
type HrSetup = { departments: Array<{ id: string; code: string; name: string }>; positions: Array<{ id: string; code: string; name: string }> };
type UserSetup = { roles: Array<{ id: string; name: string; scope: string }>; businessUnits: Array<{ id: string; code: string; name: string }> };
type UserRecord = { id: string; name: string | null; firstName: string; lastName: string; username: string; email: string | null; status: string; lastLoginAt: string | null; roleAssignments: Array<{ role: { id: string; name: string; scope: string } }>; stationScopes: Array<{ stationId: string; canOperate: boolean }> };
type PermissionRecord = { id: string; key: string; module: string; action: string; description: string; elevated: boolean };
type SessionRecord = { id: string; expires: string; ipAddress: string | null; userAgent: string | null; lastSeenAt: string; revokedAt: string | null; user: { id: string; name: string | null; username: string; email: string | null } };
type MovementRecord = { id: string; movementType: string; quantityDelta: string; balanceAfter: string; referenceType: string; referenceId: string; reason: string | null; occurredAt: string; product: { id: string; code: string; name: string }; station: AllowedStation };
type TransferRecord = { id: string; transferNumber: string; status: string; reason: string; requestedAt: string; originStation: AllowedStation; destinationStation: AllowedStation; lines: Array<{ id: string; quantityRequested: string; quantityDispatched: string; quantityReceived: string; product: { id: string; code: string; name: string } }> };
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
    if (action.modal === "sale") {
      navigate("pos");
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
          />
        </main>

        <footer className="app-footer">
          <span>AAU Chamo Operations Suite</span>
          <span className="sync-state"><Wifi size={13} /> Live sync · Last checked just now</span>
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
              <button><UserCheck size={16} /> My profile</button>
              <button><Settings2 size={16} /> Preferences</button>
              <button><History size={16} /> My activity</button>
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
}: {
  active: string;
  station: string;
  period: string;
  onNavigate: (id: string) => void;
  onModal: (modal: ModalKind) => void;
  onToast: (toast: Toast) => void;
  allowedStations: AllowedStation[];
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
      return <SalesView station={station} allowedStations={allowedStations} />;
    case "inventory":
    case "purchases":
      return <InventoryView purchases={active === "purchases"} onModal={onModal} />;
    case "cargo":
      return <CargoView onModal={onModal} onToast={onToast} />;
    case "agents":
      return <AgentsView onModal={onModal} />;
    case "customers":
      return <CustomersView onModal={onModal} />;
    case "finance":
      return <FinanceView onToast={onToast} />;
    case "stations":
      return <StationsView />;
    case "tickets":
      return <TicketsView />;
    case "staff":
      return <StaffView />;
    case "reports":
      return <ReportsView period={period} onToast={onToast} />;
    case "access":
      return <AccessView onToast={onToast} />;
    case "audit":
      return <AuditView />;
    case "management":
      return <ManagementView onNavigate={onNavigate} />;
    case "notifications":
      return <NotificationsView />;
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

function POSView({ allowedStations, selectedStation, onModal, onToast }: { allowedStations: AllowedStation[]; selectedStation: string; onModal: (modal: ModalKind) => void; onToast: (toast: Toast) => void }) {
  const station = allowedStations.find((item) => item.name === selectedStation) ?? allowedStations[0];
  const { data, loading, error, reload } = useApiData<POSBootstrap>(station ? `/api/pos/bootstrap?stationId=${station.id}` : "/api/pos/bootstrap");
  const [cart, setCart] = useState<Array<POSBootstrap["products"][number] & { quantity: number }>>([]);
  const [query, setQuery] = useState(""); const [customerId, setCustomerId] = useState(""); const [businessUnitId, setBusinessUnitId] = useState(""); const [paymentMethodId, setPaymentMethodId] = useState(""); const [agentId, setAgentId] = useState(""); const [reference, setReference] = useState(""); const [terminalId, setTerminalId] = useState(""); const [busy, setBusy] = useState(false); const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const selectedCustomerId = customerId || data?.customers[0]?.id || ""; const selectedBusinessUnitId = businessUnitId || data?.businessUnits[0]?.id || ""; const selectedPaymentMethodId = paymentMethodId || data?.paymentMethods[0]?.id || ""; const selectedMethod = data?.paymentMethods.find((item) => item.id === selectedPaymentMethodId);
  const products = (data?.products ?? []).filter((product) => !query.trim() || `${product.code} ${product.name}`.toLowerCase().includes(query.toLowerCase())); const subtotal = cart.reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);
  const updateQuantity = (id: string, delta: number) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.available, item.quantity + delta)) } : item));
  const checkout = async () => { if (!station || !selectedCustomerId || !selectedBusinessUnitId || !selectedPaymentMethodId || !cart.length) return; setBusy(true); setCheckoutError(null); try { const response = await fetch("/api/sales", { method: "POST", headers: { "content-type": "application/json", accept: "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ stationId: station.id, businessUnitId: selectedBusinessUnitId, customerId: selectedCustomerId, agentId: selectedMethod?.type === "WALLET" ? agentId || undefined : undefined, lines: cart.map((item) => ({ productId: item.id, quantity: String(item.quantity) })), payments: [{ paymentMethodId: selectedPaymentMethodId, amount: subtotal.toFixed(2), reference: reference || undefined, terminalId: terminalId || undefined }] }) }); const body = await response.json() as ApiEnvelope<{ saleNumber: string; total: string }>; if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message || "The sale could not be posted."); setCart([]); setReference(""); setTerminalId(""); reload(); window.dispatchEvent(new Event("erp-data-changed")); onToast({ title: "Sale completed", detail: `${body.data.saleNumber} posted for ${formatNaira(Number(body.data.total))}.` }); } catch (reason) { setCheckoutError(reason instanceof Error ? reason.message : "The sale could not be posted."); } finally { setBusy(false); } };
  if (!station) return <EmptyState icon={Store} title="No operating station" detail="Assign an operating station to this account before using POS." />;
  return <div className="pos-layout"><section className="pos-catalogue panel"><div className="pos-search-row"><label className="large-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Scan barcode or search products" autoFocus /><kbd>F2</kbd></label><button className="secondary-button" onClick={reload}><RefreshCcw size={16} /> Refresh</button></div>{error ? <EmptyState icon={AlertTriangle} title="POS catalogue unavailable" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading POS catalogue" detail="Checking current prices and station stock." compact /> : <div className="product-grid">{products.map((product) => <button key={product.id} className={classNames("product-tile", product.available <= 0 && "disabled")} disabled={product.available <= 0} onClick={() => setCart((current) => { const existing = current.find((item) => item.id === product.id); return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.available, item.quantity + 1) } : item) : [...current, { ...product, quantity: 1 }]; })}><span className="product-visual"><PackageOpen size={25} /></span><span className="product-code">{product.code}</span><strong>{product.name}</strong><span className="product-tile-bottom"><b>{formatNaira(Number(product.sellingPrice))}</b><em>{product.available <= 0 ? "Out of stock" : `${product.available} available`}</em></span></button>)}</div>}</section><aside className="pos-cart panel"><div className="cart-header"><div><span>Current sale</span><strong>{station.code} · Server priced</strong></div><button className="icon-ghost" onClick={() => setCart([])}><Trash2 size={16} /></button></div><div className="settings-form"><Field label="Customer"><select value={selectedCustomerId} onChange={(event) => setCustomerId(event.target.value)}>{data?.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName} · {customer.primaryPhone}</option>)}</select></Field><button className="customer-selector" onClick={() => onModal("customer")}><span className="customer-icon"><UserPlus size={17} /></span><div><span>Customer missing?</span><strong>Register customer</strong></div><ChevronRight size={15} /></button><Field label="Business unit"><select value={selectedBusinessUnitId} onChange={(event) => setBusinessUnitId(event.target.value)}>{data?.businessUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field></div><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><span>{formatNaira(Number(item.sellingPrice))} each</span></div><div className="quantity-stepper"><button onClick={() => updateQuantity(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}><Plus size={13} /></button></div><b>{formatNaira(Number(item.sellingPrice) * item.quantity)}</b></div>)}{!cart.length && <EmptyState icon={ShoppingCart} title="Cart is empty" detail="Select a product or scan its barcode to start." compact />}</div><div className="settings-form"><Field label="Payment method"><select value={selectedPaymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data?.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></Field>{selectedMethod?.type === "WALLET" && <Field label="Agent"><select value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="">Select agent</option>{data?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {formatNaira(Number(agent.wallet?.balance ?? 0))}</option>)}</select></Field>}{selectedMethod?.requiresReference && <Field label="Payment reference"><input value={reference} onChange={(event) => setReference(event.target.value)} /></Field>}{selectedMethod?.requiresTerminal && <Field label="Terminal ID"><input value={terminalId} onChange={(event) => setTerminalId(event.target.value)} /></Field>}</div><div className="cart-totals"><div><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div><div><span>Tax and discounts</span><strong>Server verified</strong></div><div className="grand-total"><span>Amount due</span><strong>{formatNaira(subtotal)}</strong></div></div>{checkoutError && <div className="form-note"><AlertTriangle size={15} /><span>{checkoutError}</span></div>}<button className="checkout-button" disabled={busy || !cart.length || !selectedCustomerId || !selectedBusinessUnitId || !selectedPaymentMethodId || Boolean(selectedMethod?.requiresReference && !reference) || Boolean(selectedMethod?.requiresTerminal && !terminalId) || Boolean(selectedMethod?.type === "WALLET" && !agentId)} onClick={checkout}><span><LockKeyhole size={16} />{busy ? "Posting…" : "Post sale & payment"}</span><strong>{formatNaira(subtotal)}</strong></button><div className="cart-shortcuts"><span><ShieldCheck size={13} /> Atomic stock, payment and finance posting</span></div></aside></div>;
}

function SalesView({ station, allowedStations }: { station: string; allowedStations: AllowedStation[] }) {
  const [tab, setTab] = useState("All sales");
  const stationId = allowedStations.find((item) => item.name === station)?.id;
  const { data, total, loading, error, reload } = useApiData<SaleRecord[]>(`/api/sales?pageSize=100${stationId ? `&stationId=${stationId}` : ""}`);
  const sales = data ?? [];
  const tabFiltered = sales.filter((sale) => tab === "Completed" ? ["PAID", "POSTED"].includes(sale.status) : tab === "Pending" ? sale.status === "PARTIALLY_PAID" : tab === "Refunded" ? sale.status.includes("REFUND") : true);
  const table = useTableControls(tabFiltered, (sale, q) => `${sale.saleNumber} ${sale.customer.displayName} ${sale.station.name} ${sale.businessUnit.name} ${sale.status}`.toLowerCase().includes(q));
  const gross = sales.reduce((sum, sale) => sum + Number(sale.total), 0); const outstanding = sales.reduce((sum, sale) => sum + Number(sale.outstandingTotal), 0); const average = sales.length ? gross / sales.length : 0;
  const refundSale = async (sale: SaleRecord) => { const reason = window.prompt(`Reason for refunding ${sale.saleNumber}`); if (!reason?.trim()) return; const response = await fetch(`/api/sales/${sale.id}`); const envelope = await response.json() as ApiEnvelope<SaleDetailRecord>; if (!response.ok || !envelope.ok || !envelope.data) return; const detail = envelope.data; const lines = detail.lines.map((line) => ({ saleLineId: line.id, quantity: (Number(line.quantity) - Number(line.quantityRefunded)).toString() })).filter((line) => Number(line.quantity) > 0); const method = detail.allocations[0]?.payment.paymentMethod; if (!method || !lines.length) return; const paymentReference = method.requiresReference ? window.prompt(`Refund reference for ${method.name}`)?.trim() : undefined; if (method.requiresReference && !paymentReference) return; if (!window.confirm(`Refund all remaining quantities on ${sale.saleNumber}?`)) return; await workflowPost("/api/refunds", { saleId: sale.id, paymentMethodId: method.id, paymentReference, reason, returnToStock: true, lines }); reload(); };
  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Gross sales" value={formatNaira(gross)} detail={`${sales.length} loaded sales`} icon={TrendingUp} tone="success" />
        <SummaryItem label="Paid" value={formatNaira(sales.reduce((sum, sale) => sum + Number(sale.paidTotal), 0))} detail="Persisted payments" icon={BadgeCheck} tone="success" />
        <SummaryItem label="Outstanding" value={formatNaira(outstanding)} detail={`${sales.filter((sale) => Number(sale.outstandingTotal) > 0).length} invoices`} icon={Clock3} tone="danger" />
        <SummaryItem label="Avg. transaction" value={formatNaira(average)} detail={`${total} total records`} icon={Banknote} tone="info" />
      </section>
      <Panel>
        <TableToolbar tabs={["All sales", "Completed", "Pending", "Refunded"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search transaction, customer or station" exportable search={table.search} onSearch={table.setSearch} onExport={() => window.open("/api/reports/export", "_blank", "noopener,noreferrer")} />
        {error ? <EmptyState icon={AlertTriangle} title="Sales could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading posted sales" detail="Retrieving sale, payment and station records." compact /> : table.filtered.length ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Transaction</th><th>Customer</th><th>Business unit</th><th>Station</th><th>Payment</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>{table.pageRows.map((sale) => <tr key={sale.id}><td><div className="primary-cell"><strong>{sale.saleNumber}</strong><span>{formatDate(sale.postedAt)}</span></div></td><td>{sale.customer.displayName}</td><td>{sale.businessUnit.name}</td><td>{sale.station.name}</td><td>{sale.allocations.map((item) => item.payment.paymentMethod.name).join(" + ") || "Outstanding"}</td><td className="number-cell strong-number">{formatNaira(Number(sale.total))}</td><td><StatusPill value={sale.status.replaceAll("_", " ")} /></td><td><div className="row-actions">{!["REFUNDED", "CANCELLED"].includes(sale.status) && <button className="row-button" onClick={() => refundSale(sale)}>Refund</button>}<button className="icon-ghost" onClick={() => window.open(`/api/sales/${sale.id}`, "_blank")}><MoreHorizontal size={17} /></button></div></td></tr>)}</tbody>
          </table>
        </div> : <EmptyState icon={ShoppingCart} title={table.search ? "No matching sales" : "No sales found"} detail={table.search ? "Try a different transaction number, customer or station." : "Posted POS transactions will appear here immediately."} />}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
    </div>
  );
}

function InventoryView({ purchases, onModal }: { purchases: boolean; onModal: (modal: ModalKind) => void }) {
  const [tab, setTab] = useState(purchases ? "Purchase orders" : "All products");
  const [referenceNow] = useState(() => Date.now());
  const productApi = useApiData<ProductRecord[]>("/api/inventory/catalogue?pageSize=100");
  const purchaseApi = useApiData<PurchaseRecord[]>("/api/purchases?pageSize=100");
  const movementApi = useApiData<MovementRecord[]>("/api/inventory/movements?pageSize=100");
  const transferApi = useApiData<TransferRecord[]>("/api/inventory/transfers?pageSize=100");
  const approvePurchase = async (order: PurchaseRecord) => { if (!window.confirm(`Approve ${order.orderNumber}?`)) return; await workflowPost(`/api/purchases/${order.id}/approve`, {}); purchaseApi.reload(); };
  const receivePurchase = async (order: PurchaseRecord) => { const supplierRef = window.prompt("Supplier delivery reference") ?? undefined; const lines = order.lines.map((line) => { const remaining = Number(line.quantityOrdered) - Number(line.quantityReceived); const batchCode = line.product.trackBatches ? window.prompt(`Batch code for ${line.product.name}`)?.trim() : undefined; return { purchaseOrderLineId: line.id, quantity: remaining.toString(), batchCode: batchCode || undefined }; }); if (lines.some((line) => Number(line.quantity) <= 0) || lines.some((line, index) => order.lines[index].product.trackBatches && !line.batchCode)) return; await workflowPost(`/api/purchases/${order.id}/receipts`, { supplierRef, lines }); purchaseApi.reload(); movementApi.reload(); productApi.reload(); };
  const orders = purchaseApi.data ?? [];
  const purchaseTable = useTableControls(orders, (order, q) => `${order.orderNumber} ${order.supplier.name} ${order.station.name} ${order.status}`.toLowerCase().includes(q));
  const movementTable = useTableControls(movementApi.data ?? [], (item, q) => `${item.product.name} ${item.product.code} ${item.station.name} ${item.movementType} ${item.referenceType} ${item.reason ?? ""}`.toLowerCase().includes(q));
  const transferTable = useTableControls(transferApi.data ?? [], (item, q) => `${item.transferNumber} ${item.originStation.code} ${item.destinationStation.code} ${item.reason} ${item.status}`.toLowerCase().includes(q));
  const rows = (productApi.data ?? []).map((product) => ({ product, available: product.balances.reduce((sum, balance) => sum + Number(balance.quantity), 0) }));
  const productSource = tab === "Low stock" ? rows.filter(({ product, available }) => available <= Number(product.reorderLevel)) : rows;
  const productTable = useTableControls(productSource, ({ product }, q) => `${product.name} ${product.code} ${product.category.name} ${product.barcode ?? ""}`.toLowerCase().includes(q));
  const onTab = (value: string) => { setTab(value); purchaseTable.resetPage(); movementTable.resetPage(); transferTable.resetPage(); productTable.resetPage(); };
  if (purchases) {
    const open = orders.filter((order) => !["RECEIVED", "CANCELLED"].includes(order.status)); const openValue = open.reduce((sum, order) => sum + Number(order.total), 0); const due = open.filter((order) => order.expectedDate && new Date(order.expectedDate).getTime() <= referenceNow + 7 * 86_400_000).length;
    return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Open orders" value={open.length.toString()} icon={PackageOpen} tone="info" /><SummaryItem label="Open value" value={formatNaira(openValue)} icon={ArrowDownLeft} tone="success" /><SummaryItem label="Due this week" value={due.toString()} icon={CalendarDays} tone="warning" /><SummaryItem label="Order records" value={purchaseApi.total.toString()} icon={FileCheck2} tone="info" /></section><Panel><TableToolbar tabs={["Purchase orders", "Suppliers", "Goods received"]} activeTab={tab} onTab={onTab} placeholder="Search PO, supplier or station" search={purchaseTable.search} onSearch={purchaseTable.setSearch} />{purchaseApi.error ? <EmptyState icon={AlertTriangle} title="Purchases could not be loaded" detail={purchaseApi.error} /> : purchaseApi.loading ? <EmptyState icon={RefreshCcw} title="Loading purchase orders" detail="Retrieving supplier orders and receipt progress." compact /> : purchaseTable.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Purchase order</th><th>Supplier</th><th>Items</th><th>Total</th><th>Expected</th><th>Destination</th><th>Status</th><th /></tr></thead><tbody>{purchaseTable.pageRows.map((order) => <tr key={order.id}><td><div className="primary-cell"><strong>{order.orderNumber}</strong><span>Raised {formatDate(order.createdAt)}</span></div></td><td>{order.supplier.name}</td><td>{order.lines.length}</td><td className="number-cell">{formatNaira(Number(order.total))}</td><td>{order.expectedDate ? formatDate(order.expectedDate) : "—"}</td><td>{order.station.name}</td><td><StatusPill value={order.status.replaceAll("_", " ")} /></td><td><div className="row-actions">{["DRAFT", "SUBMITTED"].includes(order.status) && <button className="row-button" onClick={() => approvePurchase(order)}>Approve</button>}{["APPROVED", "PARTIALLY_RECEIVED"].includes(order.status) && <button className="row-button" onClick={() => receivePurchase(order)}>Receive</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={PackageOpen} title={purchaseTable.search ? "No matching orders" : "No purchase orders"} detail={purchaseTable.search ? "Try a different PO, supplier or station." : "Create a purchase order to begin controlled supplier receiving."} />}<Pagination total={purchaseTable.total} page={purchaseTable.page} pageSize={purchaseTable.pageSize} onPage={purchaseTable.setPage} /></Panel></div>;
  }
  if (tab === "Movements") return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Movement records" value={movementApi.total.toString()} icon={History} tone="info" /><SummaryItem label="Stock in" value={(movementApi.data ?? []).filter((item) => Number(item.quantityDelta) > 0).length.toString()} icon={ArrowDownLeft} tone="success" /><SummaryItem label="Stock out" value={(movementApi.data ?? []).filter((item) => Number(item.quantityDelta) < 0).length.toString()} icon={ArrowUpRight} tone="warning" /><SummaryItem label="Ledger" value="Append-only" icon={ShieldCheck} tone="success" /></section><Panel><TableToolbar tabs={["All products", "Low stock", "Movements", "Transfers"]} activeTab={tab} onTab={onTab} placeholder="Search product, station, movement or reference" search={movementTable.search} onSearch={movementTable.setSearch} />{movementApi.error ? <EmptyState icon={AlertTriangle} title="Movements could not be loaded" detail={movementApi.error} /> : movementApi.loading ? <EmptyState icon={RefreshCcw} title="Loading stock ledger" detail="Retrieving immutable balance movements." compact /> : movementTable.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Occurred</th><th>Product</th><th>Station</th><th>Movement</th><th>Quantity</th><th>Balance after</th><th>Reference</th><th>Reason</th></tr></thead><tbody>{movementTable.pageRows.map((item) => <tr key={item.id}><td>{new Date(item.occurredAt).toLocaleString("en-NG")}</td><td><div className="primary-cell"><strong>{item.product.name}</strong><span>{item.product.code}</span></div></td><td>{item.station.name}</td><td><StatusPill value={item.movementType.replaceAll("_", " ")} /></td><td className={classNames("number-cell", Number(item.quantityDelta) < 0 && "negative-number")}>{Number(item.quantityDelta) > 0 ? "+" : ""}{item.quantityDelta}</td><td className="number-cell">{item.balanceAfter}</td><td><code>{item.referenceType}:{item.referenceId.slice(0, 8)}</code></td><td>{item.reason ?? "—"}</td></tr>)}</tbody></table></div> : <EmptyState icon={History} title={movementTable.search ? "No matching movements" : "No stock movements"} detail={movementTable.search ? "Try a different product, station or reference." : "Stock-in, sale, transfer and adjustment movements appear here."} />}<Pagination total={movementTable.total} page={movementTable.page} pageSize={movementTable.pageSize} onPage={movementTable.setPage} /></Panel></div>;
  if (tab === "Transfers") return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Transfer records" value={transferApi.total.toString()} icon={ArrowLeftRight} tone="info" /><SummaryItem label="Awaiting dispatch" value={(transferApi.data ?? []).filter((item) => item.status === "REQUESTED").length.toString()} icon={Clock3} tone="warning" /><SummaryItem label="In transit" value={(transferApi.data ?? []).filter((item) => item.status === "DISPATCHED").length.toString()} icon={Plane} tone="info" /><SummaryItem label="Received" value={(transferApi.data ?? []).filter((item) => item.status === "RECEIVED").length.toString()} icon={PackageCheck} tone="success" /></section><Panel><TableToolbar tabs={["All products", "Low stock", "Movements", "Transfers"]} activeTab={tab} onTab={onTab} placeholder="Search transfer number or route" search={transferTable.search} onSearch={transferTable.setSearch} />{transferApi.error ? <EmptyState icon={AlertTriangle} title="Transfers could not be loaded" detail={transferApi.error} /> : transferApi.loading ? <EmptyState icon={RefreshCcw} title="Loading transfers" detail="Retrieving dispatch and receipt progress." compact /> : transferTable.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Transfer</th><th>Route</th><th>Items</th><th>Requested</th><th>Dispatched</th><th>Received</th><th>Reason</th><th>Status</th></tr></thead><tbody>{transferTable.pageRows.map((item) => <tr key={item.id}><td><div className="primary-cell"><strong>{item.transferNumber}</strong><span>{formatDate(item.requestedAt)}</span></div></td><td>{item.originStation.code} → {item.destinationStation.code}</td><td>{item.lines.length}</td><td>{item.lines.reduce((sum, line) => sum + Number(line.quantityRequested), 0)}</td><td>{item.lines.reduce((sum, line) => sum + Number(line.quantityDispatched), 0)}</td><td>{item.lines.reduce((sum, line) => sum + Number(line.quantityReceived), 0)}</td><td>{item.reason}</td><td><StatusPill value={item.status} /></td></tr>)}</tbody></table></div> : <EmptyState icon={ArrowLeftRight} title={transferTable.search ? "No matching transfers" : "No transfers"} detail={transferTable.search ? "Try a different transfer number or route." : "Inter-station stock transfers appear here."} />}<Pagination total={transferTable.total} page={transferTable.page} pageSize={transferTable.pageSize} onPage={transferTable.setPage} /></Panel></div>;
  const units = rows.reduce((sum, row) => sum + row.available, 0); const value = rows.reduce((sum, row) => sum + row.available * Number(row.product.purchasePrice ?? 0), 0); const low = rows.filter(({ product, available }) => available > 0 && available <= Number(product.reorderLevel)).length; const empty = rows.filter(({ available }) => available <= 0).length;
  return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Stock value" value={formatNaira(value)} detail={`${units.toLocaleString()} units`} icon={Boxes} tone="info" /><SummaryItem label="Low stock" value={low.toString()} detail="At or below reorder" icon={AlertTriangle} tone="warning" /><SummaryItem label="Out of stock" value={empty.toString()} detail="Reorder immediately" icon={PackageOpen} tone="danger" /><SummaryItem label="Catalogue" value={productApi.total.toString()} detail="Active and inactive" icon={PackageCheck} tone="success" /></section><Panel><TableToolbar tabs={["All products", "Low stock", "Movements", "Transfers"]} activeTab={tab} onTab={onTab} placeholder="Search product, code or barcode" search={productTable.search} onSearch={productTable.setSearch} />{productApi.error ? <EmptyState icon={AlertTriangle} title="Inventory could not be loaded" detail={productApi.error} /> : productApi.loading ? <EmptyState icon={RefreshCcw} title="Loading inventory" detail="Reconciling product balances by station." compact /> : productTable.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Product</th><th>Category</th><th>Stations</th><th>Available</th><th>Reorder level</th><th>Selling price</th><th>Stock status</th><th /></tr></thead><tbody>{productTable.pageRows.map(({ product, available }) => <tr key={product.id}><td><div className="product-cell"><span><PackageOpen size={17} /></span><div><strong>{product.name}</strong><small>{product.code} · {product.unit.code}</small></div></div></td><td>{product.category.name}</td><td>{product.balances.map((balance) => balance.station.code).join(", ") || "—"}</td><td className="number-cell strong-number">{available}</td><td>{product.reorderLevel}</td><td className="number-cell">{formatNaira(Number(product.sellingPrice))}</td><td><StatusPill value={available <= 0 ? "Out of stock" : available <= Number(product.reorderLevel) ? "Low stock" : "In stock"} /></td><td><button className="icon-ghost" onClick={() => onModal("product")}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={Boxes} title={productTable.search ? "No matching products" : "No products found"} detail={productTable.search ? "Try a different product, code or barcode." : "Create the first catalogue product and opening station balance."} />}<Pagination total={productTable.total} page={productTable.page} pageSize={productTable.pageSize} onPage={productTable.setPage} /></Panel></div>;
}

function CargoView({ onModal, onToast }: { onModal: (modal: ModalKind) => void; onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("All cargo");
  const { data, total, loading, error } = useApiData<CargoRecord[]>("/api/cargo?pageSize=100");
  const cargo = data ?? []; const visible = cargo.filter((item) => tab === "Processing" ? ["DRAFT", "PROCESSING", "LABELLED"].includes(item.status) : tab === "In transit" ? ["DISPATCHED", "IN_TRANSIT", "ARRIVED"].includes(item.status) : tab === "Delivered" ? item.status === "DELIVERED" : tab === "On hold" ? item.status === "ON_HOLD" : true);
  const table = useTableControls(visible, (item, q) => `${item.awbNumber} ${item.senderName} ${item.receiverName} ${item.origin} ${item.destination} ${item.airline ?? ""} ${item.customer.displayName}`.toLowerCase().includes(q));
  const nextStatus: Record<string, string> = { DRAFT: "LABELLED", PROCESSING: "LABELLED", LABELLED: "DISPATCHED", DISPATCHED: "IN_TRANSIT", IN_TRANSIT: "ARRIVED", ARRIVED: "DELIVERED" };
  const advanceLabel: Record<string, string> = { DRAFT: "Issue label", PROCESSING: "Issue label", LABELLED: "Dispatch", DISPATCHED: "Mark in transit", IN_TRANSIT: "Mark arrived", ARRIVED: "Mark delivered" };
  const advance = async (item: CargoRecord) => { const next = nextStatus[item.status]; if (!next) return; const notes = window.prompt(`Notes for moving ${item.awbNumber} to ${next.replaceAll("_", " ")}`, `Status updated to ${next}`); if (!notes?.trim()) return; try { await workflowPost(`/api/cargo/${item.id}/status`, { status: next, notes }); onToast({ title: "Cargo updated", detail: `${item.awbNumber} moved to ${next.replaceAll("_", " ").toLowerCase()}.` }); } catch (error_) { onToast({ title: "Update failed", detail: error_ instanceof Error ? error_.message : "The status could not be changed." }); } };
  const reprint = async (item: CargoRecord) => { const reason = window.prompt(`Reason to reprint the label for ${item.awbNumber}`, "Customer copy"); if (!reason?.trim()) return; try { await workflowPost(`/api/cargo/${item.id}/reprint`, { format: "A4", reason }); window.open(`/print/cargo/${item.id}`, "_blank", "noopener,noreferrer"); onToast({ title: "Label reprinted", detail: `An audited reprint of ${item.awbNumber} was recorded.` }); } catch (error_) { onToast({ title: "Reprint failed", detail: error_ instanceof Error ? error_.message : "The label could not be reprinted." }); } };
  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Cargo records" value={total.toString()} detail={`${cargo.reduce((sum, item) => sum + Number(item.weightKg), 0).toLocaleString()} kg loaded`} icon={Plane} tone="info" />
        <SummaryItem label="In transit" value={cargo.filter((item) => ["DISPATCHED", "IN_TRANSIT", "ARRIVED"].includes(item.status)).length.toString()} detail={`${cargo.reduce((sum, item) => sum + item.pieces, 0)} pieces loaded`} icon={ArrowUpRight} tone="success" />
        <SummaryItem label="Processing" value={cargo.filter((item) => ["DRAFT", "PROCESSING", "LABELLED"].includes(item.status)).length.toString()} detail="Pre-dispatch" icon={Clock3} tone="warning" />
        <SummaryItem label="On hold" value={cargo.filter((item) => item.status === "ON_HOLD").length.toString()} detail="Action required" icon={AlertTriangle} tone="danger" />
      </section>
      <Panel>
        <TableToolbar tabs={["All cargo", "Processing", "In transit", "Delivered", "On hold"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search AWB, sender, receiver or route" search={table.search} onSearch={table.setSearch} />
        {error ? <EmptyState icon={AlertTriangle} title="Cargo could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading cargo records" detail="Retrieving AWB records and status history." compact /> : table.filtered.length ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>AWB / cargo no.</th><th>Customer</th><th>Route</th><th>Shipment</th><th>Airline</th><th>Status</th><th>Created</th><th /></tr></thead>
            <tbody>{table.pageRows.map((item) => <tr key={item.id}><td><div className="primary-cell"><strong>{item.awbNumber}</strong><span><Tag size={11} /> Barcode ready</span></div></td><td>{item.customer.displayName}</td><td><strong className="route-code">{item.origin} → {item.destination}</strong></td><td>{item.pieces} pcs · {item.weightKg} kg</td><td>{item.airline ?? "—"}</td><td><StatusPill value={item.status.replaceAll("_", " ")} /></td><td>{formatDate(item.createdAt)}</td><td><div className="row-actions">{nextStatus[item.status] && <button className="row-button" onClick={() => advance(item)}>{advanceLabel[item.status]}</button>}<button className="icon-ghost" title="Open label" onClick={() => window.open(`/print/cargo/${item.id}`, "_blank", "noopener,noreferrer")}><Printer size={16} /></button><button className="icon-ghost" title="Reprint label (audited)" onClick={() => reprint(item)}><RotateCcw size={16} /></button></div></td></tr>)}</tbody>
          </table>
        </div> : <EmptyState icon={Plane} title="No cargo records" detail="Create an AWB to generate the first scanner-compatible cargo label." />}
        <div className="table-callout"><div><PackageCheck size={18} /><span><strong>Label output</strong> Code 128 · secure QR · thermal and A4</span></div><em><i /> Ready</em><button onClick={() => onModal("cargo")}>Create AWB</button></div>
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
    </div>
  );
}

function AgentsView({ onModal }: { onModal: (modal: ModalKind) => void }) {
  const [tab, setTab] = useState("All agents");
  const { data, total, loading, error } = useApiData<AgentRecord[]>("/api/agents?pageSize=100"); const agentRecords = data ?? []; const visible = agentRecords.filter((agent) => tab === "Healthy" ? Number(agent.wallet?.balance ?? 0) > 0 && agent.status === "ACTIVE" : tab === "Low balance" ? Number(agent.wallet?.balance ?? 0) <= Number(agent.creditLimit) * .2 : tab === "Overdue" ? Number(agent.wallet?.balance ?? 0) < 0 : true);
  const table = useTableControls(visible, (agent, q) => `${agent.name} ${agent.agentNumber} ${agent.contactName} ${agent.phone} ${agent.homeStation.name}`.toLowerCase().includes(q));
  const liability = agentRecords.reduce((sum, agent) => sum + Number(agent.wallet?.balance ?? 0), 0); const exposure = agentRecords.reduce((sum, agent) => sum + Number(agent.creditLimit), 0);
  return (
    <div className="content-stack">
      <section className="summary-strip">
        <SummaryItem label="Wallet liability" value={formatNaira(liability)} detail={`Across ${total} agents`} icon={WalletCards} tone="info" />
        <SummaryItem label="Active agents" value={agentRecords.filter((agent) => agent.status === "ACTIVE").length.toString()} detail="Operational accounts" icon={UserCheck} tone="success" />
        <SummaryItem label="Credit exposure" value={formatNaira(exposure)} detail="Configured limits" icon={CircleDollarSign} tone="warning" />
        <SummaryItem label="Negative wallets" value={agentRecords.filter((agent) => Number(agent.wallet?.balance ?? 0) < 0).length.toString()} detail="Requires attention" icon={AlertTriangle} tone="danger" />
      </section>
      <Panel>
        <TableToolbar tabs={["All agents", "Healthy", "Low balance", "Overdue"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search agent, company or contact" search={table.search} onSearch={table.setSearch} />
        {error ? <EmptyState icon={AlertTriangle} title="Agents could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading agent wallets" detail="Retrieving live wallet balances and credit limits." compact /> : table.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Agent</th><th>Contact</th><th>Station</th><th>Wallet balance</th><th>Credit limit</th><th>Activity</th><th>Status</th><th /></tr></thead><tbody>{table.pageRows.map((agent) => <tr key={agent.id}><td><div className="agent-cell"><span>{agent.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{agent.name}</strong><small>{agent.agentNumber}</small></div></div></td><td>{agent.contactName}<br /><small>{agent.phone}</small></td><td>{agent.homeStation.name}</td><td className={classNames("number-cell", Number(agent.wallet?.balance ?? 0) < 0 && "negative-number")}>{formatNaira(Number(agent.wallet?.balance ?? 0))}</td><td className="number-cell">{formatNaira(Number(agent.creditLimit))}</td><td>{agent._count.sales} sales · {agent._count.bookings} tickets</td><td><StatusPill value={agent.status} /></td><td><button className="row-button" onClick={() => onModal("deposit")}>Deposit</button></td></tr>)}</tbody></table></div> : <EmptyState icon={WalletCards} title={table.search ? "No matching agents" : "No agents found"} detail={table.search ? "Try a different agent, company or contact name." : "Create an agent to provision a controlled wallet account."} />}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
    </div>
  );
}

function CustomersView({ onModal }: { onModal: (modal: ModalKind) => void }) {
  const [tab, setTab] = useState("All customers");
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
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Type</th><th>Home station</th><th>PNR</th><th>Created</th><th /></tr></thead><tbody>{table.pageRows.map((customer) => <tr key={customer.id}><td><div className="agent-cell customer"><span>{customer.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{customer.displayName}</strong><small>{customer.customerNumber}</small></div></div></td><td>{customer.primaryPhone}</td><td>{customer.primaryEmail ?? "—"}</td><td><StatusPill value={customer.type === "BUSINESS" ? "Corporate" : "Individual"} /></td><td>{customer.homeStation.name}</td><td>{customer.defaultPnr ?? "—"}</td><td>{formatDate(customer.createdAt)}</td><td><button className="icon-ghost" onClick={() => onModal("customer")} aria-label={`Add a customer from ${customer.displayName}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
        ) : <EmptyState icon={Users} title={table.search ? "No matching customers" : "No customers yet"} detail={table.search ? "Try a different name, phone, email or PNR." : "Register the first customer to reuse their details across sales, cargo and bookings."} />}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
    </div>
  );
}

function FinanceView({ onToast }: { onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("Cashbook");
  const { data, total, loading, error, reload } = useApiData<FinanceRecord[]>("/api/finance/entries?pageSize=100");
  const entries = data ?? [];
  const reverseEntry = async (entry: FinanceRecord) => { const reason = window.prompt(`Reason to reverse ${entry.entryNumber} (a compensating entry is created)`); if (!reason?.trim()) return; try { await workflowPost(`/api/finance/entries/${entry.id}/reverse`, { reason }); onToast({ title: "Entry reversed", detail: `${entry.entryNumber} was reversed with an audited compensating entry.` }); } catch (reason_) { onToast({ title: "Reversal failed", detail: reason_ instanceof Error ? reason_.message : "The entry could not be reversed." }); } };
  const decideEntry = async (entry: FinanceRecord, decision: "APPROVED" | "REJECTED") => { const reason = window.prompt(`${decision === "APPROVED" ? "Approval" : "Rejection"} reason for ${entry.entryNumber}`); if (!reason?.trim()) return; try { await workflowPost(`/api/finance/entries/${entry.id}/approve`, { decision, reason }); onToast({ title: `Entry ${decision.toLowerCase()}`, detail: `${entry.entryNumber} was ${decision.toLowerCase()} under maker-checker control.` }); } catch (reason_) { onToast({ title: "Decision failed", detail: reason_ instanceof Error ? reason_.message : "The entry could not be decided." }); } };
  const visible = entries.filter((entry) => tab === "Income" ? entry.direction === "CREDIT" : tab === "Expenses" ? entry.direction === "DEBIT" : tab === "Refunds" ? entry.description.toLowerCase().includes("refund") : tab === "Agent deposits" ? entry.description.toLowerCase().includes("agent deposit") : true);
  const table = useTableControls(visible, (entry, q) => `${entry.entryNumber} ${entry.description} ${entry.account.name} ${entry.category.name} ${entry.station.name}`.toLowerCase().includes(q));
  const posted = entries.filter((entry) => ["POSTED", "RECONCILED"].includes(entry.status));
  const income = posted.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = posted.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const pending = entries.filter((entry) => entry.status === "PENDING_APPROVAL").reduce((sum, entry) => sum + Number(entry.amount), 0);
  return (
    <div className="content-stack">
      <section className="finance-overview">
        <div className="finance-balance"><span>Net cashbook position</span><strong>{formatNaira(income - expenses)}</strong><small>Posted income less posted expenses in the current result set</small><div className="balance-bars"><i style={{ width: income + expenses ? `${Math.round((income / (income + expenses)) * 100)}%` : "0%" }} /><i style={{ width: income + expenses ? `${Math.round((expenses / (income + expenses)) * 100)}%` : "0%" }} /></div><div className="balance-legend"><span><i />Income {formatNaira(income)}</span><span><i />Expenses {formatNaira(expenses)}</span></div></div>
        <div className="finance-mini"><span className="mini-icon success"><ArrowUpRight size={17} /></span><div><span>Posted income</span><strong>{formatNaira(income)}</strong><small>Permission-scoped entries</small></div></div>
        <div className="finance-mini"><span className="mini-icon danger"><ArrowDownLeft size={17} /></span><div><span>Posted expenses</span><strong>{formatNaira(expenses)}</strong><small>Compensating reversals preserved</small></div></div>
        <div className="finance-mini"><span className="mini-icon warning"><Clock3 size={17} /></span><div><span>Awaiting approval</span><strong>{formatNaira(pending)}</strong><small>Maker-checker controlled</small></div></div>
      </section>
      <Panel>
        <TableToolbar tabs={["Cashbook", "Income", "Expenses", "Refunds", "Agent deposits"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search reference, description, account or category" search={table.search} onSearch={table.setSearch} />
        {error ? <EmptyState icon={AlertTriangle} title="Finance records could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading cashbook" detail="Reconciling posted and pending entries." compact /> : table.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Account</th><th>Description</th><th>Type</th><th>Category</th><th>Station</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{table.pageRows.map((entry) => <tr key={entry.id}><td><div className="primary-cell"><strong>{entry.entryNumber}</strong><span>{formatDate(entry.createdAt)}</span></div></td><td>{entry.account.name}</td><td>{entry.description}</td><td><StatusPill value={entry.direction === "CREDIT" ? "Income" : "Expense"} /></td><td>{entry.category.name}</td><td>{entry.station.name}</td><td className={classNames("number-cell strong-number", entry.direction === "DEBIT" && "negative-number")}>{entry.direction === "DEBIT" ? "−" : "+"}{formatNaira(Number(entry.amount))}</td><td><StatusPill value={entry.status.replaceAll("_", " ")} /></td><td><div className="row-actions">{entry.status === "PENDING_APPROVAL" ? <><button className="row-button" onClick={() => decideEntry(entry, "APPROVED")}>Approve</button><button className="icon-ghost" onClick={() => decideEntry(entry, "REJECTED")} aria-label="Reject entry"><X size={16} /></button></> : ["POSTED", "RECONCILED"].includes(entry.status) ? <button className="row-button" onClick={() => reverseEntry(entry)}>Reverse</button> : <button className="icon-ghost" onClick={reload} aria-label={`Refresh after ${entry.entryNumber}`}><RefreshCcw size={15} /></button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={Banknote} title={table.search ? "No matching entries" : "No cashbook entries"} detail={table.search ? "Try a different reference, description, account or category." : "Posted sales, deposits and approved finance entries appear here automatically."} />}
        <Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} />
      </Panel>
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

function StaffView() {
  const [tab, setTab] = useState("All staff");
  const { data, total, loading, error } = useApiData<StaffRecord[]>("/api/staff?pageSize=100");
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
  return <div className="content-stack"><section className="summary-strip"><SummaryItem label="Active staff" value={activeCount.toString()} icon={UserCheck} tone="success" /><SummaryItem label="Stations" value={stationCount.toString()} icon={Store} tone="info" /><SummaryItem label="On leave" value={leaveCount.toString()} icon={CalendarDays} tone="warning" /><SummaryItem label="New this month" value={thisMonth.toString()} icon={UserPlus} tone="success" /></section><Panel><TableToolbar tabs={["All staff", "Active", "On leave", "Inactive"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search staff name, ID, position or station" search={table.search} onSearch={table.setSearch} />{error ? <EmptyState icon={AlertTriangle} title="Staff records could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading staff directory" detail="Retrieving protected staff records from the database." compact /> : table.filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Staff member</th><th>Position</th><th>Department</th><th>Station</th><th>Employed since</th><th>Status</th><th /></tr></thead><tbody>{table.pageRows.map((person) => { const name = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" "); return <tr key={person.id}><td><div className="agent-cell staff"><span>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{name}</strong><small>{person.staffNumber}</small></div></div></td><td>{person.position.name}</td><td>{person.department.name}</td><td>{person.homeStation.name}</td><td>{formatDate(person.employmentDate)}</td><td><StatusPill value={person.status.replaceAll("_", " ")} /></td><td><button className="icon-ghost" aria-label={`Open ${name}`}><MoreHorizontal size={17} /></button></td></tr>; })}</tbody></table></div> : <EmptyState icon={UserCheck} title={table.search ? "No matching staff" : "No staff records"} detail={table.search ? "Try a different name, ID, position or station." : "Add the first staff member and assign their department, position and home station."} />}<Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} /></Panel></div>;
}

function ReportsView({ period, onToast }: { period: string; onToast: (toast: Toast) => void }) {
  const { data, loading, error, reload } = useApiData<{ sales: { _count: number; _sum: { total: string | null; paidTotal: string | null; outstandingTotal: string | null } }; refunds: { _count: number; _sum: { amount: string | null } }; cargo: Array<{ status: string; _count: number }>; tickets: { _count: number; _sum: { sellingPrice: string | null; profit?: string | null } } }>("/api/reports/summary");
  const runReport = (title: string) => { window.open("/api/reports/export", "_blank", "noopener,noreferrer"); onToast({ title: "Report export started", detail: `${title} is being generated from permission-scoped ledgers.` }); };
  return (
    <div className="content-stack">
      <section className="report-hero">
        <div><span className="report-hero-icon"><FileSearch size={23} /></span><div><span>Reporting period</span><strong>{period} · All stations</strong><small>Data is permission-scoped and refreshed in real time.</small></div></div>
        <div className="report-hero-stats"><div><strong>{data?.sales._count ?? 0}</strong><span>Sales records</span></div><div><strong>{data?.tickets._count ?? 0}</strong><span>Bookings</span></div><div><strong>{loading ? "Syncing" : "Live"}</strong><span>Ledger state</span></div></div>
      </section>
      {error && <EmptyState icon={AlertTriangle} title="Report totals could not be loaded" detail={error} compact />}
      <section className="summary-strip"><SummaryItem label="Sales value" value={formatNaira(Number(data?.sales._sum.total ?? 0))} icon={CircleDollarSign} tone="success" /><SummaryItem label="Outstanding" value={formatNaira(Number(data?.sales._sum.outstandingTotal ?? 0))} icon={Clock3} tone="warning" /><SummaryItem label="Refunds" value={formatNaira(Number(data?.refunds._sum.amount ?? 0))} icon={RotateCcw} tone="danger" /><SummaryItem label="Ticket revenue" value={formatNaira(Number(data?.tickets._sum.sellingPrice ?? 0))} icon={TicketCheck} tone="info" /></section>
      <section className="report-catalogue">
        {reportCatalogue.map((report) => { const Icon = report.icon; return <article className="report-card" key={report.title}><div className="report-card-top"><span><Icon size={19} /></span><em>{report.category}</em></div><h2>{report.title}</h2><p>{report.description}</p><div className="report-card-bottom"><span>Audited CSV export</span><button onClick={() => runReport(report.title)}>Run report <ArrowRight size={14} /></button></div></article>; })}
      </section>
      <Panel><PanelHeader title="Report integrity" subtitle="Source-ledger status for the selected period" right={<button className="text-action" onClick={reload}><RefreshCcw size={14} />Refresh</button>} /><div className="document-rows"><DocumentRow icon={FileCheck2} name="Sales ledger" meta={`${data?.sales._count ?? 0} records · ${formatNaira(Number(data?.sales._sum.paidTotal ?? 0))} collected`} status="Live" /><DocumentRow icon={Plane} name="Cargo ledger" meta={`${data?.cargo.reduce((sum, item) => sum + item._count, 0) ?? 0} shipments`} status="Live" /><DocumentRow icon={TicketCheck} name="Ticket booking ledger" meta={`${data?.tickets._count ?? 0} records`} status="Live" /></div></Panel>
    </div>
  );
}

function AccessView({ onToast }: { onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("Users");
  const [query, setQuery] = useState("");
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
  return <div className="content-stack"><section className="security-banner"><div><ShieldCheck size={22} /><div><strong>Server-enforced access control</strong><span>{roles.length} roles, {userApi.total} users and {permissionApi.total} granular permissions are configured.</span></div></div><button onClick={reload}><RefreshCcw size={14} /> Refresh access</button></section><Panel><TableToolbar tabs={["Users", "Roles", "Permissions", "Sessions"]} activeTab={tab} onTab={(value) => { setTab(value); setQuery(""); }} placeholder="Search users, roles, permissions or sessions" search={query} onSearch={setQuery} />{error ? <EmptyState icon={AlertTriangle} title="Access configuration could not be loaded" detail={error} /> : loading ? <EmptyState icon={RefreshCcw} title="Loading access configuration" detail="Retrieving users, grants and active sessions." compact /> : tab === "Roles" ? visibleRoles.length ? <div className="role-grid">{visibleRoles.map((role, index) => <article className="role-card" key={role.id}><div><span className={classNames("role-icon", tones[index % tones.length])}><KeyRound size={17} /></span><StatusPill value={role.scope} /></div><strong>{role.name}</strong><span>{role.code}</span><div className="role-meta"><span><Users size={14} />{role._count.users} users</span><span><Fingerprint size={14} />{role.permissions.length} permissions</span></div><button>Server enforced <ShieldCheck size={13} /></button></article>)}</div> : <EmptyState icon={KeyRound} title={q ? "No matching roles" : "No roles configured"} detail={q ? "Try a different role name or code." : "Create a role and assign only the permissions needed for the job."} /> : tab === "Permissions" ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Permission</th><th>Module</th><th>Action</th><th>Description</th><th>Control</th></tr></thead><tbody>{permissions.map((item) => <tr key={item.id}><td><code>{item.key}</code></td><td>{item.module}</td><td>{item.action}</td><td>{item.description}</td><td><StatusPill value={item.elevated ? "Elevated" : "Standard"} /></td></tr>)}</tbody></table></div> : tab === "Sessions" ? <div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>IP address</th><th>User agent</th><th>Last seen</th><th>Expires</th><th>Status</th><th /></tr></thead><tbody>{sessions.map((item) => { const active = !item.revokedAt && new Date(item.expires) >= new Date(); return <tr key={item.id}><td><div className="primary-cell"><strong>{item.user.name ?? item.user.username}</strong><span>{item.user.email ?? item.user.username}</span></div></td><td>{item.ipAddress ?? "Unknown"}</td><td>{item.userAgent?.slice(0, 60) ?? "Unknown"}</td><td>{new Date(item.lastSeenAt).toLocaleString("en-NG")}</td><td>{formatDate(item.expires)}</td><td><StatusPill value={item.revokedAt ? "Revoked" : new Date(item.expires) < new Date() ? "Expired" : "Active"} /></td><td>{active ? <button className="row-button" onClick={() => revokeSession(item)}>Revoke</button> : <span className="verified-cell"><ShieldCheck size={13} />Closed</span>}</td></tr>; })}</tbody></table></div> : users.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Username</th><th>Roles</th><th>Station scopes</th><th>Last login</th><th>Status</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="agent-cell staff"><span>{`${item.firstName[0]}${item.lastName[0]}`}</span><div><strong>{item.name ?? `${item.firstName} ${item.lastName}`}</strong><small>{item.email ?? "No email"}</small></div></div></td><td><code>{item.username}</code></td><td>{item.roleAssignments.map((grant) => grant.role.name).join(", ") || "—"}</td><td>{item.stationScopes.length}</td><td>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("en-NG") : "Never"}</td><td><StatusPill value={item.status.replaceAll("_", " ")} /></td><td><div className="row-actions">{item.status === "ACTIVE" ? <button className="row-button" onClick={() => userAction(item, "deactivate", "Deactivate user")}>Disable</button> : <button className="row-button" onClick={() => userAction(item, "activate", "Activate user")}>Activate</button>}<button className="icon-ghost" title="Reset password" onClick={() => userAction(item, "reset-password", "Password reset")}><KeyRound size={15} /></button><button className="icon-ghost" title="Revoke all sessions" onClick={() => userAction(item, "revoke-sessions", "Revoke sessions")}><LogOut size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title={q ? "No matching users" : "No users"} detail={q ? "Try a different name, username or email." : "Invite a user to grant scoped access."} />}<div className="permission-note"><LockKeyhole size={17} /><div><strong>Server-enforced permissions</strong><span>Menu visibility, API authorization and database query scope use the same permission policy.</span></div></div></Panel></div>;
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

function NotificationsView() {
  const [scope, setScope] = useState("Unread");
  const status = scope === "Unread" ? "UNREAD" : ""; const api = useApiData<NotificationRecord[]>(`/api/notifications?pageSize=100${status ? `&status=${status}` : ""}`); const items = (api.data ?? []).filter((item) => scope === "Security" ? item.type.toLowerCase().includes("security") || item.type.toLowerCase().includes("auth") : true);
  const table = useTableControls(items, (item, q) => `${item.title} ${item.message} ${item.type}`.toLowerCase().includes(q));
  const update = async (id: string) => { await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "READ" }) }); api.reload(); }; const markAll = async () => { await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "MARK_ALL_READ" }) }); api.reload(); };
  return <div className="content-stack"><div className="notification-layout"><Panel><TableToolbar tabs={["Unread", "All", "Operational", "Security"]} activeTab={scope} onTab={(value) => { setScope(value); table.resetPage(); }} placeholder="Search notifications" search={table.search} onSearch={table.setSearch} />{api.error ? <EmptyState icon={AlertTriangle} title="Notifications could not be loaded" detail={api.error} /> : api.loading ? <EmptyState icon={RefreshCcw} title="Loading inbox" detail="Retrieving your personal notification stream." compact /> : table.filtered.length ? <div className="notification-centre-list">{table.pageRows.map((item) => { const tone: Tone = item.severity === "ERROR" || item.severity === "DANGER" ? "danger" : item.severity === "WARNING" ? "warning" : item.severity === "SUCCESS" ? "success" : "info"; return <button key={item.id} onClick={() => update(item.id)}><span className={classNames("centre-notification-icon", tone)}>{tone === "danger" ? <AlertTriangle size={17} /> : tone === "warning" ? <Clock3 size={17} /> : <CheckCircle2 size={17} />}</span><div><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString("en-NG")}</small></div>{item.status === "UNREAD" && <span className="unread-marker" />}<ChevronRight size={16} /></button>; })}</div> : <EmptyState icon={Bell} title={table.search ? "No matching notifications" : "Inbox is clear"} detail={table.search ? "Try a different keyword." : "There are no notifications in this view."} />}<Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} /></Panel><aside className="notification-preferences panel"><h2>Inbox controls</h2><p>Notification state is stored per user and synchronized across sessions.</p><SummaryItem label="Visible records" value={items.length.toString()} icon={Bell} tone="info" /><SummaryItem label="Unread" value={items.filter((item) => item.status === "UNREAD").length.toString()} icon={Clock3} tone="warning" /><button onClick={markAll}>Mark all as read</button></aside></div></div>;
}

function DocumentsView({ onToast }: { onToast: (toast: Toast) => void }) {
  const [tab, setTab] = useState("All documents"); const api = useApiData<DocumentRecord[]>("/api/documents?pageSize=100"); const documents = (api.data ?? []).filter((item) => tab === "Cargo labels" ? item.documentType === "CARGO_LABEL" : tab === "Receipts" ? item.documentType.includes("RECEIPT") : true);
  const table = useTableControls(documents, (item, q) => `${item.documentType} ${item.documentNumber} ${item.sourceType} ${item.station?.name ?? ""}`.toLowerCase().includes(q));
  const openDocument = async (document: DocumentRecord) => { const response = await fetch(`/api/documents/${document.id}/print`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format: document.documentType === "CARGO_LABEL" ? "LABEL" : "A4", reason: "User requested print" }) }); if (!response.ok) { const body = await response.json() as ApiEnvelope<unknown>; onToast({ title: "Print request failed", detail: body.error?.message ?? "Document could not be opened." }); return; } if (document.sourceType === "CargoShipment") window.open(`/print/cargo/${document.sourceId}`, "_blank", "noopener,noreferrer"); else onToast({ title: "Print event recorded", detail: `${document.documentNumber} is ready in its configured document store.` }); api.reload(); };
  return <div className="content-stack"><section className="document-stats"><SummaryItem label="Stored documents" value={api.total.toString()} icon={FileCheck2} tone="info" /><SummaryItem label="Ready" value={(api.data ?? []).filter((item) => item.status === "READY").length.toString()} icon={Cloud} tone="success" /><SummaryItem label="Print events" value={(api.data ?? []).reduce((sum, item) => sum + item.prints.length, 0).toString()} icon={Printer} tone="info" /><SummaryItem label="Failed" value={(api.data ?? []).filter((item) => item.status === "FAILED").length.toString()} icon={ShieldCheck} tone="danger" /></section><Panel><TableToolbar tabs={["All documents", "Receipts", "Cargo labels", "Statements", "Reports"]} activeTab={tab} onTab={(value) => { setTab(value); table.resetPage(); }} placeholder="Search document type or reference" search={table.search} onSearch={table.setSearch} />{api.error ? <EmptyState icon={AlertTriangle} title="Documents could not be loaded" detail={api.error} /> : api.loading ? <EmptyState icon={RefreshCcw} title="Loading document register" detail="Retrieving protected metadata and print history." compact /> : table.filtered.length ? <div className="document-rows spacious">{table.pageRows.map((document) => <DocumentRow key={document.id} icon={document.documentType === "CARGO_LABEL" ? Tag : FileCheck2} name={`${document.documentType.replaceAll("_", " ")} - ${document.documentNumber}`} meta={`${document.mimeType ?? "Generated output"} · ${document.station?.name ?? "Company-wide"} · ${formatDate(document.generatedAt ?? document.createdAt)} · ${document.prints.length} prints`} status={document.status} onClick={() => openDocument(document)} />)}</div> : <EmptyState icon={FileCheck2} title={table.search ? "No matching documents" : "No documents found"} detail={table.search ? "Try a different document type or reference." : "Receipts, labels, statements and generated reports appear here."} />}<Pagination total={table.total} page={table.page} pageSize={table.pageSize} onPage={table.setPage} /></Panel></div>;
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

function WorkflowModal({ kind, onClose, onComplete, allowedStations }: { kind: Exclude<ModalKind, null>; onClose: () => void; onComplete: (title: string, detail: string) => void; allowedStations: AllowedStation[] }) {
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
  }[kind];
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="workflow-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="workflow-dialog">
        <div className="workflow-header"><div><span>{config.eyebrow}</span><h2 id="workflow-title">{config.title}</h2><p>{config.description}</p></div><button onClick={onClose} aria-label="Close modal"><X size={19} /></button></div>
        {kind === "sale" && <div className="workflow-body"><EmptyState icon={ShoppingCart} title="Use the live POS workspace" detail="Sales are created from the station-scoped product catalogue with server-verified pricing." /><ModalFooter onClose={onClose} submitLabel="Close" icon={ShoppingCart} /></div>}
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

function DepositForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const { data: agentData, loading: agentsLoading, error: agentsError } = useApiData<AgentRecord[]>("/api/agents?pageSize=100"); const { data: setup, loading: setupLoading, error: setupError } = useApiData<FinanceSetup>("/api/finance/setup");
  const [amount, setAmount] = useState("500000"); const [agentId, setAgentId] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const selected = agentData?.find((item) => item.id === agentId);
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

function StaffForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const api = useApiData<HrSetup>("/api/hr/catalogue"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ staffNumber: string; firstName: string; lastName: string }>("/api/staff", { firstName: String(form.get("firstName")), middleName: String(form.get("middleName") || "") || undefined, lastName: String(form.get("lastName")), phone: String(form.get("phone")), email: String(form.get("email") || "") || undefined, address: String(form.get("address") || "") || undefined, nationalId: String(form.get("nationalId") || "") || undefined, salary: String(form.get("salary") || "") || undefined, employmentDate: String(form.get("employmentDate")), employmentType: String(form.get("employmentType")), departmentId: String(form.get("departmentId")), positionId: String(form.get("positionId")), homeStationId: String(form.get("homeStationId")), nextOfKin: [] }); onComplete("Staff member created", `${data.staffNumber} · ${data.firstName} ${data.lastName} was added to the protected HR register.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Staff record could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="First name"><input name="firstName" required /></Field><Field label="Middle name"><input name="middleName" /></Field><Field label="Last name"><input name="lastName" required /></Field><Field label="Phone"><input name="phone" required /></Field><Field label="Email"><input name="email" type="email" /></Field><Field label="National ID"><input name="nationalId" /></Field><Field label="Home station"><select name="homeStationId" required defaultValue={allowedStations[0]?.id}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Employment date"><input name="employmentDate" type="date" required /></Field><Field label="Employment type"><select name="employmentType"><option value="PERMANENT">Permanent</option><option value="CONTRACT">Contract</option><option value="TEMPORARY">Temporary</option><option value="INTERN">Intern</option><option value="CONSULTANT">Consultant</option></select></Field><Field label="Department"><select name="departmentId" required defaultValue=""><option value="" disabled>Select department</option>{api.data?.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Position"><select name="positionId" required defaultValue=""><option value="" disabled>Select position</option>{api.data?.positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Salary"><div className="money-input"><span>₦</span><input name="salary" type="number" step="0.01" min="0" /></div></Field><Field label="Address" full><textarea name="address" /></Field></div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : "Add staff member"} icon={UserPlus} disabled={busy || api.loading || !allowedStations.length} /></form>;
}

function StationForm({ onComplete, onClose }: { onComplete: (title: string, detail: string) => void; onClose: () => void }) {
  const api = useApiData<{ businessUnits: Array<{ id: string; code: string; name: string }> }>("/api/stations/setup"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ code: string; name: string }>("/api/stations", { code: String(form.get("code")), name: String(form.get("name")), email: String(form.get("email") || ""), phone: String(form.get("phone") || "") || undefined, address: String(form.get("address") || "") || undefined, city: String(form.get("city") || "") || undefined, state: String(form.get("state") || "") || undefined, businessUnitIds: form.getAll("businessUnitIds").map(String) }); onComplete("Station created", `${data.code} · ${data.name} is now available for scoped assignments.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Station could not be created."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="Station code"><input name="code" required placeholder="LOS" /></Field><Field label="Station name"><input name="name" required /></Field><Field label="Email"><input name="email" type="email" /></Field><Field label="Phone"><input name="phone" /></Field><Field label="City"><input name="city" /></Field><Field label="State"><input name="state" /></Field><Field label="Address" full><textarea name="address" /></Field><Field label="Enabled business units" full><select name="businessUnitIds" multiple size={Math.min(5, api.data?.businessUnits.length ?? 3)}>{api.data?.businessUnits.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field></div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}</div><ModalFooter onClose={onClose} submitLabel={busy ? "Creating…" : "Create station"} icon={Building2} disabled={busy || api.loading} /></form>;
}

function InviteForm({ onComplete, onClose, allowedStations }: { onComplete: (title: string, detail: string) => void; onClose: () => void; allowedStations: AllowedStation[] }) {
  const api = useApiData<UserSetup>("/api/users/setup"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(null); const form = new FormData(event.currentTarget); try { const data = await workflowPost<{ username: string; status: string }>("/api/users", { firstName: String(form.get("firstName")), lastName: String(form.get("lastName")), username: String(form.get("username")), email: String(form.get("email")), phone: String(form.get("phone") || "") || undefined, roleIds: form.getAll("roleIds").map(String), stationIds: form.getAll("stationIds").map(String), businessUnitIds: form.getAll("businessUnitIds").map(String), sendInvite: true }); onComplete("User invited", `${data.username} was provisioned with explicit roles and scoped access.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "User could not be invited."); } finally { setBusy(false); } };
  return <form onSubmit={submit}><div className="workflow-body"><div className="form-grid"><Field label="First name"><input name="firstName" required /></Field><Field label="Last name"><input name="lastName" required /></Field><Field label="Username"><input name="username" required /></Field><Field label="Email"><input name="email" type="email" required /></Field><Field label="Phone"><input name="phone" /></Field><Field label="Roles" full><select name="roleIds" multiple required size={Math.min(6, api.data?.roles.length ?? 4)}>{api.data?.roles.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.scope.toLowerCase()}</option>)}</select></Field><Field label="Station scope" full><select name="stationIds" multiple size={Math.min(6, allowedStations.length)}>{allowedStations.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field label="Business-unit scope" full><select name="businessUnitIds" multiple size={Math.min(5, api.data?.businessUnits.length ?? 3)}>{api.data?.businessUnits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div>{(error || api.error) && <div className="form-note"><AlertTriangle size={16} /><span>{error ?? api.error}</span></div>}<div className="form-note"><LockKeyhole size={16} /><span>The invite carries a one-time credential and forces a password change at first sign-in.</span></div></div><ModalFooter onClose={onClose} submitLabel={busy ? "Inviting…" : "Invite user"} icon={UserPlus} disabled={busy || api.loading} /></form>;
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
          homeStationId: optional("homeStationId"),
          allowDuplicate,
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
