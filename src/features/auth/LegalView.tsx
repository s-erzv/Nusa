import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalView = ({ type, onBack }: LegalViewProps) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="relative w-full flex flex-col min-h-screen text-text overflow-x-hidden bg-[#080808]">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#FF7A00]/5 to-transparent blur-[100px]" />
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF7A00]/20 to-orange-400/20 border border-[#FF7A00]/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,122,0,0.15)]">
              {isPrivacy ? (
                <Shield className="w-8 h-8 text-[#FF7A00]" />
              ) : (
                <FileText className="w-8 h-8 text-[#FF7A00]" />
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <p className="text-white/40">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="prose prose-invert prose-orange max-w-none prose-p:text-white/70 prose-headings:text-white prose-headings:font-bold prose-li:text-white/70 bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
            {isPrivacy ? (
              <>
                <p>
                  Kebijakan Privasi ini menjelaskan bagaimana Nusa ("kami", "kita", atau "milik kami") mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan layanan asisten finansial WhatsApp dan dashboard web kami ("Layanan").
                </p>
                
                <h3>1. Informasi yang Kami Kumpulkan</h3>
                <p>
                  Kami hanya mengumpulkan informasi yang esensial untuk menyediakan layanan pencatatan finansial kepada Anda:
                </p>
                <ul>
                  <li><strong>Data Komunikasi:</strong> Pesan teks yang Anda kirimkan melalui WhatsApp kepada bot kami, khusus untuk keperluan pencatatan transaksi (nominal, kategori, deskripsi).</li>
                  <li><strong>Informasi Akun:</strong> Nomor telepon WhatsApp Anda yang digunakan sebagai pengenal unik (ID pengguna) dalam sistem kami.</li>
                  <li><strong>Data Finansial:</strong> Riwayat transaksi, saldo dompet virtual, dan catatan utang-piutang yang Anda input melalui sistem kami.</li>
                </ul>

                <h3>2. Bagaimana Kami Menggunakan Informasi Anda</h3>
                <p>Data Anda hanya digunakan secara eksplisit untuk keperluan berikut:</p>
                <ul>
                  <li>Menyediakan analitik finansial, ringkasan pengeluaran, dan fitur manajemen anggaran di dalam akun Anda.</li>
                  <li>Memproses pesan teks Anda menggunakan teknologi Natural Language Processing (NLP) untuk mengekstrak data transaksi.</li>
                  <li>Memberikan peringatan pintar (smart alerts) terkait tagihan, anggaran, atau anomali pengeluaran.</li>
                </ul>

                <h3>3. Keamanan dan Penyimpanan Data</h3>
                <p>
                  Privasi dan keamanan Anda adalah prioritas utama kami. Kami menerapkan langkah-langkah keamanan setara bank:
                </p>
                <ul>
                  <li><strong>Enkripsi:</strong> Semua data Anda disimpan di dalam database dengan perlindungan Row Level Security (RLS) dan dienkripsi (AES-256).</li>
                  <li><strong>Isolasi Data:</strong> Setiap pengguna hanya memiliki akses ke data mereka sendiri. Tidak ada pengguna atau pihak lain yang dapat melihat riwayat finansial Anda.</li>
                </ul>

                <h3>4. Berbagi Informasi Pihak Ketiga</h3>
                <p>
                  Kami <strong>tidak pernah</strong> menjual, menyewakan, atau menukar data finansial pribadi Anda kepada pihak ketiga untuk keperluan iklan atau pemasaran. Pesan teks Anda diproses secara transien oleh provider AI (Large Language Models) melalui jalur API tertutup yang melarang penggunaan data untuk pelatihan model (Zero Data Retention).
                </p>

                <h3>5. Hubungi Kami</h3>
                <p>
                  Jika Anda memiliki pertanyaan mengenai kebijakan privasi kami, silakan hubungi kami melalui WhatsApp di <a href="https://wa.me/6287762407811" target="_blank" className="text-orange-400 hover:underline">6287762407811</a>.
                </p>
              </>
            ) : (
              <>
                <p>
                  Dengan mengakses dan menggunakan Layanan Nusa ("Layanan"), Anda setuju untuk terikat oleh Syarat dan Ketentuan ("Syarat") ini. Harap baca dengan saksama sebelum mulai menggunakan Layanan.
                </p>

                <h3>1. Penggunaan Layanan</h3>
                <p>
                  Nusa menyediakan perangkat lunak pencatatan finansial berbasis WhatsApp dan dashboard web. Anda setuju untuk:
                </p>
                <ul>
                  <li>Hanya menggunakan layanan ini untuk keperluan manajemen keuangan pribadi atau bisnis Anda yang sah.</li>
                  <li>Tidak menggunakan layanan ini untuk kegiatan ilegal, penipuan, atau melanggar hukum yang berlaku di yurisdiksi Anda.</li>
                  <li>Bertanggung jawab penuh atas keakuratan data nominal dan transaksi yang Anda masukkan. Nusa tidak bertanggung jawab atas kerugian finansial akibat kelalaian input atau kesalahan perhitungan yang diakibatkan oleh pengguna.</li>
                </ul>

                <h3>2. Akun dan Keamanan</h3>
                <p>
                  Akun Anda terhubung langsung dengan nomor WhatsApp pribadi Anda. Anda bertanggung jawab untuk menjaga keamanan perangkat seluler dan akun WhatsApp Anda. Segala aktivitas yang terjadi melalui nomor Anda akan dianggap sebagai tindakan sah dari Anda.
                </p>

                <h3>3. Ketersediaan Layanan (SLA)</h3>
                <p>
                  Kami berupaya memastikan Layanan dapat diakses 24/7. Namun, kami tidak menjamin bahwa Layanan akan bebas dari gangguan, penundaan, atau pemeliharaan sistem sementara (maintenance). Kami tidak bertanggung jawab atas keterlambatan pesan WhatsApp yang disebabkan oleh infrastruktur pihak ketiga (Meta).
                </p>

                <h3>4. Kekayaan Intelektual</h3>
                <p>
                  Semua logo, desain UI/UX, teks, dan kode sumber yang menyusun aplikasi Nusa adalah hak milik intelektual kami. Anda dilarang mereproduksi, menduplikasi, atau merekayasa balik (reverse-engineer) komponen apapun dari Layanan kami tanpa izin tertulis.
                </p>

                <h3>5. Pembatasan Tanggung Jawab</h3>
                <p>
                  Nusa bukanlah lembaga perbankan, penasihat keuangan bersertifikat, atau aplikasi dompet digital. Kami hanya menyediakan perangkat lunak pencatatan. Kami tidak bertanggung jawab atas keputusan finansial, investasi, atau kerugian apapun yang Anda buat berdasarkan analisis atau ringkasan yang disajikan oleh sistem kami.
                </p>

                <h3>6. Perubahan Syarat</h3>
                <p>
                  Kami berhak mengubah Syarat ini kapan saja. Perubahan akan berlaku seketika setelah diperbarui di halaman ini. Terus menggunakan Layanan setelah perubahan berarti Anda menerima Syarat yang telah diperbarui.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
