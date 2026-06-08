"use client";

import { EmptyState } from "@/components/dashboard/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalLabelClassName,
} from "@/components/ui/premium-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BadgeCheck,
  Building2,
  GraduationCap,
  LayoutPanelTop,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminClass, AdminClassPayload, AdminMajor, AdminSchoolYear } from "@/types/admin";
import { createAdminClass, deleteAdminClass, updateAdminClass } from "@/services/admin.service";
import {
  type FieldErrors,
  hasFieldErrors,
  validateRequired,
} from "@/lib/form-validation";

type ClassManagementSectionProps = {
  classes: AdminClass[];
  majors: AdminMajor[];
  schoolYears: AdminSchoolYear[];
  isLoading?: boolean;
  errorMessage?: string;
};

type ClassFormState = {
  grade: string;
  name: string;
  major_id: string;
  school_year_id: string;
  is_active: boolean;
};

type ClassFormField = keyof ClassFormState;

const emptyForm: ClassFormState = {
  grade: "",
  name: "",
  major_id: "",
  school_year_id: "",
  is_active: true,
};

const gradeOptions = ["X", "XI", "XII", "XIII"];

const classModalInputClassName =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

const classModalSelectTriggerClassName =
  "!h-14 !min-h-14 w-full data-[size=default]:!h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 py-0 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-open:border-emerald-500 data-open:ring-4 data-open:ring-emerald-200/80 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:h-full [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:text-slate-700 [&_[data-slot=select-value]]:data-placeholder:text-slate-400 [&_svg]:text-slate-400";

const classModalSelectContentClassName =
  "z-[9999] rounded-[1.25rem] border border-emerald-200/80 bg-white/96 p-2 text-slate-700 shadow-[0_22px_48px_rgba(15,23,42,0.16),0_8px_18px_rgba(16,185,129,0.08)] ring-0 backdrop-blur-xl";

const classModalSelectItemClassName =
  "min-h-11 rounded-[0.95rem] px-3 py-2.5 pr-9 text-[0.92rem] font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 data-highlighted:bg-emerald-50 data-highlighted:text-emerald-800 data-selected:bg-emerald-100/80 data-selected:text-emerald-900";

const classModalSelectTriggerStyle = {
  height: "3.5rem",
  minHeight: "3.5rem",
} as const;

