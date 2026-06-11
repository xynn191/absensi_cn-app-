"use client";

import {
  AttendanceStatusPill,
  classFilterOptions,
  formatCheckInTime,
  formatFriendlyDate,
  formatGender,
  getInitials,
  SubmissionStatusPill,
} from "@/components/dashboard/bk-common";
import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { KpiCard } from "@/components/dashboard/admin/kpi-card";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSurfaceClassName,
} from "@/components/ui/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import {
  createBKCounselingNote,
  getBKStudentDetail,
  getBKStudentsOverview,
} from "@/services/staff.service";
import type { StaffBKStudentDetail } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookHeart,
  Eye,
  GraduationCap,
  LayoutPanelTop,
  NotebookPen,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

const riskOptions = [
  { value: "Semua", label: "Semua risiko" },
  { value: "need_attention", label: "Perlu Perhatian" },
  { value: "late", label: "Ada Telat" },
  { value: "alpha", label: "Ada Alfa" },
  { value: "counseling", label: "Punya Catatan BK" },
  { value: "stable", label: "Stabil" },
];

export function BKStudentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Semua");
  const [riskFilter, setRiskFilter] = useState("Semua");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const overviewQuery = useQuery({
    queryKey: ["bk-students-overview", classFilter, riskFilter, debouncedQuery],
    queryFn: () =>
      getBKStudentsOverview({
        class_id: classFilter === "Semua" ? "" : classFilter,
        risk: riskFilter === "Semua" ? "" : riskFilter,
        query: debouncedQuery.trim(),
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["bk-student-detail", selectedStudentId],
    queryFn: () => getBKStudentDetail(selectedStudentId ?? ""),
    enabled: Boolean(selectedStudentId),
  });

  const createNoteMutation = useMutation({
    mutationFn: async (payload: { title: string; note: string }) => {
      const targetId = noteTargetId ?? selectedStudentId;
      if (!targetId) throw new Error("Siswa belum dipilih.");
      return createBKCounselingNote(targetId, payload);
    },
    onSuccess: () => {
      toast.success("Catatan BK berhasil dibuat.");
      void queryClient.invalidateQueries({ queryKey: ["bk-student-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-students-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] });
      setNoteTargetId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const counts = overview?.counts ?? {
    total: 0,
    active: 0,
    need_attention: 0,
    total_late: 0,
    total_alpha: 0,
    with_counseling_notes: 0,
  };
  const students = overview?.students ?? [];
  const classes = overview?.classes ?? [];

  const kpiCards = [
    {
      label: "Total Siswa",
      value: String(counts.total),
      subtitle: "Siswa lintas kelas",
      icon: UsersRound,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Perlu Perhatian",
      value: String(counts.need_attention),
      subtitle: "Butuh tindak lanjut",
      icon: ShieldAlert,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Akumulasi Alfa",
      value: String(counts.total_alpha),
      subtitle: "Catatan alfa siswa",
      icon: TriangleAlert,
      accentClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Catatan BK",
      value: String(counts.with_counseling_notes),
      subtitle: "Siswa sudah dibina",
      icon: BookHeart,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKStudentsTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    BK Students Workspace
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
                      Monitoring Siswa
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Pantau siswa lintas kelas, lihat pola telat atau alfa, dan
                      buka catatan pembinaan dari satu tabel kerja BK.
                    </p>
                  </div>
                </div>
                <div className="lg:w-[390px]">
                  <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700">
                      <GraduationCap className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {classes.length} kelas aktif
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        Monitoring lintas rombel
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={classFilter}
                    onValueChange={setClassFilter}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
                <div className="w-full sm:w-[230px]">
                  <RadixSelectField
                    value={riskFilter}
                    onValueChange={setRiskFilter}
                    options={riskOptions}
                    placeholder="Pilih risiko"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </div>

              <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                  <SlidersHorizontal className="size-4" />
                </span>
                <Search className="size-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari siswa, NIS, kelas, telepon"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80"
            >
              <div className="overflow-x-auto bg-white/92">
                {overviewQuery.isLoading ? (
                  <TableSkeleton columns={8} />
                ) : overviewQuery.error ? (
                  <div className="p-5">
                    <EmptyState
                      icon={ShieldAlert}
                      title="Data siswa BK belum bisa dimuat"
                      description={overviewQuery.error.message}
                    />
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={UsersRound}
                      title="Belum ada siswa untuk filter ini"
                      description="Ubah filter kelas, risiko, atau pencarian untuk melihat data siswa."
                    />
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Siswa</th>
                        <th className="px-5 py-4 font-semibold">Kelas</th>
                        <th className="px-5 py-4 font-semibold">Identitas</th>
                        <th className="px-5 py-4 text-center font-semibold">Telat</th>
                        <th className="px-5 py-4 text-center font-semibold">Alfa</th>
                        <th className="px-5 py-4 text-center font-semibold">Izin/Sakit</th>
                        <th className="px-5 py-4 text-center font-semibold">Status</th>
                        <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 bg-white/92">
                      {students.map((student) => (
                        <tr key={student.id} className="transition-colors hover:bg-emerald-50/45">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-11 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-sm font-semibold text-emerald-800">
                                {getInitials(student.name)}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.nis}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-slate-800">
                              {student.class_name || "-"}
                            </p>
                            <p className="text-xs">{student.school_year_name || "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p>{formatGender(student.gender)}</p>
                            <p className="text-xs">{student.phone || "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge value={student.late_count} tone="warning" />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge value={student.alpha_count} tone="danger" />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge
                              value={student.permission_count + student.sick_count}
                              tone="info"
                            />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <StatusBadge active={student.is_active} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                                onClick={() => setSelectedStudentId(student.id)}
                              >
                                <Eye className="size-4.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                onClick={() => setNoteTargetId(student.id)}
                              >
                                <NotebookPen className="size-4.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </section>

          <StudentDetailModal
            open={Boolean(selectedStudentId)}
            onOpenChange={(open) => {
              if (!open) setSelectedStudentId(null);
            }}
            detail={detailQuery.data ?? null}
            isLoading={detailQuery.isLoading}
            errorMessage={detailQuery.error?.message}
            onCreateNote={(studentId) => setNoteTargetId(studentId)}
          />

          {noteTargetId ? (
            <CounselingNoteCreateModal
              key={noteTargetId}
              open
              onOpenChange={(open) => {
                if (!open) setNoteTargetId(null);
              }}
              isPending={createNoteMutation.isPending}
              onSubmit={(payload) => createNoteMutation.mutate(payload)}
            />
          ) : null}
        </>
      )}
    </StaffShell>
  );
}

function StudentDetailModal({
  open,
  onOpenChange,
  detail,
  isLoading,
  errorMessage,
  onCreateNote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: StaffBKStudentDetail | null;
  isLoading: boolean;
  errorMessage?: string;
  onCreateNote: (studentId: string) => void;
}) {
  const student = detail?.student;

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={student ? `Detail ${student.name}` : "Detail Siswa"}
      description="Lihat identitas, riwayat absensi, pengajuan, dan catatan pembinaan siswa."
      icon={UserRound}
      className="sm:!max-w-[1040px]"
    >
      {errorMessage ? (
        <EmptyState icon={ShieldAlert} title="Detail belum bisa dimuat" description={errorMessage} />
      ) : isLoading || !detail || !student ? (
        <TableSkeleton columns={3} />
      ) : (
        <div className="grid gap-5">
          <div className="grid items-start gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-base font-semibold text-emerald-800">
                  {getInitials(student.name)}
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                    {student.name}
                  </h3>
                  <div className="grid gap-2 pt-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>NIS: {student.nis}</p>
                    <p>NISN: {student.nisn || "-"}</p>
                    <p>Kelas: {student.class_name || "-"}</p>
                    <p>Gender: {formatGender(student.gender)}</p>
                    <p>Telepon: {student.phone || "-"}</p>
                    <p>Tahun ajaran: {student.school_year_name || "-"}</p>
                  </div>
                  <Button
                    type="button"
                    className="mt-2 h-11 rounded-[16px] bg-emerald-700 px-4 text-white hover:bg-emerald-800"
                    onClick={() => onCreateNote(student.id)}
                  >
                    <NotebookPen className="size-4" />
                    Tambah Catatan BK
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MiniStatCard label="Hadir" value={detail.attendance_summary.present} tone="success" />
              <MiniStatCard label="Telat" value={detail.attendance_summary.late} tone="warning" />
              <MiniStatCard label="Alfa" value={detail.attendance_summary.alpha} tone="danger" />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <DetailListCard title="Riwayat Absensi" icon={BadgeCheck}>
              {detail.recent_attendance.length === 0 ? (
                <EmptyState icon={BadgeCheck} title="Belum ada absensi" description="Riwayat absensi siswa akan tampil di sini." compact />
              ) : (
                detail.recent_attendance.slice(0, 6).map((record) => (
                  <div key={record.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatFriendlyDate(record.attendance_date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCheckInTime(record.check_in_at)}
                        </p>
                      </div>
                      <AttendanceStatusPill status={record.status} />
                    </div>
                  </div>
                ))
              )}
            </DetailListCard>

            <DetailListCard title="Pengajuan" icon={ShieldAlert}>
              {detail.recent_submissions.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="Belum ada pengajuan" description="Izin atau sakit siswa akan tampil di sini." compact />
              ) : (
                detail.recent_submissions.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{item.reason}</p>
                      </div>
                      <SubmissionStatusPill status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </DetailListCard>

            <DetailListCard title="Catatan BK" icon={BookHeart}>
              {detail.counseling_notes.length === 0 ? (
                <EmptyState icon={BookHeart} title="Belum ada catatan" description="Catatan pembinaan siswa akan tampil di sini." compact />
              ) : (
                detail.counseling_notes.slice(0, 6).map((note) => (
                  <div key={note.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{note.note}</p>
                  </div>
                ))
              )}
            </DetailListCard>
          </div>
        </div>
      )}
    </PremiumModal>
  );
}

function CounselingNoteCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { title: string; note: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"title" | "note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"title" | "note"> = {};
    validateRequired(nextErrors, "title", title, "Judul catatan");
    validateRequired(nextErrors, "note", note, "Catatan pembinaan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ title, note });
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Catatan BK"
      description="Catat tindak lanjut pembinaan siswa agar histori konseling tetap rapi."
      icon={NotebookPen}
      className="sm:!max-w-[720px]"
    >
      <div className="grid gap-5">
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Judul catatan</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Follow up keterlambatan"
            className="h-12 rounded-[18px] border border-slate-300/80 bg-white/90 px-4 text-sm text-slate-700 outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:bg-emerald-50/25 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/80"
          />
          <FieldError message={errors.title} />
        </div>
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Catatan pembinaan</label>
          <p className={premiumModalHelperClassName}>
            Tulis ringkasan observasi, tindak lanjut, atau rencana komunikasi.
          </p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tulis catatan BK"
            className="min-h-[150px] rounded-[20px]"
          />
          <FieldError message={errors.note} />
        </div>
        <div className={premiumModalActionsClassName}>
          <Button type="button" variant="outline" className="h-12 rounded-[18px] px-5" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white hover:bg-emerald-800"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Menyimpan..." : "Simpan Catatan"}
          </Button>
        </div>
      </div>
    </PremiumModal>
  );
}

function DetailListCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookHeart;
  children: ReactNode;
}) {
  return (
    <div className={`${premiumModalSurfaceClassName} p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <Icon className="size-4.5 text-emerald-600" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MiniStatCard({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-100/90"
      : tone === "warning"
        ? "border-amber-200 bg-amber-100/90"
        : "border-rose-200 bg-rose-100/90";

  return (
    <div className={`rounded-[20px] border px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}

function CountBadge({ value, tone }: { value: number; tone: "warning" | "danger" | "info" }) {
  const className =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-sky-200 bg-sky-50 text-sky-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div
          key={`bk-students-loading-${rowIndex}`}
          className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <div key={`bk-students-loading-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

function getBKStudentsTitle() {
  return "Student Monitoring Dashboard";
}
