"use client";

import { useState, type FormEvent } from "react";
import { Button, Icon, Modal, Notice, Pill, ThemeToggle } from "@/components/ui";
import { formatDate, type Correction, type CorrectionType, type Employee, type NewCorrection, type Theme } from "@/lib/model";

export interface EmployeePortalProps {
  employee: Employee;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  corrections: Correction[];
  onSubmitCorrection: (request: NewCorrection) => void;
  onNotify: (message: string) => void;
}

type Tab = "scan" | "history" | "corrections" | "profile";
type Scenario = "success" | "checkout" | "duplicate" | "expired" | "outside" | "accuracy" | "inactive" | "network" | "complete" | "night";
interface ShiftRecord { checkIn: string; checkOut: string }

const SCENARIOS: ReadonlyArray<{ value: Scenario; label: string }> = [
  { value: "success", label: "Masuk berhasil" },
  { value: "checkout", label: "Pulang berhasil" },
  { value: "duplicate", label: "Scan berulang" },
  { value: "expired", label: "QR kedaluwarsa" },
  { value: "outside", label: "Di luar radius" },
  { value: "accuracy", label: "Akurasi GPS rendah" },
  { value: "inactive", label: "Jadwal tidak aktif" },
  { value: "network", label: "Jaringan terputus" },
  { value: "complete", label: "Shift sudah lengkap" },
  { value: "night", label: "Shift lintas malam" },
];

const RESULTS: Record<Scenario, { title: string; message: string; outcome: "success" | "info" | "error"; time?: string }> = {
  success: { title: "Absensi masuk berhasil", message: "Kehadiranmu telah tercatat untuk shift pagi pada simulasi ini.", outcome: "success", time: "07.52" },
  checkout: { title: "Absensi pulang berhasil", message: "Shift hari ini selesai. Terima kasih sudah bekerja dengan baik.", outcome: "success", time: "16.03" },
  duplicate: { title: "Masuk sudah tercatat", message: "Kamu sudah absen masuk pukul 07.52. Scan ulang belum dapat mencatat pulang sebelum rentang waktunya.", outcome: "info" },
  expired: { title: "QR sudah kedaluwarsa", message: "Pindai QR terbaru pada penampil di lokasi kerja. Kehadiran belum dicatat.", outcome: "error" },
  outside: { title: "Di luar area kerja", message: "Lokasimu belum berada di area absensi yang ditentukan. Kehadiran belum dicatat.", outcome: "error" },
  accuracy: { title: "Lokasi belum akurat", message: "Aktifkan lokasi presisi dan coba di area terbuka. Kehadiran belum dicatat.", outcome: "error" },
  inactive: { title: "Jadwal tidak aktif", message: "Tidak ada penempatan atau jadwal aktif untuk saat ini. Hubungi PIC untuk memeriksa data.", outcome: "error" },
  network: { title: "Koneksi terputus", message: "Pencatatan belum dapat dikonfirmasi. Periksa koneksi dan coba kembali.", outcome: "error" },
  complete: { title: "Absensi shift sudah lengkap", message: "Masuk dan pulang untuk shift ini telah tercatat. Tidak ada catatan tambahan.", outcome: "info" },
  night: { title: "Absensi pulang berhasil", message: "Pulang pada 25 Oktober tetap terhubung ke shift malam tanggal kerja 24 Oktober.", outcome: "success", time: "06.02" },
};

function fixtureFor(scenario: Scenario): ShiftRecord {
  return {
    checkIn: ["checkout", "duplicate", "complete"].includes(scenario) ? "07.52" : scenario === "night" ? "21.55" : "—",
    checkOut: scenario === "complete" ? "16.03" : "—",
  };
}

function displayTime(time: string) { return time.replace(":", "."); }

