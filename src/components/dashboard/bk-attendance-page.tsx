"use client";

import dynamic from "next/dynamic";
import {
  AttendanceStatusPill,
  classFilterOptions,
  formatCheckInTime,
  formatFriendlyDate,
  normalizeAttachmentUrl,
  ReviewStatusPill,
} from "@/components/dashboard/bk-common";
import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { KpiCard } from "@/components/dashboard/admin/kpi-card";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FieldError } from "@/components/ui/field-error";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
} from "@/components/ui/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import { getBKAttendanceOverview, reviewBKAttendance } from "@/services/staff.service";
import type { StaffAttendanceRecord, StaffAttendanceReviewPayload } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCheck,
  FileImage,
  FileSearch,
  GraduationCap,
  Image as ImageIcon,
  LayoutPanelTop,
  Printer,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BKAbsensiReportModal = dynamic(
  () => import("@/components/reports/bk-absensi-report-modal").then((module) => module.BKAbsensiReportModal),
  { ssr: false },
);

const statusOptions = [
  { value: "Semua", label: "Semua status" },
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

const reviewStatusOptions = [
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export function BKAttendancePage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [classFilter, setClassFilter] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reviewTarget, setReviewTarget] = useState<StaffAttendanceRecord | null>(null);
  const [proofTarget, setProofTarget] = useState<StaffAttendanceRecord | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const dateValue = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const overviewQuery = useQuery({
    queryKey: ["bk-attendance-overview", dateValue, statusFilter, classFilter, debouncedQuery],
    queryFn: () =>
      getBKAttendanceOverview({
        date: dateValue,
        status: statusFilter === "Semua" ? "" : statusFilter,
        class_id: classFilter === "Semua" ? "" : classFilter,
        query: debouncedQuery.trim(),
      }),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: StaffAttendanceReviewPayload) => {
      if (!reviewTarget) throw new Error("Record absensi tidak ditemukan.");
      return reviewBKAttendance(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Review absensi berhasil disimpan.");
      void queryClient.invalidateQueries({ queryKey: ["bk-attendance-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] });
      setReviewTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const summary = overview?.summary ?? {
    present: 0,
    late: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
    repeated_late: [],
    repeated_alpha: [],
  };
  const records = overview?.records ?? [];
  const classes = overview?.classes ?? [];
  const reviewedCount = records.filter((record) => Boolean(record.verified_at)).length;
  const pendingReviewCount = records.filter(
    (record) => ["telat", "alfa"].includes(record.status.toLowerCase()) && !record.verified_at,
  ).length;

  const kpiCards = [
    {
      label: "Total Record",
      value: String(records.length),
      subtitle: "Absensi tanggal ini",
      icon: FileSearch,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Terlambat",
      value: String(summary.late),
      subtitle: "Perlu perhatian BK",
      icon: CalendarClock,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Alfa",
      value: String(summary.alpha),
      subtitle: "Butuh tindak lanjut",
      icon: TriangleAlert,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Diverifikasi",
      value: String(reviewedCount),
      subtitle: "Sudah direview",
      icon: CheckCheck,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  const focusItems = [
    ...(summary.repeated_alpha ?? []).map((item) => ({ ...item, tone: "ALFA" as const })),
    ...(summary.repeated_late ?? []).map((item) => ({ ...item, tone: "TELAT" as const })),
  ].slice(0, 8);

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKAttendanceTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="relative space-y-5 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    BK Attendance Workspace
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
                      Absensi Lintas Kelas
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Pantau telat dan alfa lintas kelas, buka bukti foto, dan
                      review record yang perlu tindak lanjut BK.
                    </p>
                  </div>
                </div>
                <div className="flex justify-start xl:justify-end">
                  <Button
                    variant="outline"
                    className="h-14 rounded-[22px] border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] px-5 text-sm font-semibold text-violet-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-violet-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(237,233,254,1)_100%)] hover:text-violet-950"
                    onClick={() => setReportModalOpen(true)}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.2)]">
                      <Printer className="size-4" />
                    </span>
                    Cetak Laporan
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.04 }}
                  >
                    <KpiCard {...item} />
                  </motion.div>
                ))}
              </div>

              <div className="text-xs font-medium text-slate-400">
                {records.length} record tercatat dengan {pendingReviewCount} item menunggu review BK.
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <AttendanceDateButton selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={classFilter}
                    onValueChange={setClassFilter}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={statusOptions}
                    placeholder="Pilih status"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <Search className="size-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari siswa, NIS, status, catatan"
                    className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]"
                  />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/92"
            >
              {overviewQuery.isLoading ? (
                <TableSkeleton />
              ) : overviewQuery.error ? (
                <div className="p-5">
                  <EmptyState icon={ShieldAlert} title="Absensi BK belum bisa dimuat" description={overviewQuery.error.message} />
                </div>
              ) : records.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={FileSearch} title="Belum ada record absensi" description="Ubah tanggal, kelas, status, atau pencarian untuk melihat data absensi." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Siswa</th>
                        <th className="px-5 py-4 font-semibold">Kelas</th>
                        <th className="px-5 py-4 font-semibold">Check-in</th>
                        <th className="px-5 py-4 text-center font-semibold">Status</th>
                        <th className="px-5 py-4 text-center font-semibold">Review</th>
                        <th className="px-5 py-4 font-semibold">Catatan</th>
                        <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 bg-white/92">
                      {records.map((record) => (
                        <tr key={record.id} className="transition-colors hover:bg-emerald-50/45">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{record.student_name}</p>
                            <p className="text-xs text-slate-500">{record.nis}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{record.class_name}</td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-slate-800">{formatFriendlyDate(record.attendance_date)}</p>
                            <p className="text-xs">{formatCheckInTime(record.check_in_at)}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <AttendanceStatusPill status={record.status} />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <ReviewStatusPill reviewed={Boolean(record.verified_at)} />
                          </td>
                          <td className="px-5 py-4">
                            <p className="line-clamp-2 max-w-[280px] text-sm leading-6 text-slate-500">
                              {record.verification_note || record.notes || "-"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                                disabled={!record.photo_url}
                                onClick={() => setProofTarget(record)}
                              >
                                <FileImage className="size-4.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                onClick={() => setReviewTarget(record)}
                              >
                                <BadgeCheck className="size-4.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </section>

          <section className="rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_20px_48px_rgba(28,77,61,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Fokus Monitoring BK</h3>
                <p className="mt-1 text-sm text-slate-500">Siswa dengan pola telat atau alfa berulang.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Prioritas</span>
            </div>
            <div className="mt-5 grid gap-3 grid-cols-2 xl:grid-cols-4">
              {focusItems.length === 0 ? (
                <EmptyState icon={BadgeCheck} title="Belum ada fokus monitoring" description="Pola telat atau alfa berulang akan tampil di sini." compact />
              ) : (
                focusItems.map((item, index) => (
                  <motion.article
                    key={`${item.student_id}-${item.tone}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="rounded-[22px] border border-slate-100 bg-slate-50/92 p-4"
                  >
                    <p className="font-semibold text-slate-900">{item.student_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.nis} - {item.class_name}</p>
                    <p className="mt-3 text-xs font-semibold text-rose-700">{item.occurrences} catatan {item.tone}</p>
                  </motion.article>
                ))
              )}
            </div>
          </section>

          <BKAbsensiReportModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            classes={classes}
          />

          {reviewTarget ? (
            <AttendanceReviewModal
              key={reviewTarget.id}
              record={reviewTarget}
              onOpenChange={(open) => {
                if (!open) setReviewTarget(null);
              }}
              isPending={reviewMutation.isPending}
              onSubmit={(payload) => reviewMutation.mutate(payload)}
            />
          ) : null}
          <AttendanceProofModal
            record={proofTarget}
            onOpenChange={(open) => {
              if (!open) setProofTarget(null);
            }}
          />
        </>
      )}
    </StaffShell>
  );
}

function AttendanceDateButton({ selectedDate, onSelectDate }: { selectedDate?: Date; onSelectDate: (date?: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 rounded-[22px] border-slate-300/80 bg-white/84 px-4 text-left text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:bg-emerald-50/70 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tanggal</p>
            <p className="text-sm font-medium text-slate-700">{selectedDate ? formatFriendlyDate(selectedDate) : "Pilih tanggal"}</p>
          </div>
          <ArrowUpRight className="size-4 text-emerald-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
        <PopoverHeader className="px-2 pt-1 pb-2">
          <PopoverTitle className="text-sm font-semibold text-slate-900">Pilih tanggal absensi</PopoverTitle>
        </PopoverHeader>
        <Calendar mode="single" selected={selectedDate} onSelect={(date) => { onSelectDate(date); setOpen(false); }} locale={localeID} buttonVariant="ghost" />
      </PopoverContent>
    </Popover>
  );
}

function AttendanceReviewModal({
  record,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  record: StaffAttendanceRecord;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: StaffAttendanceReviewPayload) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(record.status.toLowerCase());
  const [verificationNote, setVerificationNote] = useState(
    record.verification_note || record.notes || "",
  );
  const [errors, setErrors] = useState<FieldErrors<"status" | "verification_note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "verification_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    validateRequired(nextErrors, "verification_note", verificationNote, "Catatan review BK");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, verification_note: verificationNote });
  };

  return (
    <PremiumModal
      open
      onOpenChange={onOpenChange}
      title={record ? `Review ${record.student_name}` : "Review Absensi"}
      description="Perbarui status dan catatan verifikasi dari perspektif BK."
      icon={BadgeCheck}
      className="sm:!max-w-[760px]"
    >
      <div className="grid gap-5">
          <div className="rounded-[22px] border border-emerald-100/70 bg-white/92 p-4">
            <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
            <p className="mt-1 text-sm text-slate-500">{record.nis} - {record.class_name}</p>
            <p className="mt-1 text-sm text-slate-500">{formatFriendlyDate(record.attendance_date)} - {formatCheckInTime(record.check_in_at)}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Status final</label>
              <RadixSelectField value={status} onValueChange={setStatus} options={reviewStatusOptions} placeholder="Pilih status final" triggerClassName="h-12 rounded-[18px]" />
              <FieldError message={errors.status} />
            </div>
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Verifikasi</label>
              <div className="flex h-12 items-center rounded-[18px] border border-emerald-100/80 bg-white/90 px-4 text-sm text-slate-600">
                {record.verified_at ? "Sudah pernah direview" : "Belum pernah direview"}
              </div>
            </div>
          </div>

          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Catatan review BK</label>
            <p className={premiumModalHelperClassName}>Catatan ini membantu membaca alasan perubahan status.</p>
            <Textarea value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} placeholder="Tulis catatan review BK" className="min-h-[140px] rounded-[20px]" />
            <FieldError message={errors.verification_note} />
          </div>

          <div className={premiumModalActionsClassName}>
            <Button type="button" variant="outline" className="h-12 rounded-[18px] px-5" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button
              type="button"
              className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Menyimpan..." : "Simpan Review"}
            </Button>
          </div>
      </div>
    </PremiumModal>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={`bk-attendance-loading-${rowIndex}`} className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-7">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <div key={`bk-attendance-loading-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

function AttendanceProofModal({
  record,
  onOpenChange,
}: {
  record: StaffAttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const photoUrl = record?.photo_url ? normalizeAttachmentUrl(record.photo_url) : undefined;

  return (
    <PremiumModal
      open={Boolean(record)}
      onOpenChange={onOpenChange}
      title={record ? `Bukti ${record.student_name}` : "Bukti Absensi"}
      description="Preview foto absensi siswa tanpa membuka tab baru."
      icon={ImageIcon}
      className="sm:!max-w-[760px]"
    >
      {record ? (
        <div className="grid gap-4">
          <div className="rounded-[22px] border border-emerald-100/70 bg-white/92 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
                <p className="text-sm text-slate-500">
                  {record.nis} • {record.class_name}
                </p>
                <p className="text-sm text-slate-500">
                  {formatFriendlyDate(record.attendance_date)} • {formatCheckInTime(record.check_in_at)}
                </p>
              </div>
              <AttendanceStatusPill status={record.status} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-emerald-100/80 bg-[linear-gradient(180deg,#f8fffb_0%,#eefbf4_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`Bukti absensi ${record.student_name}`}
                className="max-h-[62vh] w-full rounded-[20px] object-contain"
              />
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="Bukti foto belum tersedia"
                description="Record ini belum memiliki foto absensi yang bisa ditampilkan."
                compact
              />
            )}
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

function getBKAttendanceTitle() {
  return "Attendance Review Dashboard";
}
