import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-accent text-accent-foreground",
  info: "bg-info text-info-foreground",
};

const iconBg = {
  default: "bg-secondary",
  primary: "bg-primary-foreground/15",
  success: "bg-success-foreground/15",
  warning: "bg-accent-foreground/15",
  info: "bg-info-foreground/15",
};

const MetricCard = ({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) => (
  <div className={cn("metric-card", variantStyles[variant])}>
    <div className="flex items-start justify-between">
      <div>
        <p className={cn("text-xs font-medium uppercase tracking-wide", variant === "default" ? "text-muted-foreground" : "opacity-80")}>
          {title}
        </p>
        <p className="text-2xl font-heading font-bold mt-1">{value}</p>
        {trend && <p className={cn("text-xs mt-1", variant === "default" ? "text-muted-foreground" : "opacity-70")}>{trend}</p>}
      </div>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default MetricCard;
