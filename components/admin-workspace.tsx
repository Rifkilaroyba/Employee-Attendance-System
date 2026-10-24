"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CLIENT_COMPANIES, formatDate, type ClientCompany, type Correction, type Employee, type PageKey, type Theme } from "@/lib/model";
import { Button, Icon, IconButton, Modal, Notice, Panel, Pill, ThemeToggle } from "@/components/ui";

export interface AdminWorkspaceProps {
  role: "admin" | "pic";
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  corrections: Correction[];
  canDecideCorrections: boolean;
  onDecideCorrection: (id: string, status: "Disetujui" | "Ditolak", note: string) => void;
  onNotify: (message: string) => void;
}

type Menu = [PageKey, string, string];
const ADMIN_MENUS: Menu[] = [
  ["dashboard", "layout-dashboard", "Dashboard"], ["employees", "users", "Karyawan"],
  ["clients", "building-2", "Perusahaan Klien"], ["assignments", "map-pin", "Penempatan"],
  ["schedule", "calendar-days", "Jadwal Kerja"], ["config", "sliders-horizontal", "Konfigurasi Absensi"],
  ["monitoring", "scan-line", "Monitoring Kehadiran"], ["corrections", "clipboard-check", "Koreksi Kehadiran"],
  ["reports", "chart-no-axes-combined", "Laporan"], ["settings", "settings-2", "Pengaturan"],
];
const PIC_MENUS: Menu[] = [
  ["dashboard", "layout-dashboard", "Dashboard"], ["employees", "users", "Daftar Karyawan"],
  ["monitoring", "scan-line", "Monitoring"], ["qr", "qr-code", "Penampil QR"],
  ["corrections", "clipboard-check", "Verifikasi Koreksi"], ["reports", "chart-no-axes-combined", "Rekap Kehadiran"],
  ["settings", "user-round", "Profil"],
];
type ModalState = { kind: "person"; employee: Employee } | { kind: "correction"; id: string } |
  { kind: "client"; company: ClientCompany } | { kind: "form"; form: "employee" | "client" | "assignment" | "schedule" } |
  { kind: "export" | "notifications" | "shift"; label?: string } | null;

