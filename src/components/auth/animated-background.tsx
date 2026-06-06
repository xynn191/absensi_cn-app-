"use client";

import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-[-12%] transform-gpu opacity-90 will-change-transform"
        animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.02, 1] }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(123, 223, 177, 0.34), transparent 26%), radial-gradient(circle at 100% 0%, rgba(188, 243, 181, 0.26), transparent 24%), radial-gradient(circle at 50% 100%, rgba(120, 197, 173, 0.18), transparent 30%)",
        }}
      />

      <motion.div
        className="absolute left-[-10%] top-[-12%] h-[28rem] w-[28rem] transform-gpu rounded-full bg-emerald-300/18 blur-[92px] will-change-transform"
        animate={{ x: [0, 44, 0], y: [0, 24, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-8%] top-[8%] h-[32rem] w-[32rem] transform-gpu rounded-full bg-lime-200/14 blur-[100px] will-change-transform"
        animate={{ x: [0, -36, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 21, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-18%] left-[22%] h-[26rem] w-[26rem] transform-gpu rounded-full bg-teal-200/16 blur-[92px] will-change-transform"
        animate={{ x: [0, 26, 0], y: [0, -24, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.8),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(255,255,255,0.42),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(20,90,60,0.6)_0.7px,transparent_0.7px)] [background-size:16px_16px]" />
    </div>
  );
}
