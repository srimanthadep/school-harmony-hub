import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ACADEMIC_YEARS } from "@/lib/constants";

interface SchoolSettings {
  id: string;
  school_name: string;
  school_address: string;
  phone: string;
  email: string;
  website: string;
  principal_name: string;
  academic_year: string;
  currency_symbol: string;
  receipt_prefix: string;
  slip_prefix: string;
  last_receipt_no: number;
  last_slip_no: number;
}

const YEARS = ACADEMIC_YEARS;

export default function SettingsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [form, setForm] = useState({
    school_name: "", school_address: "", phone: "", email: "",
    website: "", principal_name: "", academic_year: "2024-25",
    currency_symbol: "₹", receipt_prefix: "REC", slip_prefix: "SLP",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("school_settings").select("*").limit(1).single()
      .then(({ data }) => {
        if (data) {
          setSettings(data as SchoolSettings);
          setForm({
            school_name: data.school_name ?? "",
            school_address: data.school_address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
            principal_name: data.principal_name ?? "",
            academic_year: data.academic_year ?? "2024-25",
            currency_symbol: data.currency_symbol ?? "₹",
            receipt_prefix: data.receipt_prefix ?? "REC",
            slip_prefix: data.slip_prefix ?? "SLP",
          });
        }
      });
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const payload = { ...form };
    const { error } = settings
      ? await supabase.from("school_settings").update(payload).eq("id", settings.id)
      : await supabase.from("school_settings").insert(payload);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved successfully." });
    }
    setSaving(false);
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Account and system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* Account Info */}
        <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
              <User className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h2 className="font-semibold">Account Info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Role</div>
              <span className="badge-primary capitalize">{role}</span>
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>User ID</div>
              <div className="font-mono text-xs">{user?.id?.slice(0, 16)}...</div>
            </div>
          </div>
        </div>

        {/* Numbering Settings */}
        {role === "admin" && (
          <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
                <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 className="font-semibold">Numbering & Year</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Receipt Prefix</Label>
                <Input value={form.receipt_prefix} onChange={f("receipt_prefix")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Slip Prefix</Label>
                <Input value={form.slip_prefix} onChange={f("slip_prefix")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Currency Symbol</Label>
                <Input value={form.currency_symbol} onChange={f("currency_symbol")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Current Academic Year</Label>
                <Select value={form.academic_year} onValueChange={v => setForm(p => ({ ...p, academic_year: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {settings && (
                <div className="col-span-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Last receipt #: {settings.last_receipt_no} | Last slip #: {settings.last_slip_no}
                </div>
              )}
            </div>
          </div>
        )}

        {/* School Info Form (admin only) */}
        {role === "admin" && (
          <div className="md:col-span-2 p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">School Information</h2>
              <Button size="sm" onClick={saveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>School Name</Label><Input value={form.school_name} onChange={f("school_name")} className="mt-1" /></div>
              <div><Label>Principal Name</Label><Input value={form.principal_name} onChange={f("principal_name")} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} className="mt-1" /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={f("website")} className="mt-1" placeholder="https://..." /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={form.school_address} onChange={f("school_address")} className="mt-1" /></div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
