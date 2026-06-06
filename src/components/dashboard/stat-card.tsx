import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  colorClass,
}: StatCardProps) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
      <CardContent className="flex items-start justify-between p-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div
          className={cn(
            "rounded-2xl p-3",
            colorClass,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
