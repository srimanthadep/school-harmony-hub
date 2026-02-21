import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLASS_ORDER, ACADEMIC_YEARS } from "@/lib/constants";

const CLASSES = CLASS_ORDER;

interface FeeStructure {
  id: string;
  class: string;
  academic_year: string;
  tuition_fee: number;
  admission_fee: number;
  exam_fee: number;
  library_fee: number;
  sports_fee: number;
  transport_fee: number;
  misc_fee: number;
  total_fee: number;
}

interface BookFeeStructure {
  id: string;
  class: string;
  academic_year: string;
  reading_book_fee: number;
  text_books_fee: number;
  practice_work_book_fee: number;
  fun_with_dot_book_fee: number;
  dairy_fee: number;
  id_card_fee: number;
  covers_fee: number;
  note_books_fee: number;
  misc_fee: number;
  total_fee: number;
}

const emptyFeeForm = {
  class: "1st", academic_year: "2024-25",
  tuition_fee: 0, admission_fee: 0, exam_fee: 0,
  library_fee: 0, sports_fee: 0, transport_fee: 0, misc_fee: 0,
};

const emptyBookFeeForm = {
  class: "1st", academic_year: "2024-25",
  reading_book_fee: 0, text_books_fee: 0, practice_work_book_fee: 0,
  fun_with_dot_book_fee: 0, dairy_fee: 0, id_card_fee: 0,
  covers_fee: 0, note_books_fee: 0, misc_fee: 0,
};

function numField(label: string, value: number, onChange: (v: number) => void) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value || ""} onChange={e => onChange(Number(e.target.value))} className="mt-1" min={0} />
    </div>
  );
}

