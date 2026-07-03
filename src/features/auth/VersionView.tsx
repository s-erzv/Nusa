import { ArrowLeft, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

interface VersionViewProps {
  onBack: () => void;
}

export const VersionView = ({ onBack }: VersionViewProps) => {
  const versions = [
    {
      version: 'v1.0.0',
      date: 'Juli 2026',
      title: 'Initial Release: The Future of Personal Finance',
      changes: [
        'WhatsApp AI integration untuk pencatatan otomatis via natural language',
        'Sistem Envelope Budgeting (Kantong) yang dinamis',
        'Dashboard analitik dengan dark & light mode premium',
        'Smart Alerts & Insights untuk pengeluaran berlebih',
        'Dukungan sistem utang-piutang (receivables & payables) otomatis'
      ]
    }
  ];

  return (
    <div className="relative w-full flex flex-col min-h-screen text-text overflow-x-hidden bg-[#080808]">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent blur-[100px]" />
      </div>

      <header className="sticky top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <Rocket className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Changelog
            </h1>
            <p className="text-white/40 max-w-xl">
              Lihat perjalanan pengembangan Nusa. Setiap versi membawa peningkatan pengalaman finansial yang lebih baik untuk Anda.
            </p>
          </div>

          <div className="space-y-8">
            {versions.map((ver, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-6xl select-none">
                  {ver.version}
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold tracking-widest uppercase">
                        {ver.version}
                      </span>
                      <span className="text-white/40 text-sm">{ver.date}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-2">{ver.title}</h2>
                  </div>

                  <ul className="space-y-3">
                    {ver.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex gap-3 text-white/70">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