export function ClassManagementSection({
  classes,
  majors,
  schoolYears,
  isLoading = false,
  errorMessage,
}: ClassManagementSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClass | null>(null);

  const activeClasses = classes.filter((item) => item.is_active);
  const totalStudents = classes.reduce((sum, item) => sum + (item.student_count ?? 0), 0);
  const totalAssignments = classes.reduce(
    (sum, item) => sum + (item.subject_assignment_count ?? 0),
    0,
  );
  const homeroomCovered = classes.filter((item) => item.homeroom_teacher_name).length;

  const filteredClasses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return classes.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchesQuery =
        normalized.length === 0 ||
        item.display_name.toLowerCase().includes(normalized) ||
        item.major_name.toLowerCase().includes(normalized) ||
        item.school_year_name.toLowerCase().includes(normalized) ||
        (item.homeroom_teacher_name ?? "").toLowerCase().includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [classes, query, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createAdminClass,
    onSuccess: () => {
      toast.success("Kelas berhasil ditambahkan.");
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminClassPayload }) =>
      updateAdminClass(id, payload),
    onSuccess: () => {
      toast.success("Kelas berhasil diperbarui.");
      setEditingClass(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-homeroom-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminClass,
    onSuccess: () => {
      toast.success("Kelas dan relasi terkait berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-homeroom-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const kpiCards = [
    {
      label: "Total Kelas",
      value: classes.length,
      icon: Building2,
      accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    {
      label: "Kelas Aktif",
      value: activeClasses.length,
      icon: BadgeCheck,
      accentClass: "from-teal-500 via-emerald-500 to-green-500",
    },
    {
      label: "Siswa Terhubung",
      value: totalStudents,
      icon: Users,
      accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
    },
    {
      label: "Walas Terpasang",
      value: homeroomCovered,
      icon: ShieldCheck,
      accentClass: "from-amber-400 via-orange-400 to-emerald-500",
    },
  ];

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
                Class Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Class Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola rombel, jurusan, tahun ajaran, walas, dan relasi data kelas dari satu
                  area operasional admin.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <GraduationCap className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Relasi data kelas</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Hapus kelas akan membersihkan walas, mapel, membership, dan absensi terkait.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <ClassStatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {totalAssignments} assignment mapel aktif terhubung ke struktur kelas
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <SearchControl query={query} onQueryChange={setQuery} />

              <Button
                variant="outline"
                className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
                onClick={() => setModalOpen(true)}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                  <Plus className="size-4" />
                </span>
                Tambah
              </Button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState
              icon={Building2}
              title="Data kelas belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
          className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80"
        >
          <div className="overflow-x-auto">
            {isLoading ? (
              <ClassLoadingTable columnCount={8} />
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Kelas", "Jurusan", "Tahun Ajaran", "Walas", "Siswa", "Mapel", "Status", "Aksi"].map((label) => (
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
                  {filteredClasses.length === 0 ? (
                    <tr className="bg-white">
                      <td colSpan={8} className="p-5">
                        <EmptyState
                          icon={Building2}
                          title="Kelas tidak ditemukan"
                          description="Coba ubah pencarian, filter status, atau tambahkan kelas baru."
                          compact
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((item) => (
                      <tr key={item.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                              {item.grade}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{item.display_name}</p>
                              <p className="text-xs text-slate-400">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <p className="font-medium text-slate-700">{item.major_code}</p>
                          <p className="text-xs text-slate-400">{item.major_name}</p>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4 whitespace-nowrap">{item.school_year_name}</td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          {item.homeroom_teacher_name ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              {item.homeroom_teacher_name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Belum Ada
                            </Badge>
                          )}
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">{item.student_count}</td>
                        <td className="border-t border-slate-100 px-4 py-4">{item.subject_assignment_count}</td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <Badge variant="outline" className={item.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="border-t border-slate-100 px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="rounded-[14px] border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => setEditingClass(item)}
                            >
                              <PencilLine className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="rounded-[14px] border-rose-200/80 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </section>

      <ClassFormModal
        title="Tambah Kelas"
        description="Buat rombel baru yang langsung bisa dipakai untuk assignment walas, mapel, dan penempatan siswa."
        open={modalOpen}
        majors={majors}
        schoolYears={schoolYears}
        isSubmitting={createMutation.isPending}
        onOpenChange={setModalOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <ClassFormModal
        title="Edit Kelas"
        description="Perbarui identitas kelas tanpa memutus relasi data yang sudah terhubung."
        open={Boolean(editingClass)}
        initialData={editingClass ?? undefined}
        majors={majors}
        schoolYears={schoolYears}
        isSubmitting={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setEditingClass(null);
        }}
        onSubmit={(payload) => {
          if (!editingClass) return;
          updateMutation.mutate({ id: editingClass.id, payload });
        }}
      />

      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        title="Hapus Kelas?"
        description={
          deleteTarget
            ? `Kelas "${deleteTarget.display_name}" akan dihapus bersama relasi walas, mapel, membership siswa, dan record absensi terkait.`
            : ""
        }
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

function ClassFormModal({
  title,
  description,
  open,
  initialData,
  majors,
  schoolYears,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  title: string;
  description: string;
  open: boolean;
  initialData?: AdminClass;
  majors: AdminMajor[];
  schoolYears: AdminSchoolYear[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminClassPayload) => void;
}) {
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors<ClassFormField>>({});

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            grade: initialData.grade,
            name: initialData.name,
            major_id: initialData.major_id,
            school_year_id: initialData.school_year_id,
            is_active: initialData.is_active,
          }
        : emptyForm,
    );
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const nextErrors: FieldErrors<ClassFormField> = {};
    validateRequired(nextErrors, "grade", form.grade, "Tingkat kelas");
    validateRequired(nextErrors, "name", form.name, "Nama rombel");
    validateRequired(nextErrors, "major_id", form.major_id, "Jurusan");
    validateRequired(nextErrors, "school_year_id", form.school_year_id, "Tahun ajaran");

    setErrors(nextErrors);
    return !hasFieldErrors(nextErrors);
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      grade: form.grade,
      name: form.name.trim(),
      major_id: form.major_id,
      school_year_id: form.school_year_id,
      is_active: form.is_active,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(emptyForm);
      setErrors({});
    }
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      icon={Building2}
      title={title}
      description={description}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Tingkat">
          <Select value={form.grade} onValueChange={(value) => setForm((prev) => ({ ...prev, grade: value ?? "" }))}>
            <SelectTrigger className={classModalSelectTriggerClassName} style={classModalSelectTriggerStyle}>
              <span className={form.grade ? "text-slate-700" : "text-slate-400"}>
                {form.grade || "Pilih tingkat"}
              </span>
            </SelectTrigger>
            <SelectContent className={classModalSelectContentClassName}>
              {gradeOptions.map((grade) => (
                <SelectItem key={grade} value={grade} className={classModalSelectItemClassName}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.grade} />
        </FieldGroup>

        <FieldGroup label="Nama Rombel">
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Contoh: 1"
            className={classModalInputClassName}
          />
          <FieldError message={errors.name} />
        </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Jurusan">
          <Select value={form.major_id} onValueChange={(value) => setForm((prev) => ({ ...prev, major_id: value ?? "" }))}>
            <SelectTrigger className={classModalSelectTriggerClassName} style={classModalSelectTriggerStyle}>
              <span className={form.major_id ? "text-slate-700" : "text-slate-400"}>
                {majors.find((major) => major.id === form.major_id)?.code ?? "Pilih jurusan"}
              </span>
            </SelectTrigger>
            <SelectContent className={classModalSelectContentClassName}>
              {majors.map((major) => (
                <SelectItem key={major.id} value={major.id} className={classModalSelectItemClassName}>
                  {major.code} - {major.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.major_id} />
        </FieldGroup>

        <FieldGroup label="Tahun Ajaran">
          <Select value={form.school_year_id} onValueChange={(value) => setForm((prev) => ({ ...prev, school_year_id: value ?? "" }))}>
            <SelectTrigger className={classModalSelectTriggerClassName} style={classModalSelectTriggerStyle}>
              <span className={form.school_year_id ? "text-slate-700" : "text-slate-400"}>
                {schoolYears.find((year) => year.id === form.school_year_id)?.name ?? "Pilih tahun ajaran"}
              </span>
            </SelectTrigger>
            <SelectContent className={classModalSelectContentClassName}>
              {schoolYears.map((year) => (
                <SelectItem key={year.id} value={year.id} className={classModalSelectItemClassName}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.school_year_id} />
        </FieldGroup>
        </div>

        <FieldGroup label="Status Kelas">
          <Select
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "active" }))}
          >
            <SelectTrigger className={classModalSelectTriggerClassName} style={classModalSelectTriggerStyle}>
              <span className="text-slate-700">{form.is_active ? "Aktif" : "Nonaktif"}</span>
            </SelectTrigger>
            <SelectContent className={classModalSelectContentClassName}>
              <SelectItem value="active" className={classModalSelectItemClassName}>Aktif</SelectItem>
              <SelectItem value="inactive" className={classModalSelectItemClassName}>Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className={premiumModalActionsClassName}>
          <Button
            variant="outline"
            className="h-12 rounded-[1.1rem] border-slate-200 px-5 text-sm font-semibold text-slate-600"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            className="h-12 rounded-[1.1rem] bg-[linear-gradient(135deg,#0f766e_0%,#166534_100%)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] hover:opacity-95"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Sparkles className="size-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan Kelas"}
          </Button>
        </div>
      </div>
    </PremiumModal>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      {children}
    </div>
  );
}

function SearchControl({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
      <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <SlidersHorizontal className="size-4" />
      </span>
      <Search className="size-4 text-slate-400" />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Cari kelas, jurusan, walas"
        className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]"
      />
    </div>
  );
}

function ClassStatCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  accentClass: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/84 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>
        <span className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_18px_30px_rgba(16,185,129,0.18)]`}>
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  );
}

function ClassLoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-1 bg-white p-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={`class-loading-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div
              key={`class-loading-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-100"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
