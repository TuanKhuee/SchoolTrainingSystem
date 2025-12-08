"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http-client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import TeacherDashboardLayout from "@/components/layouts/TeacherDashboardLayout";
import StaffLayout from "@/components/layouts/StaffLayout";
import { Key, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Dynamic layout wrapper component
const LayoutWrapper = ({ children, userRole }: { children: React.ReactNode; userRole?: string }) => {
    if (userRole === "Student") return <DashboardLayout>{children}</DashboardLayout>;
    if (userRole === "Teacher") return <TeacherDashboardLayout>{children}</TeacherDashboardLayout>;
    if (userRole === "Staff") return <StaffLayout>{children}</StaffLayout>;
    return <AdminLayout>{children}</AdminLayout>;
};


export default function ChangePasswordPage() {
    const { user } = useAuth({ requireAuth: true });

    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Get dashboard URL based on user role
    const getDashboardUrl = () => {
        if (user?.role === "Student") return "/student";
        if (user?.role === "Staff") return "/staff";
        if (user?.role === "Teacher") return "/dashboard/teacher";
        return "/dashboard";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
            return;
        }

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Mật khẩu mới phải khác mật khẩu hiện tại");
            return;
        }

        setIsSubmitting(true);

        try {
            await http.post("/user/change-password", {
                CurrentPassword: currentPassword,
                NewPassword: newPassword,
            });

            setSuccess("Đổi mật khẩu thành công!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push(getDashboardUrl());
            }, 2000);
        } catch (error: any) {
            console.error("Error changing password:", error);
            setError(error.message || "Lỗi khi đổi mật khẩu");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LayoutWrapper userRole={user?.role}>
            <div className="container mx-auto py-8 px-4 max-w-2xl">
                <Link
                    href={getDashboardUrl()}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại Dashboard
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Đổi mật khẩu
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Thay đổi mật khẩu đăng nhập của bạn
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-green-600 dark:text-green-400">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mật khẩu hiện tại
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push(getDashboardUrl())}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </LayoutWrapper>
    );
}
