import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, CreditCard, Heart, Receipt, BarChart3, LogOut, Shield, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Members", path: "/members" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Heart, label: "Donations", path: "/donations" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden flex items-center justify-between bg-sidebar px-4 py-3">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-sidebar-primary" />
        <span className="font-heading font-bold text-sm text-sidebar-foreground">UC Management</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="text-sidebar-foreground"><Menu className="w-5 h-5" /></button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar border-sidebar-border w-64 p-0">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-sm text-sidebar-foreground">UC Management</h1>
                <p className="text-[11px] text-sidebar-foreground/50 capitalize">{role}</p>
              </div>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setOpen(false); }}
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
          <div className="p-3 border-t border-sidebar-border mt-auto">
            <button onClick={signOut} className="sidebar-nav-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNav;
