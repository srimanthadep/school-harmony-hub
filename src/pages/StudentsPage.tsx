import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, CreditCard, Download, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLASS_ORDER, ACADEMIC_YEARS } from "@/lib/constants";

const CLASSES = CLASS_ORDER;
const SECTIONS = ["A", "B", "C", "D"];

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class: string;
  section: string;
  roll_no: number;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  total_fee: number;
  total_book_fee: number;
  academic_year: string;
  status: string;
  admission_date: string | null;
}

interface FeePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  remarks: string | null;
}

const emptyForm = {
  student_id: "", full_name: "", class: "1st", section: "A",
  roll_no: 1, parent_name: "", parent_phone: "", parent_email: "",
  address: "", total_fee: 0, total_book_fee: 0, academic_year: "2024-25",
};

const emptyFeeForm = {
  amount: 0, payment_method: "cash", remarks: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feeDialogStudent, setFeeDialogStudent] = useState<Student | null>(null);
  const [feeForm, setFeeForm] = useState(emptyFeeForm);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [saving, setSaving] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState("2024-25");
  const [promoteTo, setPromoteTo] = useState("2025-26");
  const [promoting, setPromoting] = useState(false);
  const { toast } = useToast();

  const YEARS = ACADEMIC_YEARS;

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("full_name");
    setStudents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    let list = students;
    if (search) list = list.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase()));
    if (classFilter !== "all") list = list.filter(s => s.class === classFilter);
    if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
    setFiltered(list);
  }, [students, search, classFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, student_id: `STU${Date.now().toString().slice(-6)}` });
    setFormOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ student_id: s.student_id, full_name: s.full_name, class: s.class, section: s.section, roll_no: s.roll_no, parent_name: s.parent_name, parent_phone: s.parent_phone, parent_email: s.parent_email ?? "", address: s.address ?? "", total_fee: s.total_fee, total_book_fee: s.total_book_fee ?? 0, academic_year: s.academic_year ?? "2024-25" });
    setFormOpen(true);
  };

  const saveStudent = async () => {
    if (!form.full_name || !form.parent_name || !form.parent_phone) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, total_fee: Number(form.total_fee), total_book_fee: Number(form.total_book_fee), roll_no: Number(form.roll_no) };
    const { error } = editing
      ? await supabase.from("students").update(payload).eq("id", editing.id)
      : await supabase.from("students").insert(payload);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: editing ? "Student updated" : "Student added" });
      setFormOpen(false);
      fetchStudents();
    }
    setSaving(false);
  };

  const deleteStudent = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("students").delete().eq("id", deleteId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchStudents(); }
    setDeleteId(null);
  };

  const openFeeDialog = async (student: Student) => {
    setFeeDialogStudent(student);
    setFeeForm(emptyFeeForm);
    const { data } = await supabase.from("fee_payments").select("*").eq("student_id", student.id).order("payment_date", { ascending: false });
    setPayments(data ?? []);
  };

  const getAmountPaid = () => payments.reduce((s, p) => s + Number(p.amount), 0);

  const recordPayment = async () => {
    if (!feeDialogStudent || !feeForm.amount) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("fee_payments").insert({
      student_id: feeDialogStudent.id,
      amount: Number(feeForm.amount),
      payment_method: feeForm.payment_method,
      remarks: feeForm.remarks || null,
      receipt_number: `REC${Date.now()}`,
      academic_year: "2024-25",
      payment_date: new Date().toISOString().split("T")[0],
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment recorded!" });
      const { data } = await supabase.from("fee_payments").select("*").eq("student_id", feeDialogStudent.id).order("payment_date", { ascending: false });
      setPayments(data ?? []);
      setFeeForm(emptyFeeForm);
    }
    setSaving(false);
  };

  const promoteStudents = async () => {
    setPromoting(true);
    const { data, error } = await supabase.rpc("promote_students", {
      _from_year: promoteFrom, _to_year: promoteTo,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Promotion complete", description: `${data} student(s) promoted to ${promoteTo}.` });
      setPromoteOpen(false);
      fetchStudents();
    }
    setPromoting(false);
  };

  const exportCSV = () => {
    const rows = [["Student ID","Name","Class","Section","Roll No","Parent","Phone","Total Fee"].join(","),
      ...filtered.map(s => [s.student_id, s.full_name, s.class, s.section, s.roll_no, s.parent_name, s.parent_phone, s.total_fee].join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = "students.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-header">Students</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{filtered.length} student(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => setPromoteOpen(true)}><GraduationCap className="w-4 h-4 mr-1" />Promote</Button>
          <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Student</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <Input className="pl-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Total Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.student_id}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td><span className="badge-primary">{s.class} - {s.section}</span></td>
                  <td>
                    <div className="font-medium text-xs">{s.parent_name}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.parent_phone}</div>
                  </td>
                  <td className="font-semibold">₹{Number(s.total_fee).toLocaleString("en-IN")}</td>
                  <td><span className={s.status === "active" ? "badge-success" : "badge-primary"}>{s.status ?? "active"}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openFeeDialog(s)} className="p-1.5 rounded hover:bg-success/10 text-success transition-colors" title="Manage Fees"><CreditCard className="w-4 h-4" /></button>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Student ID *</Label><Input value={form.student_id} onChange={e => setForm(f => ({...f, student_id: e.target.value}))} className="mt-1" /></div>
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Class *</Label>
              <Select value={form.class} onValueChange={v => setForm(f => ({...f, class: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section *</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({...f, section: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Roll No *</Label><Input type="number" value={form.roll_no} onChange={e => setForm(f => ({...f, roll_no: Number(e.target.value)}))} className="mt-1" /></div>
            <div><Label>Total Annual Fee *</Label><Input type="number" value={form.total_fee} onChange={e => setForm(f => ({...f, total_fee: Number(e.target.value)}))} className="mt-1" /></div>
            <div><Label>Total Book Fee</Label><Input type="number" value={form.total_book_fee} onChange={e => setForm(f => ({...f, total_book_fee: Number(e.target.value)}))} className="mt-1" /></div>
            <div>
              <Label>Academic Year</Label>
              <Select value={form.academic_year} onValueChange={v => setForm(f => ({...f, academic_year: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Parent Name *</Label><Input value={form.parent_name} onChange={e => setForm(f => ({...f, parent_name: e.target.value}))} className="mt-1" /></div>
            <div><Label>Parent Phone *</Label><Input value={form.parent_phone} onChange={e => setForm(f => ({...f, parent_phone: e.target.value}))} className="mt-1" /></div>
            <div><Label>Parent Email</Label><Input type="email" value={form.parent_email} onChange={e => setForm(f => ({...f, parent_email: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={saveStudent} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Dialog */}
      <Dialog open={!!feeDialogStudent} onOpenChange={v => !v && setFeeDialogStudent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fee Management — {feeDialogStudent?.full_name}</DialogTitle>
          </DialogHeader>
          {feeDialogStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--primary-muted))" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--primary))" }}>Total Fee</div>
                  <div className="font-bold" style={{ color: "hsl(var(--primary))" }}>₹{Number(feeDialogStudent.total_fee).toLocaleString("en-IN")}</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--success-muted))" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--success))" }}>Paid</div>
                  <div className="font-bold" style={{ color: "hsl(var(--success))" }}>₹{getAmountPaid().toLocaleString("en-IN")}</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--danger-muted))" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--danger))" }}>Pending</div>
                  <div className="font-bold" style={{ color: "hsl(var(--danger))" }}>₹{Math.max(0, Number(feeDialogStudent.total_fee) - getAmountPaid()).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Record Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount *</Label><Input type="number" value={feeForm.amount || ""} onChange={e => setFeeForm(f => ({...f, amount: Number(e.target.value)}))} className="mt-1" /></div>
                  <div>
                    <Label>Method</Label>
                    <Select value={feeForm.payment_method} onValueChange={v => setFeeForm(f => ({...f, payment_method: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Remarks</Label><Input value={feeForm.remarks} onChange={e => setFeeForm(f => ({...f, remarks: e.target.value}))} className="mt-1" /></div>
                </div>
                <Button onClick={recordPayment} disabled={saving} className="w-full">{saving ? "Recording..." : "Record Payment"}</Button>
              </div>

              {payments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Payment History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ background: "hsl(var(--muted))" }}>
                        <div>
                          <div className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{p.receipt_number}</div>
                          <div className="text-xs">{p.payment_date} • {p.payment_method}</div>
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
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the student and all associated fee records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Students Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Promote Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Promote all active students from the selected academic year to the next year. Students in the final class (10th) will be marked inactive.
            </p>
            <div>
              <Label>From Academic Year</Label>
              <Select value={promoteFrom} onValueChange={setPromoteFrom}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Academic Year</Label>
              <Select value={promoteTo} onValueChange={setPromoteTo}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button onClick={promoteStudents} disabled={promoting || promoteFrom === promoteTo}>
              {promoting ? "Promoting..." : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
