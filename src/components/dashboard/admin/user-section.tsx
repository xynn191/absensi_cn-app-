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
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from "@/services/admin.service";
import type { AdminUser, AdminUserPayload } from "@/types/admin";
import {
  type FieldErrors,
  hasFieldErrors,
  validateMinLength,
  validateRequired,
} from "@/lib/form-validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  PencilLine,
  Trash2,
  FilePenLine,
  GraduationCap,
  LayoutPanelTop,
  LineChart,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";

type UserSectionProps = {
  users: AdminUser[];
  isLoading?: boolean;
  errorMessage?: string;
};

type UserTab = "all" | "admins" | "bk" | "teachers";

export function UserSection({
  users,
  isLoading = false,
  errorMessage,
}: UserSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<UserTab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("Akun baru berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserPayload }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      toast.success("Akun staff berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Akun staff berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const staffUsers = useMemo(
    () => users.filter((user) => user.role !== "STUDENT"),
    [users],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const base = staffUsers.filter((user) => {
      if (activeTab === "admins") return user.role === "ADMIN";
      if (activeTab === "bk") return user.role === "BK";
      if (activeTab === "teachers") return user.role === "TEACHER";
      return true;
    });

    return base.filter(
      (user) =>
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.role.toLowerCase().includes(normalizedQuery) ||
        (user.username ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [activeTab, normalizedQuery, staffUsers]);

  const kpiCards = [
    {
      label: "Akun Staff",
      value: staffUsers.length,
      icon: UsersRound,
      accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    {
      label: "Administrator",
      value: staffUsers.filter((user) => user.role === "ADMIN").length,
      icon: ShieldCheck,
      accentClass: "from-teal-500 via-emerald-500 to-green-500",
    },
    {
      label: "BK",
      value: staffUsers.filter((user) => user.role === "BK").length,
      icon: UserCog,
      accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
    },
    {
      label: "Akun Guru",
      value: staffUsers.filter((user) => user.role === "TEACHER").length,
      icon: GraduationCap,
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
                Role Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Role Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola distribusi role administrator, BK, dan guru dari endpoint admin users
                  dengan pola kerja yang konsisten dengan section lain.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <LineChart className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Ringkasan distribusi role</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Fokus ke sebaran role dan akun staff yang dipakai lintas modul sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <UserStatCard
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
              {staffUsers.length} akun staff dengan role operasional tersedia
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
                  placeholder="Cari nama, role, username"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
                />
              </div>

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
            <EmptyState icon={ShieldCheck} title="Data admin belum bisa dimuat" description={errorMessage} compact />
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserTab)} className="mt-5 gap-4">
          <TabsList className="grid w-full grid-cols-1 gap-2 rounded-[24px] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(242,250,246,0.92)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_rgba(15,23,42,0.04)] sm:grid-cols-2 xl:grid-cols-4">
            <TabsTrigger value="all" className="w-full rounded-[18px] border border-transparent px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)]">
              <UsersRound className="size-4" />
              Semua Akun
            </TabsTrigger>
            <TabsTrigger value="admins" className="w-full rounded-[18px] border border-transparent px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)]">
              <ShieldCheck className="size-4" />
              Administrator
            </TabsTrigger>
            <TabsTrigger value="bk" className="w-full rounded-[18px] border border-transparent px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)]">
              <UserCog className="size-4" />
              BK
            </TabsTrigger>
            <TabsTrigger value="teachers" className="w-full rounded-[18px] border border-transparent px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)]">
              <GraduationCap className="size-4" />
              Guru
            </TabsTrigger>
          </TabsList>

        {(["all", "admins", "bk", "teachers"] as UserTab[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
              <UserDataTableCard isLoading={isLoading} columnCount={6} emptyTitle="Belum ada role staff" emptyDescription="Tambahkan akun baru untuk admin, BK, atau guru dari section ini." icon={ShieldCheck}>
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                      {["Nama", "Role", "Username", "Identifier", "Akses", "Aksi"].map((label) => (
                        <th key={label} className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && filteredUsers.length === 0 ? (
                      <UserEmptyRow colSpan={6} icon={ShieldCheck} title="Role staff tidak ditemukan" description="Coba ubah tab atau kata kunci pencarian akun staff." />
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                          <td className="border-t border-slate-100 px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                                {getInitials(user.name)}
                              </span>
                              <div>
                                <p className="font-medium text-slate-700">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="border-t border-slate-100 px-4 py-4">
                            <UserRoleBadge role={user.role} />
                          </td>
                          <td className="border-t border-slate-100 px-4 py-4">{user.username || "-"}</td>
                          <td className="border-t border-slate-100 px-4 py-4">{user.username || user.nis || "-"}</td>
                          <td className="border-t border-slate-100 px-4 py-4">{roleDescription(user.role)}</td>
                          <td className="border-t border-slate-100 px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="rounded-[14px] border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                onClick={() => setEditingUser(user)}
                              >
                                <PencilLine className="size-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="rounded-[14px] border-red-200/80 bg-white text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                                onClick={() => setDeleteTarget(user)}
                                disabled={deleteUserMutation.isPending}
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
              </UserDataTableCard>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <UserCreateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isPending={createUserMutation.isPending}
        onSubmit={(payload) => createUserMutation.mutate(payload)}
      />
      <UserEditModal
        user={editingUser}
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        isPending={updateUserMutation.isPending}
        onSubmit={(payload) => {
          if (!editingUser) return;
          updateUserMutation.mutate({ id: editingUser.id, payload });
        }}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Role Staff?"
        description={
          deleteTarget
            ? `Akun "${deleteTarget.name}" dengan role ${deleteTarget.role} akan dihapus permanen.`
            : "Akun staff ini akan dihapus permanen."
        }
        isPending={deleteUserMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUserMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}

function UserCreateModal({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminUserPayload) => void;
}) {
  const [form, setForm] = useState<AdminUserPayload>({
    name: "",
    role: "ADMIN",
    username: "",
    nis: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminUserPayload>>({});

  const reset = () => {
    setForm({
      name: "",
      role: "ADMIN",
      username: "",
      nis: "",
      password: "",
    });
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = () => {
    const nextErrors = validateRoleUserForm(form, false);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Role Staff" description="Buat akun administrator, BK, atau guru dasar untuk kebutuhan operasional backend." icon={UserCog}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Akun">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masukkan nama akun" className={userInputClassName} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Role">
            <RadixSelectField value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as AdminUser["role"] }))} placeholder="Pilih role" options={[{ value: "ADMIN", label: "ADMIN" }, { value: "BK", label: "BK" }, { value: "TEACHER", label: "TEACHER" }]} />
            <FieldError message={errors.role} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Username">
            <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value, nis: "" }))} placeholder="Masukkan username" className={userInputClassName} />
            <FieldError message={errors.username} />
          </FieldGroup>
          <FieldGroup label="Password Login">
            <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimal 6 karakter" className={userInputClassName} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <UserModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Role Staff" />
      </div>
    </PremiumModal>
  );
}

function UserEditModal({
  user,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminUserPayload) => void;
}) {
  const [form, setForm] = useState<AdminUserPayload>({
    name: "",
    role: "ADMIN",
    username: "",
    nis: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AdminUserPayload>>({});

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      role: user.role,
      username: user.username ?? "",
      nis: user.nis ?? "",
      password: "",
    });
    setErrors({});
  }, [user]);

  const handleSubmit = () => {
    const nextErrors = validateRoleUserForm(form, true);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!user) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Role Staff" description="Perbarui nama akun, role, username, dan password bila memang perlu diganti." icon={FilePenLine}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Akun">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masukkan nama akun" className={userInputClassName} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Role">
            <RadixSelectField value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as AdminUser["role"] }))} placeholder="Pilih role" options={[{ value: "ADMIN", label: "ADMIN" }, { value: "BK", label: "BK" }, { value: "TEACHER", label: "TEACHER" }]} />
            <FieldError message={errors.role} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Username">
            <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value, nis: "" }))} placeholder="Masukkan username" className={userInputClassName} />
            <FieldError message={errors.username} />
          </FieldGroup>
          <FieldGroup label="Password Baru">
            <Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Kosongkan jika tidak diubah" className={userInputClassName} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <UserModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Role Staff" />
      </div>
    </PremiumModal>
  );
}

