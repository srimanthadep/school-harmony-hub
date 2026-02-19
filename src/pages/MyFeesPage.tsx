import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export default function MyFeesPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from("students").select("*").eq("user_id", user?.id).single();
      if (s) {
        setStudent(s);
        const { data: p } = await supabase.from("fee_payments").select("*").eq("student_id", s.id).order("payment_date", { ascending: false });
        setPayments(p ?? []);
      }
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const pending = student ? Math.max(0, Number(student.total_fee) - paid) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">My Fee Details</h1>
      </div>
      {loading ? (
        <div className="h-40 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
      ) : !student ? (
        <div className="text-center py-16" style={{ color: "hsl(var(--muted-foreground))" }}>
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No student record linked to your account. Contact the admin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <h2 className="font-semibold text-lg mb-4">{student.full_name} — Class {student.class} {student.section}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--primary-muted))" }}>
                <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--primary))" }}>Total Fee</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--primary))" }}>₹{Number(student.total_fee).toLocaleString("en-IN")}</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--success-muted))" }}>
                <div className="text-xs font-medium mb-1 flex items-center justify-center gap-1" style={{ color: "hsl(var(--success))" }}><CheckCircle className="w-3 h-3" /> Paid</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--success))" }}>₹{paid.toLocaleString("en-IN")}</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--danger-muted))" }}>
                <div className="text-xs font-medium mb-1 flex items-center justify-center gap-1" style={{ color: "hsl(var(--danger))" }}><AlertCircle className="w-3 h-3" /> Pending</div>
                <div className="text-2xl font-bold" style={{ color: "hsl(var(--danger))" }}>₹{pending.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <h2 className="font-semibold">Payment History</h2>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No payments recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.receipt_number}</td>
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
