import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(126,182,155,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(111,166,208,0.12),transparent_18%),linear-gradient(180deg,#f7f5ee_0%,#f2f0e8_100%)]">
      {children}
    </div>
  );
}
