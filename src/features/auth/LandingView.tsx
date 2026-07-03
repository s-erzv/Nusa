import { 
  ArrowRight, Bot, PieChart, Zap, LineChart, Shield, ChevronRight, 
  Activity, MessageSquare, Database, Smartphone, Users, Briefcase, 
  GraduationCap, HelpCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../../components/ThemeToggle'; // Sesuaikan path

interface LandingViewProps {
  onLoginClick: () => void;
}

// --- Framer Motion Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } }
};

export const LandingView = ({ onLoginClick }: LandingViewProps) => {
  return (
    <div className="relative w-full flex flex-col min-h-screen selection:bg-primary/30 text-text">
      
      {/* --- FIXED AMBIENT BACKGROUND --- 
          Menggunakan fixed agar blur & gradient tetap konsisten meski halaman di-scroll panjang 
      */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-primary/15 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]" />
        <div className="absolute top-[40%] right-[-10%] w-[45rem] h-[45rem] bg-orange-500/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50rem] h-[50rem] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 w-full max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-xl border-b border-border/50 -z-10 mask-image-linear-to-b" />
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-surface/30 p-2 pr-6 rounded-full border border-border/50 shadow-sm backdrop-blur-md"
        >
          <img src="/dark.png" alt="Nusa Logo" className="h-8 md:h-9 dark:hidden drop-shadow-md" />
          <img src="/light.png" alt="Nusa Logo" className="h-8 md:h-9 hidden dark:block drop-shadow-md" />
          <span className="text-xl font-bold bg-gradient-to-r from-[#FF7A00] to-orange-400 bg-clip-text text-transparent hidden sm:block">
            Nusa
          </span>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <div className="bg-surface/50 backdrop-blur-md border border-border/50 rounded-full p-1">
            <ThemeToggle />
          </div>
          <button
            onClick={onLoginClick}
            className="group relative px-6 py-2 bg-text text-background font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,122,0,0.3)]"
          >
            <div className="absolute inset-0 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full" />
            <span className="relative flex items-center gap-2 group-hover:text-white text-sm">
              Dashboard <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-8 z-10 flex flex-col gap-24 lg:gap-32 pb-24">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="pt-12 lg:pt-20 grid grid-cols-1 xl:grid-cols-2 gap-16 items-center min-h-[75vh]">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/60 backdrop-blur-xl border border-primary/30 text-primary text-xs font-semibold shadow-[0_0_20px_rgba(255,122,0,0.15)]">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
              Sistem Terhubung via WhatsApp API
            </motion.div>
            
            <motion.div variants={fadeUp} className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-text to-text-muted tracking-tight leading-[1.1]">
                Catat Keuangan,<br />
                <span className="bg-gradient-to-r from-primary via-orange-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
                  Cukup Lewat Chat.
                </span>
              </h1>
              <p className="text-lg text-text-muted max-w-xl leading-relaxed">
                Nusa adalah asisten finansial bertenaga AI. Ketik pengeluaran Anda seperti mengobrol biasa, sistem kami akan memprosesnya menjadi struktur data yang rapi dan visualisasi analitik.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-2">
              <a href="https://wa.me/6287762407811?text=Halo%20Nusa" target="_blank" rel="noreferrer" className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-[0_10px_30px_rgba(255,122,0,0.3)] hover:shadow-[0_15px_40px_rgba(255,122,0,0.5)] w-full sm:w-auto">
                Coba Chat Nusa Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative h-full min-h-[450px] flex items-center justify-center lg:justify-end">
            <div className="relative z-10 w-full max-w-md bg-surface/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl ring-1 ring-border/50">
              <div className="flex items-center gap-4 border-b border-border/50 pb-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-orange-300 flex items-center justify-center shadow-lg"><Bot className="w-5 h-5 text-white" /></div>
                <div>
                  <h3 className="font-bold text-text leading-tight">Nusa AI Agent</h3>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>
              <div className="space-y-5 relative">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="bg-text text-background rounded-2xl p-4 max-w-[85%] ml-auto rounded-tr-sm shadow-md">
                  <p className="text-sm font-medium">Netflix bulan ini 186rb, trus grabfood 60rb pake paylater</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} className="bg-primary/10 border border-primary/20 rounded-2xl p-4 max-w-[90%] rounded-tl-sm shadow-inner">
                  <p className="text-sm text-text leading-relaxed">Berhasil dicatat! 📝<br/>🎬 Hiburan: Rp186.000<br/>🍔 Makan: Rp60.000 (PayLater)<br/><span className="text-xs text-text-muted mt-2 block">Saldo bulan ini aman.</span></p>
                </motion.div>
              </div>
            </div>
            
            {/* Logic Widget */}
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-6 top-12 bg-[#1e1e1e] border border-white/10 p-3 rounded-xl shadow-2xl z-20 backdrop-blur-xl hidden sm:block">
              <div className="flex items-center gap-2 mb-2"><Activity className="w-3 h-3 text-primary" /><span className="text-[10px] text-primary font-mono font-bold">LLM PARSING</span></div>
              <pre className="text-[9px] text-green-400 font-mono">
{`{
  "action": "RECORD",
  "category": "Entertainment",
  "amount": 186000
}`}
              </pre>
            </motion.div>
          </motion.div>
        </section>

        {/* --- 2. METRICS BANNER --- */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-lg">
          {[
            { label: 'Uptime Sistem', value: '99.9%' },
            { label: 'Waktu Respon', value: '< 2s' },
            { label: 'Transaksi Dicatat', value: '1.2M+' },
            { label: 'Enkripsi Data', value: 'AES-256' },
          ].map((stat, idx) => (
            <motion.div variants={fadeUp} key={idx} className="text-center md:border-r last:border-0 border-border/50">
              <p className="text-3xl font-extrabold text-text tracking-tight">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* --- 3. WORKFLOW (How It Works) --- */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold">Satu Alur, Tanpa Gesekan</motion.h2>
            <motion.p variants={fadeUp} className="text-text-muted">Tidak perlu form rumit atau dropdown yang membingungkan. Nusa mendesain ulang cara Anda berinteraksi dengan data finansial.</motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />
            
            {[
              { icon: <MessageSquare />, title: "1. Kirim Pesan WA", desc: "Ketik transaksi finansial Anda menggunakan bahasa sehari-hari kapanpun, di manapun." },
              { icon: <Activity />, title: "2. AI Processing", desc: "Mesin Llama 3 kami secara otomatis mengekstrak nominal, kategori, dan dompet pengeluaran." },
              { icon: <Database />, title: "3. Tersinkronisasi", desc: "Data masuk ke database dengan aman dan langsung tercermin dalam bentuk grafik di Web Dashboard." }
            ].map((step, idx) => (
              <motion.div variants={fadeUp} key={idx} className="relative z-10 bg-surface/50 backdrop-blur-xl border border-border/50 p-8 rounded-3xl text-center group hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 mx-auto bg-background border border-border/50 rounded-full flex items-center justify-center text-primary mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* --- 4. CORE FEATURES (Bento Grid) --- */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-center">Fitur Kelas Enterprise, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Untuk Personal.</span></motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div variants={fadeUp} className="lg:col-span-2 group bg-surface/30 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Natural Language Engine</h3>
              <p className="text-text-muted max-w-md">Kecerdasan buatan kami dilatih khusus untuk memahami konteks finansial Indonesia, dari slang hingga typo, memastikan akurasi pencatatan hingga 98%.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="group bg-surface/30 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50">
              <Shield className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Bank-Grade RLS</h3>
              <p className="text-text-muted text-sm">Infrastruktur database Supabase memastikan isolasi data ketat (Row Level Security). Data Anda hanya milik Anda.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="group bg-surface/30 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50">
              <Smartphone className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Passwordless Login</h3>
              <p className="text-text-muted text-sm">Lupakan password. Akses web dashboard dengan sistem OTP aman yang dikirimkan langsung ke WhatsApp Anda.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="lg:col-span-2 group bg-surface/30 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 flex flex-col justify-end">
               <LineChart className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Interactive Analytics</h3>
              <p className="text-text-muted max-w-md">Dashboard analitik yang elegan. Lacak pola pengeluaran (*spending habits*) dan atur limit budget (*budget constraints*) dengan antarmuka yang modern dan responsif.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* --- 5. USE CASES --- */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="space-y-12">
          <div className="text-center space-y-2">
             <motion.h2 variants={fadeUp} className="text-3xl font-bold">Dirancang Untuk Siapa Saja</motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Briefcase />, title: "Freelancer & Profesional", desc: "Pisahkan uang pribadi dan project tanpa perlu instal aplikasi akuntansi rumit." },
              { icon: <Users />, title: "Rumah Tangga", desc: "Catat pengeluaran belanja bulanan dan tagihan dengan presisi hanya lewat chat." },
              { icon: <GraduationCap />, title: "Mahasiswa", desc: "Pantau kiriman bulanan, uang makan, dan nongkrong agar tidak boncos di akhir bulan." }
            ].map((item, idx) => (
              <motion.div variants={fadeUp} key={idx} className="bg-surface/20 p-6 rounded-3xl border border-border/30 flex items-start gap-4">
                <div className="p-3 bg-surface border border-border/50 rounded-xl text-primary">{item.icon}</div>
                <div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-text-muted mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* --- 6. FAQ SECTION --- */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-bold">Pertanyaan Populer</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Apakah Nusa aman digunakan?", a: "Sangat aman. Nusa tidak menyimpan password Anda, dan seluruh sesi web menggunakan token terenkripsi. Pesan WhatsApp juga diamankan dengan standar end-to-end Meta." },
              { q: "Apakah saya harus mengunduh aplikasi?", a: "Tidak. Proses pencatatan 100% berjalan di WhatsApp, dan panel analitik bisa diakses melalui browser apapun (Web Apps)." },
              { q: "Bagaimana AI menentukan kategori?", a: "Kami menggunakan arsitektur Llama LLM yang dilatih untuk memecah kalimat bahasa alami (natural language) ke dalam skema JSON finansial terstruktur." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-surface/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <h4 className="font-bold text-text mb-2">{faq.q}</h4>
                <p className="text-sm text-text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* --- 7. BOTTOM CTA --- */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeIn} className="relative py-20 rounded-[3rem] overflow-hidden bg-primary/10 border border-primary/20 text-center px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 -z-10" />
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">Siap merapikan keuangan Anda?</h2>
          <p className="text-text-muted mb-10 max-w-xl mx-auto">Bergabung dengan ekosistem finansial paling intuitif. Setup kurang dari 1 menit.</p>
          <div className="flex justify-center">
            <button onClick={onLoginClick} className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_10px_40px_rgba(255,122,0,0.4)]">
              Mulai Login Web Dashboard
            </button>
          </div>
        </motion.section>
      </main>

      {/* --- 8. FOOTER (Restored & Polished) --- */}
      <footer className="w-full border-t border-border/50 bg-background/80 backdrop-blur-2xl z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <img src="/dark up.png" alt="Nusa Logo" className="h-8 dark:hidden opacity-80 hover:opacity-100 transition-opacity" />
              <img src="/light up.png" alt="Nusa Logo" className="h-8 hidden dark:block opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-text-muted max-w-xs text-center md:text-left">
              Menghadirkan pengalaman finansial yang clean, logis, dan terstruktur. Dirancang untuk masa depan produktivitas.
            </p>
            <p className="text-xs font-mono text-text-muted/60 mt-2">
              &copy; {new Date().getFullYear()} Nusa Systems. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-sm font-medium text-text-muted">
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <span className="text-text font-bold uppercase tracking-wider text-xs">Produk</span>
              <a href="#" className="hover:text-primary transition-colors">Web Dashboard</a>
              <a href="#" className="hover:text-primary transition-colors">WhatsApp Bot</a>
              <a href="#" className="hover:text-primary transition-colors">API Docs</a>
            </div>
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <span className="text-text font-bold uppercase tracking-wider text-xs">Legal</span>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="https://wa.me/6287762407811" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};