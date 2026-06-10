"use client";

import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { KpiCard } from "@/components/dashboard/admin/kpi-card";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { walasSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { Badge } from "@/components/ui/badge";
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
import { resolveApiAssetUrl } from "@/lib/config/site";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import {
  getTeacherHomeroomSubmissionsOverview,
  reviewTeacherHomeroomSubmission,
} from "@/services/staff.service";
import type { StaffHomeroomSubmissionOverview, StaffSubmission } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDisplayLabel } from "@/lib/utils";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  FileClock,
  FileImage,
  FileSearch,
  GraduationCap,
  LayoutPanelTop,
  PencilLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const submissionStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "menunggu", label: "Menunggu" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const submissionTypeOptions = [
  { value: "Semua", label: "Semua tipe" },
  { value: "IZIN", label: "Izin" },
  { value: "SAKIT", label: "Sakit" },
  { value: "DISPENSASI", label: "Dispensasi" },
];

const reviewStatusOptions = [
  { value: "menunggu", label: "Menunggu" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const emptyOverview: StaffHomeroomSubmissionOverview = {
  homeroom: {
    assignment_id: "",
    teacher_id: "",
    class_id: "",
    class_name: "Belum ada kelas walas",
    school_year_id: "",
    school_year_name: "Tahun ajaran belum tersedia",
    is_active: false,
  },
  counts: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    with_attachment: 0,
  },
  records: [],
};

export function WalasSubmissionsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [detailTarget, setDetailTarget] = useState<StaffSubmission | null>(null);
  const [reviewTarget, setReviewTarget] = useState<StaffSubmission | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["teacher-homeroom-submissions-overview", statusFilter, typeFilter, query],
    queryFn: () =>
      getTeacherHomeroomSubmissionsOverview({
        status: statusFilter === "Semua" ? "" : statusFilter,
        type: typeFilter === "Semua" ? "" : typeFilter,
        query: query.trim(),
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { status: string; review_note: string }) => {
      if (!reviewTarget) {
        throw new Error("Pengajuan tidak ditemukan.");
      }
      return reviewTeacherHomeroomSubmission(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Pengajuan berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["teacher-homeroom-submissions-overview"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-homeroom-dashboard"],
      });
      setReviewTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const overview = overviewQuery.data ?? emptyOverview;
  const counts = overview.counts;
  const records = overview.records ?? [];
  const pendingItems = useMemo(
    () => records.filter((item) => normalizeSubmissionStatus(item.status) === "menunggu").slice(0, 5),
    [records],
  );

  const kpiCards = [
    {
      label: "Total Pengajuan",
      value: String(counts.total),
      subtitle: "Pengajuan kelas ini",
      icon: FileClock,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Menunggu Review",
      value: String(counts.pending),
      subtitle: "Butuh tanggapan walas",
      icon: ShieldAlert,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Sudah Diterima",
      value: String(counts.approved),
      subtitle: "Disetujui wali kelas",
      icon: BadgeCheck,
      accentClass: "bg-teal-100 text-teal-700",
    },
    {
      label: "Ada Lampiran",
      value: String(counts.with_attachment),
      subtitle: "Bukti terunggah siswa",
      icon: Upload,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="walas"
      sidebarItems={walasSidebarItems}
      userLabel="Wali Kelas"
      resolveTitle={getWalasSubmissionsSectionTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    Homeroom Submissions Workspace
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                      Pengajuan
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Review izin, sakit, dan dispensasi dari siswa kelas walas,
                      baca alasan serta lampiran, lalu beri tanggapan langsung
                      dari satu meja kerja yang fokus.
                    </p>
                  </div>
                </div>

                <div className="lg:w-[390px]">
                  <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <GraduationCap className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {overview.homeroom.class_name || "Belum ada kelas walas"}
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        {overview.homeroom.school_year_name || "Tahun ajaran belum tersedia"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.04, ease: "easeOut" }}
                  >
                    <KpiCard {...item} />
                  </motion.div>
                ))}
              </div>

              <div className="text-xs font-medium text-slate-400">
                {counts.pending} pengajuan masih menunggu review dan {counts.with_attachment} pengajuan membawa lampiran siswa
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={submissionStatusOptions}
                    placeholder="Pilih status"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>

                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    options={submissionTypeOptions}
                    placeholder="Pilih tipe"
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
                  placeholder="Cari siswa, NIS, alasan, tipe"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
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
                  <SubmissionTableSkeleton />
                ) : overviewQuery.error ? (
                  <div className="p-5">
                    <EmptyState
                      icon={ShieldAlert}
                      title="Data pengajuan belum bisa dimuat"
                      description={overviewQuery.error.message}
                    />
                  </div>
                ) : records.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={FileSearch}
                      title="Belum ada pengajuan untuk filter ini"
                      description="Coba ubah filter status atau tipe untuk melihat pengajuan siswa kelas walas."
                    />
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Siswa</th>
                        <th className="px-5 py-4 font-semibold">Pengajuan</th>
                        <th className="px-5 py-4 font-semibold">Waktu</th>
                        <th className="px-5 py-4 text-center font-semibold">Status</th>
                        <th className="px-5 py-4 text-center font-semibold">Lampiran</th>
                        <th className="px-5 py-4 font-semibold">Catatan</th>
                        <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 bg-white/92">
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="transition-colors hover:bg-emerald-50/45"
                        >
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{record.student_name}</p>
                              <p className="text-xs text-slate-500">
                                {record.nis} • {record.class_name || "Kelas belum tersambung"}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <SubmissionTypePill type={record.type} />
                              <p className="line-clamp-2 max-w-[280px] text-xs leading-5 text-slate-500">
                                {record.reason}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-800">
                                {formatDate(record.created_at)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDateTime(record.updated_at)}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <SubmissionStatusPill status={record.status} />
                          </td>
                          <td className="px-5 py-4 text-center">
                            {record.attachment ? (
                              <button
                                type="button"
                                onClick={() => openSubmissionAttachment(record.attachment)}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                              >
                                <FileImage className="size-3.5" />
                                Buka
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="line-clamp-2 max-w-[260px] text-sm leading-6 text-slate-500">
                              {record.review_note || "Belum ada tanggapan walas"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                                onClick={() => setDetailTarget(record)}
                              >
                                <Eye className="size-4.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                onClick={() => setReviewTarget(record)}
                              >
                                <PencilLine className="size-4.5" />
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

          <article className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,252,250,0.94)_100%)] p-5 shadow-[0_20px_48px_rgba(28,77,61,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-950">
                  Fokus Review
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Pengajuan yang masih menunggu respon wali kelas.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Prioritas
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {pendingItems.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="Tidak ada pengajuan pending"
                  description="Pengajuan yang belum ditanggapi walas akan tampil di panel ini."
                  compact
                />
              ) : (
                pendingItems.map((item, index) => (
                  <motion.article
                    key={`pending-${item.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="rounded-[22px] border border-slate-100 bg-slate-50/92 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.student_name}</p>
                          <SubmissionTypePill type={item.type} />
                        </div>
                        <p className="text-sm text-slate-500">
                          {item.nis} • {item.class_name || "Kelas belum tersambung"}
                        </p>
                        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                          {item.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end lg:self-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-[16px] px-4"
                          onClick={() => setDetailTarget(item)}
                        >
                          Detail
                        </Button>
                        <Button
                          type="button"
                          className="h-11 rounded-[16px] bg-emerald-700 px-4 text-white hover:bg-emerald-800"
                          onClick={() => setReviewTarget(item)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </article>

          <SubmissionDetailModal
            submission={detailTarget}
            onOpenChange={(open) => {
              if (!open) {
                setDetailTarget(null);
              }
            }}
          />

          <SubmissionReviewModal
            submission={reviewTarget}
            onOpenChange={(open) => {
              if (!open) {
                setReviewTarget(null);
              }
            }}
            onSubmit={(payload) => reviewMutation.mutate(payload)}
            isPending={reviewMutation.isPending}
          />
        </>
      )}
    </StaffShell>
  );
}

function SubmissionDetailModal({
  submission,
  onOpenChange,
}: {
  submission: StaffSubmission | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Detail ${submission.student_name}` : "Detail Pengajuan"}
      description="Lihat alasan pengajuan, lampiran, dan riwayat tanggapan wali kelas secara lengkap."
      icon={Eye}
      className="sm:!max-w-[920px]"
    >
      {submission ? (
        <div className="grid gap-5">
          <div className="grid items-start gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                      {submission.student_name}
                    </h3>
                    <SubmissionStatusPill status={submission.status} />
                    <SubmissionTypePill type={submission.type} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {submission.nis} • {submission.class_name || "Kelas belum tersambung"}
                  </p>
                </div>
                {submission.attachment ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-[16px]"
                    onClick={() => openSubmissionAttachment(submission.attachment)}
                  >
                    <ArrowUpRight className="size-4" />
                    Buka Lampiran
                  </Button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p>Dibuat: {formatDateTime(submission.created_at)}</p>
                <p>Diperbarui: {formatDateTime(submission.updated_at)}</p>
                <p>Reviewer: {submission.reviewed_by_name || "-"}</p>
                <p>Ditinjau: {formatDateTime(submission.reviewed_at)}</p>
              </div>
            </div>

            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Lampiran</p>
                  <p className="text-sm text-slate-500">Preview bukti jika tersedia</p>
                </div>
                <FileImage className="size-4.5 text-emerald-600" />
              </div>

              {submission.attachment ? (
                isImageAttachment(submission.attachment) ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[20px] border border-emerald-100 bg-slate-50/80">
                      <img
                        src={normalizeSubmissionAttachment(submission.attachment)}
                        alt={`Lampiran ${submission.student_name}`}
                        className="h-[240px] w-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-[16px]"
                      onClick={() => openSubmissionAttachment(submission.attachment)}
                    >
                      Lihat ukuran penuh
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5 text-center">
                    <FileImage className="mx-auto size-8 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Lampiran tersedia
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Buka lampiran untuk melihat file asli.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-[16px]"
                      onClick={() => openSubmissionAttachment(submission.attachment)}
                    >
                      Buka file
                    </Button>
                  </div>
                )
              ) : (
                <EmptyState
                  icon={FileImage}
                  title="Tidak ada lampiran"
                  description="Siswa belum menyertakan foto atau file pendukung."
                  compact
                />
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Alasan Pengajuan</p>
                  <p className="text-sm text-slate-500">Pesan asli yang dikirim siswa</p>
                </div>
                <ClipboardCheck className="size-4.5 text-emerald-600" />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {submission.reason}
              </p>
            </div>

            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Tanggapan Walas</p>
                  <p className="text-sm text-slate-500">Catatan review terbaru</p>
                </div>
                <ShieldCheck className="size-4.5 text-emerald-600" />
              </div>

              {submission.review_note ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {submission.review_note}
                </p>
              ) : (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Belum ada tanggapan"
                  description="Catatan review walas akan tampil setelah pengajuan ditinjau."
                  compact
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

function SubmissionReviewModal({
  submission,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  submission: StaffSubmission | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { status: string; review_note: string }) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState("menunggu");
  const [reviewNote, setReviewNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"status" | "review_note">>({});

  useEffect(() => {
    if (!submission) return;
    setStatus(normalizeSubmissionStatus(submission.status));
    setReviewNote(submission.review_note || "");
    setErrors({});
  }, [submission]);

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "review_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    validateRequired(nextErrors, "review_note", reviewNote, "Catatan tanggapan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, review_note: reviewNote });
  };

  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Review ${submission.student_name}` : "Review Pengajuan"}
      description="Berikan keputusan dan tanggapan wali kelas untuk pengajuan izin, sakit, atau dispensasi."
      icon={PencilLine}
      className="sm:!max-w-[760px]"
    >
      {submission ? (
        <div className="grid gap-5">
          <div className={`${premiumModalSurfaceClassName} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{submission.student_name}</p>
                <p className="text-sm text-slate-500">
                  {submission.nis} • {submission.class_name || "Kelas belum tersambung"}
                </p>
                <p className="text-sm text-slate-500">
                  Dibuat {formatDateTime(submission.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SubmissionStatusPill status={submission.status} />
                <SubmissionTypePill type={submission.type} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Status final</label>
              <RadixSelectField
                value={status}
                onValueChange={setStatus}
                options={reviewStatusOptions}
                placeholder="Pilih status akhir"
                triggerClassName="h-12 rounded-[18px]"
              />
              <FieldError message={errors.status} />
            </div>
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Lampiran</label>
              <div className="flex h-12 items-center rounded-[18px] border border-emerald-100/80 bg-white/90 px-4 text-sm text-slate-600">
                {submission.attachment ? "Tersedia untuk ditinjau" : "Tidak ada lampiran"}
              </div>
            </div>
          </div>

          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Catatan tanggapan</label>
            <p className={premiumModalHelperClassName}>
              Catatan ini akan terlihat pada riwayat pengajuan siswa dan panel monitoring walas.
            </p>
            <Textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Tulis tanggapan atau alasan keputusan walas"
              className="min-h-[140px] rounded-[20px]"
            />
            <FieldError message={errors.review_note} />
          </div>

          <div className={premiumModalActionsClassName}>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-[18px] px-5"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Menyimpan..." : "Simpan Tanggapan"}
            </Button>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

function SubmissionTypePill({ type }: { type: string }) {
  const normalized = type.toUpperCase();

  let className = "border-slate-200 bg-slate-100 text-slate-600";
  if (normalized === "IZIN") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  } else if (normalized === "SAKIT") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (normalized === "DISPENSASI") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  }

  return <Badge className={className}>{formatDisplayLabel(type)}</Badge>;
}

function SubmissionStatusPill({ status }: { status: string }) {
  const normalized = normalizeSubmissionStatus(status);

  let className = "border-slate-200 bg-slate-100 text-slate-600";
  if (normalized === "menunggu") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (normalized === "diterima") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "ditolak") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

function SubmissionTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div
          key={`submission-skeleton-${rowIndex}`}
          className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-[1.1fr_1.3fr_0.9fr_0.8fr_0.8fr_1.2fr_0.8fr]"
        >
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <div
              key={`submission-skeleton-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-200"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSubmissionStatus(value?: string) {
  return (value || "").toLowerCase().trim();
}

function isImageAttachment(attachment: string) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(attachment);
}

function normalizeSubmissionAttachment(attachment: string) {
  return resolveApiAssetUrl(attachment);
}

function openSubmissionAttachment(attachment?: string) {
  if (!attachment || typeof window === "undefined") {
    return;
  }

  window.open(normalizeSubmissionAttachment(attachment), "_blank", "noopener,noreferrer");
}

function getWalasSubmissionsSectionTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/walas/submissions")) {
    return "Submission Review Dashboard";
  }
  return "Homeroom Dashboard";
}
