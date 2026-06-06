import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBriefcase,
  FaBullhorn,
  FaCameraRetro,
  FaCheckCircle,
  FaClock,
  FaCode,
  FaConciergeBell,
  FaGlobe,
  FaGraduationCap,
  FaHeartbeat,
  FaInstagram,
  FaNetworkWired,
  FaSchool,
  FaShieldAlt,
  FaStar,
  FaWhatsapp,
  FaWifi,
} from "react-icons/fa";
import { TestimonialsCarousel } from "@/components/landing/testimonials-carousel";
import styles from "./page.module.css";

const highlightChips = [
  "Sistem Digital Canggih",
  "Komunikatif",
  "Terintegrasi",
  "Absensi Real Time",
  "Aktif dan Cerdas",
];

const excellencePoints = [
  "Fitur absensi waktu nyata",
  "Waktu absensi terjadwal",
  "Siap untuk manajemen sekolah",
  "Bimbingan siswa yang baik dan terarah",
];

const majors = [
  {
    name: "PPLG",
    label: "Teknologi",
    detail: "Pemrograman dan software modern",
  },
  {
    name: "DKV",
    label: "Kreatif",
    detail: "Visual branding dan multimedia",
  },
  {
    name: "TJKT",
    label: "Jaringan",
    detail: "Komputer, server, dan konektivitas",
  },
  {
    name: "Pemasaran",
    label: "Bisnis",
    detail: "Strategi promosi dan layanan pelanggan",
  },
  {
    name: "MPLB",
    label: "Manajemen",
    detail: "Administrasi kantor yang terstruktur",
  },
  {
    name: "Perhotelan",
    label: "Hospitality",
    detail: "Etika layanan dan kesiapan industri",
  },
];

const majorIcons = {
  PPLG: FaCode,
  DKV: FaCameraRetro,
  TJKT: FaNetworkWired,
  Pemasaran: FaBullhorn,
  MPLB: FaBriefcase,
  Perhotelan: FaConciergeBell,
} as const;

const contactLinks = [
  { icon: FaGlobe, label: "Website" },
  { icon: FaInstagram, label: "Instagram" },
  { icon: FaWhatsapp, label: "WhatsApp" },
] as const;

const testimonials = [
  {
    name: "Randhu",
    role: "XI DKV 1",
    body: "Tampilan aplikasinya enak dipakai dan proses absensi jadi cepat. Saat datang ke sekolah, saya langsung tahu status kehadiran tanpa bingung atau antre lama.",
  },
  {
    name: "Alya",
    role: "XI PPLG 2",
    body: "Bagian dashboard terasa modern dan rapi. Informasi kehadiran, keterlambatan, dan catatan sekolah bisa dilihat dengan jelas dari satu tempat.",
  },
  {
    name: "Nadira",
    role: "X MPLB 1",
    body: "Aplikasi ini bikin komunikasi kehadiran lebih tertata. Saya suka karena tampilannya simpel, responsif di HP, dan tetap terasa premium saat dipakai.",
  },
  {
    name: "Fikri",
    role: "X TJKT 2",
    body: "Proses check-in terasa cepat dan tampilannya mudah dipahami. Notifikasi status hadir juga membantu saya lebih disiplin setiap pagi.",
  },
  {
    name: "Keisha",
    role: "XII PM 1",
    body: "Saya suka karena data kehadiran langsung terlihat jelas. Untuk tugas sekolah seperti ini, tampilannya sudah rapi dan terasa profesional.",
  },
  {
    name: "Rama",
    role: "XI MPLB 2",
    body: "Penggunaan aplikasinya ringan di laptop maupun HP. Riwayat absensi jadi lebih mudah dicek tanpa harus tanya ulang ke guru.",
  },
  {
    name: "Citra",
    role: "X DKV 2",
    body: "Desainnya bersih dan enak dilihat. Saya paling suka bagian review dan informasi utama karena langsung terbaca tanpa bikin bingung.",
  },
  {
    name: "Bagas",
    role: "XII PPLG 1",
    body: "Absensi digital seperti ini lebih praktis dibanding manual. Semua data terasa lebih modern dan cocok buat kebutuhan sekolah sekarang.",
  },
  {
    name: "Nabila",
    role: "XI PM 2",
    body: "Halaman aplikasinya nyaman dipakai dan transisinya halus. Dari sisi pengguna, semuanya terasa lebih cepat dan tertata.",
  },
  {
    name: "Dimas",
    role: "X TJKT 1",
    body: "Saya bisa langsung paham alur aplikasinya sejak pertama buka. Ini membantu siswa supaya tidak kesulitan saat melakukan absensi harian.",
  },
  {
    name: "Salma",
    role: "XII MPLB 2",
    body: "Warna, tata letak, dan informasi pentingnya sudah pas. Aplikasi ini terasa siap dipakai untuk presentasi maupun penggunaan sekolah.",
  },
  {
    name: "Arkan",
    role: "XI PPLG 3",
    body: "Menurut saya ini salah satu bagian yang paling menarik dari project-nya. Review card dan section jurusan sekarang terasa lebih hidup.",
  },
];