function Status({ value }: { value: string }) {
  const tone = ["Tepat waktu", "Disetujui", "Aktif", "Dikonfirmasi"].includes(value) ? "green" : value === "Ditolak" ? "red" : ["Terlambat", "Menunggu"].includes(value) ? "gold" : "neutral";
  return <Pill tone={tone}>{value}</Pill>;
}
function Title({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="kcw-between kcw-titleline"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="kcw-field"><span style={{ fontWeight: 600 }}>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Values({ values }: { values: [string, ReactNode][] }) {
  return <dl className="kcw-kv">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
function Metric({ label, value, sub, icon, positive }: { label: string; value: string | number; sub: string; icon: string; positive?: boolean }) {
  return <div className="kcw-metric"><div className="kcw-metric-top"><span>{label}</span><span className="kcw-metric-icon"><Icon name={icon} /></span></div><div className="kcw-metric-value">{value}</div><div className={`kcw-metric-sub ${positive ? "kcw-positive" : ""}`}>{sub}</div></div>;
}

function CorrectionReview({ correction, employee, canDecide, onDecision }: {
  correction: Correction; employee?: Employee; canDecide: boolean;
  onDecision: (status: "Disetujui" | "Ditolak", note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  function decide(status: "Disetujui" | "Ditolak") {
    if (!note.trim()) { setError(true); return; }
    onDecision(status, note.trim());
  }
  return <>
    <div className="kcw-between"><div><h3>{employee?.name ?? correction.employeeId}</h3><p className="kcw-small kcw-muted">{correction.employeeId} · {employee?.client}</p></div><Status value={correction.status} /></div>
    <Values values={[["Tanggal kerja", formatDate(correction.date)], ["Jenis koreksi", correction.type], ["Catatan asal", correction.originalTime], ["Waktu diajukan", `${correction.requestedTime.replace(":", ".")} WIB`]]} />
    <Notice><span><strong>Alasan karyawan</strong><p style={{ marginTop: 5 }}>{correction.reason}</p></span></Notice>
    {canDecide && correction.status === "Menunggu" ? <div className="kcw-stack">
      <Field label="Catatan keputusan"><textarea aria-label="Catatan keputusan PIC" value={note} onChange={event => { setNote(event.target.value); setError(false); }} placeholder="Tuliskan hasil pemeriksaan…" rows={3} required /></Field>
      {error && <p className="kcw-alert" role="alert">Isi catatan keputusan terlebih dahulu.</p>}
      <div className="kcw-modal-actions"><Button onClick={() => decide("Ditolak")}>Tolak</Button><Button variant="gold" icon="check" onClick={() => decide("Disetujui")}>Setujui koreksi</Button></div>
    </div> : <Notice icon="history">{correction.status === "Menunggu" ? "Menunggu keputusan PIC. Admin dapat memantau tanpa mengubah keputusan." : <span><strong>{correction.status} oleh {correction.decidedBy ?? "PIC perusahaan"}</strong><p style={{ marginTop: 5 }}>{correction.note}</p><p className="kcw-small" style={{ marginTop: 6 }}>Catatan asal tetap tersimpan dalam riwayat.</p></span>}</Notice>}
  </>;
}

export default function AdminWorkspace(props: AdminWorkspaceProps) {
  const { role, theme, onToggleTheme, onLogout, employees, onAddEmployee, corrections, canDecideCorrections, onDecideCorrection, onNotify } = props;
  const isPIC = role === "pic";
  const canDecide = isPIC && canDecideCorrections;
  const menus = isPIC ? PIC_MENUS : ADMIN_MENUS;
  const [requestedPage, setPage] = useState<PageKey>("dashboard");
  const page = isPIC && !PIC_MENUS.some(menu => menu[0] === requestedPage) ? "dashboard" : requestedPage;
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("2026-10-24");
  const [reportPeriod, setReportPeriod] = useState("2026-10");
  const [reportCompany, setReportCompany] = useState("all");
  const [companies, setCompanies] = useState(CLIENT_COMPANIES);
  const [qrLocation, setQrLocation] = useState("Gedung A");
  const [configuredCompany, setConfiguredCompany] = useState("PT Sentra Mandiri");
  const qrCompany = isPIC ? "PT Sentra Mandiri" : configuredCompany;
  const qrCity = companies.find(company => company.name === qrCompany)?.city ?? "Surabaya";
  const [qrRevision, setQrRevision] = useState(0);
  const [recapConfirmed, setRecapConfirmed] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [addedAssignments, setAddedAssignments] = useState<string[]>([]);
  const [addedSchedules, setAddedSchedules] = useState<string[]>([]);
  const scopedEmployees = useMemo(() => isPIC ? employees.filter(employee => employee.client === "PT Sentra Mandiri") : employees, [employees, isPIC]);
  const scopedIds = new Set(scopedEmployees.map(employee => employee.id));
  const scopedCorrections = corrections.filter(correction => scopedIds.has(correction.employeeId));
  const pendingCount = scopedCorrections.filter(correction => correction.status === "Menunggu").length;
  const title = page === "qr" ? "Penampil QR" : menus.find(menu => menu[0] === page)?.[2] ?? "Dashboard";
  const sampleTotal = isPIC ? 48 + Math.max(0, scopedEmployees.length - 4) : 128 + Math.max(0, employees.length - 6);

  function navigate(next: PageKey) {
    setPage(next); setSearch(""); setCompanyFilter("all"); setStatusFilter("all"); setModal(null);
  }
  function person(employee: Employee) {
    return <div className="kcw-person"><span className="kcw-avatar kcw-tinted">{employee.initial}</span><div><button type="button" className="kcw-link" onClick={() => setModal({ kind: "person", employee })}>{employee.name}</button><small>{employee.id} · {employee.job}</small></div></div>;
  }
  function attendanceTable(list: Employee[], full = false) {
    return <div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th>{!isPIC && <th>Perusahaan</th>}<th>Masuk</th>{full && <th>Pulang</th>}<th>Status</th></tr></thead><tbody>{list.length ? list.map(employee => <tr key={employee.id}><td>{person(employee)}</td>{!isPIC && <td>{employee.client}</td>}<td className="kcw-num">{employee.checkIn}</td>{full && <td className="kcw-num">{employee.checkOut}</td>}<td><Status value={employee.status} /></td></tr>) : <tr><td colSpan={full ? 6 : 5}><div className="kcw-empty">Tidak ada catatan yang sesuai filter.</div></td></tr>}</tbody></table></div>;
  }
  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.kind !== "form") return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (modal.form === "employee") {
      const client = String(data.get("client"));
      onAddEmployee({ id: `KCW-${String(employees.length + 1).padStart(3, "0")}`, name, initial: name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase(), job: String(data.get("job")), client, location: "Gedung A · Surabaya", shift: "08.00–16.00", checkIn: "—", checkOut: "—", status: "Belum masuk" });
      onNotify(`${name} ditambahkan ke data contoh.`);
    } else if (modal.form === "client") {
      setCompanies(previous => [...previous, { id: `CLIENT-${previous.length + 1}`, name, city: String(data.get("city")), employees: 0, locations: 1, present: 0 }]);
      onNotify(`${name} ditambahkan ke daftar klien contoh.`);
    } else {
      const employee = employees.find(item => item.id === data.get("employee"));
      const label = `${employee?.name} · ${String(data.get("choice"))} · mulai ${formatDate(String(data.get("start")))}`;
      if (modal.form === "assignment") setAddedAssignments(previous => [...previous, label]);
      else setAddedSchedules(previous => [...previous, label]);
      onNotify(modal.form === "assignment" ? "Penempatan contoh berhasil ditambahkan." : "Jadwal contoh berhasil ditambahkan.");
    }
    setModal(null);
  }
  function exportCSV() {
    const rows = scopedEmployees.filter(employee => isPIC || reportCompany === "all" || employee.client === reportCompany);
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const content = [["ID", "Nama", "Perusahaan", "Periode", "Hari kerja", "Hadir", "Terlambat", "Tidak hadir"], ...rows.map((employee, index) => [employee.id, employee.name, employee.client, reportPeriod, "24", String([24, 23, 22, 24][index % 4]), String([0, 1, 2, 0][index % 4]), String([0, 1, 2, 0][index % 4])])].map(row => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rekap-contoh-${reportPeriod}.csv`; anchor.click(); URL.revokeObjectURL(url);
    onNotify("CSV data contoh diunduh. Ekspor Excel produksi disiapkan pada tahap integrasi.");
    setModal(null);
  }

  function dashboard() {
    return <>
      <section className="kcw-hero"><div><div className="kcw-eyebrow">{isPIC ? "PT SENTRA MANDIRI" : "PT KARUNIA CIPTA WASANTARA"}</div><h2>Selamat pagi, {isPIC ? "Bu Ratna" : "Admin"}.</h2><p>{isPIC ? "Pantau kehadiran tim dan tindak lanjuti pengajuan koreksi." : "Semua penempatan dan kehadiran tim, dalam satu pandangan."}</p></div><div className="kcw-hero-aside"><div className="kcw-eyebrow">PERLU DITINJAU</div><strong>{pendingCount}</strong><span>pengajuan koreksi</span></div></section>
      <div className="kcw-between"><div className="kcw-titleline"><h2>Ringkasan hari ini</h2><p>Aktivitas pada seluruh shift terjadwal.</p></div><div className="kcw-date"><Icon name="calendar-days" />Sabtu, 24 Oktober 2026</div></div>
      <div className="kcw-metrics"><Metric label="Karyawan aktif" value={sampleTotal} sub={isPIC ? "2 lokasi penempatan" : `${companies.length} perusahaan klien`} icon="users" /><Metric label="Sudah hadir" value={isPIC ? 44 : 112} sub={isPIC ? "91,7% dari jadwal hari ini" : "87,5% dari jadwal hari ini"} icon="user-check" positive /><Metric label="Terlambat" value={isPIC ? 3 : 8} sub="Termasuk karyawan hadir" icon="clock-3" /><Metric label="Belum masuk" value={isPIC ? 4 : 16} sub="Perlu ditindaklanjuti" icon="clock-4" /></div>
      <div className="kcw-grid-two"><Panel title="Komposisi kehadiran" action={<Pill>Hari ini</Pill>}><div className="kcw-panel-body"><div className="kcw-chart" role="img" aria-label={isPIC ? "41 tepat waktu, 3 terlambat, 4 belum masuk" : "104 tepat waktu, 8 terlambat, 16 belum masuk"}><div className="kcw-donut" style={isPIC ? { background: "conic-gradient(#387c61 0deg 307.5deg,#c6a249 307.5deg 330deg,var(--kcw-soft) 330deg)" } : undefined}><div className="kcw-donut-hole"><strong>{isPIC ? "91,7" : "87,5"}<span style={{ fontSize: 12 }}>%</span></strong><span>SUDAH HADIR</span></div></div><div className="kcw-legend">{[["Tepat waktu", isPIC ? 41 : 104, "#387c61"], ["Terlambat", isPIC ? 3 : 8, "#c6a249"], ["Belum masuk", isPIC ? 4 : 16, "var(--kcw-line)"]].map(([label, value, color]) => <div className="kcw-legend-row" key={String(label)}><span className="kcw-swatch" style={{ background: String(color) }} />{label}<strong>{value}</strong></div>)}</div></div></div></Panel>
        {isPIC ? <Panel title="Perlu perhatian"><div className="kcw-panel-body kcw-stack"><div className="kcw-between"><div><h3>4 karyawan belum masuk</h3><p className="kcw-small kcw-muted" style={{ marginTop: 4 }}>Shift pagi · Gedung A & B</p></div><Button variant="quiet" icon="arrow-up-right" onClick={() => navigate("monitoring")}>Lihat</Button></div><div className="kcw-between"><div><h3>{pendingCount} pengajuan menunggu</h3><p className="kcw-small kcw-muted" style={{ marginTop: 4 }}>Periksa alasan dan catatan asal.</p></div><Button variant="quiet" icon="arrow-up-right" onClick={() => navigate("corrections")}>Tinjau</Button></div></div></Panel> : <Panel title="Kehadiran per perusahaan" action={<Button variant="quiet" onClick={() => navigate("clients")}>Semua klien</Button>}><div className="kcw-panel-body"><div className="kcw-client-bars">{companies.slice(0, 3).map(company => <div key={company.id}><div className="kcw-client-bar-top"><span>{company.name}</span><strong>{company.present}<span className="kcw-muted"> / {company.employees}</span></strong></div><div className="kcw-track"><span style={{ width: `${company.present / company.employees * 100}%` }} /></div></div>)}</div><p className="kcw-sublabel">Karyawan hadir / karyawan terjadwal</p></div></Panel>}</div>
      <Panel title="Aktivitas kehadiran terbaru" action={<Pill tone="gold">Contoh hari ini</Pill>}>{attendanceTable(scopedEmployees.slice(0, 4))}<div className="kcw-table-foot"><span>Waktu ditampilkan dalam WIB</span><Button variant="quiet" icon="arrow-right" onClick={() => navigate("monitoring")}>Lihat monitoring</Button></div></Panel>
    </>;
  }

  function employeePage() {
    const list = scopedEmployees.filter(employee => `${employee.name} ${employee.id} ${employee.job}`.toLowerCase().includes(search.toLowerCase()));
    return <><Title title="Data karyawan" description={isPIC ? "Karyawan yang ditempatkan di PT Sentra Mandiri." : "Kelola identitas, akun, dan status karyawan."} action={!isPIC && <Button variant="gold" icon="plus" onClick={() => setModal({ kind: "form", form: "employee" })}>Tambah karyawan</Button>} /><div className="kcw-toolbar"><div className="kcw-search"><Icon name="search" /><input aria-label="Cari karyawan" placeholder="Cari nama atau ID karyawan…" value={search} onChange={event => setSearch(event.target.value)} /></div><Pill tone="gold">{sampleTotal} karyawan aktif</Pill></div><Panel title="Daftar karyawan"><div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th><th>{isPIC ? "Lokasi" : "Penempatan"}</th><th>Shift</th><th>Status akun</th></tr></thead><tbody>{list.map(employee => <tr key={employee.id}><td>{person(employee)}</td><td>{isPIC ? employee.location : employee.client}</td><td>{employee.shift}</td><td><Status value="Aktif" /></td></tr>)}{!list.length && <tr><td colSpan={4}><div className="kcw-empty">Nama atau ID tidak ditemukan.</div></td></tr>}</tbody></table></div><div className="kcw-table-foot">{list.length} data contoh ditampilkan · klik nama untuk melihat detail</div></Panel><Notice icon="badge-check">Penempatan dan jadwal aktif menjadi acuan otomatis saat karyawan melakukan scan QR.</Notice></>;
  }
  function clientsPage() {
    return <><Title title="Perusahaan klien" description="Atur perusahaan serta lokasi kerja yang terhubung." action={<Button variant="gold" icon="plus" onClick={() => setModal({ kind: "form", form: "client" })}>Tambah klien</Button>} /><div className="kcw-client-grid">{companies.map(company => <section key={company.id} className="kcw-panel kcw-client-card"><div className="kcw-between"><div className="kcw-flex"><span className="kcw-square"><Icon name="building-2" /></span><div><h3>{company.name}</h3><span className="kcw-small kcw-muted">{company.city}</span></div></div><Status value="Aktif" /></div><Values values={[["Karyawan", `${company.employees} orang`], ["Lokasi kerja", `${company.locations} lokasi`]]} /><div className="kcw-between"><span className="kcw-small kcw-muted">{company.present} hadir hari ini</span><Button variant="quiet" icon="arrow-up-right" onClick={() => setModal({ kind: "client", company })}>Lihat lokasi</Button></div></section>)}</div></>;
  }
  function assignmentsPage() {
    return <><Title title="Penempatan karyawan" description="Hubungkan karyawan dengan perusahaan dan lokasi kerjanya." action={<Button variant="gold" icon="plus" onClick={() => setModal({ kind: "form", form: "assignment" })}>Penempatan baru</Button>} /><Panel title="Penempatan aktif"><div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th><th>Perusahaan / lokasi</th><th>Periode aktif</th><th>Status</th></tr></thead><tbody>{employees.map(employee => <tr key={employee.id}><td>{person(employee)}</td><td>{employee.client}<small style={{ display: "block", color: "var(--kcw-muted)" }}>{employee.location}</small></td><td>01 Okt – 31 Des 2026</td><td><Status value="Aktif" /></td></tr>)}</tbody></table></div></Panel>{addedAssignments.map((label, index) => <Notice key={index} icon="map-pin">Penempatan baru: {label}</Notice>)}<Notice icon="map-pin">Karyawan hanya dapat melakukan absensi pada penempatan yang masih aktif.</Notice></>;
  }
  function schedulePage() {
    return <><Title title="Jadwal kerja" description="Kelola shift dan penjadwalan karyawan." action={<Button variant="gold" icon="plus" onClick={() => setModal({ kind: "form", form: "schedule" })}>Buat jadwal</Button>} /><Notice>Jam shift dan rentang absensi berikut adalah contoh desain, menunggu ketetapan perusahaan.</Notice><div className="kcw-client-grid">{[["Shift Pagi", "08.00", "16.00", "Senin–Sabtu", "sun"], ["Shift Malam", "22.00", "06.00", "Hari berikutnya", "moon"]].map(shift => <section className="kcw-panel kcw-client-card" key={shift[0]}><div className="kcw-flex"><span className="kcw-square"><Icon name={shift[4]} /></span><div><h3>{shift[0]}</h3><span className="kcw-small kcw-muted">{shift[3]}</span></div></div><Values values={[["Jam masuk", `${shift[1]} WIB`], ["Jam pulang", `${shift[2]} WIB`]]} /><Button icon="arrow-up-right" onClick={() => setModal({ kind: "shift", label: shift[0] })}>Detail aturan shift</Button></section>)}</div>{addedSchedules.map((label, index) => <Notice key={index} icon="calendar-days">Jadwal baru: {label}</Notice>)}<Panel title="Jadwal karyawan · 24 Oktober"><div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th><th>Lokasi kerja</th><th>Jam kerja</th></tr></thead><tbody>{employees.slice(0, 4).map(employee => <tr key={employee.id}><td>{person(employee)}</td><td>{employee.location}</td><td>{employee.shift} WIB</td></tr>)}</tbody></table></div></Panel></>;
  }
  function configPage() {
    return <><Title title="Konfigurasi absensi" description="Atur validasi berdasarkan lokasi kerja." action={<Button variant="gold" icon="qr-code" onClick={() => navigate("qr")}>Tampilkan QR</Button>} /><Notice>Seluruh nilai bersifat ilustratif. Radius, akurasi GPS, interval QR, dan toleransi waktu perlu ditetapkan perusahaan.</Notice><Panel title={`${qrLocation} · ${qrCompany}`} action={<Pill tone="gold">Contoh konfigurasi</Pill>}><form className="kcw-panel-body kcw-stack" onSubmit={event => { event.preventDefault(); onNotify(`Konfigurasi contoh ${qrLocation} tersimpan untuk sesi ini.`); }}><div className="kcw-formgrid"><Field label="Lokasi kerja"><select value={qrLocation} onChange={event => setQrLocation(event.target.value)}><option>Gedung A</option><option>Gedung B</option></select></Field><Field label="Radius area (meter)" hint="Contoh batas area absensi."><input type="number" min="1" defaultValue="100" required /></Field><Field label="Ambang akurasi GPS (meter)"><input type="number" min="1" defaultValue="30" required /></Field><Field label="Pembaruan QR (detik)"><input type="number" min="5" defaultValue="30" required /></Field></div><div className="kcw-between"><span className="kcw-small kcw-muted">QR, lokasi, jadwal, dan duplikasi diperiksa saat scan.</span><Button type="submit" variant="gold">Simpan simulasi</Button></div></form></Panel><Panel title="Aturan pencatatan"><div className="kcw-panel-body kcw-stack"><div className="kcw-flex"><Icon name="scan-line" />Masuk / pulang mengikuti jadwal dan catatan shift.</div><div className="kcw-flex"><Icon name="shield-check" />Scan berulang setelah masuk tidak langsung menjadi pulang.</div><div className="kcw-flex"><Icon name="map-pin" />Lokasi diperiksa hanya ketika melakukan absensi.</div></div></Panel></>;
  }
  function monitoringPage() {
    const list = scopedEmployees.filter(employee => (companyFilter === "all" || employee.client === companyFilter) && (statusFilter === "all" || employee.status === statusFilter) && `${employee.name} ${employee.id}`.toLowerCase().includes(search.toLowerCase()));
    return <><Title title="Monitoring kehadiran" description={isPIC ? "Kehadiran karyawan PT Sentra Mandiri." : "Pantau kehadiran pada seluruh penempatan."} action={<Button icon="file-spreadsheet" onClick={() => navigate("reports")}>Lihat rekap</Button>} /><div className="kcw-toolbar"><div className="kcw-search"><Icon name="search" /><input aria-label="Cari nama di monitoring" placeholder="Cari karyawan…" value={search} onChange={event => setSearch(event.target.value)} /></div><input type="date" aria-label="Tanggal monitoring" value={dateFilter} onChange={event => setDateFilter(event.target.value)} />{!isPIC && <select aria-label="Filter perusahaan" value={companyFilter} onChange={event => setCompanyFilter(event.target.value)}><option value="all">Semua perusahaan</option>{companies.map(company => <option key={company.id}>{company.name}</option>)}</select>}<select aria-label="Filter status kehadiran" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Semua status</option>{["Tepat waktu", "Terlambat", "Belum masuk"].map(status => <option key={status}>{status}</option>)}</select></div><Panel title="Catatan kehadiran">{dateFilter === "2026-10-24" ? attendanceTable(list, true) : <div className="kcw-empty">Belum ada data contoh untuk tanggal ini. Pilih 24 Oktober 2026 untuk mencoba monitoring.</div>}<div className="kcw-table-foot"><span>{dateFilter === "2026-10-24" ? list.length : 0} catatan contoh · WIB</span><span>{dateFilter ? formatDate(dateFilter) : "Pilih tanggal"}</span></div></Panel><div className="kcw-grid-two"><Panel title="Status akhir shift"><div className="kcw-panel-body"><div className="kcw-between"><span className="kcw-muted">Belum masuk</span><strong>{isPIC ? 4 : 16} orang</strong></div><div className="kcw-divider" /><div className="kcw-between"><span className="kcw-muted">Belum pulang</span><strong>{isPIC ? 44 : 112} orang</strong></div><p className="kcw-sublabel">Ringkasan dari data contoh 24 Oktober.</p></div></Panel><Panel title="Validasi absensi"><div className="kcw-panel-body kcw-stack"><div className="kcw-flex"><Icon name="qr-code" />QR aktif sesuai lokasi</div><div className="kcw-flex"><Icon name="map-pin" />Lokasi dan akurasi diperiksa</div><div className="kcw-flex"><Icon name="calendar-clock" />Sesuai jadwal dan catatan shift</div></div></Panel></div></>;
  }
  function correctionsPage() {
    return <><Title title={isPIC ? "Verifikasi koreksi" : "Koreksi kehadiran"} description={isPIC ? "Periksa pengajuan karyawan di perusahaan Anda." : "Pantau pengajuan dan jejak keputusan PIC."} />{!isPIC && <Notice icon="eye">Keputusan koreksi diberikan oleh PIC perusahaan terkait. Admin dapat memantau status dan riwayatnya.</Notice>}<Panel title={isPIC ? "Pengajuan perusahaan Anda" : "Daftar pengajuan"}><div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th><th>Tanggal kerja</th><th>Jenis koreksi</th><th>Status</th><th><span className="sr-only">Tindakan</span></th></tr></thead><tbody>{scopedCorrections.map(correction => <tr key={correction.id}><td>{person(employees.find(employee => employee.id === correction.employeeId)!)}</td><td>{formatDate(correction.date)}</td><td>{correction.type}</td><td><Status value={correction.status} /></td><td><Button variant="quiet" icon="arrow-up-right" onClick={() => setModal({ kind: "correction", id: correction.id })}>{canDecide && correction.status === "Menunggu" ? "Periksa" : "Detail"}</Button></td></tr>)}</tbody></table></div><div className="kcw-table-foot">{isPIC ? "Pengajuan dibatasi ke PT Sentra Mandiri." : `${scopedCorrections.length} pengajuan contoh ditampilkan.`}</div></Panel><Panel title="Alur koreksi"><div className="kcw-panel-body"><div className="kcw-timeline">{[["file-pen-line", "Karyawan mengajukan koreksi", "Tanggal kerja, jenis, waktu, dan alasan."], ["clipboard-check", "PIC memeriksa dan memberi keputusan", "Persetujuan atau penolakan disertai catatan."], ["history", "Catatan asal dan keputusan tetap tersimpan", "Status dapat dilihat oleh karyawan dan Admin."]].map(([icon, heading, text]) => <div className="kcw-timeline-item" key={heading}><span className="kcw-timeline-icon"><Icon name={icon} /></span><div><p>{heading}</p><small>{text}</small></div></div>)}</div></div></Panel></>;
  }
  function reportsPage() {
    const list = scopedEmployees.filter(employee => isPIC || reportCompany === "all" || employee.client === reportCompany);
    return <><Title title={isPIC ? "Rekap kehadiran" : "Laporan kehadiran"} description={isPIC ? "Tinjau dan konfirmasi rekap PT Sentra Mandiri." : "Rekap kehadiran berdasarkan periode dan perusahaan."} action={<Button variant="gold" icon="download" onClick={() => setModal({ kind: "export" })}>Ekspor laporan</Button>} /><div className="kcw-toolbar"><Field label="Periode"><select value={reportPeriod} onChange={event => { setReportPeriod(event.target.value); setRecapConfirmed(false); }}><option value="2026-10">Oktober 2026</option><option value="2026-09">September 2026</option></select></Field>{!isPIC && <Field label="Perusahaan"><select value={reportCompany} onChange={event => setReportCompany(event.target.value)}><option value="all">Semua perusahaan</option>{companies.map(company => <option key={company.id}>{company.name}</option>)}</select></Field>}<Pill tone="gold">Rekap ilustratif untuk review UI</Pill></div><div className="kcw-metrics"><Metric label="Karyawan" value={isPIC ? 48 : reportCompany === "all" ? 128 : companies.find(company => company.name === reportCompany)?.employees ?? 0} sub="Dalam periode terpilih" icon="users" /><Metric label="Hari kerja tercatat" value={isPIC ? "1.152" : "3.072"} sub="Akumulasi hari per karyawan" icon="calendar-check" /><Metric label="Hari hadir" value={isPIC ? "1.098" : "2.928"} sub="Termasuk keterlambatan" icon="badge-check" positive /><Metric label="Koreksi disetujui" value={scopedCorrections.filter(correction => correction.status === "Disetujui").length} sub="Sudah ditinjau PIC" icon="clipboard-check" /></div><Panel title="Ringkasan per karyawan"><div className="kcw-tablewrap"><table className="kcw-table"><thead><tr><th>Karyawan</th><th>Hari kerja</th><th>Hadir</th><th>Terlambat</th><th>Tidak hadir</th></tr></thead><tbody>{list.map((employee, index) => <tr key={employee.id}><td>{person(employee)}</td><td>24</td><td>{[24, 23, 22, 24][index % 4]}</td><td>{[0, 1, 2, 0][index % 4]}</td><td>{[0, 1, 2, 0][index % 4]}</td></tr>)}</tbody></table></div></Panel>{isPIC ? <Notice icon={recapConfirmed ? "badge-check" : "file-check-2"}><div style={{ flex: 1 }}><strong>{recapConfirmed ? "Rekap sudah dikonfirmasi" : "Konfirmasi rekap perusahaan"}</strong><p className="kcw-small" style={{ marginTop: 4 }}>{recapConfirmed ? "Simulasi dikonfirmasi oleh Ratna Puspita." : "Periksa catatan kehadiran sebelum memberikan konfirmasi."}</p></div>{recapConfirmed ? <Status value="Dikonfirmasi" /> : <Button variant="gold" onClick={() => { setRecapConfirmed(true); onNotify("Rekap contoh PT Sentra Mandiri dikonfirmasi oleh PIC."); }}>Konfirmasi</Button>}</Notice> : <Notice icon="file-spreadsheet">Ekspor mengikuti periode dan perusahaan yang dipilih. Konfirmasi rekap dilakukan oleh PIC.</Notice>}</>;
  }
  function qrPage() {
    const cells = [];
    for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
      let dark = false; let finder = false;
      for (const [ox, oy] of [[1, 1], [17, 1], [1, 17]]) if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) { const a = x - ox; const b = y - oy; dark = a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); finder = true; }
      if (!finder) dark = ((x * 17 + y * 13 + x * y * 3 + qrRevision) % 11) < 5;
      cells.push(<span key={`${x}-${y}`} className={dark ? "is-dark" : undefined} />);
    }
    return <><Title title="Penampil QR" description="QR untuk lokasi yang ditugaskan pada perusahaan Anda." /><div className="kcw-qr-layout"><section className="kcw-qr-display"><div className="kcw-eyebrow" style={{ color: "var(--kcw-gold-dark)" }}>{qrCompany.toUpperCase()}</div><h2>{qrLocation} · {qrCity}</h2><p className="kcw-small kcw-muted">Pindai dari halaman absensi karyawan</p><div className="kcw-qr-code" role="img" aria-label="Ilustrasi QR untuk preview desain">{cells}</div><Pill tone="gold">QR demonstrasi</Pill><div className="kcw-qr-progress"><div className="kcw-track"><span style={{ width: "63%" }} /></div><p className="kcw-sublabel">Contoh masa berlaku: 30 detik</p></div><div style={{ marginTop: 18 }}><Button icon="refresh-cw" onClick={() => { setQrRevision(value => value + 1); onNotify("Ilustrasi QR diperbarui. Kode ini hanya untuk preview UI."); }}>Perbarui contoh QR</Button></div></section><div className="kcw-stack"><Panel title="Lokasi penampil"><div className="kcw-panel-body kcw-stack"><Field label="Lokasi"><select value={qrLocation} onChange={event => setQrLocation(event.target.value)}><option>Gedung A</option><option>Gedung B</option></select></Field><Values values={[["Perusahaan", qrCompany], ["Status lokasi", <Status key="active" value="Aktif" />]]} /></div></Panel><Notice icon="qr-code">QR ini hanya ilustrasi desain. QR produksi akan diperbarui berkala dan diperiksa oleh server.</Notice><Notice icon="scan-line">Karyawan langsung memindai setelah login. Tidak perlu memilih lokasi atau jenis absensi.</Notice></div></div></>;
  }
  function settingsPage() {
    return <><Title title={isPIC ? "Profil PIC" : "Pengaturan"} description={isPIC ? "Informasi akun dan cakupan perusahaan." : "Akun pengguna, hak akses, dan riwayat aktivitas."} /><Panel title="Informasi akun"><div className="kcw-panel-body"><div className="kcw-flex"><span className="kcw-avatar" style={{ width: 48, height: 48, fontSize: 14 }}>{isPIC ? "RP" : "AD"}</span><div><h3>{isPIC ? "Ratna Puspita" : "Admin Internal"}</h3><span className="kcw-small kcw-muted">{isPIC ? "PIC · PT Sentra Mandiri" : "Admin · PT Karunia Cipta Wasantara"}</span></div></div><div className="kcw-divider" /><Values values={[["Email", isPIC ? "ratna@example.com" : "admin@example.com"], ["Status akun", <Status key="active" value="Aktif" />], ["Cakupan akses", isPIC ? "PT Sentra Mandiri" : "Seluruh perusahaan"], ["Lokasi", isPIC ? "Gedung A dan B" : "8 lokasi kerja"]]} /></div></Panel>{!isPIC && <Panel title="Riwayat aktivitas"><div className="kcw-panel-body"><div className="kcw-timeline">{[["calendar-days", "Admin memperbarui jadwal", "Penjadwalan shift pagi · KCW-004.", "08.15 WIB"], ["clipboard-check", "PIC menyetujui koreksi", "PT Bina Karya · catatan asal tetap tersimpan.", "07.45 WIB"], ["map-pin", "Admin menambahkan penempatan", "PT Sentra Mandiri · Gedung A.", "23 Okt, 16.30"]].map(([icon, heading, description, time]) => <div className="kcw-timeline-item" key={heading}><span className="kcw-timeline-icon"><Icon name={icon} /></span><div><time>{time}</time><p>{heading}</p><small>{description}</small></div></div>)}</div></div></Panel>}<div><Button icon="log-out" onClick={onLogout}>Keluar dari akun</Button></div></>;
  }
  function modalContent(): { title: string; content: ReactNode } | null {
    if (!modal) return null;
    if (modal.kind === "person") return { title: "Detail karyawan", content: <><div className="kcw-flex"><span className="kcw-avatar" style={{ width: 47, height: 47, fontSize: 13 }}>{modal.employee.initial}</span><div><h2>{modal.employee.name}</h2><span className="kcw-small kcw-muted">{modal.employee.id} · {modal.employee.job}</span></div></div><Values values={[["Status akun", <Status key="active" value="Aktif" />], ["Perusahaan", modal.employee.client], ["Lokasi kerja", modal.employee.location], ["Shift", `${modal.employee.shift} WIB`], ["Penempatan", "01 Okt–31 Des 2026"], ["Masuk hari ini", modal.employee.checkIn]]} /><Notice icon="map-pin">Penempatan dan jadwal ini menjadi konteks otomatis pada halaman scan karyawan.</Notice></> };
    if (modal.kind === "correction") { const correction = corrections.find(item => item.id === modal.id); if (!correction) return null; return { title: canDecide ? "Periksa pengajuan koreksi" : "Detail pengajuan koreksi", content: <CorrectionReview key={correction.id} correction={correction} employee={employees.find(employee => employee.id === correction.employeeId)} canDecide={canDecide} onDecision={(status, note) => { if (!canDecide) return; onDecideCorrection(correction.id, status, note); setModal(null); onNotify(`Koreksi ${status.toLowerCase()} oleh Ratna Puspita. Catatan asal dipertahankan.`); }} /> }; }
    if (modal.kind === "client") return { title: modal.company.name, content: <><Values values={[["Kota", modal.company.city], ["Karyawan aktif", `${modal.company.employees} orang`], ["Lokasi kerja", `${modal.company.locations} lokasi`], ["Status", <Status key="active" value="Aktif" />]]} /><section className="kcw-history-item"><h3>Lokasi utama · {modal.company.city}</h3><p className="kcw-small kcw-muted">Titik kerja dan validasi area dikelola Admin.</p></section><Button variant="gold" icon="sliders-horizontal" onClick={() => { setConfiguredCompany(modal.company.name); setQrLocation("Gedung A"); navigate("config"); }}>Konfigurasi absensi</Button></> };
    if (modal.kind === "shift") return { title: `Aturan ${modal.label}`, content: <><Values values={[["Identitas shift", modal.label === "Shift Malam" ? "SHIFT-MALAM" : "SHIFT-PAGI"], ["Tanggal kerja", "Mengikuti awal shift"], ["Masuk / pulang", "Ditentukan otomatis"], ["Rentang absensi", "Konfigurasi perusahaan"]]} /><Notice icon="calendar-clock">Shift melewati tengah malam tetap menggunakan identitas shift dan tanggal kerja yang sama.</Notice></> };
    if (modal.kind === "export") return { title: "Ekspor laporan contoh", content: <><div className="kcw-flex"><span className="kcw-square"><Icon name="file-spreadsheet" /></span><div><h3>Rekap Kehadiran · {reportPeriod}</h3><p className="kcw-small kcw-muted">{isPIC ? "PT Sentra Mandiri" : reportCompany === "all" ? "Seluruh perusahaan" : reportCompany}</p></div></div><Notice>UI ini menyediakan unduhan CSV data contoh yang dapat dibuka di Excel. Ekspor .xlsx sesuai PRD akan ditambahkan saat integrasi backend.</Notice><div className="kcw-modal-actions"><Button variant="gold" icon="download" onClick={exportCSV}>Unduh CSV contoh</Button></div></> };
    if (modal.kind === "notifications") return { title: "Pemberitahuan", content: <div className="kcw-history-item"><h3>{pendingCount} koreksi menunggu keputusan</h3><p className="kcw-small kcw-muted">{isPIC ? "Pengajuan dari karyawan PT Sentra Mandiri." : "Keputusan diberikan oleh PIC perusahaan terkait."}</p><Button variant="gold" icon="arrow-right" onClick={() => navigate("corrections")}>Lihat pengajuan</Button></div> };
    if (modal.kind === "form") return { title: ({ employee: "Tambah karyawan", client: "Tambah perusahaan klien", assignment: "Penempatan baru", schedule: "Buat jadwal" })[modal.form], content: <form className="kcw-stack" onSubmit={submitForm}>{modal.form === "employee" ? <><Field label="Nama lengkap"><input name="name" required placeholder="Nama karyawan" /></Field><Field label="Email akun"><input name="email" type="email" required placeholder="nama@example.com" /></Field><Field label="Posisi kerja"><input name="job" required placeholder="Contoh: Security" /></Field><Field label="Perusahaan penempatan"><select name="client">{companies.map(company => <option key={company.id}>{company.name}</option>)}</select></Field></> : modal.form === "client" ? <><Field label="Nama perusahaan"><input name="name" required placeholder="PT …" /></Field><Field label="Kota"><input name="city" required placeholder="Kota penempatan" /></Field></> : <><Field label="Karyawan"><select name="employee">{employees.map(employee => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></Field><Field label={modal.form === "schedule" ? "Shift" : "Perusahaan"}><select name="choice">{(modal.form === "schedule" ? ["Shift Pagi · 08.00–16.00", "Shift Malam · 22.00–06.00"] : companies.map(company => company.name)).map(value => <option key={value}>{value}</option>)}</select></Field><Field label="Mulai berlaku"><input type="date" name="start" defaultValue="2026-10-24" required /></Field></>}<p className="kcw-small kcw-muted">Data disimpan sementara selama sesi demo ini.</p><div className="kcw-modal-actions"><Button onClick={() => setModal(null)}>Batal</Button><Button type="submit" variant="gold">Simpan data contoh</Button></div></form> };
    return null;
  }
  const content = ({ dashboard, employees: employeePage, clients: clientsPage, assignments: assignmentsPage, schedule: schedulePage, config: configPage, monitoring: monitoringPage, corrections: correctionsPage, reports: reportsPage, settings: settingsPage, qr: qrPage }[page])();
  const activeModal = modalContent();
  return <div className="kcw-shell">
    <aside className="kcw-sidebar" aria-label={`Navigasi ${isPIC ? "PIC" : "Admin"}`}><div className="kcw-brand"><div className="kcw-monogram" aria-hidden="true">K</div><div className="kcw-brand-text"><div className="kcw-brandname">KARUNIA CIPTA</div><span className="kcw-brand-sub">WASANTARA</span></div></div><div className="kcw-navgroup">{isPIC ? "PERUSAHAAN KLIEN" : "WORKFORCE MANAGEMENT"}</div><nav className="kcw-nav">{menus.map(([key, icon, label]) => <button type="button" key={key} aria-label={label} aria-current={page === key ? "page" : undefined} onClick={() => navigate(key)}><Icon name={icon} /><span className="kcw-nav-label">{label}</span>{key === "corrections" && pendingCount > 0 && <span className="kcw-count">{pendingCount}</span>}</button>)}</nav><div className="kcw-sidebar-foot"><div style={{ color: "#ead9ac", fontSize: 11, marginBottom: 5 }}>Satu sistem. Lebih teratur.</div>PT Karunia Cipta Wasantara<br />© 2026</div></aside>
    <div className="kcw-workspace"><header className="kcw-topbar"><div><div className="kcw-crumb">{isPIC ? "PT Sentra Mandiri" : "Ruang kerja admin"} / {title}</div><div className="kcw-top-title">{title}</div></div><div className="kcw-account"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><IconButton icon="bell" label="Buka pemberitahuan" onClick={() => setModal({ kind: "notifications" })} /><span className="kcw-avatar">{isPIC ? "RP" : "AD"}</span><div className="kcw-account-meta">{isPIC ? "Ratna Puspita" : "Admin Internal"}<span>{isPIC ? "PIC Perusahaan" : "PT Karunia Cipta Wasantara"}</span></div></div></header><main className="kcw-main" id="kcw-main">{content}</main></div>
    {activeModal && <Modal title={activeModal.title} onClose={() => setModal(null)}>{activeModal.content}</Modal>}
  </div>;
}
