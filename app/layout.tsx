import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karunia Cipta Wasantara — Monitoring Karyawan",
  description: "Preview antarmuka monitoring karyawan outsourcing PT Karunia Cipta Wasantara. Data demonstrasi untuk penempatan, kehadiran, koreksi, dan laporan.",
  robots: { index: false, follow: false },
};

const themeScript = `(function(){try{var t=localStorage.getItem('kcw-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
