import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, DollarSign, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["Teacher", "Principal", "Vice Principal", "Accountant", "Librarian", "Lab Assistant", "Peon", "Guard"];

interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  role: string;
  subject: string | null;
  monthly_salary: number;
  joining_date: string | null;
  phone: string | null;
  email: string | null;
}

interface SalaryPayment {
  id: string;
  amount: number;
  payment_date: string;
  month: string;
  slip_number: string;
}

const emptyForm = {
  staff_id: "", full_name: "", role: "Teacher", subject: "",
  monthly_salary: 0, joining_date: new Date().toISOString().split("T")[0],
  phone: "", email: "", address: "",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filtered, setFiltered] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [salaryDialogStaff, setSalaryDialogStaff] = useState<Staff | null>(null);
  const [salaryForm, setSalaryForm] = useState({ amount: 0, month: "", payment_method: "bank_transfer", remarks: "" });
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*").order("full_name");
    setStaff(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => {
    let list = staff;
    if (search) list = list.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.staff_id.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [staff, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, staff_id: `STF${Date.now().toString().slice(-6)}` });
    setFormOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ staff_id: s.staff_id, full_name: s.full_name, role: s.role, subject: s.subject ?? "", monthly_salary: s.monthly_salary, joining_date: s.joining_date ?? "", phone: s.phone ?? "", email: s.email ?? "", address: "" });
    setFormOpen(true);
  };

  const saveStaff = async () => {
    if (!form.full_name || !form.role) {
      toast({ title: "Validation Error", description: "Name and role are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, monthly_salary: Number(form.monthly_salary) };
    const { error } = editing
      ? await supabase.from("staff").update(payload).eq("id", editing.id)
      : await supabase.from("staff").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Success", description: editing ? "Staff updated" : "Staff added" }); setFormOpen(false); fetchStaff(); }
    setSaving(false);
  };

  const deleteStaff = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("staff").delete().eq("id", deleteId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchStaff(); }
    setDeleteId(null);
  };

  const openSalaryDialog = async (s: Staff) => {
    setSalaryDialogStaff(s);
    setSalaryForm({ amount: s.monthly_salary, month: new Date().toLocaleString("en", { month: "long", year: "numeric" }), payment_method: "bank_transfer", remarks: "" });
    const { data } = await supabase.from("salary_payments").select("*").eq("staff_id", s.id).order("payment_date", { ascending: false });
    setSalaryPayments(data ?? []);
  };

  const recordSalary = async () => {
    if (!salaryDialogStaff || !salaryForm.amount || !salaryForm.month) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("salary_payments").insert({
      staff_id: salaryDialogStaff.id,
      amount: Number(salaryForm.amount),
      month: salaryForm.month,
      payment_method: salaryForm.payment_method,
      remarks: salaryForm.remarks || null,
      slip_number: `SLP${Date.now()}`,
      payment_date: new Date().toISOString().split("T")[0],
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Salary recorded!" });
      const { data } = await supabase.from("salary_payments").select("*").eq("staff_id", salaryDialogStaff.id).order("payment_date", { ascending: false });
      setSalaryPayments(data ?? []);
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const rows = [["Staff ID","Name","Role","Subject","Monthly Salary","Phone","Email"].join(","),
      ...filtered.map(s => [s.staff_id, s.full_name, s.role, s.subject ?? "", s.monthly_salary, s.phone ?? "", s.email ?? ""].join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = "staff.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-header">Staff</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{filtered.length} staff member(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
          <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Staff</Button>
        </div>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <Input className="pl-9" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Subject</th>
                <th>Monthly Salary</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No staff found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.staff_id}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td><span className="badge-primary">{s.role}</span></td>
                  <td style={{ color: "hsl(var(--muted-foreground))" }}>{s.subject ?? "—"}</td>
                  <td className="font-semibold">₹{Number(s.monthly_salary).toLocaleString("en-IN")}</td>
                  <td className="text-sm">{s.joining_date ?? "—"}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openSalaryDialog(s)} className="p-1.5 rounded hover:bg-success/10 text-success transition-colors" title="Manage Salary"><DollarSign className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" style={{ color: "hsl(var(--primary))" }} title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Staff" : "Add New Staff"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Staff ID *</Label><Input value={form.staff_id} onChange={e => setForm(f => ({...f, staff_id: e.target.value}))} className="mt-1" /></div>
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} className="mt-1" placeholder="e.g. Mathematics" /></div>
            <div><Label>Monthly Salary (₹) *</Label><Input type="number" value={form.monthly_salary || ""} onChange={e => setForm(f => ({...f, monthly_salary: Number(e.target.value)}))} className="mt-1" /></div>
            <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={e => setForm(f => ({...f, joining_date: e.target.value}))} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={saveStaff} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={!!salaryDialogStaff} onOpenChange={v => !v && setSalaryDialogStaff(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Salary Management — {salaryDialogStaff?.full_name}</DialogTitle></DialogHeader>
          {salaryDialogStaff && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
                <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--primary))" }}>Monthly Salary</div>
                <div className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>₹{Number(salaryDialogStaff.monthly_salary).toLocaleString("en-IN")}</div>
              </div>
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Record Salary Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount *</Label><Input type="number" value={salaryForm.amount || ""} onChange={e => setSalaryForm(f => ({...f, amount: Number(e.target.value)}))} className="mt-1" /></div>
                  <div><Label>Month *</Label><Input value={salaryForm.month} onChange={e => setSalaryForm(f => ({...f, month: e.target.value}))} className="mt-1" placeholder="e.g. January 2025" /></div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={salaryForm.payment_method} onValueChange={v => setSalaryForm(f => ({...f, payment_method: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Remarks</Label><Input value={salaryForm.remarks} onChange={e => setSalaryForm(f => ({...f, remarks: e.target.value}))} className="mt-1" /></div>
                </div>
                <Button onClick={recordSalary} disabled={saving} className="w-full">{saving ? "Recording..." : "Record Payment"}</Button>
              </div>
              {salaryPayments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Payment History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {salaryPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ background: "hsl(var(--muted))" }}>
                        <div>
                          <div className="font-medium text-xs">{p.month}</div>
                          <div className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{p.slip_number}</div>
                        </div>
                        <span className="font-bold text-sm" style={{ color: "hsl(var(--success))" }}>₹{Number(p.amount).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the staff record and all salary history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStaff} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
