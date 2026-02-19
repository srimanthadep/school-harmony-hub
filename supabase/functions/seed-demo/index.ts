import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const demoUsers = [
    { email: "admin@school.edu", password: "admin123", role: "admin", name: "School Admin" },
    { email: "student@school.edu", password: "student123", role: "student", name: "Demo Student" },
    { email: "teacher@school.edu", password: "teacher123", role: "teacher", name: "Demo Teacher" },
  ];

  const results = [];

  for (const u of demoUsers) {
    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });

    if (authError && !authError.message.includes("already been registered")) {
      results.push({ email: u.email, status: "error", error: authError.message });
      continue;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      // User already exists, find them
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((x: any) => x.email === u.email);
      if (found) {
        await supabase.from("user_roles").upsert({ user_id: found.id, role: u.role }, { onConflict: "user_id,role" });
        results.push({ email: u.email, status: "role_updated" });
      }
      continue;
    }

    // Assign role
    await supabase.from("user_roles").upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });

    // Seed sample data for student
    if (u.role === "student") {
      await supabase.from("students").upsert({
        student_id: "STU001",
        full_name: "Demo Student",
        class: "10th",
        section: "A",
        roll_no: 1,
        parent_name: "Demo Parent",
        parent_phone: "9876543210",
        total_fee: 50000,
        user_id: userId,
      }, { onConflict: "student_id" });
    }

    if (u.role === "teacher") {
      await supabase.from("staff").upsert({
        staff_id: "STF001",
        full_name: "Demo Teacher",
        role: "Teacher",
        subject: "Mathematics",
        monthly_salary: 35000,
        user_id: userId,
      }, { onConflict: "staff_id" });
    }

    results.push({ email: u.email, status: "created", role: u.role });
  }

  // Seed sample students and staff
  const sampleStudents = [
    { student_id: "STU002", full_name: "Arjun Sharma", class: "5th", section: "A", roll_no: 2, parent_name: "Rajesh Sharma", parent_phone: "9812345678", total_fee: 35000 },
    { student_id: "STU003", full_name: "Priya Patel", class: "3rd", section: "B", roll_no: 5, parent_name: "Suresh Patel", parent_phone: "9887654321", total_fee: 28000 },
    { student_id: "STU004", full_name: "Rahul Kumar", class: "7th", section: "A", roll_no: 12, parent_name: "Vijay Kumar", parent_phone: "9823456789", total_fee: 42000 },
    { student_id: "STU005", full_name: "Ananya Singh", class: "LKG", section: "A", roll_no: 3, parent_name: "Anil Singh", parent_phone: "9834567890", total_fee: 20000 },
    { student_id: "STU006", full_name: "Kabir Verma", class: "9th", section: "C", roll_no: 8, parent_name: "Deepak Verma", parent_phone: "9845678901", total_fee: 48000 },
  ];

  for (const s of sampleStudents) {
    await supabase.from("students").upsert(s, { onConflict: "student_id" });
  }

  const sampleStaff = [
    { staff_id: "STF002", full_name: "Mrs. Sunita Rao", role: "Teacher", subject: "English", monthly_salary: 32000 },
    { staff_id: "STF003", full_name: "Mr. Ravi Nair", role: "Principal", monthly_salary: 65000 },
    { staff_id: "STF004", full_name: "Mrs. Geeta Joshi", role: "Accountant", monthly_salary: 28000 },
    { staff_id: "STF005", full_name: "Mr. Arun Mishra", role: "Teacher", subject: "Science", monthly_salary: 30000 },
  ];

  for (const s of sampleStaff) {
    await supabase.from("staff").upsert(s, { onConflict: "staff_id" });
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
