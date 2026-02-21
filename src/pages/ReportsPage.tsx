import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASS_ORDER } from "@/lib/constants";

const CLASSES = CLASS_ORDER;

interface ClassStats {
  class: string;
  collected: number;
  pending: number;
  total: number;
}

interface PendingStudent {
  student_id: string;
  full_name: string;
  class: string;
  section: string;
  total_fee: number;
  paid: number;
  pending: number;
}

interface SalaryRecord {
  full_name: string;
  role: string;
  month: string;
  amount: number;
  slip_number: string;
  payment_date: string;
}

const COLORS = ["#1e40af", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#d97706", "#db2777", "#475569", "#059669", "#9333ea"];

export default function ReportsPage() {
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalSalary, setTotalSalary] = useState(0);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [pendingClassFilter, setPendingClassFilter] = useState("all");
  const [salaryMonthFilter, setSalaryMonthFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [studentsRes, feeRes, salaryRes] = await Promise.all([
        supabase.from("students").select("id, student_id, full_name, class, section, total_fee"),
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

      // Pending students report
      const pending: PendingStudent[] = students
        .map(s => ({
          student_id: s.student_id ?? s.id,
          full_name: s.full_name ?? "",
          class: s.class,
          section: s.section ?? "",
          total_fee: Number(s.total_fee),
          paid: paidByStudent[s.id] ?? 0,
          pending: Math.max(0, Number(s.total_fee) - (paidByStudent[s.id] ?? 0)),
        }))
        .filter(s => s.pending > 0)
        .sort((a, b) => b.pending - a.pending);

      setPendingStudents(pending);

      // Salary records
      const salaryRes2 = await supabase
        .from("salary_payments")
        .select("*, staff(full_name, role)")
        .order("payment_date", { ascending: false });
      const salaryData: SalaryRecord[] = (salaryRes2.data ?? []).map((p: {
        staff: { full_name: string; role: string } | null;
        month: string; amount: number; slip_number: string; payment_date: string;
      }) => ({
        full_name: p.staff?.full_name ?? "—",
        role: p.staff?.role ?? "—",
        month: p.month,
        amount: Number(p.amount),
        slip_number: p.slip_number,
        payment_date: p.payment_date,
      }));
      setSalaryRecords(salaryData);

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

  const filteredPending = pendingStudents.filter(s =>
    pendingClassFilter === "all" || s.class === pendingClassFilter
  );
  const filteredSalary = salaryRecords.filter(s =>
    salaryMonthFilter === "all" || s.month === salaryMonthFilter
  );
  const salaryMonths = Array.from(new Set(salaryRecords.map(s => s.month)));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Reports & Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Financial overview and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
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

      <Tabs defaultValue="overview">
        <TabsList className="mb-5">
          <TabsTrigger value="overview">Fee Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Fees</TabsTrigger>
          <TabsTrigger value="salary">Salary Report</TabsTrigger>
        </TabsList>

        {/* --- Fee Overview Tab --- */}
        <TabsContent value="overview">
          {loading ? (
            <div className="h-64 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </TabsContent>

        {/* --- Pending Fees Tab --- */}
        <TabsContent value="pending">
          <div className="flex items-center gap-3 mb-4">
            <Select value={pendingClassFilter} onValueChange={setPendingClassFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {filteredPending.length} student(s) with outstanding fees
            </span>
          </div>
          <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No pending fees found.</td></tr>
                  ) : filteredPending.map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{s.student_id}</td>
                      <td className="font-medium">{s.full_name}</td>
                      <td><span className="badge-primary">{s.class}{s.section ? ` - ${s.section}` : ""}</span></td>
                      <td>{fmt(s.total_fee)}</td>
                      <td style={{ color: "hsl(var(--success))" }}>{fmt(s.paid)}</td>
                      <td className="font-bold" style={{ color: "hsl(var(--danger))" }}>{fmt(s.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* --- Salary Report Tab --- */}
        <TabsContent value="salary">
          <div className="flex items-center gap-3 mb-4">
            <Select value={salaryMonthFilter} onValueChange={setSalaryMonthFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {salaryMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Total: {fmt(filteredSalary.reduce((s, r) => s + r.amount, 0))}
            </span>
          </div>
          <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Slip No</th>
                    <th>Staff</th>
                    <th>Role</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalary.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No salary records found.</td></tr>
                  ) : filteredSalary.map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{s.slip_number}</td>
                      <td className="font-medium">{s.full_name}</td>
                      <td><span className="badge-primary">{s.role}</span></td>
                      <td>{s.month}</td>
                      <td className="font-semibold" style={{ color: "hsl(var(--success))" }}>{fmt(s.amount)}</td>
                      <td className="text-sm">{s.payment_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
