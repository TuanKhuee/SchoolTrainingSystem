"use client";

import { useAuth } from "@/hooks/useAuth";
import { StudentEditForm } from "@/components/admin/StudentEditForm";

import { use } from "react";

interface StudentEditPageProps {
  params: Promise<{
    studentCode: string;
  }>;
}

export default function StudentEditPage({ params }: StudentEditPageProps) {
  // Ensure user is authenticated and has admin role
  useAuth({ requireAuth: true });

  const { studentCode } = use(params);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Student</h1>
      <StudentEditForm studentCode={studentCode} />
    </div>
  );
}