export default function HomePage() {
  return (
    <main className={`${styles.landingPage} min-h-screen`}>
      <section className="w-full">
        <div className="space-y-7 pb-14 md:pb-20">
          <div className={`${styles.landingHeroShell} relative overflow-hidden`}>
            <div className="relative h-[350px] overflow-hidden md:h-[520px] xl:h-[600px]">
              <Image
                src="/images/logos/cn_looks.jpg"
                alt="Gedung SMK Citra Negara"
                fill
                priority
                className="object-cover"
              />
              <div className={`${styles.landingHeroOverlay} absolute inset-0`} />

              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <div className="max-w-[760px] space-y-2.5 md:space-y-3.5">
                  <p className="font-heading text-[2rem] leading-[1.05] font-semibold italic text-white md:text-[3rem]">
                    Aplikasi Absensi Siswa
                  </p>
                  <h1 className={`${styles.landingHeroTitle} font-heading text-[2.4rem] leading-[0.98] font-bold tracking-tight md:text-[4.25rem]`}>
                    SMK Citra Negara
                  </h1>
                  <p className="text-base leading-[1.15] font-semibold text-white md:text-[1.65rem]">
                    Pilihan Yang Tepat Di Sekolah Yang M.A.N.T.A.P
                  </p>
                  <div className="pt-1.5">
                    <Link
                      href="/login"
                      className={`${styles.landingCtaButton} inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-emerald-50`}
                    >
                      Klik Untuk Memulai
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.landingPageShell} mx-auto w-full max-w-[1480px] md:px-6 xl:px-10`}>
            <div className="px-5 py-7 md:px-8 md:py-9 xl:px-10">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                {highlightChips.map((chip, index) => (
                  <div
                    key={chip}
                    className={`${styles.landingChip} flex items-center gap-2 px-4 py-3 text-sm font-medium`}
                  >
                    <span className={`${styles.landingChipIcon} flex size-7 shrink-0 items-center justify-center rounded-full`}>
                      {index === 0 ? (
                        <FaShieldAlt className="size-3.5" />
                      ) : index === 1 ? (
                        <FaWifi className="size-3.5" />
                      ) : index === 2 ? (
                        <FaHeartbeat className="size-3.5" />
                      ) : index === 3 ? (
                        <FaClock className="size-3.5" />
                      ) : (
                        <FaCheckCircle className="size-3.5" />
                      )}
                    </span>
                    <span>{chip}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] xl:gap-12">
                <div className="relative mx-auto w-full max-w-[420px]">
                  <div className={`${styles.landingPanelImage} relative h-[320px] overflow-hidden`}>
                    <Image
                      src="/images/logos/cn_looks.jpg"
                      alt="Area sekolah SMK Citra Negara"
                      fill
                      className="object-cover object-left"
                    />
                    <div className={`${styles.landingImageSoftOverlay} absolute inset-0`} />
                  </div>

                  <div className={`${styles.landingFloatCard} absolute bottom-5 right-[-6px] px-4 py-3`}>
                    <div className="flex items-center gap-3">
                      <span className={`${styles.landingAccentText} flex size-9 items-center justify-center rounded-full bg-emerald-50`}>
                        <FaSchool className="size-4" />
                      </span>
                      <div>
                        <p className={`${styles.landingAccentStrong} text-sm font-bold`}>Sekolah</p>
                        <p className={`${styles.landingAccentStrong} text-sm font-bold`}>Unggulan</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <h2 className={`${styles.landingInkText} font-heading text-3xl font-bold tracking-tight md:text-[2.8rem]`}>
                      Keistimewaan Aplikasi
                      <br />
                      Absensi SMK Citra Negara
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {excellencePoints.map((point, index) => (
                      <div key={point} className="flex items-start gap-3">
                        <span className={`${styles.landingAccentText} mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50`}>
                          {index === 0 ? (
                            <FaHeartbeat className="size-4" />
                          ) : index === 1 ? (
                            <FaClock className="size-4" />
                          ) : index === 2 ? (
                            <FaGraduationCap className="size-4" />
                          ) : (
                            <FaCheckCircle className="size-4" />
                          )}
                        </span>
                        <p className={`${styles.landingMutedText} pt-1 text-base font-medium md:text-lg`}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 px-2 py-4 md:px-4 md:py-5 xl:px-6">
              <div className="text-center">
                <div className={`${styles.landingMajorBadge} inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]`}>
                  <FaStar className="size-3.5" />
                  Jurusan Unggulan
                </div>
                <h2 className={`${styles.landingInkText} mt-4 text-[1.75rem] font-bold tracking-tight md:text-[2.25rem]`}>
                  Jurusan yang Terpantau Sistem
                </h2>
                <p className={`${styles.landingMutedText} mx-auto mt-3 max-w-[620px] text-sm leading-7 md:text-base`}>
                  Setiap jurusan dipresentasikan dengan tampilan visual yang lebih
                  modern, kontras, dan interaktif agar terasa premium saat dilihat.
                </p>
              </div>

              <div className="mx-auto mt-10 grid max-w-[1280px] gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {majors.map((major, index) => (
                  (() => {
                    const MajorIcon = majorIcons[major.name as keyof typeof majorIcons] as IconType;

                    return (
                  <article
                    key={major.name}
                    className={`${styles.landingMajorCard} group relative mx-auto w-full max-w-[310px] overflow-hidden transition duration-500 hover:-translate-y-2`}
                  >
                    <div className="relative h-[340px]">
                      <Image
                        src="/images/logos/cn_looks.jpg"
                        alt={`Jurusan ${major.name} di SMK Citra Negara`}
                        fill
                        className={`object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-[0.6deg] ${
                          index % 3 === 0
                            ? "object-[24%_center]"
                            : index % 3 === 1
                              ? "object-center"
                              : "object-[78%_center]"
                        }`}
                      />
                      <div className={`${styles.landingMajorOverlay} absolute inset-0`} />
                      <div className="absolute inset-x-0 top-0 p-4">
                        <div className="flex items-center justify-between">
                          <span className={`${styles.landingMajorTopBadge} inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]`}>
                            {major.label}
                          </span>
                          <span className={`${styles.landingMajorIconBadge} inline-flex size-10 items-center justify-center rounded-full transition duration-300 group-hover:bg-emerald-500/85`}>
                            <MajorIcon className="size-4" />
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className={`${styles.landingMajorPanel} px-5 py-4`}>
                          <p className="text-left text-[1.28rem] font-semibold tracking-tight text-white">
                            {major.name}
                          </p>
                          <p className="mt-1 text-left text-[12px] leading-6 text-white/72">
                            {major.detail}
                          </p>
                        </div>
                      </div>
                      <div className={`${styles.landingMajorDivider} pointer-events-none absolute inset-x-6 bottom-[92px] h-px`} />
                    </div>
                  </article>
                    );
                  })()
                ))}
              </div>
            </div>

            <div className={`${styles.landingReviewSection} mt-8 px-6 py-7 md:px-8 md:py-8 xl:px-12`}>
              <TestimonialsCarousel testimonials={testimonials} />
            </div>

            <div className="mt-12 px-2 md:px-4 xl:px-6">
              <div className={`${styles.landingCtaShell} relative overflow-hidden rounded-[42px] px-6 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12`}>
                <div className={`${styles.landingCtaGlow} absolute inset-0`} />
                <div className="absolute right-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-emerald-300/12 blur-3xl" />
                <div className="absolute bottom-[-90px] left-[46%] h-[220px] w-[220px] rounded-full bg-teal-200/10 blur-3xl" />

                <div className="relative grid items-center gap-8 lg:grid-cols-[0.86fr_1.14fr]">
                  <div className="relative mx-auto w-full max-w-[390px]">
                    <div className={`${styles.landingCtaImageFrame} absolute -left-4 -top-4 h-24 w-24 rounded-[28px]`} />
                    <div className={`${styles.landingCtaImageFrame} absolute -bottom-4 -right-4 h-24 w-24 rounded-[28px]`} />
                    <div className="absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-emerald-300/18 blur-2xl" />
                    <div className={`${styles.landingCtaImage} relative h-[220px] overflow-hidden md:h-[278px]`}>
                      <Image
                        src="/images/logos/cn_looks.jpg"
                        alt="Area sekolah untuk akses aplikasi absensi"
                        fill
                        className="object-cover object-center transition duration-700 hover:scale-105"
                      />
                      <div className={`${styles.landingCtaImageOverlay} absolute inset-0`} />
                    </div>
                  </div>

                  <div className="relative max-w-[640px]">
                    <div className={`${styles.landingCtaBadge} inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]`}>
                      Portal Absensi
                    </div>
                    <h2 className="mt-5 max-w-[580px] text-[2rem] font-bold leading-[1.06] tracking-tight text-white md:text-[3.2rem]">
                      Lakukan Absensi Atau
                      <br />
                      Manajemen Absensi Siswa Di Sini
                    </h2>
                    <p className="mt-4 max-w-[500px] text-sm leading-7 text-white/80 md:text-base">
                      Silahkan login untuk melakukan tugas sesuai keinginan Anda
                      dengan pengalaman yang lebih cepat, rapi, dan terintegrasi.
                    </p>

                    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <Link
                        href="/login"
                        className={`${styles.landingCtaButton} group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5`}
                      >
                        Mulai Aplikasi
                        <FaArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                      </Link>
                      <div className={`${styles.landingCtaPill} inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm`}>
                        <span className={`${styles.landingCtaPillIcon} flex size-8 items-center justify-center rounded-full`}>
                          <FaCheckCircle className="size-4" />
                        </span>
                        Siap untuk siswa, walas, BK, dan admin
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={`${styles.landingFooterShell} relative mt-10 overflow-hidden px-6 pb-10 pt-18 text-white md:px-8`}>
        <div className="absolute left-[8%] top-12 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-16 h-28 w-28 rounded-full bg-teal-300/8 blur-3xl" />
        <div className="mx-auto max-w-[1480px]">
          <div className={`${styles.landingFooterGlass} grid gap-10 rounded-b-[36px] px-8 py-10 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:items-start`}>
            <div>
              <div className="inline-flex items-center gap-3">
                <div className={`${styles.landingFooterBrandBadge} flex size-12 items-center justify-center rounded-2xl`}>
                  <FaSchool className="size-5" />
                </div>
                <div>
                  <p className={`${styles.landingFooterKicker} text-xs font-semibold uppercase tracking-[0.28em]`}>
                    Absensi Siswa
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">
                    SMK CITRA NEGARA
                  </h3>
                </div>
              </div>
              <p className="mt-5 max-w-[360px] text-sm leading-7 text-white/68">
                Platform absensi sekolah yang dirancang untuk membantu proses
                hadir, monitoring, dan manajemen siswa secara lebih modern.
              </p>
            </div>

            <div>
              <p className={`${styles.landingFooterKicker} text-sm font-semibold uppercase tracking-[0.24em]`}>
                Nilai Utama
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  "Absensi real-time dan terjadwal",
                  "Siap dipakai multi peran sekolah",
                  "Desain bersih, cepat, dan terintegrasi",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/72">
                    <span className={`${styles.landingFooterCheck} mt-1 flex size-6 items-center justify-center rounded-full`}>
                      <FaCheckCircle className="size-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={`${styles.landingFooterKicker} text-sm font-semibold uppercase tracking-[0.24em]`}>
                Hubungi
              </p>
              <div className="mt-5 flex items-center gap-3">
                {contactLinks.map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className={`${styles.landingFooterContact} inline-flex size-11 items-center justify-center rounded-2xl transition hover:-translate-y-0.5`}
                  >
                    <Icon className="size-4.5" />
                  </a>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-white/62">
                pilihan yang tepat di sekolah
                <br />
                yang M.A.N.T.A.P
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/56">
            <p>2026@ SMK CITRA NEGARA ALL RIGHT RESERVED</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
