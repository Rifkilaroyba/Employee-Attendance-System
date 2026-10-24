"use client";

import { useState, type FormEvent } from "react";
import { Button, Icon, IconButton, Modal, Pill, ThemeToggle } from "@/components/ui";
import type { Theme } from "@/lib/model";

export type AuthView = "login" | "register" | "forgot-password";

export default function LoginScreen({ theme, onToggleTheme, onLogin, view, onChangeView }: {
  theme: Theme;
  onToggleTheme: () => void;
  onLogin: (email: string, password: string) => boolean;
  view: AuthView;
  onChangeView: (view: AuthView) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registration, setRegistration] = useState({ fullName: "", employeeId: "", email: "", password: "" });
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySentTo, setRecoverySentTo] = useState("");

  const titles: Record<AuthView, { heading: string; welcome: string }> = {
    login: { heading: "Masuk ke sistem", welcome: "Selamat datang kembali. Silakan masuk." },
    register: { heading: "Buat akun baru", welcome: "Lengkapi informasi akun karyawan Anda." },
    "forgot-password": { heading: "Lupa kata sandi?", welcome: "Masukkan email akun untuk melihat alur pemulihan." },
  };

  function changeView(next: AuthView) {
    setShowPassword(false);
    setShowRegistrationPassword(false);
    setRegistrationError("");
    setLoginError("");
    if (next === "forgot-password") {
      setRecoveryEmail(email);
      setRecoverySentTo("");
    }
    onChangeView(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    if (!onLogin(email, password)) {
      setLoginError("Email atau kata sandi tidak cocok. Periksa kembali email dan kata sandi Anda.");
      return;
    }
    setPassword("");
  }

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registration.fullName.trim() || !registration.employeeId.trim()) {
      setRegistrationError("Isi nama lengkap dan ID karyawan dengan benar.");
      return;
    }
    const account = registration.email.trim().toLowerCase();
    setEmail(account);
    setRegisteredEmail(account);
    setPassword("");
    setLoginError("");
    setRegistration({ fullName: "", employeeId: "", email: "", password: "" });
    setShowRegistrationPassword(false);
    setRegistrationError("");
    onChangeView("login");
  }

  function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverySentTo(recoveryEmail.trim().toLowerCase());
  }

  return <main className="kcw-login">
    <section className="kcw-login-story" aria-label="Sistem monitoring karyawan">
      <div className="kcw-eyebrow"><span className="kcw-dot" /> SISTEM MONITORING KARYAWAN</div>
      <div className="kcw-monogram" aria-hidden="true">K</div>
      <h1>Kehadiran terpantau.<br />Kerja lebih <span>teratur.</span></h1>
      <p>Satukan penempatan, absensi, dan laporan karyawan dalam satu ruang kerja PT Karunia Cipta Wasantara.</p>
      <div className="kcw-login-tags"><Pill tone="gold">Terpusat</Pill><Pill tone="gold">Terpantau</Pill><Pill tone="gold">Tercatat</Pill></div>
    </section>
    <div className="kcw-login-right">
      <section className={`kcw-login-card kcw-auth-card kcw-auth-card-${view}`} aria-labelledby="login-heading">
        <div>
          <div className="kcw-eyebrow">PT KARUNIA CIPTA WASANTARA</div>
          <div className="kcw-login-title"><h2 id="login-heading">{titles[view].heading}</h2><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
          <p className="kcw-small kcw-muted kcw-login-welcome">{titles[view].welcome}</p>
        </div>
        {view === "login" && <>
          <form className="kcw-login-form kcw-auth-form" onSubmit={submit}>
            <label className="kcw-field"><span>Email</span><input type="email" autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@perusahaan.com" required /></label>
            <label className="kcw-field"><span>Kata sandi</span><div className="kcw-password"><input type={showPassword ? "text" : "password"} autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} placeholder="Masukkan kata sandi" required /><IconButton icon={showPassword ? "eye-off" : "eye"} label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} /></div></label>
            <div className="kcw-auth-row"><label className="kcw-flex kcw-small kcw-muted kcw-remember"><input type="checkbox" /> Ingat saya</label><button type="button" className="kcw-link kcw-auth-link" onClick={() => changeView("forgot-password")}>Lupa password?</button></div>
            <Button type="submit" variant="gold">Masuk <Icon name="arrow-right" /></Button>
          </form>
          <div className="kcw-auth-secondary"><span className="kcw-small kcw-muted">Belum punya akun?</span> <button type="button" className="kcw-link kcw-auth-link" onClick={() => changeView("register")}>Daftar akun</button></div>
        </>}
        {view === "register" && <>
          <form className="kcw-login-form kcw-auth-form" onSubmit={submitRegistration}>
            <label className="kcw-field"><span>Nama lengkap</span><input type="text" autoComplete="off" value={registration.fullName} onChange={event => setRegistration({ ...registration, fullName: event.target.value })} placeholder="Nama sesuai data karyawan" maxLength={100} required /></label>
            <label className="kcw-field"><span>ID karyawan</span><input type="text" autoComplete="off" value={registration.employeeId} onChange={event => setRegistration({ ...registration, employeeId: event.target.value })} placeholder="Contoh: KCW-001" maxLength={30} required /></label>
            <label className="kcw-field"><span>Email</span><input type="email" autoComplete="off" value={registration.email} onChange={event => setRegistration({ ...registration, email: event.target.value })} placeholder="nama@perusahaan.com" required /></label>
            <label className="kcw-field"><span>Kata sandi</span><div className="kcw-password"><input type={showRegistrationPassword ? "text" : "password"} autoComplete="off" value={registration.password} onChange={event => setRegistration({ ...registration, password: event.target.value })} placeholder="Minimal 8 karakter" minLength={8} aria-describedby="register-password-hint" required /><IconButton icon={showRegistrationPassword ? "eye-off" : "eye"} label={showRegistrationPassword ? "Sembunyikan kata sandi pendaftaran" : "Tampilkan kata sandi pendaftaran"} aria-pressed={showRegistrationPassword} onClick={() => setShowRegistrationPassword(!showRegistrationPassword)} /></div><small id="register-password-hint">Gunakan minimal 8 karakter untuk contoh kata sandi.</small></label>
            {registrationError && <p className="kcw-alert" role="alert">{registrationError}</p>}
            <Button type="submit" variant="gold">Daftar akun <Icon name="arrow-right" /></Button>
          </form>
          <div className="kcw-auth-secondary"><span className="kcw-small kcw-muted">Sudah punya akun?</span> <button type="button" className="kcw-link kcw-auth-link" onClick={() => changeView("login")}>Login</button></div>
          <p className="kcw-login-note">Simulasi UI · pendaftaran ini tidak membuat akun sungguhan.</p>
        </>}
        {view === "forgot-password" && <>
          {recoverySentTo ? <div className="kcw-auth-recovery kcw-stack">
            <div className="kcw-auth-success" role="status"><Icon name="circle-check" /><div><h3>Simulasi pemulihan selesai</h3><p>Permintaan untuk <strong>{recoverySentTo}</strong> telah ditampilkan. Tidak ada email pemulihan yang dikirim.</p></div></div>
            <Button variant="gold" onClick={() => { setEmail(recoverySentTo); changeView("login"); }}>Kembali ke Login <Icon name="arrow-right" /></Button>
            <Button variant="quiet" onClick={() => setRecoverySentTo("")}>Gunakan email lain</Button>
          </div> : <>
            <form className="kcw-login-form kcw-auth-form" onSubmit={submitRecovery}>
              <label className="kcw-field"><span>Email akun</span><input type="email" autoComplete="off" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} placeholder="nama@perusahaan.com" required /></label>
              <Button type="submit" variant="gold">Kirim tautan pemulihan <Icon name="arrow-right" /></Button>
            </form>
            <Button variant="quiet" icon="arrow-left" onClick={() => changeView("login")}>Kembali ke Login</Button>
          </>}
          <p className="kcw-login-note">Preview UI · pemulihan kata sandi belum terhubung ke email.</p>
        </>}
      </section>
    </div>
    <footer className="kcw-login-copyright">© 2026 PT Karunia Cipta Wasantara</footer>
    {loginError && <Modal title="Login belum berhasil" onClose={() => setLoginError("")}>
      <div className="kcw-stack">
        <p role="alert">{loginError}</p>
        <Button variant="gold" onClick={() => setLoginError("")}>Coba lagi</Button>
      </div>
    </Modal>}
    {registeredEmail && <Modal title="Simulasi pendaftaran" onClose={() => setRegisteredEmail("")}>
      <div className="kcw-stack">
        <div className="kcw-auth-success" role="status"><Icon name="circle-check" /><p>Simulasi pendaftaran selesai untuk <strong>{registeredEmail}</strong>. Tidak ada akun sungguhan yang dibuat. Email sudah diisikan pada form Login.</p></div>
        <Button variant="gold" onClick={() => setRegisteredEmail("")}>Lanjut ke Login</Button>
      </div>
    </Modal>}
  </main>;
}
