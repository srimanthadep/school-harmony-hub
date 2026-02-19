import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">EduManage Pro</h1>
          <p className="text-lg text-white/80 mb-8">
            Complete school fee & salary management system for modern educational institutions
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Fee Management", desc: "Track payments & generate receipts" },
              { label: "Staff Salaries", desc: "Manage payroll effortlessly" },
              { label: "Reports", desc: "Detailed financial reports" },
              { label: "Role Access", desc: "Secure multi-role system" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-white/70 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>EduManage Pro</span>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>Welcome back</h2>
          <p className="mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            Sign in to access your school management portal
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email" className="font-medium">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="font-medium">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-semibold h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--primary))" }}>Demo Accounts</p>
            <div className="space-y-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <p>Admin: admin@school.edu / admin123</p>
              <p>Student: student@school.edu / student123</p>
              <p>Teacher: teacher@school.edu / teacher123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
