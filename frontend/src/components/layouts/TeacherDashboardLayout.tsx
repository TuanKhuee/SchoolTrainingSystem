"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Home, BookOpen, GraduationCap, Key } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface TeacherDashboardLayoutProps {
    children: React.ReactNode;
}

const TeacherDashboardLayout = ({ children }: TeacherDashboardLayoutProps) => {
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const navItems = [
        {
            href: "/dashboard/teacher",
            label: "Trang chủ",
            icon: <Home className="w-5 h-5 mr-2" />,
        },
        {
            href: "/dashboard/teacher/courses",
            label: "Lớp học phần",
            icon: <BookOpen className="w-5 h-5 mr-2" />,
        },
        {
            href: "/dashboard/change-password",
            label: "Đổi mật khẩu",
            icon: <Key className="w-5 h-5 mr-2" />,
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <div className="w-64 bg-gradient-to-b from-emerald-600 to-teal-700 border-r border-white/10 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/20 flex items-center justify-center">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Image
                                src="/logo_educhain.png"
                                alt="EduChain Logo"
                                width={48}
                                height={48}
                                className="rounded-lg"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            EduChain
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1">Teacher Portal</p>
                    </div>
                </div>
                <nav className="p-4 flex-1">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center p-3 text-white/90 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 group"
                                >
                                    <span className="group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center p-3 text-white/90 rounded-xl hover:bg-red-500/20 hover:text-white transition-all duration-200 group mt-4 border-t border-white/20 pt-6"
                            >
                                <LogOut className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Đăng xuất</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
};

export default TeacherDashboardLayout;
