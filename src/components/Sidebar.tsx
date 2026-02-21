import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, CreditCard, DollarSign,
  BarChart3, Settings, GraduationCap, LogOut, ChevronLeft, ChevronRight, BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/staff", label: "Staff", icon: UserCheck },
  { to: "/fees", label: "Fees", icon: CreditCard },
  { to: "/salaries", label: "Salaries", icon: DollarSign },
  { to: "/fee-structures", label: "Fee Structures", icon: BookOpen },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const studentNavItems = [
  { to: "/", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/my-fees", label: "My Fees", icon: CreditCard },
];

const teacherNavItems = [
  { to: "/", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/my-salary", label: "My Salary", icon: DollarSign },
];

export default function Sidebar() {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === "admin"
    ? adminNavItems
    : role === "student"
    ? studentNavItems
    : teacherNavItems;

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-white leading-none">EduManage</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground))" }}>Pro</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}>
            Role
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/15 text-white capitalize">
            {role}
          </span>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t px-2 py-3" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="text-xs text-white/50 truncate">{user?.email}</div>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
