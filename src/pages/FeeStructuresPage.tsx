import DashboardLayout from "@/components/DashboardLayout";
import { Construction } from "lucide-react";

export default function FeeStructuresPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-header">Fee Structures</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Configure tuition and book fees per class and academic year
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--primary-muted))" }}>
          <Construction className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
        <p className="text-sm max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>
          Fee structure management requires additional database tables. This feature will be implemented in the next phase.
        </p>
      </div>
    </DashboardLayout>
  );
}