function UserDataTableCard({
  children,
  icon,
  emptyTitle,
  emptyDescription,
  isLoading,
  columnCount,
}: {
  children: ReactNode;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  columnCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
      className="overflow-hidden rounded-[24px] border border-emerald-100/80"
    >
      <div className="overflow-x-auto">{isLoading ? <UserLoadingTable columnCount={columnCount} /> : children}</div>
      {!isLoading && columnCount === 0 ? (
        <div className="p-5">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} compact />
        </div>
      ) : null}
    </motion.div>
  );
}

function UserLoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={`user-loading-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}>
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div key={`user-loading-cell-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

function UserEmptyRow({
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

function UserStatCard({
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
        <div className="flex flex-col items-center text-right">
          <span className={`inline-flex size-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`}>
            <Icon className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function UserRoleBadge({ role }: { role: AdminUser["role"] }) {
  const classes =
    role === "ADMIN"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : role === "BK"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <Badge variant="outline" className={classes}>
      {role}
    </Badge>
  );
}

function roleDescription(role: AdminUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Kontrol penuh dashboard dan master data";
    case "BK":
      return "Akses monitoring siswa dan konseling";
    case "TEACHER":
      return "Akun dasar guru untuk modul pengajaran";
    default:
      return "-";
  }
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      {children}
    </div>
  );
}

function UserModalActions({
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
  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function validateRoleUserForm(
  form: AdminUserPayload,
  isEdit: boolean,
): FieldErrors<keyof AdminUserPayload> {
  const errors: FieldErrors<keyof AdminUserPayload> = {};
  validateRequired(errors, "name", form.name, "Nama akun");
  validateRequired(errors, "role", form.role, "Role");
  validateRequired(errors, "username", form.username, "Username");
  validateMinLength(errors, "password", form.password, 6, isEdit ? "Password baru" : "Password login", {
    allowEmpty: isEdit,
  });
  return errors;
}

const userInputClassName =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";
