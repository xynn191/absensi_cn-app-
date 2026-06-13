"use client";

import dynamic from "next/dynamic";
import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { ScrollableTabsWrapper } from "@/components/dashboard/admin/scrollable-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
} from "@/components/ui/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminAttendanceRule,
  createAdminStudent,
  createAdminStudentClassMembership,
  deleteAdminAttendanceRule,
  deleteAdminStudent,
  deleteAdminStudentClassMembership,
  updateAdminAttendanceRule,
  updateAdminStudent,
  updateAdminStudentClassMembership,
} from "@/services/admin.service";
import type {
  AdminAttendanceRule,
  AdminAttendanceRulePayload,
  AdminClass,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
  AdminStudentClassMembershipPayload,
  AdminStudentPayload,
} from "@/types/admin";
import {
  type FieldErrors,
  hasFieldErrors,
  validateDate,
  validateExactDigits,
  validateMinLength,
  validatePhone,
  validateRequired,
  validateTime,
  validateYear,
} from "@/lib/form-validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { id as localeID } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  FilePenLine,
  FileSpreadsheet,
  GraduationCap,
  LayoutPanelTop,
  LineChart,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Printer,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useDeferredValue, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";

const ImportExcelModal = dynamic(
  () => import("@/components/ui/import-excel-modal").then((module) => module.ImportExcelModal),
  { ssr: false },
);

const SiswaReportModal = dynamic(
  () => import("@/components/reports/siswa-report-modal").then((module) => module.SiswaReportModal),
  { ssr: false },
);

type StudentSectionProps = {
  students: AdminStudent[];
  memberships: AdminStudentClassMembership[];
  attendanceRules: AdminAttendanceRule[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isLoading?: boolean;
  errorMessage?: string;
};

type StudentTab = "profiles" | "memberships" | "rules";

type StudentDeleteTarget =
  | { type: "profile"; item: AdminStudent }
  | { type: "membership"; item: AdminStudentClassMembership }
  | { type: "rule"; item: AdminAttendanceRule };

const statusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

const membershipStatusOptions = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "TRANSFERRED", label: "Pindah Kelas" },
  { value: "GRADUATED", label: "Lulus" },
  { value: "INACTIVE", label: "Nonaktif" },
];

function deriveMembershipIsActive(status: string) {
  return status === "ACTIVE";
}

