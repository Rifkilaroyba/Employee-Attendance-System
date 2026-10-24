"use client";

import { useEffect, useRef, useState } from "react";
import AdminWorkspace from "@/components/admin-workspace";
import EmployeePortal from "@/components/employee-portal";
import LoginScreen, { type AuthView } from "@/components/login-screen";
import { Icon, IconButton, ThemeToggle } from "@/components/ui";
import { authenticateDemoAccount, canAccessView, resolveView } from "@/lib/access";
import { INITIAL_CORRECTIONS, INITIAL_EMPLOYEES, type Correction, type Employee, type NewCorrection, type PreviewRole, type Role, type Theme } from "@/lib/model";

export default function AttendanceApp() {
  const [requestedRole, setRequestedRole] = useState<PreviewRole>("login");
  const [sessionRole, setSessionRole] = useState<Role | null>(null);
  const role = resolveView(sessionRole, requestedRole);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [corrections, setCorrections] = useState<Correction[]>(INITIAL_CORRECTIONS);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    setMounted(true);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function notify(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  }
  function login(email: string, password: string): boolean {
    const accountRole = authenticateDemoAccount(email, password);
    if (!accountRole) return false;
    setSessionRole(accountRole);
    setRequestedRole(accountRole);
    setToast(null);
    return true;
  }
  function logout() {
    setSessionRole(null);
    setRequestedRole("login");
    setAuthView("login");
    setToast(null);
  }
  function switchRole(next: Role) {
    if (!canAccessView(sessionRole, next)) {
      notify("Halaman ini tidak tersedia untuk akun Anda.");
      return;
    }
    setRequestedRole(next);
    setToast(null);
  }
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem("kcw-theme", next); } catch { /* Preference remains available for this visit. */ }
  }
  function submitCorrection(request: NewCorrection) {
    if (role !== "employee" || !canAccessView(sessionRole, "employee")) return;
    const correction: Correction = { ...request, id: `COR-${crypto.randomUUID()}`, employeeId: "KCW-001", originalTime: "—", status: "Menunggu" };
    setCorrections(previous => [correction, ...previous]);
  }
  function decideCorrection(id: string, status: "Disetujui" | "Ditolak", note: string) {
    if (sessionRole !== "pic" || role !== "pic" || !note.trim()) return;
    setCorrections(previous => previous.map(correction => {
      const employee = employees.find(person => person.id === correction.employeeId);
      return correction.id === id && employee?.client === "PT Sentra Mandiri" && correction.status === "Menunggu" ? { ...correction, status, note: note.trim(), decidedBy: "Ratna Puspita · PT Sentra Mandiri" } : correction;
    }));
  }

  return <div id="kcw-preview" data-view={role} data-auth-view={authView}>
    <a className="kcw-skip-link" href="#kcw-content">Lewati ke isi halaman</a>
    <div className="kcw-previewbar">
      {role === "login" ? <nav className="kcw-rolebar kcw-auth-nav" aria-label="Akses akun">
        <button type="button" onClick={() => setAuthView("register")} aria-current={authView === "register" ? "page" : undefined}>Daftar Akun</button>
        <button type="button" onClick={() => setAuthView("login")} aria-current={authView !== "register" ? "page" : undefined}>Login</button>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </nav> : <>
        <span className="kcw-small kcw-muted">Masuk sebagai {sessionRole === "admin" ? "Admin" : sessionRole === "pic" ? "PIC" : "Karyawan"}</span>
        <div className="kcw-rolebar" role="group" aria-label="Menu akun">
        {sessionRole === "admin" && ([['admin', 'Admin'], ['pic', 'PIC'], ['employee', 'Karyawan']] as const).map(([value, label]) => <button key={value} type="button" data-role={value} onClick={() => switchRole(value)} aria-pressed={role === value}>{label}</button>)}
        <button type="button" onClick={logout}>Keluar</button>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </>}
    </div>
    <div className="kcw-window" id="kcw-content" data-theme={mounted ? theme : undefined} style={mounted ? { colorScheme: theme } : undefined}>
      {role === "login" ? <LoginScreen view={authView} onChangeView={setAuthView} theme={theme} onToggleTheme={toggleTheme} onLogin={login} /> : role === "employee" ? <EmployeePortal employee={employees[0]} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} corrections={corrections} onSubmitCorrection={submitCorrection} onNotify={notify} /> : <AdminWorkspace key={role} role={role} canDecideCorrections={sessionRole === "pic"} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} employees={employees} onAddEmployee={employee => { if (sessionRole === "admin" && role === "admin") setEmployees(previous => [...previous, employee]); }} corrections={corrections} onDecideCorrection={decideCorrection} onNotify={notify} />}
      {toast && <div className="kcw-toast" role="status"><span className="kcw-flex"><Icon name="info" /><span>{toast}</span></span><IconButton icon="x" label="Tutup pemberitahuan" onClick={() => setToast(null)} /></div>}
    </div>
    {role !== "login" && <footer className="kcw-site-footer"><span>© 2026 PT Karunia Cipta Wasantara</span></footer>}
  </div>;
}
