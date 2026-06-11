"use client";

import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { ScrollableTabsWrapper } from "@/components/dashboard/admin/scrollable-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
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
  createAdminHomeroomAssignment,
  createAdminTeacherProfile,
  createAdminTeacherSubjectAssignment,
  createAdminUser,
  deleteAdminHomeroomAssignment,
  deleteAdminTeacherSubjectAssignment,
  deleteAdminUser,
  getAdminClasses,
  getAdminSchoolYears,
  getAdminSubjects,
  getAdminUsers,
  updateAdminHomeroomAssignment,
  updateAdminTeacherProfile,
  updateAdminTeacherSubjectAssignment,
  updateAdminUser,
} from "@/services/admin.service";
import type {
  AdminClass,
  AdminHomeroomAssignment,
  AdminHomeroomAssignmentPayload,
  AdminSchoolYear,
  AdminSubject,
  AdminTeacherProfile,
  AdminTeacherProfilePayload,
  AdminTeacherSubjectAssignment,
  AdminTeacherSubjectAssignmentPayload,
  AdminUser,
} from "@/types/admin";
import {
  type FieldErrors,
  hasFieldErrors,
  validateMinLength,
  validatePhone,
  validateRequired,
} from "@/lib/form-validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  FilePenLine,
  GraduationCap,
  IdCard,
  LayoutPanelTop,
  LineChart,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useDeferredValue, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";

type TeacherSectionProps = {
  teacherProfiles: AdminTeacherProfile[];
  teacherSubjectAssignments: AdminTeacherSubjectAssignment[];
  homeroomAssignments: AdminHomeroomAssignment[];
  isLoading?: boolean;
  errorMessage?: string;
};

const profileStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

type TeacherTab = "profiles" | "subjects" | "homerooms";

type TeacherDeleteTarget =
  | { type: "profile"; item: AdminTeacherProfile }
  | { type: "subject"; item: AdminTeacherSubjectAssignment }
  | { type: "homeroom"; item: AdminHomeroomAssignment };