export function StudentSection({
  students,
  memberships,
  attendanceRules,
  classes,
  schoolYears,
  isLoading = false,
  errorMessage,
}: StudentSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<StudentTab>("profiles");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [editingMembership, setEditingMembership] =
    useState<AdminStudentClassMembership | null>(null);
  const [editingRule, setEditingRule] = useState<AdminAttendanceRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentDeleteTarget | null>(null);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const createStudentMutation = useMutation({
    mutationFn: createAdminStudent,
    onSuccess: () => {
      toast.success("Profil siswa berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setProfileModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMembershipMutation = useMutation({
    mutationFn: createAdminStudentClassMembership,
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil dibuat.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
      setMembershipModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createRuleMutation = useMutation({
    mutationFn: createAdminAttendanceRule,
    onSuccess: () => {
      toast.success("Aturan absensi berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
      setRuleModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminStudentPayload }) =>
      updateAdminStudent(id, payload),
    onSuccess: () => {
      toast.success("Profil siswa berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setEditingStudent(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: deleteAdminStudent,
    onSuccess: () => {
      toast.success("Data siswa berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMembershipMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminStudentClassMembershipPayload;
    }) => updateAdminStudentClassMembership(id, payload),
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
      setEditingMembership(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: deleteAdminStudentClassMembership,
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminAttendanceRulePayload;
    }) => updateAdminAttendanceRule(id, payload),
    onSuccess: () => {
      toast.success("Aturan absensi berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
      setEditingRule(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteAdminAttendanceRule,
    onSuccess: () => {
      toast.success("Aturan absensi berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && student.is_active) ||
          (statusFilter === "Nonaktif" && !student.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          student.name.toLowerCase().includes(normalizedQuery) ||
          student.nis.toLowerCase().includes(normalizedQuery) ||
          (student.nisn ?? "").toLowerCase().includes(normalizedQuery) ||
          (student.birth_place ?? "").toLowerCase().includes(normalizedQuery) ||
          (student.birth_date ?? "").toLowerCase().includes(normalizedQuery) ||
          (student.birth_place_date ?? "").toLowerCase().includes(normalizedQuery) ||
          (student.phone ?? "").toLowerCase().includes(normalizedQuery) ||
          (student.parent_name ?? "").toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [students, statusFilter, normalizedQuery],
  );

  const filteredMemberships = useMemo(
    () =>
      memberships.filter((membership) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && membership.is_active) ||
          (statusFilter === "Nonaktif" && !membership.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          membership.student_name.toLowerCase().includes(normalizedQuery) ||
          membership.nis.toLowerCase().includes(normalizedQuery) ||
          membership.class_name.toLowerCase().includes(normalizedQuery) ||
          membership.school_year_name.toLowerCase().includes(normalizedQuery) ||
          membership.status.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [memberships, statusFilter, normalizedQuery],
  );

  const filteredRules = useMemo(
    () =>
      attendanceRules.filter((rule) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && rule.is_active) ||
          (statusFilter === "Nonaktif" && !rule.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          rule.school_year.toLowerCase().includes(normalizedQuery) ||
          rule.check_in_start.toLowerCase().includes(normalizedQuery) ||
          rule.on_time_until.toLowerCase().includes(normalizedQuery) ||
          rule.late_until.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [attendanceRules, statusFilter, normalizedQuery],
  );

  const activeStudentCount = students.filter((student) => student.is_active).length;
  const activeMembershipCount = memberships.filter((membership) => membership.is_active).length;
  const activeRuleCount = attendanceRules.filter((rule) => rule.is_active).length;

  const kpiCards = useMemo(() => {
    if (activeTab === "memberships") {
      return [
        {
          label: "Total Penempatan",
          value: memberships.length,
          icon: GraduationCap,
          accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
        },
        {
          label: "Penempatan Aktif",
          value: activeMembershipCount,
          icon: BadgeCheck,
          accentClass: "from-teal-500 via-emerald-500 to-green-500",
        },
        {
          label: "Kelas Terisi",
          value: new Set(memberships.map((membership) => membership.class_id)).size,
          icon: BookOpen,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
        {
          label: "Tahun Ajaran",
          value: new Set(memberships.map((membership) => membership.school_year_id)).size,
          icon: CalendarClock,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
      ];
    }

    if (activeTab === "rules") {
      return [
        {
          label: "Total Rule",
          value: attendanceRules.length,
          icon: TimerReset,
          accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
        },
        {
          label: "Rule Aktif",
          value: activeRuleCount,
          icon: ShieldCheck,
          accentClass: "from-teal-500 via-emerald-500 to-green-500",
        },
        {
          label: "Tahun Ajaran",
          value: new Set(attendanceRules.map((rule) => rule.school_year_id)).size,
          icon: CalendarClock,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
        {
          label: "Window Unik",
          value: new Set(
            attendanceRules.map(
              (rule) => `${rule.check_in_start}|${rule.on_time_until}|${rule.late_until}`,
            ),
          ).size,
          icon: BadgeCheck,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
      ];
    }

    return [
      {
        label: "Total Siswa",
        value: students.length,
        icon: UsersRound,
        accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        label: "Siswa Aktif",
        value: activeStudentCount,
        icon: BadgeCheck,
        accentClass: "from-teal-500 via-emerald-500 to-green-500",
      },
      {
        label: "Punya NISN",
        value: students.filter((student) => Boolean(student.nisn?.trim())).length,
        icon: FilePenLine,
        accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
      },
      {
        label: "Kontak Ortu",
        value: students.filter((student) => Boolean(student.parent_phone?.trim())).length,
        icon: UserPlus,
        accentClass: "from-amber-400 via-orange-400 to-emerald-500",
      },
    ];
  }, [activeMembershipCount, activeRuleCount, activeStudentCount, activeTab, attendanceRules, memberships, students]);

  const addActionConfig = {
    profiles: {
      label: "Tambah",
      onClick: () => setProfileModalOpen(true),
    },
    memberships: {
      label: "Tambah",
      onClick: () => setMembershipModalOpen(true),
    },
    rules: {
      label: "Tambah",
      onClick: () => setRuleModalOpen(true),
    },
  } satisfies Record<StudentTab, { label: string; onClick: () => void }>;

  const activeAction = addActionConfig[activeTab];

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Student Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Student Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola profil siswa, penempatan kelas per tahun ajaran, dan aturan absensi
                  harian dari API admin dengan struktur yang konsisten.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              {activeTab === "profiles" && (
                <Button
                  variant="outline"
                  className="h-14 rounded-[22px] border-teal-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,250,0.98)_100%)] px-5 text-sm font-semibold text-teal-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-teal-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(230,252,248,1)_100%)] hover:text-teal-950"
                  onClick={() => setImportModalOpen(true)}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-teal-600 text-white shadow-[0_10px_20px_rgba(13,148,136,0.2)]">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  Import Excel
                </Button>
              )}

              {activeTab === "profiles" && (
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
              )}
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <StudentStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accentClass={card.accentClass}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {activeStudentCount} siswa aktif tercatat
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                  <SlidersHorizontal className="size-4" />
                </span>
                <Search className="size-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari siswa, kelas, NIS, orang tua"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
                />
              </div>

              <div className="w-full sm:w-[190px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={statusOptions}
                  triggerClassName="h-14 rounded-[22px] pl-4"
                />
              </div>

              <Button
                variant="outline"
                className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
                onClick={activeAction.onClick}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                  <Plus className="size-4" />
                </span>
                {activeAction.label}
              </Button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState
              icon={UsersRound}
              title="Data student belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudentTab)} className="mt-5 gap-4">
          <ScrollableTabsWrapper>
              <TabsList className="flex min-w-max gap-2 rounded-[24px] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(242,250,246,0.92)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_rgba(15,23,42,0.04)] xl:min-w-0 xl:grid xl:w-full xl:grid-cols-3">
                <TabsTrigger value="profiles" className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full">
                  <UsersRound className="size-4" />
                  Profil Siswa
                </TabsTrigger>
                <TabsTrigger value="memberships" className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full">
                  <GraduationCap className="size-4" />
                  Penempatan Kelas
                </TabsTrigger>
                <TabsTrigger value="rules" className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full">
                  <TimerReset className="size-4" />
                  Aturan Absensi
                </TabsTrigger>
              </TabsList>
          </ScrollableTabsWrapper>

          <TabsContent value="profiles" className="mt-4">
            <StudentDataTableCard isLoading={isLoading} columnCount={9} isEmpty={filteredStudents.length === 0} emptyTitle="Belum ada siswa" emptyDescription="Tambahkan siswa baru agar data muncul pada daftar ini." icon={UsersRound}>
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Siswa", "NIS / NISN", "Kontak", "Orang Tua", "Angkatan", "Gender", "Tempat, Tanggal Lahir", "Status", "Aksi"].map((label) => (
                      <th key={label} className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                      <tr key={student.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                              {getInitials(student.name)}
                            </span>
                            <div>
                              <p className="font-medium text-slate-700">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{student.nis}</p>
                            <p className="text-xs text-slate-400">NISN: {student.nisn || "-"}</p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{student.phone || "-"}</p>
                            <p className="text-xs text-slate-400">{student.address || "Alamat belum diisi"}</p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{student.parent_name || "-"}</p>
                            <p className="text-xs text-slate-400">{student.parent_phone || "-"}</p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">{student.entry_year}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{formatGender(student.gender)}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{formatBirthPlaceDate(student.birth_place, student.birth_date, student.birth_place_date)}</td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <StudentStatusBadge isActive={student.is_active} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingStudent(student)}
                            onDelete={() => setDeleteTarget({ type: "profile", item: student })}
                            isDeletePending={deleteStudentMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </StudentDataTableCard>
          </TabsContent>

          <TabsContent value="memberships" className="mt-4">
            <StudentDataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredMemberships.length === 0} emptyTitle="Belum ada penempatan kelas" emptyDescription="Riwayat kelas siswa per tahun ajaran akan tampil di sini." icon={GraduationCap}>
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Siswa", "Kelas", "Tahun Ajaran", "Status", "Waktu", "Aksi"].map((label) => (
                      <th key={label} className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map((membership) => (
                      <tr key={membership.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-700">{membership.student_name}</p>
                            <p className="text-xs text-slate-400">{membership.nis}</p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">{membership.class_name}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{membership.school_year_name}</td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <MembershipStatusBadge status={membership.status} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1 text-xs text-slate-500">
                            <p>Masuk: {formatDateTime(membership.joined_at)}</p>
                            <p>Keluar: {formatDateTime(membership.left_at)}</p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingMembership(membership)}
                            onDelete={() => setDeleteTarget({ type: "membership", item: membership })}
                            isDeletePending={deleteMembershipMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </StudentDataTableCard>
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <StudentDataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredRules.length === 0} emptyTitle="Belum ada aturan absensi" emptyDescription="Rule jam hadir, telat, dan cutoff alfa akan muncul di tabel ini." icon={TimerReset}>
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Tahun Ajaran", "Mulai Absen", "Tepat Waktu", "Batas Telat", "Status", "Aksi"].map((label) => (
                      <th key={label} className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                      <tr key={rule.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="border-t border-slate-100 px-4 py-4">{rule.school_year}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{rule.check_in_start}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{rule.on_time_until}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{rule.late_until}</td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <StudentStatusBadge isActive={rule.is_active} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingRule(rule)}
                            onDelete={() => setDeleteTarget({ type: "rule", item: rule })}
                            isDeletePending={deleteRuleMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </StudentDataTableCard>
          </TabsContent>
        </Tabs>
      </section>

      <ImportExcelModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        type="siswa"
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
        }}
      />

      <SiswaReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        students={students}
      />

      <StudentProfileCreateModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        isPending={createStudentMutation.isPending}
        onSubmit={(payload) => createStudentMutation.mutate(payload)}
      />
      <StudentProfileEditModal
        student={editingStudent}
        open={Boolean(editingStudent)}
        onOpenChange={(open) => {
          if (!open) setEditingStudent(null);
        }}
        isPending={updateStudentMutation.isPending}
        onSubmit={(payload) => updateStudentMutation.mutate({ id: editingStudent!.id, payload })}
      />
      <StudentMembershipCreateModal
        open={membershipModalOpen}
        onOpenChange={setMembershipModalOpen}
        students={students}
        classes={classes}
        schoolYears={schoolYears}
        isPending={createMembershipMutation.isPending}
        onSubmit={(payload) => createMembershipMutation.mutate(payload)}
      />
      <StudentMembershipEditModal
        membership={editingMembership}
        open={Boolean(editingMembership)}
        onOpenChange={(open) => {
          if (!open) setEditingMembership(null);
        }}
        students={students}
        classes={classes}
        schoolYears={schoolYears}
        isPending={updateMembershipMutation.isPending}
        onSubmit={(payload) => updateMembershipMutation.mutate({ id: editingMembership!.id, payload })}
      />
      <AttendanceRuleCreateModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        schoolYears={schoolYears}
        isPending={createRuleMutation.isPending}
        onSubmit={(payload) => createRuleMutation.mutate(payload)}
      />
      <AttendanceRuleEditModal
        rule={editingRule}
        open={Boolean(editingRule)}
        onOpenChange={(open) => {
          if (!open) setEditingRule(null);
        }}
        schoolYears={schoolYears}
        isPending={updateRuleMutation.isPending}
        onSubmit={(payload) => updateRuleMutation.mutate({ id: editingRule!.id, payload })}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getStudentDeleteTitle(deleteTarget)}
        description={getStudentDeleteDescription(deleteTarget)}
        isPending={
          deleteStudentMutation.isPending ||
          deleteMembershipMutation.isPending ||
          deleteRuleMutation.isPending
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "profile") {
            deleteStudentMutation.mutate(deleteTarget.item.id);
            return;
          }
          if (deleteTarget.type === "membership") {
            deleteMembershipMutation.mutate(deleteTarget.item.id);
            return;
          }
          deleteRuleMutation.mutate(deleteTarget.item.id);
        }}
      />
    </>
  );
}

function getStudentDeleteTitle(target: StudentDeleteTarget | null) {
  if (target?.type === "profile") return "Hapus Siswa?";
  if (target?.type === "membership") return "Hapus Penempatan Kelas?";
  if (target?.type === "rule") return "Hapus Aturan Absensi?";
  return "Konfirmasi Penghapusan";
}

function getStudentDeleteDescription(target: StudentDeleteTarget | null) {
  if (!target) return "Data ini akan dihapus permanen.";
  if (target.type === "profile") {
    return `Profil siswa "${target.item.name}" akan dihapus permanen.`;
  }
  if (target.type === "membership") {
    return `Penempatan kelas "${target.item.student_name}" di ${target.item.class_name} akan dihapus permanen.`;
  }
  return `Aturan absensi tahun ajaran "${target.item.school_year}" akan dihapus permanen.`;
}

function StudentProfileCreateModal({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminStudentPayload) => void;
}) {
  const [form, setForm] = useState<AdminStudentPayload>({
    name: "",
    nis: "",
    nisn: "",
    password: "",
    gender: "",
    birth_place: "",
    birth_date: "",
    address: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    entry_year: new Date().getFullYear(),
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentPayload>>({});

  const reset = () =>
    setForm({
      name: "",
      nis: "",
      nisn: "",
      password: "",
      gender: "",
      birth_place: "",
      birth_date: "",
      address: "",
      phone: "",
      parent_name: "",
      parent_phone: "",
      entry_year: new Date().getFullYear(),
      is_active: true,
    });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateStudentProfileForm(form, false);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Profil Siswa" description="Lengkapi data profil siswa dan akun login dasar dalam satu modal." icon={UsersRound}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Siswa">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masukkan nama siswa" className={inputClassName} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Password Login">
            <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimal 6 karakter" className={inputClassName} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="NIS">
            <Input value={form.nis} onChange={(event) => setForm((current) => ({ ...current, nis: event.target.value }))} placeholder="10 digit NIS" className={inputClassName} />
            <FieldError message={errors.nis} />
          </FieldGroup>
          <FieldGroup label="NISN">
            <Input value={form.nisn} onChange={(event) => setForm((current) => ({ ...current, nisn: event.target.value }))} placeholder="Masukkan NISN" className={inputClassName} />
            <FieldError message={errors.nisn} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Jenis Kelamin">
            <RadixSelectField
              value={form.gender}
              onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}
              placeholder="Pilih gender"
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <FieldError message={errors.gender} />
          </FieldGroup>
          <FieldGroup label="Angkatan">
            <Input value={String(form.entry_year)} onChange={(event) => setForm((current) => ({ ...current, entry_year: Number(event.target.value || 0) }))} placeholder="2026" className={inputClassName} />
            <FieldError message={errors.entry_year} />
          </FieldGroup>
          <FieldGroup label="Status Aktif">
            <RadixSelectField
              value={String(form.is_active)}
              onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))}
              placeholder="Pilih status"
              options={[
                { value: "true", label: "Aktif" },
                { value: "false", label: "Nonaktif" },
              ]}
            />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Telepon Siswa">
            <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="08xxxxxxxxxx" className={inputClassName} />
            <FieldError message={errors.phone} />
          </FieldGroup>
          <FieldGroup label="Nama Orang Tua">
            <Input value={form.parent_name} onChange={(event) => setForm((current) => ({ ...current, parent_name: event.target.value }))} placeholder="Masukkan nama orang tua" className={inputClassName} />
            <FieldError message={errors.parent_name} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Telepon Orang Tua">
            <Input value={form.parent_phone} onChange={(event) => setForm((current) => ({ ...current, parent_phone: event.target.value }))} placeholder="08xxxxxxxxxx" className={inputClassName} />
            <FieldError message={errors.parent_phone} />
          </FieldGroup>
          <FieldGroup label="Tempat Lahir">
            <Input value={form.birth_place} onChange={(event) => setForm((current) => ({ ...current, birth_place: event.target.value }))} placeholder="Contoh: Cianjur" className={inputClassName} />
            <FieldError message={errors.birth_place} />
          </FieldGroup>
          <FieldGroup label="Tanggal Lahir">
            <BirthDatePicker value={form.birth_date} onChange={(value) => setForm((current) => ({ ...current, birth_date: value }))} />
            <FieldError message={errors.birth_date} />
          </FieldGroup>
        </div>

        <FieldGroup label="Alamat">
          <Textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Masukkan alamat siswa" className={textareaClassName} />
          <FieldError message={errors.address} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Profil Siswa" />
      </div>
    </PremiumModal>
  );
}

function StudentProfileEditModal({
  student,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  student: AdminStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminStudentPayload) => void;
}) {
  const [form, setForm] = useState<AdminStudentPayload>({
    name: "",
    nis: "",
    nisn: "",
    password: "",
    gender: "",
    birth_place: "",
    birth_date: "",
    address: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    entry_year: new Date().getFullYear(),
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentPayload>>({});

  useEffect(() => {
    if (!student) return;
    setForm({
      name: student.name,
      nis: student.nis,
      nisn: student.nisn ?? "",
      password: "",
      gender: student.gender ?? "",
      birth_place: student.birth_place ?? "",
      birth_date: student.birth_date ?? "",
      address: student.address ?? "",
      phone: student.phone ?? "",
      parent_name: student.parent_name ?? "",
      parent_phone: student.parent_phone ?? "",
      entry_year: student.entry_year,
      is_active: student.is_active,
    });
    setErrors({});
  }, [student]);

  if (!student) return null;

  const handleSubmit = () => {
    const nextErrors = validateStudentProfileForm(form, true);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Profil Siswa" description="Perbarui data siswa dan isi password hanya jika memang ingin diganti." icon={FilePenLine}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Siswa">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masukkan nama siswa" className={inputClassName} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Password Baru">
            <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Kosongkan jika tidak diubah" className={inputClassName} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="NIS">
            <Input value={form.nis} onChange={(event) => setForm((current) => ({ ...current, nis: event.target.value }))} placeholder="10 digit NIS" className={inputClassName} />
            <FieldError message={errors.nis} />
          </FieldGroup>
          <FieldGroup label="NISN">
            <Input value={form.nisn} onChange={(event) => setForm((current) => ({ ...current, nisn: event.target.value }))} placeholder="Masukkan NISN" className={inputClassName} />
            <FieldError message={errors.nisn} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Jenis Kelamin">
            <RadixSelectField value={form.gender} onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))} placeholder="Pilih gender" options={[{ value: "MALE", label: "Laki-laki" }, { value: "FEMALE", label: "Perempuan" }]} />
            <FieldError message={errors.gender} />
          </FieldGroup>
          <FieldGroup label="Angkatan">
            <Input value={String(form.entry_year)} onChange={(event) => setForm((current) => ({ ...current, entry_year: Number(event.target.value || 0) }))} placeholder="2026" className={inputClassName} />
            <FieldError message={errors.entry_year} />
          </FieldGroup>
          <FieldGroup label="Status Aktif">
            <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Telepon Siswa">
            <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="08xxxxxxxxxx" className={inputClassName} />
            <FieldError message={errors.phone} />
          </FieldGroup>
          <FieldGroup label="Nama Orang Tua">
            <Input value={form.parent_name} onChange={(event) => setForm((current) => ({ ...current, parent_name: event.target.value }))} placeholder="Masukkan nama orang tua" className={inputClassName} />
            <FieldError message={errors.parent_name} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Telepon Orang Tua">
            <Input value={form.parent_phone} onChange={(event) => setForm((current) => ({ ...current, parent_phone: event.target.value }))} placeholder="08xxxxxxxxxx" className={inputClassName} />
            <FieldError message={errors.parent_phone} />
          </FieldGroup>
          <FieldGroup label="Tempat Lahir">
            <Input value={form.birth_place} onChange={(event) => setForm((current) => ({ ...current, birth_place: event.target.value }))} placeholder="Contoh: Cianjur" className={inputClassName} />
            <FieldError message={errors.birth_place} />
          </FieldGroup>
          <FieldGroup label="Tanggal Lahir">
            <BirthDatePicker value={form.birth_date} onChange={(value) => setForm((current) => ({ ...current, birth_date: value }))} />
            <FieldError message={errors.birth_date} />
          </FieldGroup>
        </div>

        <FieldGroup label="Alamat">
          <Textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Masukkan alamat siswa" className={textareaClassName} />
          <FieldError message={errors.address} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Profil Siswa" />
      </div>
    </PremiumModal>
  );
}

function StudentMembershipCreateModal({
  open,
  onOpenChange,
  students,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AdminStudent[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminStudentClassMembershipPayload) => void;
}) {
  const [form, setForm] = useState<AdminStudentClassMembershipPayload>({
    student_id: "",
    class_id: "",
    school_year_id: "",
    status: "ACTIVE",
    joined_at: "",
    left_at: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentClassMembershipPayload>>({});

  const reset = () =>
    setForm({
      student_id: "",
      class_id: "",
      school_year_id: "",
      status: "ACTIVE",
      joined_at: "",
      left_at: "",
      is_active: true,
    });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
    if (!nextOpen) setErrors({});
  };

  const handleSubmit = () => {
    const payload = { ...form, is_active: deriveMembershipIsActive(form.status) };
    const nextErrors = validateStudentMembershipForm(payload);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(payload);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Penempatan Kelas" description="Hubungkan siswa ke kelas aktif per tahun ajaran tanpa menghilangkan riwayat akademik." icon={GraduationCap}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Siswa">
            <RadixSelectField value={form.student_id} onValueChange={(value) => setForm((current) => ({ ...current, student_id: value }))} placeholder="Pilih siswa" options={students.map((student) => ({ value: student.id, label: student.name, description: student.nis }))} />
            <FieldError message={errors.student_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(value) => setForm((current) => ({ ...current, class_id: value }))} placeholder="Pilih kelas" options={classes.map((item) => ({ value: item.id, label: item.display_name, description: item.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Penempatan">
            <RadixSelectField value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value, is_active: deriveMembershipIsActive(value) }))} placeholder="Pilih status" options={membershipStatusOptions} />
            <FieldError message={errors.status} />
          </FieldGroup>
        </div>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Penempatan" />
      </div>
    </PremiumModal>
  );
}

function StudentMembershipEditModal({
  membership,
  open,
  onOpenChange,
  students,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  membership: AdminStudentClassMembership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AdminStudent[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminStudentClassMembershipPayload) => void;
}) {
  const [form, setForm] = useState<AdminStudentClassMembershipPayload>({
    student_id: "",
    class_id: "",
    school_year_id: "",
    status: "ACTIVE",
    joined_at: "",
    left_at: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentClassMembershipPayload>>({});

  useEffect(() => {
    if (!membership) return;
    setForm({
      student_id: membership.student_id,
      class_id: membership.class_id,
      school_year_id: membership.school_year_id,
      status: membership.status,
      joined_at: membership.joined_at ?? "",
      left_at: membership.left_at ?? "",
      is_active: membership.is_active,
    });
    setErrors({});
  }, [membership]);

  if (!membership) return null;

  const handleSubmit = () => {
    const payload = { ...form, is_active: deriveMembershipIsActive(form.status) };
    const nextErrors = validateStudentMembershipForm(payload);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(payload);
  };

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Penempatan Kelas" description="Perbarui rombel siswa per tahun ajaran tanpa menghilangkan struktur riwayatnya." icon={GraduationCap}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Siswa">
            <RadixSelectField value={form.student_id} onValueChange={(value) => setForm((current) => ({ ...current, student_id: value }))} placeholder="Pilih siswa" options={students.map((student) => ({ value: student.id, label: student.name, description: student.nis }))} />
            <FieldError message={errors.student_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(value) => setForm((current) => ({ ...current, class_id: value }))} placeholder="Pilih kelas" options={classes.map((item) => ({ value: item.id, label: item.display_name, description: item.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Penempatan">
            <RadixSelectField value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value, is_active: deriveMembershipIsActive(value) }))} placeholder="Pilih status" options={membershipStatusOptions} />
            <FieldError message={errors.status} />
          </FieldGroup>
        </div>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Penempatan" />
      </div>
    </PremiumModal>
  );
}

function AttendanceRuleCreateModal({
  open,
  onOpenChange,
  schoolYears,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminAttendanceRulePayload) => void;
}) {
  const [form, setForm] = useState<AdminAttendanceRulePayload>({
    school_year_id: "",
    check_in_start: "06:30:00",
    on_time_until: "07:00:00",
    late_until: "07:30:00",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminAttendanceRulePayload>>({});

  const reset = () =>
    setForm({
      school_year_id: "",
      check_in_start: "06:30:00",
      on_time_until: "07:00:00",
      late_until: "07:30:00",
      is_active: true,
    });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateAttendanceRuleForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Aturan Absensi" description="Atur window hadir, telat, dan cutoff absensi per tahun ajaran." icon={TimerReset}>
      <div className="grid gap-5">
        <FieldGroup label="Tahun Ajaran">
          <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
          <FieldError message={errors.school_year_id} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Mulai Absen">
            <TimeInput value={form.check_in_start} onChange={(value) => setForm((current) => ({ ...current, check_in_start: value }))} placeholder="06:30:00" />
            <FieldError message={errors.check_in_start} />
          </FieldGroup>
          <FieldGroup label="Batas Tepat Waktu">
            <TimeInput value={form.on_time_until} onChange={(value) => setForm((current) => ({ ...current, on_time_until: value }))} placeholder="07:00:00" />
            <FieldError message={errors.on_time_until} />
          </FieldGroup>
          <FieldGroup label="Batas Telat">
            <TimeInput value={form.late_until} onChange={(value) => setForm((current) => ({ ...current, late_until: value }))} placeholder="07:30:00" />
            <FieldError message={errors.late_until} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Rule">
          <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Aturan Absensi" />
      </div>
    </PremiumModal>
  );
}

function AttendanceRuleEditModal({
  rule,
  open,
  onOpenChange,
  schoolYears,
  isPending,
  onSubmit,
}: {
  rule: AdminAttendanceRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminAttendanceRulePayload) => void;
}) {
  const [form, setForm] = useState<AdminAttendanceRulePayload>({
    school_year_id: "",
    check_in_start: "06:30:00",
    on_time_until: "07:00:00",
    late_until: "07:30:00",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminAttendanceRulePayload>>({});

  useEffect(() => {
    if (!rule) return;
    setForm({
      school_year_id: rule.school_year_id,
      check_in_start: rule.check_in_start,
      on_time_until: rule.on_time_until,
      late_until: rule.late_until,
      is_active: rule.is_active,
    });
    setErrors({});
  }, [rule]);

  if (!rule) return null;

  const handleSubmit = () => {
    const nextErrors = validateAttendanceRuleForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Aturan Absensi" description="Perbarui window hadir, telat, dan cutoff absensi untuk tahun ajaran yang dipilih." icon={TimerReset}>
      <div className="grid gap-5">
        <FieldGroup label="Tahun Ajaran">
          <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
          <FieldError message={errors.school_year_id} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Mulai Absen">
            <TimeInput value={form.check_in_start} onChange={(value) => setForm((current) => ({ ...current, check_in_start: value }))} placeholder="06:30:00" />
            <FieldError message={errors.check_in_start} />
          </FieldGroup>
          <FieldGroup label="Batas Tepat Waktu">
            <TimeInput value={form.on_time_until} onChange={(value) => setForm((current) => ({ ...current, on_time_until: value }))} placeholder="07:00:00" />
            <FieldError message={errors.on_time_until} />
          </FieldGroup>
          <FieldGroup label="Batas Telat">
            <TimeInput value={form.late_until} onChange={(value) => setForm((current) => ({ ...current, late_until: value }))} placeholder="07:30:00" />
            <FieldError message={errors.late_until} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Rule">
          <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Aturan Absensi" />
      </div>
    </PremiumModal>
  );
}

function StudentDataTableCard({
  children,
  icon,
  emptyTitle,
  emptyDescription,
  isLoading,
  columnCount,
  isEmpty,
}: {
  children: ReactNode;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  columnCount: number;
  isEmpty: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
      className="overflow-hidden rounded-[24px] border border-emerald-100/80"
    >
      {isLoading ? (
        <div className="overflow-x-auto"><LoadingTable columnCount={columnCount} /></div>
      ) : isEmpty ? (
        <div className="p-5">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} compact />
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </motion.div>
  );
}

function StudentEmptyRow({
  colSpan,
  icon,
  title,
  description,
}: {
  colSpan: number;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <tr className="bg-white">
      <td colSpan={colSpan} className="p-5">
        <EmptyState icon={icon} title={title} description={description} compact />
      </td>
    </tr>
  );
}

function ActionButtons({
  onEdit,
  onDelete,
  isDeletePending,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-[14px] border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={onEdit}
      >
        <PencilLine className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-[14px] border-red-200/80 bg-white text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
        onClick={onDelete}
        disabled={isDeletePending}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function LoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={`student-loading-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}>
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div key={`student-loading-cell-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StudentStatCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,252,248,0.96)_100%)] p-4 shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_54px_rgba(15,23,42,0.1)]">
      <div className="absolute right-[-10px] top-[-26px] h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl transition duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center text-right">
          <span className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`}>
            <Icon className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function MembershipStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  const label =
    membershipStatusOptions.find((option) => option.value === normalizedStatus)?.label ??
    formatBadgeLabel(status);
  const className =
    normalizedStatus === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalizedStatus === "TRANSFERRED"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalizedStatus === "GRADUATED"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-100 text-slate-500";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function StudentStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="outline" className={isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}>
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

function FieldGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      {helper ? <p className={premiumModalHelperClassName}>{helper}</p> : null}
      {children}
    </div>
  );
}

function BirthDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className={`${inputClassName} w-full justify-start text-left font-normal ${value ? "text-slate-700" : "text-slate-400"}`}
      >
        <CalendarClock className="mr-2 size-4 text-emerald-600" />
        {value ? formatBirthDate(value) : "Pilih tanggal lahir"}
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
        <PopoverHeader className="px-2 pt-1 pb-2">
          <PopoverTitle className="text-sm font-semibold text-slate-900">
            Pilih tanggal kelahiran
          </PopoverTitle>
        </PopoverHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => { onChange(date ? toDateInputValue(date) : ""); setOpen(false); }}
          locale={localeID}
          buttonVariant="ghost"
          captionLayout="dropdown"
          startMonth={new Date(1990, 0)}
          endMonth={new Date(new Date().getFullYear(), 11)}
        />
      </PopoverContent>
    </Popover>
  );
}

function TimeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(formatTimeInput(event.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="off"
      maxLength={8}
      className={`${inputClassName} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
    />
  );
}

function ModalActions({
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className={premiumModalActionsClassName}>
      <Button variant="outline" className="h-12 rounded-[1.1rem] border-slate-200 px-5 text-sm font-semibold text-slate-600" onClick={onCancel} disabled={isPending}>
        Batal
      </Button>
      <Button className="h-12 rounded-[1.1rem] bg-[linear-gradient(135deg,#0f766e_0%,#166534_100%)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] hover:opacity-95" onClick={onSubmit} disabled={isPending}>
        <Sparkles className="size-4" />
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function formatGender(gender?: string) {
  switch ((gender ?? "").toUpperCase()) {
    case "MALE":
    case "L":
      return "Laki-laki";
    case "FEMALE":
    case "P":
      return "Perempuan";
    default:
      return "-";
  }
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID");
}

function formatBirthPlaceDate(place?: string, date?: string, fallback?: string) {
  if (fallback?.trim()) return fallback;
  const formattedDate = formatBirthDate(date);
  const trimmedPlace = place?.trim() ?? "";
  if (!trimmedPlace && !formattedDate) return "-";
  if (!trimmedPlace) return formattedDate;
  if (!formattedDate) return trimmedPlace;
  return `${trimmedPlace}, ${formattedDate}`;
}

function formatBirthDate(value?: string) {
  if (!value) return "";
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function parseDateValue(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);
  const second = digits.slice(4, 6);

  return [hour, minute, second].filter(Boolean).join(":");
}

function formatBadgeLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function validateStudentProfileForm(
  form: AdminStudentPayload,
  isEdit: boolean,
): FieldErrors<keyof AdminStudentPayload> {
  const errors: FieldErrors<keyof AdminStudentPayload> = {};

  validateRequired(errors, "name", form.name, "Nama siswa");
  validateRequired(errors, "nis", form.nis, "NIS");
  validateExactDigits(errors, "nis", form.nis, 10, "NIS");
  validateExactDigits(errors, "nisn", form.nisn, 10, "NISN", { allowEmpty: true });
  validateMinLength(errors, "password", form.password, 6, isEdit ? "Password baru" : "Password login", {
    allowEmpty: isEdit,
  });
  validateRequired(errors, "gender", form.gender, "Jenis kelamin");
  validateYear(errors, "entry_year", form.entry_year, "Angkatan");
  validatePhone(errors, "phone", form.phone, "Telepon siswa", { allowEmpty: true });
  validateRequired(errors, "parent_name", form.parent_name, "Nama orang tua");
  validatePhone(errors, "parent_phone", form.parent_phone, "Telepon orang tua", { allowEmpty: true });
  validateRequired(errors, "birth_place", form.birth_place, "Tempat lahir");
  validateRequired(errors, "birth_date", form.birth_date, "Tanggal lahir");
  validateDate(errors, "birth_date", form.birth_date, "Tanggal lahir");

  return errors;
}

function validateStudentMembershipForm(
  form: AdminStudentClassMembershipPayload,
): FieldErrors<keyof AdminStudentClassMembershipPayload> {
  const errors: FieldErrors<keyof AdminStudentClassMembershipPayload> = {};

  validateRequired(errors, "student_id", form.student_id, "Siswa");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "status", form.status, "Status penempatan");

  return errors;
}

function validateAttendanceRuleForm(
  form: AdminAttendanceRulePayload,
): FieldErrors<keyof AdminAttendanceRulePayload> {
  const errors: FieldErrors<keyof AdminAttendanceRulePayload> = {};

  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateTime(errors, "check_in_start", form.check_in_start, "Mulai absen");
  validateTime(errors, "on_time_until", form.on_time_until, "Batas tepat waktu");
  validateTime(errors, "late_until", form.late_until, "Batas telat");

  return errors;
}

const inputClassName =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

const textareaClassName =
  "min-h-[140px] rounded-[1.4rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 py-3 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";