export default function EmployeePortal({ employee, theme, onToggleTheme, onLogout, corrections, onSubmitCorrection, onNotify }: EmployeePortalProps) {
  const [tab, setTab] = useState<Tab>("scan");
  const [scenario, setScenario] = useState<Scenario>("success");
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState<Scenario | null>(null);
  const [record, setRecord] = useState<ShiftRecord>({ checkIn: "—", checkOut: "—" });
  const [request, setRequest] = useState<NewCorrection>({ date: "2026-10-23", type: "Jam pulang", requestedTime: "16:00", reason: "" });
  const [submitted, setSubmitted] = useState<NewCorrection | null>(null);
  const [formError, setFormError] = useState("");
  const ownCorrections = corrections.filter((correction) => correction.employeeId === employee.id);
  const nightShift = scenario === "night";
  const shiftStatus = record.checkOut !== "—" ? "Selesai" : record.checkIn !== "—" ? "Sudah masuk" : "Belum tercatat";
  const firstName = employee.name.split(" ")[0];

  function changeScenario(next: Scenario) {
    setScenario(next);
    setRecord(fixtureFor(next));
    setResult(null);
  }

  function simulateScan() {
    setTab("scan");
    setResult(scenario);
    if (["success", "duplicate", "checkout", "complete", "night"].includes(scenario)) {
      setRecord({
        checkIn: scenario === "night" ? "21.55" : "07.52",
        checkOut: ["checkout", "complete"].includes(scenario) ? "16.03" : scenario === "night" ? "06.02" : "—",
      });
    }
  }

  function openCorrection(date = "2026-10-23") {
    setRequest((previous) => ({ ...previous, date }));
    setTab("corrections");
    setFormError("");
  }

  function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.reason.trim()) {
      setFormError("Tuliskan alasan koreksi terlebih dahulu.");
      return;
    }
    const cleanRequest = { ...request, reason: request.reason.trim() };
    onSubmitCorrection(cleanRequest);
    setSubmitted(cleanRequest);
    setRequest((previous) => ({ ...previous, reason: "" }));
    setFormError("");
  }

  function shiftDetails() {
    return (
      <div className="kcw-placement">
        <span className="kcw-square" style={{ width: 34, height: 34 }}><Icon name="building-2" /></span>
        <div>
          <p>{employee.client}</p>
          <small>{employee.location}</small>
          <small>{nightShift ? "Shift malam · 22.00–06.00 WIB" : `Shift pagi · ${employee.shift} WIB`}</small>
        </div>
      </div>
    );
  }

  function scanScreen() {
    const outcome = result ? RESULTS[result] : null;
    return (
      <>
        <div>
          <div className="kcw-phone-greeting">{nightShift ? "Tanggal kerja: Sabtu, 24 Oktober 2026" : "Sabtu, 24 Oktober 2026"}</div>
          <h1>{result ? "Status absensi" : `Halo, ${firstName} 👋`}</h1>
          <p className="kcw-small kcw-muted" style={{ marginTop: 6 }}>{result ? "Hasil pemindaian QR di lokasi kerja." : "Pindai QR di lokasi untuk mencatat kehadiran."}</p>
        </div>
        {shiftDetails()}
        {outcome ? (
          <section className="kcw-result" aria-live="polite" aria-atomic="true">
            <span className={`kcw-result-icon ${outcome.outcome === "error" ? "kcw-error" : ""}`}>
              <Icon name={outcome.outcome === "success" ? "check" : outcome.outcome === "info" ? "info" : "triangle-alert"} />
            </span>
            <div><h2>{outcome.title}</h2><p style={{ marginTop: 9 }}>{outcome.message}</p></div>
            {outcome.time && (
              <div>
                <div className="kcw-result-time">{outcome.time}<span style={{ fontSize: 12, letterSpacing: 0, marginLeft: 5 }}>WIB</span></div>
                <p style={{ marginTop: 5 }}>{nightShift ? "25 Oktober 2026 · tanggal kerja 24 Oktober" : "24 Oktober 2026"}</p>
              </div>
            )}
            {outcome.outcome === "success" && <Pill tone="green">Lokasi dan QR valid · simulasi</Pill>}
            <div className="kcw-small kcw-muted">Hasil simulasi · tidak ada absensi nyata yang disimpan</div>
            <Button variant="gold" onClick={() => { setResult(null); setCameraActive(true); }}>{outcome.outcome === "error" ? "Coba lagi" : "Kembali ke scan"}</Button>
            {outcome.outcome === "error" && <Button variant="quiet" onClick={() => openCorrection("2026-10-24")}>Ajukan koreksi</Button>}
          </section>
        ) : (
          <>
            <div className="kcw-scanner" aria-label={cameraActive ? "Pemindai kamera simulasi siap" : "Kamera simulasi belum aktif"}>
              <div className="kcw-scanner-grid" aria-hidden="true" />
              <div className="kcw-scan-frame" aria-hidden="true">{[0, 1, 2, 3].map((corner) => <span className="kcw-scan-corner" key={corner} />)}</div>
              {cameraActive && <div className="kcw-scan-line" aria-hidden="true" />}
              <div className={`kcw-scanner-content ${cameraActive ? "kcw-scan-active" : ""}`}>
                {!cameraActive && <Icon name="camera" />}
                <p>{cameraActive ? "Arahkan kamera ke QR yang ditampilkan di lokasi." : "Kamera siap diaktifkan untuk memindai QR."}</p>
                {cameraActive ? <Pill tone="gold">Menunggu QR contoh</Pill> : (
                  <Button variant="gold" icon="camera" onClick={() => { setCameraActive(true); onNotify("Kamera simulasi aktif. Gunakan tombol Simulasikan pemindaian untuk mencoba hasil scan."); }}>Aktifkan Kamera</Button>
                )}
              </div>
            </div>
            <div className="kcw-phone-note"><Icon name="shield-check" /><span>Lokasi diperiksa saat absensi. Jenis masuk atau pulang ditentukan otomatis sesuai jadwal.</span></div>
            <div>
              <div className="kcw-between" style={{ marginBottom: 10 }}>
                <h3 style={{ fontSize: 12 }}>Kehadiran {nightShift ? "shift ini" : "hari ini"}</h3>
                <Pill tone={record.checkIn === "—" ? "neutral" : "green"}>{shiftStatus}</Pill>
              </div>
              <div className="kcw-today" aria-label="Catatan kehadiran shift aktif">
                <div className="kcw-today-item"><span>Masuk</span><strong>{record.checkIn}</strong></div>
                <div className="kcw-today-item"><span>Pulang</span><strong>{record.checkOut}</strong></div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  function historyScreen() {
    const history = [
      ...(record.checkIn !== "—" ? [{ date: "2026-10-24", checkIn: record.checkIn, checkOut: record.checkOut, status: record.checkOut === "—" ? "Sedang bekerja" : "Selesai", correction: false }] : []),
      { date: "2026-10-23", checkIn: "07.55", checkOut: "—", status: "Perlu koreksi", correction: true },
      { date: "2026-10-22", checkIn: "07.52", checkOut: "16.04", status: "Tepat waktu", correction: false },
      { date: "2026-10-21", checkIn: "07.48", checkOut: "16.01", status: "Tepat waktu", correction: false },
    ];
    return (
      <>
        <div><h1>Riwayat kehadiran</h1><p className="kcw-small kcw-muted" style={{ marginTop: 6 }}>Catatan pribadi · Oktober 2026</p></div>
        {history.map((item) => (
          <section className="kcw-history-item" key={item.date}>
            <div className="kcw-between"><strong style={{ fontSize: 12 }}>{formatDate(item.date)}</strong><Pill tone={item.correction ? "gold" : "green"}>{item.status}</Pill></div>
            <dl className="kcw-kv"><div><dt>Masuk</dt><dd>{item.checkIn}</dd></div><div><dt>Pulang</dt><dd>{item.checkOut}</dd></div></dl>
            {item.date === "2026-10-24" && nightShift && <p className="kcw-small kcw-muted">Shift malam · pulang pada 25 Oktober</p>}
            {item.correction && <Button variant="quiet" icon="file-pen-line" onClick={() => openCorrection(item.date)}>Ajukan koreksi</Button>}
          </section>
        ))}
      </>
    );
  }

  function correctionScreen() {
    return (
      <>
        <div><h1>Pengajuan koreksi</h1><p className="kcw-small kcw-muted" style={{ marginTop: 6 }}>Pengajuan akan diperiksa PIC perusahaan.</p></div>
        <form className="kcw-stack" onSubmit={submitCorrection}>
          <div className="kcw-field"><label htmlFor="employee-correction-date">Tanggal kerja</label><input id="employee-correction-date" type="date" value={request.date} max="2026-10-24" onChange={(event) => setRequest({ ...request, date: event.target.value })} required /></div>
          <div className="kcw-field"><label htmlFor="employee-correction-type">Jenis koreksi</label><select id="employee-correction-type" value={request.type} onChange={(event) => setRequest({ ...request, type: event.target.value as CorrectionType })}><option>Jam pulang</option><option>Jam masuk</option></select></div>
          <div className="kcw-field"><label htmlFor="employee-correction-time">Waktu yang diajukan</label><input id="employee-correction-time" type="time" value={request.requestedTime} onChange={(event) => setRequest({ ...request, requestedTime: event.target.value })} required /></div>
          <div className="kcw-field"><label htmlFor="employee-correction-reason">Alasan koreksi</label><textarea id="employee-correction-reason" rows={3} placeholder="Jelaskan kendala yang kamu alami…" value={request.reason} onChange={(event) => setRequest({ ...request, reason: event.target.value })} aria-describedby={formError ? "employee-correction-error" : undefined} required /></div>
          {formError && <p className="kcw-alert" id="employee-correction-error" role="alert">{formError}</p>}
          <Button type="submit" variant="gold" icon="send">Kirim pengajuan</Button>
        </form>
        <div className="kcw-phone-note"><Icon name="info" /><span>Catatan asal tetap tersimpan. Perubahan berlaku setelah disetujui PIC.</span></div>
        <div className="kcw-between"><h3>Pengajuan saya</h3><Pill>{ownCorrections.length} pengajuan</Pill></div>
        {ownCorrections.length === 0 ? <Notice>Belum ada pengajuan koreksi. Pengajuanmu akan tampil di sini.</Notice> : ownCorrections.map((correction) => (
          <section className="kcw-history-item" key={correction.id}>
            <div className="kcw-between"><strong style={{ fontSize: 12 }}>{correction.type}</strong><Pill tone={correction.status === "Disetujui" ? "green" : correction.status === "Ditolak" ? "red" : "gold"}>{correction.status === "Menunggu" ? "Menunggu verifikasi" : correction.status}</Pill></div>
            <p className="kcw-small kcw-muted">{formatDate(correction.date)} · {displayTime(correction.requestedTime)} WIB</p>
            <p className="kcw-small">{correction.reason}</p>
            {correction.note ? <p className="kcw-small kcw-muted">Catatan PIC: {correction.note}</p> : <p className="kcw-small kcw-muted">Menunggu pemeriksaan PIC {employee.client}.</p>}
          </section>
        ))}
      </>
    );
  }

  function profileScreen() {
    return (
      <>
        <div><h1>Profil saya</h1><p className="kcw-small kcw-muted" style={{ marginTop: 6 }}>Identitas dan penempatan aktif.</p></div>
        <section className="kcw-history-item">
          <div className="kcw-flex"><span className="kcw-avatar" style={{ width: 45, height: 45, fontSize: 14 }}>{employee.initial}</span><div><h3>{employee.name}</h3><span className="kcw-small kcw-muted">{employee.id} · {employee.job}</span></div></div>
          <Pill tone="green">Aktif</Pill>
        </section>
        <section className="kcw-history-item"><dl className="kcw-kv">
          <div><dt>Perusahaan</dt><dd>{employee.client}</dd></div><div><dt>Lokasi kerja</dt><dd>{employee.location}</dd></div>
          <div><dt>Shift</dt><dd>Pagi</dd></div><div><dt>Jam kerja</dt><dd>{employee.shift} WIB</dd></div>
          <div><dt>Periode penempatan</dt><dd>01 Okt–31 Des 2026</dd></div><div><dt>Email</dt><dd>andi@example.com</dd></div>
        </dl></section>
        <div className="kcw-phone-note"><Icon name="badge-check" /><span>Penempatan dan jadwal dikelola Admin. Hubungi PIC jika informasi perlu diperbarui.</span></div>
        <Button icon="log-out" onClick={onLogout}>Keluar</Button>
      </>
    );
  }

  return (
    <>
      <div className="kcw-scenario" role="group" aria-label="Kontrol simulasi untuk preview UI">
        <label htmlFor="employee-demo-scenario">Uji hasil scan:</label>
        <select id="employee-demo-scenario" value={scenario} onChange={(event) => changeScenario(event.target.value as Scenario)}>{SCENARIOS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
        <Button icon="scan-line" onClick={simulateScan}>Simulasikan pemindaian</Button>
        <span className="kcw-muted kcw-small">Kontrol demo · tanpa akses kamera atau GPS perangkat</span>
      </div>
      <div className="kcw-employee-stage">
        <div className="kcw-phone">
          <header className="kcw-phone-head">
            <div className="kcw-flex"><span className="kcw-monogram" aria-hidden="true">K</span><div><div className="kcw-brandname">Karunia Cipta Wasantara</div><span className="kcw-small kcw-muted">PORTAL KARYAWAN</span></div></div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </header>
          <main className="kcw-phone-body" id="employee-content">
            {tab === "scan" ? scanScreen() : tab === "history" ? historyScreen() : tab === "corrections" ? correctionScreen() : profileScreen()}
          </main>
          <nav className="kcw-bottomnav" aria-label="Navigasi karyawan">
            {([
              { key: "scan", icon: "scan-line", label: "Scan QR" },
              { key: "history", icon: "history", label: "Riwayat" },
              { key: "corrections", icon: "file-pen-line", label: "Koreksi" },
              { key: "profile", icon: "user-round", label: "Profil" },
            ] as const).map((item) => <button type="button" key={item.key} onClick={() => setTab(item.key)} aria-current={tab === item.key ? "page" : undefined}><Icon name={item.icon} />{item.label}</button>)}
          </nav>
        </div>
      </div>
      {submitted && <Modal title="Pengajuan terkirim" onClose={() => setSubmitted(null)}>
        <Pill tone="gold">Menunggu verifikasi</Pill>
        <h3>{submitted.type} · {formatDate(submitted.date)}</h3>
        <p className="kcw-small kcw-muted">Waktu yang diajukan: {displayTime(submitted.requestedTime)} WIB</p>
        <p>{submitted.reason}</p>
        <Notice icon="clipboard-check">Simulasi pengajuan diteruskan ke PIC {employee.client}. Catatan absensi belum diubah.</Notice>
        <div className="kcw-modal-actions"><Button variant="gold" onClick={() => setSubmitted(null)}>Selesai</Button></div>
      </Modal>}
    </>
  );
}
