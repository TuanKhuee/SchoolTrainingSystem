'use client';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/http-client';
import { useAdminAuth } from '@/lib/admin.utils';
import { Calendar, Plus, Edit, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Semester {
    id: string;
    name: string;
    schoolYear: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface SemesterForm {
    name: string;
    schoolYear: string;
    startDate: string;
    endDate: string;
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default function SemestersPage() {
    useAdminAuth();
    const router = useRouter();

    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SemesterForm>({ name: '', schoolYear: '', startDate: '', endDate: '' });
    const [errors, setErrors] = useState<Partial<SemesterForm>>({});
    const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

    useEffect(() => {
        fetchSemesters(1);
    }, []);

    const fetchSemesters = async (page: number) => {
        setLoading(true);
        try {
            const response = await http.get<{ data: Semester[], pagination: Pagination }>(`/semester/all?page=${page}&pageSize=10`);
            setSemesters(response.data);
            setPagination(response.pagination);
        } catch (error: any) {
            console.error('Error fetching semesters:', error);
            console.error('Error status:', error.status);
            console.error('Error data:', error.data);
            alert(`Lỗi khi tải danh sách kỳ học: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Partial<SemesterForm> = {};
        if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên kỳ học';
        if (!formData.schoolYear.trim()) newErrors.schoolYear = 'Vui lòng nhập năm học';
        if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            if (editingId) {
                await http.put(`/semester/update/${editingId}`, formData);
                alert('Cập nhật kỳ học thành công!');
            } else {
                await http.post('/semester/create', formData);
                alert('Tạo kỳ học thành công!');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', schoolYear: '', startDate: '', endDate: '' });
            fetchSemesters(pagination.page);
        } catch (error: any) {
            console.error('Error saving semester:', error);
            alert(error.data?.message || error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (semester: Semester) => {
        setEditingId(semester.id);
        setFormData({
            name: semester.name,
            schoolYear: semester.schoolYear,
            startDate: semester.startDate.split('T')[0],
            endDate: semester.endDate.split('T')[0],
        });
        setShowForm(true);
    };



    // Determine semester status based on current date
    const getSemesterStatus = (startDate: string, endDate: string) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (now < start) return { type: 'upcoming', label: 'Chưa bắt đầu', color: 'blue' };
        if (now >= start && now <= end) return { type: 'active', label: 'Đang hoạt động', color: 'green' };
        return { type: 'ended', label: 'Đã kết thúc', color: 'gray' };
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

    return (
        <AdminLayout>
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quản lý kỳ học</h1>
                        <p className="text-gray-600 dark:text-gray-400">Tạo và quản lý các kỳ học trong hệ thống</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingId(null);
                            setFormData({ name: '', schoolYear: '', startDate: '', endDate: '' });
                            setErrors({});
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        <Plus className="h-5 w-5" /> Thêm kỳ học
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingId ? 'Chỉnh sửa kỳ học' : 'Thêm kỳ học mới'}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Tên kỳ học <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="HK1, HK2, HK Hè"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            {/* School Year */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Năm học <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.schoolYear}
                                    onChange={e => setFormData({ ...formData, schoolYear: e.target.value })}
                                    placeholder="2024-2025"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.schoolYear ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.schoolYear && <p className="mt-1 text-sm text-red-500">{errors.schoolYear}</p>}
                            </div>
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Ngày bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
                            </div>
                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Ngày kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
                            </div>
                            {/* Buttons */}
                            <div className="md:col-span-2 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                >
                                    {loading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo kỳ học'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormData({ name: '', schoolYear: '', startDate: '', endDate: '' });
                                        setErrors({});
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tên kỳ học</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Năm học</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ngày bắt đầu</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ngày kết thúc</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading && semesters.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</td>
                                    </tr>
                                ) : semesters.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Chưa có kỳ học nào</td>
                                    </tr>
                                ) : (
                                    semesters.map(semester => {
                                        const status = getSemesterStatus(semester.startDate, semester.endDate);
                                        return (
                                            <tr key={semester.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-5 w-5 text-gray-400" />
                                                        <span className="font-semibold text-gray-900 dark:text-white">{semester.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{semester.schoolYear}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(semester.startDate)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatDate(semester.endDate)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span style={{ backgroundColor: status.color === 'blue' ? '#ebf8ff' : status.color === 'green' ? '#f0fff4' : '#f7fafc', color: status.color === 'blue' ? '#2b6cb0' : status.color === 'green' ? '#2f855a' : '#4a5568' }} className="px-2 py-1 rounded text-xs font-medium">{status.label}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleEdit(semester)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Hiển thị {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} trong tổng số {pagination.total} kỳ học
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchSemesters(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trang {pagination.page} / {pagination.totalPages}</span>
                                    <button
                                        onClick={() => fetchSemesters(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
