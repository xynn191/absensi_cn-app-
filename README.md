# Absensi CN App

Frontend `Absensi CN`, sistem absensi sekolah untuk `SMK Citra Negara`.

Project ini dibangun sebagai aplikasi `Next.js` yang fokus pada pengalaman pengguna, tampilan dashboard per role, form absensi, riwayat kehadiran, serta integrasi ke backend `Absensi CN API`.

## Kepemilikan dan Kredit

Website absensi ini dibuat oleh `Randhu Paksi Membumi`.

Copyright 2026 `Randhu Paksi Membumi`. All rights reserved.

Project ini dibuat untuk kebutuhan ujian praktik SMK dan portfolio. Penggunaan untuk operasional sekolah, distribusi ulang, rebranding, penghapusan atribusi pembuat, atau pengembangan turunan membutuhkan izin tertulis dari `Randhu Paksi Membumi`.

## Tentang Project

`Absensi CN App` adalah sisi frontend dari arsitektur full stack `Absensi CN`.

Role utama yang akan didukung:

- `Siswa`
- `Wali Kelas`
- `BK`
- `Admin`

Flow login saat ini memakai konsep `portal-aware login`:

- `Portal Siswa` untuk akun dengan role `STUDENT`
- `Portal Staff` untuk akun dengan role `HOMEROOM_TEACHER`, `BK`, dan `ADMIN`

Frontend akan menyesuaikan field login berdasarkan portal:

- portal siswa: `NIS + password`
- portal staff: `username + password`

## Tujuan Frontend

- Menyediakan UI modern, clean, dan premium untuk sistem absensi sekolah
- Menjadi dashboard yang berbeda per role
- Menyediakan form dan tabel yang mudah dipahami
- Menjadi client utama untuk integrasi dengan REST API backend

## Stack

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `Radix UI`
- `TanStack Query`
- `TanStack Table`
- `React Hook Form`
- `Zod`
- `Motion`
- `Sonner`

## Status Saat Ini

Yang sudah tersedia:

- fondasi project frontend
- struktur folder yang rapi dan modular
- halaman login premium
- toggle portal login siswa/staff
- validasi form login
- integrasi dasar ke endpoint auth backend

Yang akan dilanjutkan:

- penyimpanan JWT di client
- proteksi route dashboard
- dashboard per role
- halaman absensi, riwayat, izin/sakit, dan monitoring

## Struktur Folder

```text
src/
  app/
  components/
    auth/
    forms/
    ui/
  providers/
  services/
  lib/
    validations/
    constants/
    config/
  types/
public/
  images/
    logos/
```

## Menjalankan Project

1. Install dependency

```bash
npm install
```

2. Jalankan development server

```bash
npm run dev
```

3. Buka di browser

```bash
http://localhost:3000
```

## Script

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Konfigurasi Environment

Buat file `.env` berdasarkan `.env.example`.

Contoh variabel yang dipakai frontend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Integrasi Backend

Frontend ini dirancang untuk terhubung ke repository backend:

- `absensi-cn-api`

Pastikan backend aktif di environment lokal agar flow login dan request API bisa berjalan normal.

## Catatan

Project ini dijaga tetap realistis untuk tugas sekolah:

- tidak over-engineering
- fokus pada core flow absensi
- role dan permission dibuat jelas
- tetap disusun dengan standar yang rapi dan mudah dikembangkan
