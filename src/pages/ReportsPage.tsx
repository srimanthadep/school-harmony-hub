import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface ClassStats {
  class: string;
  collected: number;
  pending: number;
  total: number;
}

const COLORS = ["#1e40af", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#d97706", "#db2777", "#475569", "#059669", "#9333ea"];

export default function ReportsPage() {
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalSalary, setTotalSalary] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [studentsRes, feeRes, salaryRes] = await Promise.all([
        supabase.from("students").select("id, class, total_fee"),
        supabase.from("fee_payments").select("student_id, amount"),
        supabase.from("salary_payments").select("amount"),
      ]);

      const students = studentsRes.data ?? [];
      const fees = feeRes.data ?? [];
      const salaries = salaryRes.data ?? [];

      const paidByStudent: Record<string, number> = {};
      fees.forEach(f => { paidByStudent[f.student_id] = (paidByStudent[f.student_id] ?? 0) + Number(f.amount); });

      const byClass: Record<string, ClassStats> = {};
      students.forEach(s => {
        if (!byClass[s.class]) byClass[s.class] = { class: s.class, collected: 0, pending: 0, total: 0 };
        const paid = paidByStudent[s.id] ?? 0;
        byClass[s.class].total += Number(s.total_fee);
        byClass[s.class].collected += paid;
        byClass[s.class].pending += Math.max(0, Number(s.total_fee) - paid);
      });

      const stats = Object.values(byClass).sort((a, b) => {
        const order = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
        return order.indexOf(a.class) - order.indexOf(b.class);
      });

      setClassStats(stats);
      setTotalCollected(fees.reduce((s, f) => s + Number(f.amount), 0));
      setTotalPending(stats.reduce((s, c) => s + c.pending, 0));
      setTotalSalary(salaries.reduce((s, p) => s + Number(p.amount), 0));
      setLoading(false);
    };
    load();
  }, []);

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const pieData = [
    { name: "Collected", value: totalCollected },
    { name: "Pending", value: totalPending },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Reports & Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Financial overview and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Collected", value: fmt(totalCollected), color: "var(--success)", bg: "var(--success-muted)" },
          { label: "Total Pending", value: fmt(totalPending), color: "var(--danger)", bg: "var(--danger-muted)" },
          { label: "Total Salary Paid", value: fmt(totalSalary), color: "var(--warning)", bg: "var(--warning-muted)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="p-5 rounded-xl border" style={{ background: `hsl(${bg})`, borderColor: "hsl(var(--border))" }}>
            <div className="text-sm font-medium mb-1" style={{ color: `hsl(${color})` }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color: `hsl(${color})` }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <h2 className="font-semibold mb-4">Class-wise Fee Collection</h2>
            {classStats.length === 0 ? (
              <p className="text-center py-8" style={{ color: "hsl(var(--muted-foreground))" }}>No data yet. Add students and record fees.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classStats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart */}
          <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <h2 className="font-semibold mb-4">Fee Status</h2>
            {totalCollected + totalPending === 0 ? (
              <p className="text-center py-8" style={{ color: "hsl(var(--muted-foreground))" }}>No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill="hsl(var(--success))" />
                    <Cell fill="hsl(var(--danger))" />
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Class-wise Table */}
      {classStats.length > 0 && (
        <div className="mt-6 rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h2 className="font-semibold">Class-wise Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Total Fee</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Collection %</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map(c => (
                  <tr key={c.class}>
                    <td><span className="badge-primary">{c.class}</span></td>
                    <td className="font-medium">{fmt(c.total)}</td>
                    <td style={{ color: "hsl(var(--success))" }} className="font-medium">{fmt(c.collected)}</td>
                    <td style={{ color: "hsl(var(--danger))" }} className="font-medium">{fmt(c.pending)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                          <div className="h-2 rounded-full" style={{ background: "hsl(var(--success))", width: `${c.total > 0 ? (c.collected / c.total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs w-10 text-right">{c.total > 0 ? Math.round((c.collected / c.total) * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
