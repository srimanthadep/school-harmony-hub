import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, User } from "lucide-react";

export default function SettingsPage() {
  const { user, role } = useAuth();

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

        {/* System Info */}
        {role === "admin" && (
          <div className="p-6 rounded-xl border shadow-card" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
                <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 className="font-semibold">System</h2>
            </div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              School settings, fee structure configuration, and numbering options will be available in the next update.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
