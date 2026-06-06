export const siteConfig = {
  name: "Absensi CN",
  description:
    "Frontend web absensi sekolah untuk SMK Citra Negara dengan role siswa, walas, BK, dan admin.",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
};
