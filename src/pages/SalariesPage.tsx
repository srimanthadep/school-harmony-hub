import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SalaryPayment {
  id: string;
  amount: number;
  payment_date: string;
  month: string;
  payment_method: string;
  slip_number: string;
  staff: { full_name: string; role: string; staff_id: string } | null;
}

export default function SalariesPage() {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [filtered, setFiltered] = useState<SalaryPayment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("salary_payments")
      .select("*, staff(full_name, role, staff_id)")
      .order("payment_date", { ascending: false })
      .then(({ data }) => { setPayments(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    let list = payments;
    if (search) list = list.filter(p => p.staff?.full_name.toLowerCase().includes(search.toLowerCase()) || p.month.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [payments, search]);

  const total = filtered.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Salary Payments</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{filtered.length} payment(s) — Total: ₹{total.toLocaleString("en-IN")}</p>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <Input className="pl-9" placeholder="Search by staff or month..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Slip No</th>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Month</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>)}</tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No salary records found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.slip_number}</td>
                  <td className="font-medium">{p.staff?.full_name ?? "—"}</td>
                  <td><span className="badge-primary">{p.staff?.role}</span></td>
                  <td className="font-medium">{p.month}</td>
                  <td className="font-semibold" style={{ color: "hsl(var(--success))" }}>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  <td className="capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="text-sm">{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