export function TeacherSection({
  teacherProfiles,
  teacherSubjectAssignments,
  homeroomAssignments,
  isLoading = false,
  errorMessage,
}: TeacherSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<TeacherTab>("profiles");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [homeroomModalOpen, setHomeroomModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminTeacherProfile | null>(null);
  const [editingSubjectAssignment, setEditingSubjectAssignment] =
    useState<AdminTeacherSubjectAssignment | null>(null);
  const [editingHomeroomAssignment, setEditingHomeroomAssignment] =
    useState<AdminHomeroomAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherDeleteTarget | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });
  const subjectsQuery = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: getAdminSubjects,
  });
  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: getAdminClasses,
  });
  const schoolYearsQuery = useQuery({
    queryKey: ["admin-school-years"],
    queryFn: getAdminSchoolYears,
  });

  const createTeacherProfileMutation = useMutation({
    mutationFn: async (payload: TeacherProfileCreatePayload) => {
      const account = await createAdminUser({
        name: payload.name,
        role: "TEACHER",
        username: payload.username,
        nis: "",
        password: payload.password,
      });

      return createAdminTeacherProfile({
        user_id: account.id,
        nip: payload.nip,
        nuptk: payload.nuptk,
        gender: payload.gender,
        phone: payload.phone,
        address: payload.address,
        is_active: payload.is_active,
      });
    },
    onSuccess: () => {
      toast.success("Akun dan profil guru baru berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setProfileModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createTeacherSubjectAssignmentMutation = useMutation({
    mutationFn: createAdminTeacherSubjectAssignment,
    onSuccess: () => {
      toast.success("Assignment mapel berhasil dibuat.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-teacher-subject-assignments"],
      });
      setSubjectModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createHomeroomAssignmentMutation = useMutation({
    mutationFn: createAdminHomeroomAssignment,
    onSuccess: () => {
      toast.success("Assignment wali kelas berhasil dibuat.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
      setHomeroomModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateTeacherProfileMutation = useMutation({
    mutationFn: async (payload: TeacherProfileCreatePayload) => {
      if (!editingProfile) {
        throw new Error("Profil guru tidak ditemukan.");
      }

      await updateAdminUser(editingProfile.user_id, {
        name: payload.name,
        role: "TEACHER",
        username: payload.username,
        nis: "",
        password: payload.password,
      });

      return updateAdminTeacherProfile(editingProfile.id, {
        user_id: editingProfile.user_id,
        nip: payload.nip,
        nuptk: payload.nuptk,
        gender: payload.gender,
        phone: payload.phone,
        address: payload.address,
        is_active: payload.is_active,
      });
    },
    onSuccess: () => {
      toast.success("Profil guru berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingProfile(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTeacherProfileMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Data guru berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-teacher-subject-assignments"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTeacherSubjectAssignmentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminTeacherSubjectAssignmentPayload;
    }) => updateAdminTeacherSubjectAssignment(id, payload),
    onSuccess: () => {
      toast.success("Assignment mapel berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-teacher-subject-assignments"],
      });
      setEditingSubjectAssignment(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTeacherSubjectAssignmentMutation = useMutation({
    mutationFn: deleteAdminTeacherSubjectAssignment,
    onSuccess: () => {
      toast.success("Assignment mapel berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-teacher-subject-assignments"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateHomeroomAssignmentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminHomeroomAssignmentPayload;
    }) => updateAdminHomeroomAssignment(id, payload),
    onSuccess: () => {
      toast.success("Assignment walas berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
      setEditingHomeroomAssignment(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteHomeroomAssignmentMutation = useMutation({
    mutationFn: deleteAdminHomeroomAssignment,
    onSuccess: () => {
      toast.success("Assignment walas berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const teacherUsers = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.role === "TEACHER"),
    [usersQuery.data],
  );

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const subjectAssignmentsByTeacher = useMemo(() => {
    return teacherSubjectAssignments.reduce<Record<string, number>>(
      (accumulator, assignment) => {
        accumulator[assignment.teacher_id] =
          (accumulator[assignment.teacher_id] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
  }, [teacherSubjectAssignments]);

  const homeroomAssignmentsByTeacher = useMemo(() => {
    return homeroomAssignments.reduce<Record<string, number>>(
      (accumulator, assignment) => {
        accumulator[assignment.teacher_id] =
          (accumulator[assignment.teacher_id] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
  }, [homeroomAssignments]);

  const filteredTeacherProfiles = useMemo(
    () =>
      teacherProfiles.filter((teacher) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && teacher.is_active) ||
          (statusFilter === "Nonaktif" && !teacher.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          teacher.name.toLowerCase().includes(normalizedQuery) ||
          (teacher.username ?? "").toLowerCase().includes(normalizedQuery) ||
          (teacher.nip ?? "").toLowerCase().includes(normalizedQuery) ||
          (teacher.nuptk ?? "").toLowerCase().includes(normalizedQuery) ||
          (teacher.phone ?? "").toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [teacherProfiles, statusFilter, normalizedQuery],
  );

  const filteredTeacherSubjectAssignments = useMemo(
    () =>
      teacherSubjectAssignments.filter(
        (assignment) =>
          normalizedQuery.length === 0 ||
          assignment.teacher_name.toLowerCase().includes(normalizedQuery) ||
          assignment.subject_code.toLowerCase().includes(normalizedQuery) ||
          assignment.subject_name.toLowerCase().includes(normalizedQuery) ||
          assignment.class_name.toLowerCase().includes(normalizedQuery) ||
          assignment.school_year_name.toLowerCase().includes(normalizedQuery),
      ),
    [teacherSubjectAssignments, normalizedQuery],
  );

  const filteredHomeroomAssignments = useMemo(
    () =>
      homeroomAssignments.filter(
        (assignment) =>
          normalizedQuery.length === 0 ||
          assignment.teacher_name.toLowerCase().includes(normalizedQuery) ||
          assignment.class_name.toLowerCase().includes(normalizedQuery) ||
          assignment.school_year_name.toLowerCase().includes(normalizedQuery),
      ),
    [homeroomAssignments, normalizedQuery],
  );

  const activeTeacherCount = teacherProfiles.filter(
    (teacher) => teacher.is_active,
  ).length;
  const totalSubjectAssignments = teacherSubjectAssignments.length;
  const totalHomeroomAssignments = homeroomAssignments.length;
  const activeSubjectAssignments = teacherSubjectAssignments.filter(
    (assignment) => assignment.is_active,
  ).length;
  const activeHomeroomAssignments = homeroomAssignments.filter(
    (assignment) => assignment.is_active,
  ).length;

  const kpiCards = useMemo(() => {
    if (activeTab === "subjects") {
      return [
        {
          label: "Total Assignment",
          value: totalSubjectAssignments,
          icon: BookOpen,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
        {
          label: "Assignment Aktif",
          value: activeSubjectAssignments,
          icon: BadgeCheck,
          accentClass: "from-emerald-500 via-teal-500 to-green-500",
        },
        {
          label: "Guru Terlibat",
          value: new Set(teacherSubjectAssignments.map((assignment) => assignment.teacher_id))
            .size,
          icon: UsersRound,
          accentClass: "from-teal-500 via-emerald-500 to-lime-500",
        },
        {
          label: "Kelas Terlayani",
          value: new Set(teacherSubjectAssignments.map((assignment) => assignment.class_id))
            .size,
          icon: GraduationCap,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
      ];
    }

    if (activeTab === "homerooms") {
      return [
        {
          label: "Total Assignment",
          value: totalHomeroomAssignments,
          icon: GraduationCap,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
        {
          label: "Walas Aktif",
          value: activeHomeroomAssignments,
          icon: BadgeCheck,
          accentClass: "from-emerald-500 via-teal-500 to-green-500",
        },
        {
          label: "Guru Walas",
          value: new Set(homeroomAssignments.map((assignment) => assignment.teacher_id)).size,
          icon: UsersRound,
          accentClass: "from-teal-500 via-emerald-500 to-lime-500",
        },
        {
          label: "Kelas Berwali",
          value: new Set(homeroomAssignments.map((assignment) => assignment.class_id)).size,
          icon: BookOpen,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
      ];
    }

    return [
      {
        label: "Total Guru",
        value: teacherProfiles.length,
        icon: UsersRound,
        accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        label: "Guru Aktif",
        value: activeTeacherCount,
        icon: BadgeCheck,
        accentClass: "from-emerald-500 via-teal-500 to-green-500",
      },
      {
        label: "Punya NIP",
        value: teacherProfiles.filter((teacher) => Boolean(teacher.nip?.trim())).length,
        icon: IdCard,
        accentClass: "from-teal-500 via-emerald-500 to-lime-500",
      },
      {
        label: "Punya NUPTK",
        value: teacherProfiles.filter((teacher) => Boolean(teacher.nuptk?.trim())).length,
        icon: FilePenLine,
        accentClass: "from-amber-400 via-orange-400 to-emerald-500",
      },
    ];
  }, [
    activeHomeroomAssignments,
    activeSubjectAssignments,
    activeTab,
    activeTeacherCount,
    homeroomAssignments,
    teacherProfiles,
    teacherSubjectAssignments,
    totalHomeroomAssignments,
    totalSubjectAssignments,
  ]);

  const addActionConfig = {
    profiles: {
      label: "Tambah",
      onClick: () => setProfileModalOpen(true),
    },
    subjects: {
      label: "Tambah",
      onClick: () => setSubjectModalOpen(true),
    },
    homerooms: {
      label: "Tambah",
      onClick: () => setHomeroomModalOpen(true),
    },
  } satisfies Record<
    TeacherTab,
    { label: string; onClick: () => void }
  >;

  const activeAction = addActionConfig[activeTab];

  return (
    <>
      <section
        id="guru"
        className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6"
      >
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Teacher Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Teacher Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Profil guru, assignment mapel, dan penugasan wali kelas dari API admin
                  dengan tampilan kerja yang lebih rapi untuk operasional harian.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <LineChart className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    Ringkasan kerja guru
                  </p>
                  <p className="text-xs leading-5 text-slate-500">
                    Cari cepat profil, status aktif, mapel, atau kelas wali secara langsung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <StatCard
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
              {activeTeacherCount} guru aktif
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
                  placeholder="Cari guru, mapel, kelas, NIP, NUPTK"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
                />
              </div>

              <div className="w-full sm:w-[190px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={profileStatusOptions}
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
              title="Data teacher belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TeacherTab)}
          className="mt-5 gap-4"
        >
          <ScrollableTabsWrapper>
            <TabsList className="flex min-w-max gap-2 rounded-[24px] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(242,250,246,0.92)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_rgba(15,23,42,0.04)] xl:min-w-0 xl:grid xl:w-full xl:grid-cols-3">
              <TabsTrigger
                value="profiles"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <UsersRound className="size-4" />
                Profil Guru
              </TabsTrigger>
              <TabsTrigger
                value="subjects"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <BookOpen className="size-4" />
                Penempatan Mapel
              </TabsTrigger>
              <TabsTrigger
                value="homerooms"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <GraduationCap className="size-4" />
                Penempatan Walas
              </TabsTrigger>
            </TabsList>
          </ScrollableTabsWrapper>

          <TabsContent value="profiles" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={8}
              isEmpty={filteredTeacherProfiles.length === 0}
              emptyTitle="Belum ada profil guru"
              emptyDescription="Tambahkan akun dengan role TEACHER lalu buat teacher profile agar data muncul di sini."
              icon={UsersRound}
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {[
                      "Guru",
                      "Username",
                      "NIP / NUPTK",
                      "Kontak",
                      "Mapel",
                      "Walas",
                      "Status",
                      "Aksi",
                    ].map((label) => (
                      <th
                        key={label}
                        className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherProfiles.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30"
                      >
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef7ec_0%,#ecfdf5_100%)] text-xs font-semibold text-emerald-700 shadow-[0_8px_20px_rgba(22,85,58,0.08)]">
                              {getInitials(teacher.name)}
                            </span>
                            <div>
                              <p className="font-medium text-slate-700">
                                {teacher.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {teacher.user_id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {teacher.username || "-"}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{teacher.nip || "-"}</p>
                            <p className="text-xs text-slate-400">
                              NUPTK: {teacher.nuptk || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{teacher.phone || "-"}</p>
                            <p className="text-xs text-slate-400">
                              {teacher.gender || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {subjectAssignmentsByTeacher[teacher.id] ?? 0}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {homeroomAssignmentsByTeacher[teacher.id] ?? 0}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <StatusBadge isActive={teacher.is_active} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingProfile(teacher)}
                            onDelete={() => setDeleteTarget({ type: "profile", item: teacher })}
                            isDeletePending={deleteTeacherProfileMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="subjects" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={7}
              isEmpty={filteredTeacherSubjectAssignments.length === 0}
              emptyTitle="Belum ada assignment mapel"
              emptyDescription="Relasi guru ke mapel dan kelas per tahun ajaran akan tampil di tabel ini."
              icon={BookOpen}
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {[
                      "Guru",
                      "Mapel",
                      "Kelas",
                      "Tahun Ajaran",
                      "Status",
                      "ID Assignment",
                      "Aksi",
                    ].map((label) => (
                      <th
                        key={label}
                        className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherSubjectAssignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30"
                      >
                        <td className="border-t border-slate-100 px-4 py-4 font-medium text-slate-700">
                          {assignment.teacher_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="space-y-1">
                            <p>{assignment.subject_name}</p>
                            <p className="text-xs text-slate-400">
                              {assignment.subject_code}
                            </p>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {assignment.class_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {assignment.school_year_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <StatusBadge isActive={assignment.is_active} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4 text-xs text-slate-400">
                          {assignment.id}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingSubjectAssignment(assignment)}
                            onDelete={() => setDeleteTarget({ type: "subject", item: assignment })}
                            isDeletePending={deleteTeacherSubjectAssignmentMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="homerooms" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={6}
              isEmpty={filteredHomeroomAssignments.length === 0}
              emptyTitle="Belum ada assignment walas"
              emptyDescription="Data wali kelas per tahun ajaran akan tampil di sini."
              icon={GraduationCap}
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {[
                      "Guru",
                      "Kelas",
                      "Tahun Ajaran",
                      "Status",
                      "ID Assignment",
                      "Aksi",
                    ].map((label) => (
                      <th
                        key={label}
                        className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHomeroomAssignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30"
                      >
                        <td className="border-t border-slate-100 px-4 py-4 font-medium text-slate-700">
                          {assignment.teacher_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {assignment.class_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {assignment.school_year_name}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <StatusBadge isActive={assignment.is_active} />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4 text-xs text-slate-400">
                          {assignment.id}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <ActionButtons
                            onEdit={() => setEditingHomeroomAssignment(assignment)}
                            onDelete={() => setDeleteTarget({ type: "homeroom", item: assignment })}
                            isDeletePending={deleteHomeroomAssignmentMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </DataTableCard>
          </TabsContent>
        </Tabs>
      </section>

      <TeacherProfileCreateModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        isPending={createTeacherProfileMutation.isPending}
        onSubmit={(payload) => createTeacherProfileMutation.mutate(payload)}
      />
      <TeacherProfileEditModal
        teacher={editingProfile}
        open={Boolean(editingProfile)}
        onOpenChange={(open) => {
          if (!open) setEditingProfile(null);
        }}
        isPending={updateTeacherProfileMutation.isPending}
        onSubmit={(payload) => updateTeacherProfileMutation.mutate(payload)}
      />

      <TeacherSubjectAssignmentCreateModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        teacherProfiles={teacherProfiles}
        subjects={subjectsQuery.data ?? []}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={createTeacherSubjectAssignmentMutation.isPending}
        onSubmit={(payload) => createTeacherSubjectAssignmentMutation.mutate(payload)}
      />
      <TeacherSubjectAssignmentEditModal
        assignment={editingSubjectAssignment}
        open={Boolean(editingSubjectAssignment)}
        onOpenChange={(open) => {
          if (!open) setEditingSubjectAssignment(null);
        }}
        teacherProfiles={teacherProfiles}
        subjects={subjectsQuery.data ?? []}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={updateTeacherSubjectAssignmentMutation.isPending}
        onSubmit={(payload) => {
          if (!editingSubjectAssignment) return;
          updateTeacherSubjectAssignmentMutation.mutate({
            id: editingSubjectAssignment.id,
            payload,
          });
        }}
      />

      <HomeroomAssignmentCreateModal
        open={homeroomModalOpen}
        onOpenChange={setHomeroomModalOpen}
        teacherProfiles={teacherProfiles}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={createHomeroomAssignmentMutation.isPending}
        onSubmit={(payload) => createHomeroomAssignmentMutation.mutate(payload)}
      />
      <HomeroomAssignmentEditModal
        assignment={editingHomeroomAssignment}
        open={Boolean(editingHomeroomAssignment)}
        onOpenChange={(open) => {
          if (!open) setEditingHomeroomAssignment(null);
        }}
        teacherProfiles={teacherProfiles}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={updateHomeroomAssignmentMutation.isPending}
        onSubmit={(payload) => {
          if (!editingHomeroomAssignment) return;
          updateHomeroomAssignmentMutation.mutate({
            id: editingHomeroomAssignment.id,
            payload,
          });
        }}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getTeacherDeleteTitle(deleteTarget)}
        description={getTeacherDeleteDescription(deleteTarget)}
        isPending={
          deleteTeacherProfileMutation.isPending ||
          deleteTeacherSubjectAssignmentMutation.isPending ||
          deleteHomeroomAssignmentMutation.isPending
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "profile") {
            deleteTeacherProfileMutation.mutate(deleteTarget.item.user_id);
            return;
          }
          if (deleteTarget.type === "subject") {
            deleteTeacherSubjectAssignmentMutation.mutate(deleteTarget.item.id);
            return;
          }
          deleteHomeroomAssignmentMutation.mutate(deleteTarget.item.id);
        }}
      />
    </>
  );
}

function getTeacherDeleteTitle(target: TeacherDeleteTarget | null) {
  if (target?.type === "profile") return "Hapus Guru?";
  if (target?.type === "subject") return "Hapus Assignment Mapel?";
  if (target?.type === "homeroom") return "Hapus Assignment Walas?";
  return "Konfirmasi Penghapusan";
}

function getTeacherDeleteDescription(target: TeacherDeleteTarget | null) {
  if (!target) return "Data ini akan dihapus permanen.";
  if (target.type === "profile") {
    return `Profil dan akun guru "${target.item.name}" akan dihapus permanen.`;
  }
  if (target.type === "subject") {
    return `Assignment mapel "${target.item.subject_name}" untuk ${target.item.teacher_name} akan dihapus permanen.`;
  }
  return `Assignment wali kelas "${target.item.class_name}" untuk ${target.item.teacher_name} akan dihapus permanen.`;
}

function TeacherProfileCreateModal({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: TeacherProfileCreatePayload) => void;
}) {
  const [form, setForm] = useState<TeacherProfileCreatePayload>({
    name: "",
    username: "",
    password: "",
    nip: "",
    nuptk: "",
    gender: "",
    phone: "",
    address: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof TeacherProfileCreatePayload>>({});

  const reset = () => {
    setForm({
      name: "",
      username: "",
      password: "",
      nip: "",
      nuptk: "",
      gender: "",
      phone: "",
      address: "",
      is_active: true,
    });
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateTeacherProfileForm(form, false);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah Profil Guru"
      description="Lengkapi data profil guru tanpa berpindah ke halaman lain."
      icon={FilePenLine}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Guru">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Masukkan nama guru"
              className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Username Login">
            <Input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="Masukkan username guru"
              className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            />
            <FieldError message={errors.username} />
          </FieldGroup>
        </div>

        <FieldGroup label="Password Login">
          <Input
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Minimal 6 karakter"
            className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
          />
          <FieldError message={errors.password} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="NIP">
            <Input
              value={form.nip}
              onChange={(event) =>
                setForm((current) => ({ ...current, nip: event.target.value }))
              }
              placeholder="Masukkan NIP guru"
              className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            />
            <FieldError message={errors.nip} />
          </FieldGroup>
          <FieldGroup label="NUPTK">
            <Input
              value={form.nuptk}
              onChange={(event) =>
                setForm((current) => ({ ...current, nuptk: event.target.value }))
              }
              placeholder="Masukkan NUPTK guru"
              className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            />
            <FieldError message={errors.nuptk} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Jenis Kelamin">
            <RadixSelectField
              value={form.gender}
              onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}
              placeholder="Pilih jenis kelamin"
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <FieldError message={errors.gender} />
          </FieldGroup>
          <FieldGroup label="Status Aktif">
            <RadixSelectField
              value={String(form.is_active)}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, is_active: value === "true" }))
              }
              placeholder="Pilih status aktif"
              options={[
                { value: "true", label: "Aktif" },
                { value: "false", label: "Nonaktif" },
              ]}
            />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <div className="grid gap-4">
          <FieldGroup label="Telepon">
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="08xxxxxxxxxx"
              className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
            />
            <FieldError message={errors.phone} />
          </FieldGroup>
        </div>

        <FieldGroup
          label="Alamat"
          helper="Gunakan alamat singkat yang mudah dibaca admin untuk kebutuhan data master."
        >
          <Textarea
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            placeholder="Masukkan alamat guru"
            className="min-h-[140px] rounded-[1.4rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 py-3 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]"
          />
          <FieldError message={errors.address} />
        </FieldGroup>

        <ModalActions
          isPending={isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel="Simpan Profil Guru"
        />
      </div>
    </PremiumModal>
  );
}

function TeacherProfileEditModal({
  teacher,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  teacher: AdminTeacherProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: TeacherProfileCreatePayload) => void;
}) {
  const [form, setForm] = useState<TeacherProfileCreatePayload>({
    name: "",
    username: "",
    password: "",
    nip: "",
    nuptk: "",
    gender: "",
    phone: "",
    address: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof TeacherProfileCreatePayload>>({});

  useEffect(() => {
    if (!teacher) return;
    setForm({
      name: teacher.name,
      username: teacher.username ?? "",
      password: "",
      nip: teacher.nip ?? "",
      nuptk: teacher.nuptk ?? "",
      gender: teacher.gender ?? "",
      phone: teacher.phone ?? "",
      address: teacher.address ?? "",
      is_active: teacher.is_active,
    });
    setErrors({});
  }, [teacher]);

  const handleSubmit = () => {
    const nextErrors = validateTeacherProfileForm(form, true);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!teacher) return null;

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Profil Guru"
      description="Perbarui akun dan profil guru tanpa membuka halaman lain."
      icon={FilePenLine}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Guru">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masukkan nama guru" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Username Login">
            <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="Masukkan username guru" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
            <FieldError message={errors.username} />
          </FieldGroup>
        </div>

        <FieldGroup label="Password Baru">
          <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Kosongkan jika tidak diubah" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
          <FieldError message={errors.password} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="NIP">
            <Input value={form.nip} onChange={(event) => setForm((current) => ({ ...current, nip: event.target.value }))} placeholder="Masukkan NIP guru" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
            <FieldError message={errors.nip} />
          </FieldGroup>
          <FieldGroup label="NUPTK">
            <Input value={form.nuptk} onChange={(event) => setForm((current) => ({ ...current, nuptk: event.target.value }))} placeholder="Masukkan NUPTK guru" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
            <FieldError message={errors.nuptk} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Jenis Kelamin">
            <RadixSelectField value={form.gender} onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))} placeholder="Pilih jenis kelamin" options={[{ value: "MALE", label: "Laki-laki" }, { value: "FEMALE", label: "Perempuan" }]} />
            <FieldError message={errors.gender} />
          </FieldGroup>
          <FieldGroup label="Status Aktif">
            <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status aktif" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <FieldGroup label="Telepon">
          <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="08xxxxxxxxxx" className="h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
          <FieldError message={errors.phone} />
        </FieldGroup>

        <FieldGroup label="Alamat" helper="Gunakan alamat singkat yang mudah dibaca admin untuk kebutuhan data master.">
          <Textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Masukkan alamat guru" className="min-h-[140px] rounded-[1.4rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 py-3 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]" />
          <FieldError message={errors.address} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Profil Guru" />
      </div>
    </PremiumModal>
  );
}

function TeacherSubjectAssignmentCreateModal({
  open,
  onOpenChange,
  teacherProfiles,
  subjects,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherProfiles: AdminTeacherProfile[];
  subjects: AdminSubject[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminTeacherSubjectAssignmentPayload) => void;
}) {
  const [form, setForm] = useState<AdminTeacherSubjectAssignmentPayload>({
    teacher_id: "",
    subject_id: "",
    class_id: "",
    school_year_id: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminTeacherSubjectAssignmentPayload>>({});

  const reset = () => {
    setForm({
      teacher_id: "",
      subject_id: "",
      class_id: "",
      school_year_id: "",
      is_active: true,
    });
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateTeacherSubjectAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah Assignment Mapel"
      description="Buat relasi guru ke mapel dan kelas untuk tahun ajaran yang relevan."
      icon={BookOpen}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField
              value={form.teacher_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, teacher_id: value }))
              }
              placeholder="Pilih guru"
              options={teacherProfiles.map((teacher) => ({
                value: teacher.id,
                label: teacher.name,
                description: teacher.nip || teacher.username || teacher.id,
              }))}
            />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Mapel">
            <RadixSelectField
              value={form.subject_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, subject_id: value }))
              }
              placeholder="Pilih mapel"
              options={subjects.map((subject) => ({
                value: subject.id,
                label: subject.name,
                description: subject.code,
              }))}
            />
            <FieldError message={errors.subject_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Kelas">
            <RadixSelectField
              value={form.class_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, class_id: value }))
              }
              placeholder="Pilih kelas"
              options={classes.map((item) => ({
                value: item.id,
                label: item.display_name,
                description: item.school_year_name,
              }))}
            />
            <FieldError message={errors.class_id} />
          </FieldGroup>
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField
              value={form.school_year_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, school_year_id: value }))
              }
              placeholder="Pilih tahun ajaran"
              options={schoolYears.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Assignment">
          <RadixSelectField
            value={String(form.is_active)}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, is_active: value === "true" }))
            }
            placeholder="Pilih status"
            options={[
              { value: "true", label: "Aktif" },
              { value: "false", label: "Nonaktif" },
            ]}
          />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions
          isPending={isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel="Simpan Assignment Mapel"
        />
      </div>
    </PremiumModal>
  );
}

function TeacherSubjectAssignmentEditModal({
  assignment,
  open,
  onOpenChange,
  teacherProfiles,
  subjects,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  assignment: AdminTeacherSubjectAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherProfiles: AdminTeacherProfile[];
  subjects: AdminSubject[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminTeacherSubjectAssignmentPayload) => void;
}) {
  const [form, setForm] = useState<AdminTeacherSubjectAssignmentPayload>({
    teacher_id: "",
    subject_id: "",
    class_id: "",
    school_year_id: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminTeacherSubjectAssignmentPayload>>({});

  useEffect(() => {
    if (!assignment) return;
    setForm({
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      class_id: assignment.class_id,
      school_year_id: assignment.school_year_id,
      is_active: assignment.is_active,
    });
    setErrors({});
  }, [assignment]);

  const handleSubmit = () => {
    const nextErrors = validateTeacherSubjectAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!assignment) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Assignment Mapel" description="Perbarui relasi guru, mapel, kelas, dan tahun ajaran sesuai kebutuhan." icon={BookOpen}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField value={form.teacher_id} onValueChange={(value) => setForm((current) => ({ ...current, teacher_id: value }))} placeholder="Pilih guru" options={teacherProfiles.map((teacher) => ({ value: teacher.id, label: teacher.name, description: teacher.nip || teacher.username || teacher.id }))} />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Mapel">
            <RadixSelectField value={form.subject_id} onValueChange={(value) => setForm((current) => ({ ...current, subject_id: value }))} placeholder="Pilih mapel" options={subjects.map((subject) => ({ value: subject.id, label: subject.name, description: subject.code }))} />
            <FieldError message={errors.subject_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(value) => setForm((current) => ({ ...current, class_id: value }))} placeholder="Pilih kelas" options={classes.map((item) => ({ value: item.id, label: item.display_name, description: item.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Assignment">
          <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Assignment Mapel" />
      </div>
    </PremiumModal>
  );
}

function HomeroomAssignmentCreateModal({
  open,
  onOpenChange,
  teacherProfiles,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherProfiles: AdminTeacherProfile[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminHomeroomAssignmentPayload) => void;
}) {
  const [form, setForm] = useState<AdminHomeroomAssignmentPayload>({
    teacher_id: "",
    class_id: "",
    school_year_id: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminHomeroomAssignmentPayload>>({});

  const reset = () => {
    setForm({
      teacher_id: "",
      class_id: "",
      school_year_id: "",
      is_active: true,
    });
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateHomeroomAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah Assignment Walas"
      description="Tentukan guru yang menjadi wali kelas untuk rombel dan tahun ajaran tertentu."
      icon={GraduationCap}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField
              value={form.teacher_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, teacher_id: value }))
              }
              placeholder="Pilih guru"
              options={teacherProfiles.map((teacher) => ({
                value: teacher.id,
                label: teacher.name,
                description: teacher.nip || teacher.username || teacher.id,
              }))}
            />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField
              value={form.class_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, class_id: value }))
              }
              placeholder="Pilih kelas walas"
              options={classes.map((item) => ({
                value: item.id,
                label: item.display_name,
                description: item.school_year_name,
              }))}
            />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField
              value={form.school_year_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, school_year_id: value }))
              }
              placeholder="Pilih tahun ajaran"
              options={schoolYears.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Assignment">
            <RadixSelectField
              value={String(form.is_active)}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, is_active: value === "true" }))
              }
              placeholder="Pilih status"
              options={[
                { value: "true", label: "Aktif" },
                { value: "false", label: "Nonaktif" },
              ]}
            />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <ModalActions
          isPending={isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel="Simpan Assignment Walas"
        />
      </div>
    </PremiumModal>
  );
}

function HomeroomAssignmentEditModal({
  assignment,
  open,
  onOpenChange,
  teacherProfiles,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: {
  assignment: AdminHomeroomAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherProfiles: AdminTeacherProfile[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminHomeroomAssignmentPayload) => void;
}) {
  const [form, setForm] = useState<AdminHomeroomAssignmentPayload>({
    teacher_id: "",
    class_id: "",
    school_year_id: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminHomeroomAssignmentPayload>>({});

  useEffect(() => {
    if (!assignment) return;
    setForm({
      teacher_id: assignment.teacher_id,
      class_id: assignment.class_id,
      school_year_id: assignment.school_year_id,
      is_active: assignment.is_active,
    });
    setErrors({});
  }, [assignment]);

  const handleSubmit = () => {
    const nextErrors = validateHomeroomAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!assignment) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Assignment Walas" description="Perbarui penugasan wali kelas untuk kelas dan tahun ajaran tertentu." icon={GraduationCap}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField value={form.teacher_id} onValueChange={(value) => setForm((current) => ({ ...current, teacher_id: value }))} placeholder="Pilih guru" options={teacherProfiles.map((teacher) => ({ value: teacher.id, label: teacher.name, description: teacher.nip || teacher.username || teacher.id }))} />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(value) => setForm((current) => ({ ...current, class_id: value }))} placeholder="Pilih kelas walas" options={classes.map((item) => ({ value: item.id, label: item.display_name, description: item.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(value) => setForm((current) => ({ ...current, school_year_id: value }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((item) => ({ value: item.id, label: item.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Assignment">
            <RadixSelectField value={String(form.is_active)} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))} placeholder="Pilih status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Assignment Walas" />
      </div>
    </PremiumModal>
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
      <Button
        variant="outline"
        className="h-12 rounded-[1.1rem] border-slate-200 px-5 text-sm font-semibold text-slate-600"
        onClick={onCancel}
        disabled={isPending}
      >
        Batal
      </Button>
      <Button
        className="h-12 rounded-[1.1rem] bg-[linear-gradient(135deg,#0f766e_0%,#166534_100%)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] hover:opacity-95"
        onClick={onSubmit}
        disabled={isPending}
      >
        <Sparkles className="size-4" />
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
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

function DataTableCard({
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
        <div className="overflow-x-auto">
          <LoadingTable columnCount={columnCount} />
        </div>
      ) : isEmpty ? (
        <div className="p-5">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} compact />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {children}
        </div>
      )}
    </motion.div>
  );
}

function LoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={`teacher-loading-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div
              key={`teacher-loading-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-100"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyRow({
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
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          compact
        />
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

function StatCard({
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
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center text-right">
          <span
            className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

type TeacherProfileCreatePayload = {
  name: string;
  username: string;
  password: string;
  nip: string;
  nuptk: string;
  gender: string;
  phone: string;
  address: string;
  is_active: boolean;
};

function validateTeacherProfileForm(
  form: TeacherProfileCreatePayload,
  isEdit: boolean,
): FieldErrors<keyof TeacherProfileCreatePayload> {
  const errors: FieldErrors<keyof TeacherProfileCreatePayload> = {};
  validateRequired(errors, "name", form.name, "Nama guru");
  validateRequired(errors, "username", form.username, "Username login");
  validateMinLength(errors, "password", form.password, 6, isEdit ? "Password baru" : "Password login", {
    allowEmpty: isEdit,
  });
  if (!isEdit) validateRequired(errors, "nip", form.nip, "NIP");
  if (!isEdit) validateRequired(errors, "nuptk", form.nuptk, "NUPTK");
  validateRequired(errors, "gender", form.gender, "Jenis kelamin");
  validatePhone(errors, "phone", form.phone, "Telepon", { allowEmpty: true });
  return errors;
}

function validateTeacherSubjectAssignmentForm(
  form: AdminTeacherSubjectAssignmentPayload,
): FieldErrors<keyof AdminTeacherSubjectAssignmentPayload> {
  const errors: FieldErrors<keyof AdminTeacherSubjectAssignmentPayload> = {};
  validateRequired(errors, "teacher_id", form.teacher_id, "Guru");
  validateRequired(errors, "subject_id", form.subject_id, "Mapel");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "is_active", String(form.is_active), "Status assignment");
  return errors;
}

function validateHomeroomAssignmentForm(
  form: AdminHomeroomAssignmentPayload,
): FieldErrors<keyof AdminHomeroomAssignmentPayload> {
  const errors: FieldErrors<keyof AdminHomeroomAssignmentPayload> = {};
  validateRequired(errors, "teacher_id", form.teacher_id, "Guru");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "is_active", String(form.is_active), "Status assignment");
  return errors;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "G";
  }
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
