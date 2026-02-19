import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CLASSES = ["all", "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

interface FeePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  academic_year: string;
  students: { full_name: string; class: string; section: string; student_id: string; total_fee: number } | null;
}

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [filtered, setFiltered] = useState<FeePayment[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("fee_payments")
      .select("*, students(full_name, class, section, student_id, total_fee)")
      .order("payment_date", { ascending: false })
      .then(({ data }) => { setPayments(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    let list = payments;
    if (search) list = list.filter(p => p.students?.full_name.toLowerCase().includes(search.toLowerCase()) || p.receipt_number.toLowerCase().includes(search.toLowerCase()));
    if (classFilter !== "all") list = list.filter(p => p.students?.class === classFilter);
    setFiltered(list);
  }, [payments, search, classFilter]);

  const total = filtered.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Fee Transactions</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{filtered.length} transaction(s) — Total: ₹{total.toLocaleString("en-IN")}</p>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <Input className="pl-9" placeholder="Search by student or receipt..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All Classes" : c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Student</th>
                <th>Class</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Date</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>)}</tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No fee records found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.receipt_number}</td>
                  <td className="font-medium">{p.students?.full_name ?? "—"}</td>
                  <td><span className="badge-primary">{p.students?.class}</span></td>
                  <td className="font-semibold" style={{ color: "hsl(var(--success))" }}>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  <td className="capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="text-sm">{p.payment_date}</td>
                  <td style={{ color: "hsl(var(--muted-foreground))" }}>{p.academic_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
