"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http-client";
import { useAdminAuth } from "@/lib/admin.utils";
import { User, Mail, Key, IdCard, Eye, EyeOff, CheckCircle, Phone } from "lucide-react";

interface CreateTeacherForm {
    fullName: string;
    email: string;
    teacherCode: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
}

export default function AddTeacherPage() {
    useAdminAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdTeacher, setCreatedTeacher] = useState<any>(null);

    const [formData, setFormData] = useState<CreateTeacherForm>({
        fullName: "",
        email: "",
        teacherCode: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<Partial<CreateTeacherForm>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<CreateTeacherForm> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Vui lòng nhập họ tên giáo viên";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!formData.teacherCode.trim()) {
            newErrors.teacherCode = "Vui lòng nhập mã giáo viên";
        }

        if (!formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await http.post("/admin/create-teacher", {
                FullName: formData.fullName,
                Email: formData.email,
                TeacherCode: formData.teacherCode,
                PhoneNumber: formData.phoneNumber,
                Password: formData.password,
            });

            setSuccess(true);
            // Backend returns { message, teacher: { fullName, email, teacherCodes, password } } in camelCase
            setCreatedTeacher(response.teacher || response);

            // Reset form
            setFormData({
                fullName: "",
                email: "",
                teacherCode: "",
                phoneNumber: "",
                password: "",
                confirmPassword: "",
            });

        } catch (error: any) {
            console.error("Error creating teacher:", error);

            let errorMessage = "Có lỗi xảy ra khi tạo tài khoản giáo viên";

            // Check for network errors
            if (error instanceof TypeError && error.message.includes("fetch")) {
                errorMessage = "❌ Lỗi kết nối mạng!\n\nKiểm tra:\n1. Backend có đang chạy ở http://localhost:5000 không?\n2. CORS có được cấu hình đúng không?\n3. Firewall có chặn không?";
            } else if (error.status === 0) {
                errorMessage = "❌ Không thể kết nối đến server!\n\nVui lòng kiểm tra:\n- Backend có đang chạy không?\n- URL API: http://localhost:5000/api";
            } else if (error.status === 401) {
                errorMessage = "❌ Lỗi xác thực!\n\nBạn cần đăng nhập lại với tài khoản Admin.";
            } else if (error.status === 403) {
                errorMessage = "❌ Không có quyền!\n\nChỉ Admin mới có thể tạo tài khoản giáo viên.";
            } else if (error.status === 409) {
                errorMessage = `❌ ${error.data?.message || "Email hoặc mã giáo viên đã tồn tại"}`;
            } else if (error.status === 400) {
                errorMessage = `❌ Dữ liệu không hợp lệ!\n\n${error.data?.message || error.data?.Errors || "Vui lòng kiểm tra lại thông tin"}`;
            } else if (error.data?.message) {
                errorMessage = `❌ ${error.data.message}\n(Status: ${error.status})`;
            } else if (error.message) {
                errorMessage = `❌ ${error.message}${error.status ? ` (Status: ${error.status})` : ''}`;
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof CreateTeacherForm]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    if (success && createdTeacher) {
        return (
            <AdminLayout>
                <div className="container mx-auto py-8 max-w-2xl">
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-8 text-center">
                        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-4">
                            Tạo tài khoản giáo viên thành công!
                        </h1>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 text-left">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                                Thông tin tài khoản:
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Họ tên</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {createdTeacher.fullName || createdTeacher.FullName || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IdCard className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Mã giáo viên</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {createdTeacher.teacherCodes || createdTeacher.TeacherCodes || createdTeacher.teacherCode || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {createdTeacher.email || createdTeacher.Email || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {createdTeacher.phoneNumber || createdTeacher.PhoneNumber || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Key className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Mật khẩu</p>
                                        <p className="font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                                            {createdTeacher.password || createdTeacher.Password || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Vui lòng lưu lại thông tin này và cung cấp cho giáo viên
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setCreatedTeacher(null);
                                }}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                                Tạo giáo viên khác
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                            >
                                Về Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="container mx-auto py-8 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Thêm giáo viên mới
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Tạo tài khoản mới cho giáo viên trong hệ thống
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.fullName ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                            </div>
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="teacher@example.com"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.email ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Teacher Code */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mã giáo viên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="teacherCode"
                                    value={formData.teacherCode}
                                    onChange={handleChange}
                                    placeholder="GV001"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.teacherCode ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                            </div>
                            {errors.teacherCode && (
                                <p className="mt-1 text-sm text-red-500">{errors.teacherCode}</p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="0123456789"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.phoneNumber ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                            </div>
                            {errors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.password ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Mật khẩu phải có ít nhất 6 ký tự
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Xác nhận mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "Đang tạo..." : "Tạo tài khoản"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
