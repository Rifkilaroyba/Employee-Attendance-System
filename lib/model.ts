export type Role = "admin" | "pic" | "employee";
export type PreviewRole = Role | "login";
export type Theme = "light" | "dark";
export type PageKey = "dashboard" | "employees" | "clients" | "assignments" | "schedule" | "config" | "monitoring" | "corrections" | "reports" | "settings" | "qr";
export type AttendanceStatus = "Tepat waktu" | "Terlambat" | "Belum masuk";

export interface Employee {
  id: string;
  name: string;
  initial: string;
  job: string;
  client: string;
  location: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

export interface ClientCompany {
  id: string;
  name: string;
  city: string;
  employees: number;
  locations: number;
  present: number;
}

export type CorrectionType = "Jam masuk" | "Jam pulang";
export type CorrectionStatus = "Menunggu" | "Disetujui" | "Ditolak";
export interface Correction {
  id: string;
  employeeId: string;
  date: string;
  type: CorrectionType;
  originalTime: string;
  requestedTime: string;
  reason: string;
  status: CorrectionStatus;
  note?: string;
  decidedBy?: string;
}
export interface NewCorrection {
  date: string;
  type: CorrectionType;
  requestedTime: string;
  reason: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: "KCW-001", name: "Andi Pratama", initial: "AP", job: "Security", client: "PT Sentra Mandiri", location: "Gedung A · Surabaya", shift: "08.00–16.00", checkIn: "07.52", checkOut: "—", status: "Tepat waktu" },
  { id: "KCW-002", name: "Siti Rahmawati", initial: "SR", job: "Cleaning Service", client: "PT Sentra Mandiri", location: "Gedung A · Surabaya", shift: "08.00–16.00", checkIn: "07.56", checkOut: "—", status: "Tepat waktu" },
  { id: "KCW-003", name: "Budi Santoso", initial: "BS", job: "Security", client: "PT Bina Karya", location: "Kantor Pusat · Sidoarjo", shift: "08.00–16.00", checkIn: "08.12", checkOut: "—", status: "Terlambat" },
  { id: "KCW-004", name: "Dewi Lestari", initial: "DL", job: "Office Support", client: "PT Sentra Mandiri", location: "Gedung A · Surabaya", shift: "08.00–16.00", checkIn: "—", checkOut: "—", status: "Belum masuk" },
  { id: "KCW-005", name: "Rizky Saputra", initial: "RS", job: "Cleaning Service", client: "PT Cakra Utama", location: "Unit Timur · Gresik", shift: "07.00–15.00", checkIn: "06.54", checkOut: "—", status: "Tepat waktu" },
  { id: "KCW-006", name: "Nadia Putri", initial: "NP", job: "Receptionist", client: "PT Sentra Mandiri", location: "Gedung A · Surabaya", shift: "08.00–16.00", checkIn: "07.58", checkOut: "—", status: "Tepat waktu" }
];
export const CLIENT_COMPANIES: ClientCompany[] = [
  { id: "SM", name: "PT Sentra Mandiri", city: "Surabaya", employees: 48, locations: 2, present: 44 },
  { id: "BK", name: "PT Bina Karya", city: "Sidoarjo", employees: 32, locations: 1, present: 29 },
  { id: "CU", name: "PT Cakra Utama", city: "Gresik", employees: 24, locations: 2, present: 21 },
  { id: "MS", name: "PT Mitra Sejahtera", city: "Surabaya", employees: 12, locations: 1, present: 10 },
  { id: "AN", name: "PT Artha Nusantara", city: "Malang", employees: 8, locations: 1, present: 6 },
  { id: "DP", name: "PT Daya Prima", city: "Sidoarjo", employees: 4, locations: 1, present: 2 }
];
export const INITIAL_CORRECTIONS: Correction[] = [
  { id: "COR-001", employeeId: "KCW-002", date: "2026-10-23", type: "Jam pulang", originalTime: "—", requestedTime: "16:00", reason: "Koneksi internet terputus saat scan pulang. Saya selesai bekerja pukul 16.00.", status: "Menunggu" },
  { id: "COR-002", employeeId: "KCW-003", date: "2026-10-22", type: "Jam masuk", originalTime: "08.14", requestedTime: "07:58", reason: "Kendala koneksi saat tiba di lokasi kerja.", status: "Disetujui", note: "Waktu kedatangan telah dikonfirmasi.", decidedBy: "Hendra · PT Bina Karya" },
  { id: "COR-003", employeeId: "KCW-001", date: "2026-10-21", type: "Jam masuk", originalTime: "—", requestedTime: "07:48", reason: "Lokasi belum akurat saat scan.", status: "Disetujui", note: "Waktu kerja sudah dikonfirmasi PIC.", decidedBy: "Ratna Puspita" }
];

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value + "T12:00:00+07:00"));
}
