import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign } from "lucide-react";

export default function MySalaryPage() {
  const { user } = useAuth();
  const [staffMember, setStaffMember] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from("staff").select("*").eq("user_id", user?.id).single();
      if (s) {
        setStaffMember(s);
        const { data: p } = await supabase.from("salary_payments").select("*").eq("staff_id", s.id).order("payment_date", { ascending: false });
        setPayments(p ?? []);
      }
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">My Salary</h1>
      </div>
      {loading ? (
        <div className="h-40 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
      ) : !staffMember ? (
        <div className="text-center py-16" style={{ color: "hsl(var(--muted-foreground))" }}>
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No staff record linked to your account. Contact the admin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <h2 className="font-semibold text-lg mb-1">{staffMember.full_name}</h2>
            <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>{staffMember.role}{staffMember.subject ? ` — ${staffMember.subject}` : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
                <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--primary))" }}>Monthly Salary</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--primary))" }}>₹{Number(staffMember.monthly_salary).toLocaleString("en-IN")}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "hsl(var(--success-muted))" }}>
                <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--success))" }}>Total Paid (All Time)</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--success))" }}>₹{totalPaid.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <h2 className="font-semibold">Salary History</h2>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No salary payments recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Slip No</th><th>Month</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.slip_number}</td>
                        <td className="font-medium">{p.month}</td>
                        <td className="font-semibold" style={{ color: "hsl(var(--success))" }}>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                        <td className="capitalize">{p.payment_method.replace("_", " ")}</td>
                        <td>{p.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
