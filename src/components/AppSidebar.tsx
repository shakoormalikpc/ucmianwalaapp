import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Heart,
  Receipt,
  BarChart3,
  LogOut,
  Shield,
  Award,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Members", path: "/members" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Heart, label: "Fund", path: "/fund" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Award, label: "Designations", path: "/designations" },
  { icon: MessageSquare, label: "Activities", path: "/activities" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar min-h-screen">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm text-sidebar-foreground">TMQ Mianwala</h1>
            <p className="text-[11px] text-sidebar-foreground/50 capitalize">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "sidebar-nav-item w-full",
              location.pathname.startsWith(item.path) && "sidebar-nav-item-active"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="sidebar-nav-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
