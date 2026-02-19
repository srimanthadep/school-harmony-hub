import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, UserCheck, CreditCard, DollarSign, TrendingUp, AlertCircle, BookOpen, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalStudents: number;
  totalStaff: number;
  feesCollected: number;
  pendingFees: number;
  totalSalaryPaid: number;
  totalFeesDue: number;
}

function StatCard({ title, value, icon: Icon, variant, sub }: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant: "blue" | "green" | "orange" | "red";
  sub?: string;
}) {
  return (
    <div className={`stat-card-${variant} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, totalStaff: 0,
    feesCollected: 0, pendingFees: 0,
    totalSalaryPaid: 0, totalFeesDue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [studentsRes, staffRes, feeRes, salaryRes, feesDueRes] = await Promise.all([
        supabase.from("students").select("id, total_fee", { count: "exact" }),
        supabase.from("staff").select("id", { count: "exact" }),
        supabase.from("fee_payments").select("amount"),
        supabase.from("salary_payments").select("amount"),
        supabase.from("students").select("total_fee"),
      ]);

      const feesCollected = (feeRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const totalFeesDue = (feesDueRes.data ?? []).reduce((s, r) => s + Number(r.total_fee), 0);
      const totalSalaryPaid = (salaryRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

      setStats({
        totalStudents: studentsRes.count ?? 0,
        totalStaff: staffRes.count ?? 0,
        feesCollected,
        pendingFees: totalFeesDue - feesCollected,
        totalSalaryPaid,
        totalFeesDue,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Dashboard Overview</h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }} className="text-sm mt-1">
          Welcome back! Here's what's happening at your school.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Students" value={stats.totalStudents.toString()} icon={Users} variant="blue" sub="Enrolled" />
          <StatCard title="Total Staff" value={stats.totalStaff.toString()} icon={UserCheck} variant="green" sub="Active members" />
          <StatCard title="Fees Collected" value={fmt(stats.feesCollected)} icon={CreditCard} variant="green" sub="This year" />
          <StatCard title="Pending Fees" value={fmt(Math.max(0, stats.pendingFees))} icon={AlertCircle} variant="red" sub="Outstanding" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
        <StatCard title="Total Salary Paid" value={fmt(stats.totalSalaryPaid)} icon={DollarSign} variant="orange" sub="All time" />
        <StatCard title="Total Fees Due" value={fmt(stats.totalFeesDue)} icon={TrendingUp} variant="blue" sub="Annual total" />
        <StatCard title="Collection Rate" value={stats.totalFeesDue > 0 ? Math.round((stats.feesCollected / stats.totalFeesDue) * 100) + "%" : "0%"} icon={Award} variant="green" sub="Fee collection efficiency" />
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h2 className="font-semibold text-lg mb-4" style={{ color: "hsl(var(--foreground))" }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Add Student", href: "/students", icon: Users, color: "var(--primary-muted)", iconColor: "var(--primary)" },
            { label: "Add Staff", href: "/staff", icon: UserCheck, color: "var(--success-muted)", iconColor: "var(--success)" },
            { label: "Record Fee", href: "/fees", icon: CreditCard, color: "var(--warning-muted)", iconColor: "var(--warning)" },
            { label: "Pay Salary", href: "/salaries", icon: DollarSign, color: "var(--danger-muted)", iconColor: "var(--danger)" },
          ].map(({ label, href, icon: Icon, color, iconColor }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200 hover:shadow-hover cursor-pointer"
              style={{ background: `hsl(${color})`, borderColor: "hsl(var(--border))" }}
            >
              <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center">
                <Icon className="w-5 h-5" style={{ color: `hsl(${iconColor})` }} />
              </div>
              <span className="text-sm font-medium" style={{ color: `hsl(${iconColor})` }}>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
