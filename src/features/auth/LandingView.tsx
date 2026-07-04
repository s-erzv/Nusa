import {
  ArrowRight, Bot, Zap, LineChart, Shield, ChevronRight,
  Activity, Users, MessageSquare, Database, Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ThemeToggle } from '../../components/ThemeToggle'; // Sesuaikan path

interface LandingViewProps {
  onLoginClick: () => void;
  onNavigate?: (page: string) => void;
}

// Clean, snappy animations (No bouncy springs)
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const LandingView = ({ onLoginClick, onNavigate }: LandingViewProps) => {
  return (
    <div className="relative w-full flex flex-col min-h-screen text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950 font-sans selection:bg-[#FF7A00]/20 selection:text-[#FF7A00]">

      {/* ═══════════════════════════════════════════
          MINIMALIST AMBIENT BACKGROUND
      ═══════════════════════════════════════════ */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-[#FF7A00]/5 dark:bg-[#FF7A00]/10 rounded-full blur-[120px]" />
        {/* Grain overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* ═══════════════════════════════════════════
          HEADER (Clean Glassmorphism)
      ═══════════════════════════════════════════ */}
      <header className="sticky top-0 w-full z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <img src="/logo.png" alt="Nusa Logo" className="h-6 sm:h-7" />
            <span className="text-xl font-bold tracking-tight">Nusa.</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={onLoginClick}
              className="group flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Dashboard
              <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-8 z-10 flex flex-col gap-24 lg:gap-32 pb-32">

        {/* ═══════════════════════════════════════════
            1. HERO SECTION
        ═══════════════════════════════════════════ */}
        <section className="pt-20 lg:pt-32 grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
            
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A00] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7A00]" />
              </span>
              AI Finance via WhatsApp API
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Pencatatan Keuangan, <br />
                <span className="text-[#FF7A00]">Tanpa Friksi.</span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                Asisten finansial AI yang hidup di WhatsApp Anda. Catat pengeluaran, pantau saldo, dan kelola anggaran tanpa perlu menginstal aplikasi baru.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="https://wa.me/6287762407811?text=Halo%20Nusa"
                target="_blank" rel="noreferrer"
                className="group flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white transition-all w-full sm:w-auto shadow-sm shadow-[#FF7A00]/20"
              >
                Mulai Chat Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button
                onClick={onLoginClick}
                className="flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto text-zinc-900 dark:text-zinc-100"
              >
                Buka Web Dashboard
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-3 pt-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Users className="w-4 h-4 text-zinc-500" />
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">1.200+</span> transaksi terproses minggu ini
              </p>
            </motion.div>
          </motion.div>

          {/* ── HERO VISUAL (Intentional UI) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            {/* Main Chat Interface */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50">
              
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="w-8 h-8 rounded-full bg-[#FF7A00] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Nusa AI Agent</h3>
                  <p className="text-[10px] text-green-500 font-medium">● Online</p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="px-5 py-6 space-y-5 bg-zinc-50/30 dark:bg-zinc-950/30">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-sm font-medium bg-[#FF7A00] text-white shadow-sm">
                    Netflix 186rb + gofood 60rb pake paylater
                  </div>
                </div>

                {/* Bot Message */}
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Tercatat. ✅</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">🎬 Hiburan</span>
                      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">Rp186.000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">🍔 Makanan</span>
                      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">Rp60.000</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-500 text-[10px]">via PayLater</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Technical Widget */}
            <motion.div
              animate={{ y: [-4, 4, -4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as any }}
              className="absolute -left-10 top-20 z-20 hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3 h-3 text-[#FF7A00]" />
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">JSON Output</span>
              </div>
              <pre className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
{`{
  "action": "RECORD",
  "data": [
    { "cat": "Entertainment",
      "amount": 186000 },
    { "cat": "Food",
      "amount": 60000 }
  ]
}`}
              </pre>
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            2. STATS BANNER
        ═══════════════════════════════════════════ */}
        <motion.section
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
        >
          {[
            { label: 'Uptime', value: '99.9%' },
            { label: 'Latency', value: '< 2s' },
            { label: 'Transaksi', value: '1.2M+' },
            { label: 'Keamanan', value: 'AES-256' },
          ].map((stat, idx) => (
            <motion.div variants={fadeUp} key={idx} className="text-center space-y-1 md:border-r last:border-0 border-zinc-200 dark:border-zinc-800">
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</p>
              <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* ═══════════════════════════════════════════
            3. WORKFLOW (Clean Linear Process)
        ═══════════════════════════════════════════ */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight">Satu Alur. Tanpa Gesekan.</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-600 dark:text-zinc-400">Dirancang dengan prinsip HCI untuk meminimalkan beban kognitif pengguna saat mengelola keuangan.</motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[2.5rem] left-[20%] right-[20%] h-[1px] bg-zinc-200 dark:bg-zinc-800 -z-10" />
            {[
              { icon: <MessageSquare />, title: "1. Input Natural", desc: "Ketik transaksi menggunakan bahasa sehari-hari. Tidak perlu mengisi form kompleks." },
              { icon: <Activity />, title: "2. AI Parsing", desc: "LLM mengekstrak entitas data (nominal, kategori, akun) secara otomatis dan presisi." },
              { icon: <Database />, title: "3. Sinkronisasi Web", desc: "Data terstruktur langsung masuk ke database dan divisualisasikan pada dashboard." }
            ].map((step, idx) => (
              <motion.div variants={fadeUp} key={idx} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-5">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════
            4. BENTO GRID FEATURES (Structured)
        ═══════════════════════════════════════════ */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
          <motion.div variants={fadeUp} className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Infrastruktur Solid.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Zap className="w-6 h-6 text-zinc-900 dark:text-zinc-100 mb-4" />
              <h3 className="text-xl font-bold mb-2">Natural Language Processing</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">Engine kami memproses bahasa gaul, typo, hingga struktur kalimat kompleks menjadi data JSON yang valid dan siap diolah ke database.</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-mono text-zinc-500">"beli bensin 80k"</span>
                <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-mono text-zinc-500">"gajian 5jt masuk bca"</span>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeUp} className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Shield className="w-6 h-6 text-zinc-900 dark:text-zinc-100 mb-4" />
              <h3 className="text-xl font-bold mb-2">Row Level Security</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Implementasi keamanan ketat di level database. Data finansial dienkripsi dan diisolasi per ID pengguna.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeUp} className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Smartphone className="w-6 h-6 text-zinc-900 dark:text-zinc-100 mb-4" />
              <h3 className="text-xl font-bold mb-2">Passwordless Auth</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Autentikasi berbasis OTP via WhatsApp. Mengurangi kerentanan kredensial dan mempercepat onboarding.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
               <LineChart className="w-6 h-6 text-zinc-900 dark:text-zinc-100 mb-4" />
              <h3 className="text-xl font-bold mb-2">Dashboard Analitik Terpusat</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">Evaluasi arus kas bulanan Anda melalui antarmuka web interaktif yang dikembangkan dengan Next.js dan Tailwind CSS.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════
            5. BOTTOM CTA (No Distractions)
        ═══════════════════════════════════════════ */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="py-24 rounded-3xl bg-zinc-900 text-white text-center px-6 border border-zinc-800"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold tracking-tight">Siap merapikan sistem keuangan Anda?</h2>
            <p className="text-zinc-400 text-base">Setup integrasi WhatsApp dalam hitungan detik. Tanpa konfigurasi yang rumit.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <a href="https://wa.me/6287762407811?text=Halo%20Nusa" target="_blank" rel="noreferrer"
                className="px-6 py-3 font-semibold rounded-xl text-zinc-900 bg-white hover:bg-zinc-200 transition-colors w-full sm:w-auto text-sm"
              >
                Integrasikan Sekarang
              </a>
            </div>
          </div>
        </motion.section>
      </main>

      {/* ═══════════════════════════════════════════
          FOOTER (Professional & Minimal)
      ═══════════════════════════════════════════ */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Nusa.</span>
            <p className="text-xs text-zinc-500 text-center md:text-left">
              Menghadirkan pengalaman finansial yang clean, logis, dan terstruktur.
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-medium text-zinc-500">
            <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms of Service</button>
            <a href="https://wa.me/6287762407811" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Developer API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};