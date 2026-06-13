"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/ui/premium-modal";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import type { AdminStudent } from "@/types/admin";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/guru-report-modal";
import { ArrowUpDown, ListChecks, ListFilter, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "active" | "inactive" | "entry_year";
type SortBy = "name" | "nis" | "entry_year";
type Columns = {
  nisn: boolean;
  gender: boolean;
  phone: boolean;
  address: boolean;
  parent: boolean;
  birth: boolean;
  entryYear: boolean;
};

// ─── PDF generator ────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

async function generateSiswaPdf(
  data: AdminStudent[],
  filterLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Siswa");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 14;

  const now = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Header band
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(mx, 10, W - mx * 2, 20, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", mx + 5, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Sistem Informasi Absensi Sekolah", mx + 5, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN DATA SISWA", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 35;
  const pills = [
    `Filter: ${filterLabel}`,
    `Total: ${data.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  let pillX = mx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  pills.forEach((text) => {
    const tw = doc.getTextWidth(text);
    const pw = tw + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(110, 231, 183);
    doc.setLineWidth(0.3);
    doc.roundedRect(pillX, metaY, pw, 5, 1.2, 1.2, "FD");
    doc.text(text, pillX + 4, metaY + 3.6);
    pillX += pw + 4;
  });

  // Table columns
  const head: string[][] = [["No", "Nama Siswa", "NIS"]];
  if (columns.nisn) head[0].push("NISN");
  if (columns.gender) head[0].push("Jenis Kelamin");
  if (columns.phone) head[0].push("No. Telepon");
  if (columns.address) head[0].push("Alamat");
  if (columns.parent) head[0].push("Orang Tua");
  if (columns.birth) head[0].push("Tempat, Tgl. Lahir");
  if (columns.entryYear) head[0].push("Angkatan");

  const body = data.map((s, i) => {
    const row: string[] = [String(i + 1), s.name, s.nis];
    if (columns.nisn) row.push(s.nisn || "—");
    if (columns.gender)
      row.push(
        s.gender === "MALE" ? "Laki-laki" : s.gender === "FEMALE" ? "Perempuan" : "—",
      );
    if (columns.phone) row.push(s.phone || "—");
    if (columns.address) row.push(s.address || "—");
    if (columns.parent) {
      const parent = [s.parent_name, s.parent_phone].filter(Boolean).join("\n") || "—";
      row.push(parent);
    }
    if (columns.birth) {
      const birthInfo = s.birth_place_date || [s.birth_place, formatDate(s.birth_date)].filter(Boolean).join(", ") || "—";
      row.push(birthInfo);
    }
    if (columns.entryYear) row.push(String(s.entry_year));
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    styles: {
      fontSize: 8,
      cellPadding: { horizontal: 4, vertical: 4 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      textColor: [51, 65, 85],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [236, 253, 245],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(mx, H - 8, W - mx, H - 8);
    doc.text("Laporan Data Siswa — ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Siswa-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AdminStudent[];
};

export function SiswaReportModal({ open, onOpenChange, students }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [columns, setColumns] = useState<Columns>({
    nisn: false,
    gender: false,
    phone: false,
    address: false,
    parent: false,
    birth: false,
    entryYear: true,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const entryYears = useMemo(
    () =>
      [...new Set(students.map((s) => s.entry_year))].sort((a, b) => b - a),
    [students],
  );

  const counts = useMemo(
    () => ({
      all: students.length,
      active: students.filter((s) => s.is_active).length,
      inactive: students.filter((s) => !s.is_active).length,
    }),
    [students],
  );

  const q1FullyAnswered =
    filterStatus !== null &&
    (filterStatus !== "entry_year" || selectedYear !== null);
  const showQ2 = q1FullyAnswered;
  const canDownload = q1FullyAnswered && sortBy !== null;

  const filteredCount = useMemo(() => {
    if (!q1FullyAnswered) return 0;
    if (filterStatus === "active") return counts.active;
    if (filterStatus === "inactive") return counts.inactive;
    if (filterStatus === "entry_year" && selectedYear !== null)
      return students.filter((s) => s.entry_year === selectedYear).length;
    return counts.all;
  }, [q1FullyAnswered, filterStatus, selectedYear, counts, students]);

  function resetState() {
    setFilterStatus(null);
    setSelectedYear(null);
    setColumns({
      nisn: false,
      gender: false,
      phone: false,
      address: false,
      parent: false,
      birth: false,
      entryYear: true,
    });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    const filtered = students.filter((s) => {
      if (filterStatus === "active") return s.is_active;
      if (filterStatus === "inactive") return !s.is_active;
      if (filterStatus === "entry_year") return s.entry_year === selectedYear;
      return true;
    });
    if (filtered.length === 0) {
      toast.warning("Tidak ada data siswa yang sesuai filter.");
      return;
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "id");
      if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
      if (sortBy === "entry_year") return b.entry_year - a.entry_year;
      return 0;
    });
    const filterLabel =
      filterStatus === "active" ? "Aktif Saja" :
      filterStatus === "inactive" ? "Non-aktif Saja" :
      filterStatus === "entry_year" ? `Angkatan ${selectedYear}` : "Semua Siswa";
    const sortLabel =
      sortBy === "name" ? "Nama (A–Z)" :
      sortBy === "nis" ? "NIS" : "Angkatan (Terbaru)";

    setGenerating(true);
    try {
      await generateSiswaPdf(sorted, filterLabel, sortLabel, columns);
    } catch {
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Cetak Laporan Siswa"
      description="Sesuaikan preferensi laporan, lalu unduh PDF siap cetak dalam hitungan detik."
      icon={Printer}
      className="sm:!max-w-[620px]"
    >
      <div className="space-y-4">
        {/* Q1 — Filter */}
        <QuestionBlock
          icon={ListFilter}
          label="Saring berdasarkan"
          answered={q1FullyAnswered}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={filterStatus === "all"}
              label="Semua Siswa"
              badge={`${counts.all}`}
              onClick={() => { setFilterStatus("all"); setSelectedYear(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "active"}
              label="Aktif Saja"
              badge={`${counts.active}`}
              onClick={() => { setFilterStatus("active"); setSelectedYear(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "inactive"}
              label="Non-aktif"
              badge={`${counts.inactive}`}
              onClick={() => { setFilterStatus("inactive"); setSelectedYear(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "entry_year"}
              label="Per Angkatan"
              onClick={() => { setFilterStatus("entry_year"); setSelectedYear(null); setSortBy(null); }}
            />
          </div>

          {/* Q1b — Year picker (appears only when "Per Angkatan" selected) */}
          <AnimatePresence>
            {filterStatus === "entry_year" && (
              <motion.div
                key="year-picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="mt-3 mb-2 text-[0.78rem] font-semibold text-slate-500 uppercase tracking-wide">
                  Pilih angkatan:
                </p>
                <div className="flex flex-wrap gap-2">
                  {entryYears.map((year) => {
                    const count = students.filter((s) => s.entry_year === year).length;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => { setSelectedYear(year); setSortBy(null); }}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                          selectedYear === year
                            ? "border-emerald-400 bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                        )}
                      >
                        Angkatan {year}
                        <span className={cn("ml-1.5 text-xs", selectedYear === year ? "opacity-80" : "opacity-50")}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </QuestionBlock>

        {/* Q2 — Columns */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={ListChecks}
                label="Kolom yang ingin ditampilkan"
                answered
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & NIS" badge="wajib" />
                  <ReportCheckbox
                    checked={columns.nisn}
                    onChange={(v) => setColumns((c) => ({ ...c, nisn: v }))}
                    label="NISN"
                  />
                  <ReportCheckbox
                    checked={columns.gender}
                    onChange={(v) => setColumns((c) => ({ ...c, gender: v }))}
                    label="Jenis Kelamin"
                  />
                  <ReportCheckbox
                    checked={columns.phone}
                    onChange={(v) => setColumns((c) => ({ ...c, phone: v }))}
                    label="No. Telepon"
                  />
                  <ReportCheckbox
                    checked={columns.address}
                    onChange={(v) => setColumns((c) => ({ ...c, address: v }))}
                    label="Alamat"
                  />
                  <ReportCheckbox
                    checked={columns.parent}
                    onChange={(v) => setColumns((c) => ({ ...c, parent: v }))}
                    label="Orang Tua"
                  />
                  <ReportCheckbox
                    checked={columns.birth}
                    onChange={(v) => setColumns((c) => ({ ...c, birth: v }))}
                    label="Tempat, Tgl. Lahir"
                  />
                  <ReportCheckbox
                    checked={columns.entryYear}
                    onChange={(v) => setColumns((c) => ({ ...c, entryYear: v }))}
                    label="Angkatan"
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Sort */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.09 }}
            >
              <QuestionBlock
                icon={ArrowUpDown}
                label="Urutkan data berdasarkan"
                answered={sortBy !== null}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportRadio
                    selected={sortBy === "name"}
                    label="Nama (A–Z)"
                    onClick={() => setSortBy("name")}
                  />
                  <ReportRadio
                    selected={sortBy === "nis"}
                    label="NIS"
                    onClick={() => setSortBy("nis")}
                  />
                  <ReportRadio
                    selected={sortBy === "entry_year"}
                    label="Angkatan"
                    onClick={() => setSortBy("entry_year")}
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.8rem] border-slate-200 px-5 text-[0.88rem] text-slate-600"
            onClick={() => handleClose(false)}
          >
            Batal
          </Button>
          <button
            type="button"
            disabled={!canDownload || generating}
            onClick={handleDownload}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
              canDownload && !generating
                ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            {generating ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Membuat PDF...
              </>
            ) : (
              <>
                <Printer className="size-4" />
                {canDownload
                  ? `Download PDF (${filteredCount} siswa)`
                  : "Download PDF"}
              </>
            )}
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}
