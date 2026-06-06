"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Menu } from "lucide-react";

type StaffTopbarProps = {
  userName: string;
  userLabel: string;
  title: string;
  eyebrow?: string;
  onToggleSidebar: () => void;
};

export function StaffTopbar({
  userName,
  userLabel,
  title,
  eyebrow = "Role Dashboard",
  onToggleSidebar,
}: StaffTopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="rounded-[30px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_55px_rgba(153,161,179,0.12)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[1.7rem]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-3 py-2 shadow-[0_12px_24px_rgba(148,163,184,0.12)]">
            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50">
              <Image
                src="/images/logos/logo_cn_downscale.png"
                alt={`Avatar ${userLabel}`}
                width={34}
                height={34}
                className="rounded-full"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <div className="min-w-0 pr-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                {userName}
              </p>
              <p className="text-sm text-slate-500">{userLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
