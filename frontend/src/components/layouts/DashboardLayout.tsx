"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Home, Wallet, Award, Calendar, QrCode, BookOpen, ShoppingCart, Key, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navItems = [
    {
      href: "/student",
      label: "Trang chủ",
      icon: <Home className="w-5 h-5 mr-2" />,
    },
    {
      href: "/student/profile",
      label: "Thông tin sinh viên",
      icon: <User className="w-5 h-5 mr-2" />,
    },
    {
      href: "/student/courses",
      label: "Đăng ký học phần",
      icon: <BookOpen className="w-5 h-5 mr-2" />,
    },
    {
      href: "/student/results",
      label: "Kết quả học tập",
      icon: <Award className="w-5 h-5 mr-2" />,
    },
    {
      href: "/student/shop",
      label: "Mua hàng",
      icon: <ShoppingCart className="w-5 h-5 mr-2" />,
    },
    {
      href: "/student/activities",
      label: "Hoạt động",
      icon: <Calendar className="w-5 h-5 mr-2" />,
    },

    {
      href: "/student/scan-qr",
      label: "Quét mã",
      icon: <QrCode className="w-5 h-5 mr-2" />,
    },
    {
      href: "/dashboard/change-password",
      label: "Đổi mật khẩu",
      icon: <Key className="w-5 h-5 mr-2" />,
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-purple-700 z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <Image
            src="/logo_educhain.png"
            alt="EduChain Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold text-white">EduChain</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-600 to-purple-700 shadow-2xl 
        transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/logo_educhain.png"
              alt="EduChain Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">
                EduChain
              </h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm">Student Portal</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center p-3 text-white/90 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 group"
                >
                  <span className="group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="pt-4 mt-4 border-t border-white/20">
              <button
                onClick={handleLogout}
                className="flex w-full items-center p-3 text-white/90 rounded-xl hover:bg-red-500/20 hover:text-white transition-all duration-200 group"
              >
                <LogOut className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto md:ml-0 pt-16 md:pt-0">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