export default function FeeStructuresPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [bookFeeStructures, setBookFeeStructures] = useState<BookFeeStructure[]>([]);
  const [yearFilter, setYearFilter] = useState("2024-25");
  const [loading, setLoading] = useState(true);
  const [feeFormOpen, setFeeFormOpen] = useState(false);
  const [bookFeeFormOpen, setBookFeeFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [editingBookFee, setEditingBookFee] = useState<BookFeeStructure | null>(null);
  const [feeForm, setFeeForm] = useState(emptyFeeForm);
  const [bookFeeForm, setBookFeeForm] = useState(emptyBookFeeForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [fsRes, bfsRes] = await Promise.all([
      supabase.from("fee_structures").select("*").eq("academic_year", yearFilter).order("class"),
      supabase.from("book_fee_structures").select("*").eq("academic_year", yearFilter).order("class"),
    ]);
    setFeeStructures(fsRes.data ?? []);
    setBookFeeStructures(bfsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [yearFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

  // ---- Fee Structure ----
  const openAddFee = () => {
    setEditingFee(null);
    setFeeForm({ ...emptyFeeForm, academic_year: yearFilter });
    setFeeFormOpen(true);
  };

  const openEditFee = (fs: FeeStructure) => {
    setEditingFee(fs);
    setFeeForm({
      class: fs.class, academic_year: fs.academic_year,
      tuition_fee: fs.tuition_fee, admission_fee: fs.admission_fee,
      exam_fee: fs.exam_fee, library_fee: fs.library_fee,
      sports_fee: fs.sports_fee, transport_fee: fs.transport_fee,
      misc_fee: fs.misc_fee,
    });
    setFeeFormOpen(true);
  };

  const saveFeeStructure = async () => {
    setSaving(true);
    const payload = {
      class: feeForm.class, academic_year: feeForm.academic_year,
      tuition_fee: Number(feeForm.tuition_fee), admission_fee: Number(feeForm.admission_fee),
      exam_fee: Number(feeForm.exam_fee), library_fee: Number(feeForm.library_fee),
      sports_fee: Number(feeForm.sports_fee), transport_fee: Number(feeForm.transport_fee),
      misc_fee: Number(feeForm.misc_fee),
    };
    const { error } = editingFee
      ? await supabase.from("fee_structures").update(payload).eq("id", editingFee.id)
      : await supabase.from("fee_structures").upsert(payload, { onConflict: "class,academic_year" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Fee structure saved successfully." });
      setFeeFormOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const cascadeFee = async (fs: FeeStructure) => {
    const { data, error } = await supabase.rpc("apply_fee_structure", {
      _class: fs.class, _academic_year: fs.academic_year,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Applied", description: `Updated ${data} student(s) in ${fs.class}.` });
  };

  // ---- Book Fee Structure ----
  const openAddBookFee = () => {
    setEditingBookFee(null);
    setBookFeeForm({ ...emptyBookFeeForm, academic_year: yearFilter });
    setBookFeeFormOpen(true);
  };

  const openEditBookFee = (bfs: BookFeeStructure) => {
    setEditingBookFee(bfs);
    setBookFeeForm({
      class: bfs.class, academic_year: bfs.academic_year,
      reading_book_fee: bfs.reading_book_fee, text_books_fee: bfs.text_books_fee,
      practice_work_book_fee: bfs.practice_work_book_fee,
      fun_with_dot_book_fee: bfs.fun_with_dot_book_fee,
      dairy_fee: bfs.dairy_fee, id_card_fee: bfs.id_card_fee,
      covers_fee: bfs.covers_fee, note_books_fee: bfs.note_books_fee,
      misc_fee: bfs.misc_fee,
    });
    setBookFeeFormOpen(true);
  };

  const saveBookFeeStructure = async () => {
    setSaving(true);
    const payload = {
      class: bookFeeForm.class, academic_year: bookFeeForm.academic_year,
      reading_book_fee: Number(bookFeeForm.reading_book_fee),
      text_books_fee: Number(bookFeeForm.text_books_fee),
      practice_work_book_fee: Number(bookFeeForm.practice_work_book_fee),
      fun_with_dot_book_fee: Number(bookFeeForm.fun_with_dot_book_fee),
      dairy_fee: Number(bookFeeForm.dairy_fee),
      id_card_fee: Number(bookFeeForm.id_card_fee),
      covers_fee: Number(bookFeeForm.covers_fee),
      note_books_fee: Number(bookFeeForm.note_books_fee),
      misc_fee: Number(bookFeeForm.misc_fee),
    };
    const { error } = editingBookFee
      ? await supabase.from("book_fee_structures").update(payload).eq("id", editingBookFee.id)
      : await supabase.from("book_fee_structures").upsert(payload, { onConflict: "class,academic_year" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Book fee structure saved successfully." });
      setBookFeeFormOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const cascadeBookFee = async (bfs: BookFeeStructure) => {
    const { data, error } = await supabase.rpc("apply_book_fee_structure", {
      _class: bfs.class, _academic_year: bfs.academic_year,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Applied", description: `Updated ${data} student(s) in ${bfs.class}.` });
  };

  const YEARS = ACADEMIC_YEARS;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-header">Fee Structures</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Configure tuition and book fees per class and academic year
          </p>
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="fee">
        <TabsList className="mb-5">
          <TabsTrigger value="fee">Tuition Fee Structures</TabsTrigger>
          <TabsTrigger value="book">Book Fee Structures</TabsTrigger>
        </TabsList>

        {/* ---- Tuition Fee Structures ---- */}
        <TabsContent value="fee">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={openAddFee}><Plus className="w-4 h-4 mr-1" />Add Structure</Button>
          </div>
          <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Tuition</th>
                    <th>Admission</th>
                    <th>Exam</th>
                    <th>Library</th>
                    <th>Sports</th>
                    <th>Transport</th>
                    <th>Misc</th>
                    <th>Total Fee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>{[...Array(10)].map((_, j) => <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>)}</tr>
                    ))
                  ) : feeStructures.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No fee structures for {yearFilter}. Add one to get started.</td></tr>
                  ) : feeStructures.map(fs => (
                    <tr key={fs.id}>
                      <td><span className="badge-primary">{fs.class}</span></td>
                      <td>{fmt(fs.tuition_fee)}</td>
                      <td>{fmt(fs.admission_fee)}</td>
                      <td>{fmt(fs.exam_fee)}</td>
                      <td>{fmt(fs.library_fee)}</td>
                      <td>{fmt(fs.sports_fee)}</td>
                      <td>{fmt(fs.transport_fee)}</td>
                      <td>{fmt(fs.misc_fee)}</td>
                      <td className="font-bold" style={{ color: "hsl(var(--primary))" }}>{fmt(fs.total_fee)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditFee(fs)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" style={{ color: "hsl(var(--primary))" }} title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => cascadeFee(fs)} className="p-1.5 rounded hover:bg-success/10 text-success transition-colors" title="Apply to students"><RefreshCw className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Click the refresh icon to cascade the total fee to all active students in that class/year.
          </p>
        </TabsContent>

        {/* ---- Book Fee Structures ---- */}
        <TabsContent value="book">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={openAddBookFee}><Plus className="w-4 h-4 mr-1" />Add Structure</Button>
          </div>
          <div className="rounded-xl border overflow-hidden shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Reading Books</th>
                    <th>Text Books</th>
                    <th>Practice Books</th>
                    <th>Dairy</th>
                    <th>ID Card</th>
                    <th>Covers</th>
                    <th>Note Books</th>
                    <th>Misc</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>{[...Array(11)].map((_, j) => <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} /></td>)}</tr>
                    ))
                  ) : bookFeeStructures.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No book fee structures for {yearFilter}. Add one to get started.</td></tr>
                  ) : bookFeeStructures.map(bfs => (
                    <tr key={bfs.id}>
                      <td><span className="badge-primary">{bfs.class}</span></td>
                      <td>{fmt(bfs.reading_book_fee)}</td>
                      <td>{fmt(bfs.text_books_fee)}</td>
                      <td>{fmt(bfs.practice_work_book_fee)}</td>
                      <td>{fmt(bfs.dairy_fee)}</td>
                      <td>{fmt(bfs.id_card_fee)}</td>
                      <td>{fmt(bfs.covers_fee)}</td>
                      <td>{fmt(bfs.note_books_fee)}</td>
                      <td>{fmt(bfs.misc_fee)}</td>
                      <td className="font-bold" style={{ color: "hsl(var(--primary))" }}>{fmt(bfs.total_fee)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEditBookFee(bfs)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" style={{ color: "hsl(var(--primary))" }} title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => cascadeBookFee(bfs)} className="p-1.5 rounded hover:bg-success/10 text-success transition-colors" title="Apply to students"><RefreshCw className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Click the refresh icon to cascade the book fee total to all active students in that class/year.
          </p>
        </TabsContent>
      </Tabs>

      {/* Fee Structure Dialog */}
      <Dialog open={feeFormOpen} onOpenChange={setFeeFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFee ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Class *</Label>
              <Select value={feeForm.class} onValueChange={v => setFeeForm(f => ({ ...f, class: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year *</Label>
              <Select value={feeForm.academic_year} onValueChange={v => setFeeForm(f => ({ ...f, academic_year: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {numField("Tuition Fee (₹)", feeForm.tuition_fee, v => setFeeForm(f => ({ ...f, tuition_fee: v })))}
            {numField("Admission Fee (₹)", feeForm.admission_fee, v => setFeeForm(f => ({ ...f, admission_fee: v })))}
            {numField("Exam Fee (₹)", feeForm.exam_fee, v => setFeeForm(f => ({ ...f, exam_fee: v })))}
            {numField("Library Fee (₹)", feeForm.library_fee, v => setFeeForm(f => ({ ...f, library_fee: v })))}
            {numField("Sports Fee (₹)", feeForm.sports_fee, v => setFeeForm(f => ({ ...f, sports_fee: v })))}
            {numField("Transport Fee (₹)", feeForm.transport_fee, v => setFeeForm(f => ({ ...f, transport_fee: v })))}
            {numField("Misc Fee (₹)", feeForm.misc_fee, v => setFeeForm(f => ({ ...f, misc_fee: v })))}
            <div className="col-span-2 p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
              <div className="text-xs font-medium mb-0.5" style={{ color: "hsl(var(--primary))" }}>Computed Total Fee</div>
              <div className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                ₹{(feeForm.tuition_fee + feeForm.admission_fee + feeForm.exam_fee + feeForm.library_fee + feeForm.sports_fee + feeForm.transport_fee + feeForm.misc_fee).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeeFormOpen(false)}>Cancel</Button>
            <Button onClick={saveFeeStructure} disabled={saving}>{saving ? "Saving..." : editingFee ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Fee Structure Dialog */}
      <Dialog open={bookFeeFormOpen} onOpenChange={setBookFeeFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBookFee ? "Edit Book Fee Structure" : "Add Book Fee Structure"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Class *</Label>
              <Select value={bookFeeForm.class} onValueChange={v => setBookFeeForm(f => ({ ...f, class: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year *</Label>
              <Select value={bookFeeForm.academic_year} onValueChange={v => setBookFeeForm(f => ({ ...f, academic_year: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {numField("Reading Book Fee (₹)", bookFeeForm.reading_book_fee, v => setBookFeeForm(f => ({ ...f, reading_book_fee: v })))}
            {numField("Text Books Fee (₹)", bookFeeForm.text_books_fee, v => setBookFeeForm(f => ({ ...f, text_books_fee: v })))}
            {numField("Practice/Work Book Fee (₹)", bookFeeForm.practice_work_book_fee, v => setBookFeeForm(f => ({ ...f, practice_work_book_fee: v })))}
            {numField("Fun with Dot Book Fee (₹)", bookFeeForm.fun_with_dot_book_fee, v => setBookFeeForm(f => ({ ...f, fun_with_dot_book_fee: v })))}
            {numField("Dairy Fee (₹)", bookFeeForm.dairy_fee, v => setBookFeeForm(f => ({ ...f, dairy_fee: v })))}
            {numField("ID Card Fee (₹)", bookFeeForm.id_card_fee, v => setBookFeeForm(f => ({ ...f, id_card_fee: v })))}
            {numField("Covers Fee (₹)", bookFeeForm.covers_fee, v => setBookFeeForm(f => ({ ...f, covers_fee: v })))}
            {numField("Note Books Fee (₹)", bookFeeForm.note_books_fee, v => setBookFeeForm(f => ({ ...f, note_books_fee: v })))}
            {numField("Misc Fee (₹)", bookFeeForm.misc_fee, v => setBookFeeForm(f => ({ ...f, misc_fee: v })))}
            <div className="col-span-2 p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
              <div className="text-xs font-medium mb-0.5" style={{ color: "hsl(var(--primary))" }}>Computed Total Book Fee</div>
              <div className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                ₹{(bookFeeForm.reading_book_fee + bookFeeForm.text_books_fee + bookFeeForm.practice_work_book_fee + bookFeeForm.fun_with_dot_book_fee + bookFeeForm.dairy_fee + bookFeeForm.id_card_fee + bookFeeForm.covers_fee + bookFeeForm.note_books_fee + bookFeeForm.misc_fee).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookFeeFormOpen(false)}>Cancel</Button>
            <Button onClick={saveBookFeeStructure} disabled={saving}>{saving ? "Saving..." : editingBookFee ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
