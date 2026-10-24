"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bell, Building2,
  CalendarCheck, CalendarClock, CalendarDays, Camera, ChartNoAxesCombined, Check,
  CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck, CircleHelp,
  ClipboardCheck, ClipboardClock, Clock, Clock3, Clock4, Download, Eye, EyeOff,
  FileCheck2, FilePenLine, FileSpreadsheet, History, Info, LayoutDashboard, ListFilter,
  LockKeyhole, LogOut, MapPin, Menu, Moon, MoreHorizontal, Plus, QrCode, RefreshCw,
  ScanLine, Search, Send, Settings2, ShieldCheck, SlidersHorizontal, Sun, Trash2,
  TriangleAlert, UserCheck, UserRound, Users, WifiOff, X, type LucideProps,
} from "lucide-react";
import type { Theme } from "@/lib/model";

const iconMap = {
  "arrow-down-to-line": ArrowDownToLine, "arrow-left": ArrowLeft, "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight, "badge-check": BadgeCheck, bell: Bell, "building-2": Building2,
  "calendar-check": CalendarCheck, "calendar-clock": CalendarClock, "calendar-days": CalendarDays,
  camera: Camera, "chart-no-axes-combined": ChartNoAxesCombined, check: Check, "check-check": CheckCheck,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  circle: Circle, "circle-check": CircleCheck, "circle-help": CircleHelp, "clipboard-check": ClipboardCheck,
  "clipboard-clock": ClipboardClock, clock: Clock, "clock-3": Clock3, "clock-4": Clock4,
  download: Download, eye: Eye, "eye-off": EyeOff, "file-check-2": FileCheck2, "file-pen-line": FilePenLine,
  "file-spreadsheet": FileSpreadsheet, history: History, info: Info, "layout-dashboard": LayoutDashboard,
  "list-filter": ListFilter, "lock-keyhole": LockKeyhole, "log-out": LogOut, "map-pin": MapPin,
  menu: Menu, moon: Moon, "more-horizontal": MoreHorizontal, plus: Plus, "qr-code": QrCode,
  "refresh-cw": RefreshCw, "scan-line": ScanLine, search: Search, send: Send, "settings-2": Settings2,
  "shield-check": ShieldCheck, "sliders-horizontal": SlidersHorizontal, sun: Sun, "trash-2": Trash2,
  "triangle-alert": TriangleAlert, "user-check": UserCheck, "user-round": UserRound, users: Users,
  "wifi-off": WifiOff, x: X,
};

export function Icon({ name, size = 17, ...props }: LucideProps & { name: string }) {
  const Component = iconMap[name as keyof typeof iconMap] || Circle;
  return <Component size={size} strokeWidth={1.7} aria-hidden="true" {...props} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: string;
  variant?: "gold" | "dark" | "quiet" | "default";
};
export function Button({ icon, variant = "default", children, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`kcw-btn ${variant === "default" ? "" : `kcw-btn-${variant}`} ${className}`} {...props}>{icon && <Icon name={icon} />}{children}</button>;
}

export function IconButton({ icon, label, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string }) {
  return <button type="button" className={`kcw-iconbtn ${className}`} aria-label={label} {...props}><Icon name={icon} /></button>;
}

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <IconButton icon={theme === "dark" ? "sun" : "moon"} label={`Aktifkan mode ${theme === "dark" ? "terang" : "gelap"}`} className="kcw-theme-toggle" data-action="toggle-theme" aria-pressed={theme === "dark"} onClick={onToggle} />;
}

export function Pill({ tone = "neutral", children }: { tone?: "green" | "gold" | "red" | "neutral"; children: ReactNode }) {
  return <span className={`kcw-pill ${tone === "neutral" ? "" : `kcw-pill-${tone}`}`}>{children}</span>;
}

export function Panel({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <section className="kcw-panel"><div className="kcw-panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

export function Notice({ icon = "info", children }: { icon?: string; children: ReactNode }) {
  return <div className="kcw-note"><Icon name={icon} /><div>{children}</div></div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const titleId = useId();
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>("button")?.focus());
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key === "Tab") {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]");
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = overflow; document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, []);
  return <div className="kcw-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="kcw-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog}><div className="kcw-modal-header"><h2 id={titleId}>{title}</h2><IconButton icon="x" label="Tutup jendela" onClick={onClose} /></div><div className="kcw-modal-content">{children}</div></div></div>;
}
