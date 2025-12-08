"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";

export default function StudentProfile() {
  const { user, wallet, isAuthenticated } = useAuth({ requireAuth: true });

  // Loading state
  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format date
  const formattedBirthDate = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString()
    : "N/A";

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="bg-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{user.fullName}</h2>
        <p className="text-blue-100">Student ID: {user.studentCode || "N/A"}</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileItem label="Email" value={user.email || "N/A"} />
          <ProfileItem label="Date of Birth" value={formattedBirthDate} />
          <ProfileItem label="Username" value={user.userName || "N/A"} />
          {user.class && <ProfileItem label="Class" value={user.class} />}
        </div>
      </div>
    </div>
  );
}

// Helper component for profile items
interface ProfileItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function ProfileItem({ label, value, highlight = false }: ProfileItemProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div
        className={`mt-1 font-medium ${highlight ? "text-blue-600" : "text-gray-800 dark:text-gray-200"}`}
      >
        {value}
      </div>
    </div>
  );
}
