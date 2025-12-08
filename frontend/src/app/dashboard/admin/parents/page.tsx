"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { http } from "@/lib/http-client";
import { Search, Save, User, Phone, Mail, MapPin, Briefcase, GraduationCap, Calendar, CreditCard } from "lucide-react";

interface ParentInfo {
    fullName: string;
    dateOfBirth: string;
    cccd: string;
    placeBorn: string;
    education: string;
    career: string;
    living: string;
    phone: string;
    email: string;
    relationship: string;
}

export default function ParentInfoPage() {
    const [studentCode, setStudentCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [parents, setParents] = useState<ParentInfo[]>([]);

    // Forms for Father and Mother
    const [fatherForm, setFatherForm] = useState<ParentInfo>({
        fullName: "",
        dateOfBirth: "",
        cccd: "",
        placeBorn: "",
        education: "",
        career: "",
        living: "",
        phone: "",
        email: "",
        relationship: "Father"
    });

    const [motherForm, setMotherForm] = useState<ParentInfo>({
        fullName: "",
        dateOfBirth: "",
        cccd: "",
        placeBorn: "",
        education: "",
        career: "",
        living: "",
        phone: "",
        email: "",
        relationship: "Mother"
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentCode.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const data = await http.get<ParentInfo[]>(`/admin/GetParentInfos/${studentCode}`);
            setParents(data);

            // Populate forms if data exists
            const father = data.find(p => p.relationship === "Father");
            if (father) {
                setFatherForm({
                    ...father,
                    dateOfBirth: father.dateOfBirth ? new Date(father.dateOfBirth).toISOString().split('T')[0] : ""
                });
            } else {
                resetForm("Father");
            }

            const mother = data.find(p => p.relationship === "Mother");
            if (mother) {
                setMotherForm({
                    ...mother,
                    dateOfBirth: mother.dateOfBirth ? new Date(mother.dateOfBirth).toISOString().split('T')[0] : ""
                });
            } else {
                resetForm("Mother");
            }

        } catch (error: any) {
            console.error("Error fetching parent info:", error);
            setParents([]);
            resetForm("Father");
            resetForm("Mother");
            if (error.status !== 404) {
                alert(error.message || "Lỗi khi tìm kiếm thông tin");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = (relationship: string) => {
        const emptyForm = {
            fullName: "",
            dateOfBirth: "",
            cccd: "",
            placeBorn: "",
            education: "",
            career: "",
            living: "",
            phone: "",
            email: "",
            relationship: relationship
        };
        if (relationship === "Father") setFatherForm(emptyForm);
        else setMotherForm(emptyForm);
    };

    const handleSave = async (relationship: string) => {
        const form = relationship === "Father" ? fatherForm : motherForm;
        const existingParent = parents.find(p => p.relationship === relationship);

        if (!form.fullName.trim()) {
            alert("Vui lòng nhập họ tên");
            return;
        }

        setLoading(true);
        try {
            if (existingParent) {
                // Update
                await http.put(`/admin/UpdateParentInfo/${studentCode}/${relationship}`, form);
                alert(`Cập nhật thông tin ${relationship === "Father" ? "Cha" : "Mẹ"} thành công!`);
            } else {
                // Add
                await http.post(`/admin/AddParentInfo/${studentCode}`, form);
                alert(`Thêm thông tin ${relationship === "Father" ? "Cha" : "Mẹ"} thành công!`);
            }

            // Refresh data
            const data = await http.get<ParentInfo[]>(`/admin/GetParentInfos/${studentCode}`);
            setParents(data);
        } catch (error: any) {
            console.error("Error saving parent info:", error);
            alert(error.message || "Có lỗi xảy ra khi lưu thông tin");
        } finally {
            setLoading(false);
        }
    };

    const renderForm = (relationship: string, form: ParentInfo, setForm: any) => {
        const title = relationship === "Father" ? "Thông tin Cha" : "Thông tin Mẹ";
        const isUpdate = parents.some(p => p.relationship === relationship);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        {title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isUpdate ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {isUpdate ? 'Đã có thông tin' : 'Chưa có thông tin'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={form.dateOfBirth}
                                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CCCD/CMND</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.cccd}
                                onChange={e => setForm({ ...form, cccd: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0123456789"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nơi sinh</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.placeBorn}
                                onChange={e => setForm({ ...form, placeBorn: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Hà Nội"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trình độ học vấn</label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.education}
                                onChange={e => setForm({ ...form, education: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Đại học"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nghề nghiệp</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.career}
                                onChange={e => setForm({ ...form, career: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Kỹ sư"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nơi ở hiện tại</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.living}
                                onChange={e => setForm({ ...form, living: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Số 1, Đường ABC..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0987654321"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="example@email.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => handleSave(relationship)}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {isUpdate ? 'Cập nhật' : 'Lưu thông tin'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quản lý thông tin phụ huynh</h1>
                    <p className="text-gray-600 dark:text-gray-400">Tra cứu và cập nhật thông tin phụ huynh sinh viên</p>
                </div>

                {/* Search Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <label className="sr-only">Mã sinh viên</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={studentCode}
                                    onChange={e => setStudentCode(e.target.value)}
                                    placeholder="Nhập mã sinh viên để tìm kiếm..."
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !studentCode.trim()}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {searched && (
                    <div className="space-y-8">
                        {renderForm("Father", fatherForm, setFatherForm)}
                        {renderForm("Mother", motherForm, setMotherForm)}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
