import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentsPage from "./pages/StudentsPage";
import StaffPage from "./pages/StaffPage";
import FeesPage from "./pages/FeesPage";
import SalariesPage from "./pages/SalariesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import FeeStructuresPage from "./pages/FeeStructuresPage";
import MyFeesPage from "./pages/MyFeesPage";
import MySalaryPage from "./pages/MySalaryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (role === "admin") {
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/salaries" element={<SalariesPage />} />
        <Route path="/fee-structures" element={<FeeStructuresPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (role === "student") {
    return (
      <Routes>
        <Route path="/" element={<MyFeesPage />} />
        <Route path="/my-fees" element={<MyFeesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (role === "teacher") {
    return (
      <Routes>
        <Route path="/" element={<MySalaryPage />} />
        <Route path="/my-salary" element={<MySalaryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // No role assigned yet - show a waiting screen
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
      <div className="text-center max-w-sm p-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--primary-muted))" }}>
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="font-bold text-lg mb-2">Account Pending</h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your account hasn't been assigned a role yet. Please contact your school administrator.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>{user.email}</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
