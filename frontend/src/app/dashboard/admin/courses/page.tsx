'use client';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/http-client';
import { useAdminAuth } from '@/lib/admin.utils';
import { BookOpen, Plus, Calendar, Users, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Course {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    majors: string[];
    yearLevel: number;
}

interface CourseOffering {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    semesterName: string;
    schoolYear: string;
    capacity: number;
    dayOfWeek: string;
    startPeriod: number;
    endPeriod: number;
    room: string;
    teacherCode?: string;
    teacherName?: string;
}

interface CourseForm {
    courseCode: string;
    courseName: string;
    credits: number;
    yearLevel: number;
    majorCodes: string;
}

interface OfferingForm {
    courseCode: string;
    semesterName: string;
    schoolYear: string;
    capacity: number;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    room: string;
    teacherCode: string;
    offeringCode: string;
}

export default function CoursesPage() {
    useAdminAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'courses' | 'offerings'>('courses');
    const [courses, setCourses] = useState<Course[]>([]);
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [loading, setLoading] = useState(false);
    const [coursePagination, setCoursePagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [showOfferingForm, setShowOfferingForm] = useState(false);
    const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);

    const [courseForm, setCourseForm] = useState<CourseForm>({
        courseCode: '',
        courseName: '',
        credits: 3,
        yearLevel: 1,
        majorCodes: ''
    });

    const [offeringForm, setOfferingForm] = useState<OfferingForm>({
        courseCode: '',
        semesterName: '',
        schoolYear: '',
        capacity: 40,
        dayOfWeek: 2,
        startPeriod: 1,
        endPeriod: 3,
        room: '',
        teacherCode: '',
        offeringCode: ''
    });

    type FormErrors = {
        [key: string]: string;
    };

    const [errors, setErrors] = useState<FormErrors>({});
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
    const [registrationData, setRegistrationData] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'courses') {
            fetchCourses(1);
        } else if (activeTab === 'offerings') {
            fetchOfferings();
        }
    }, [activeTab]);

    const fetchCourses = async (page: number) => {
        setLoading(true);
        try {
            const response = await http.get<{ data: Course[], pagination: any }>(`/admin/course/all?page=${page}&pageSize=10`);
            console.log('Full response:', response);
            console.log('Response data:', response.data);
            console.log('Response pagination:', response.pagination);

            // Check if response is already the data object or if it's wrapped
            if (Array.isArray(response)) {
                console.log('Response is array directly');
                setCourses(response);
            } else if (response.data) {
                console.log('Response has data property');
                setCourses(response.data);
                setCoursePagination(response.pagination);
            } else {
                console.log('Unknown response structure');
            }
        } catch (error: any) {
            console.error('Error fetching courses:', error);
            console.error('Error details:', error.data);
            alert(`Lỗi khi tải danh sách môn học: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchOfferings = async () => {
        setLoading(true);
        try {
            const response = await http.get<CourseOffering[]>('/admin/course/offerings');
            setOfferings(response);
        } catch (error: any) {
            console.error('Error fetching offerings:', error);
            alert(`Lỗi khi tải danh sách lớp học phần: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const validateCourseForm = () => {
        const newErrors: FormErrors = {};
        if (!courseForm.courseCode.trim()) newErrors.courseCode = 'Vui lòng nhập mã học phần';
        if (!courseForm.courseName.trim()) newErrors.courseName = 'Vui lòng nhập tên môn học';
        if (courseForm.credits < 1 || courseForm.credits > 15) newErrors.credits = 'Số tín chỉ phải từ 1-15';
        if (courseForm.yearLevel < 1 || courseForm.yearLevel > 5) newErrors.yearLevel = 'Năm học phải từ 1-4';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOfferingForm = () => {
        const newErrors: FormErrors = {};
        if (!offeringForm.courseCode.trim()) newErrors.courseCode = 'Vui lòng nhập mã học phần';
        if (!offeringForm.semesterName.trim()) newErrors.semesterName = 'Vui lòng nhập tên kỳ học';
        if (!offeringForm.schoolYear.trim()) newErrors.schoolYear = 'Vui lòng nhập năm học';
        if (!offeringForm.room.trim()) newErrors.room = 'Vui lòng nhập phòng học';
        if (offeringForm.capacity < 1) newErrors.capacity = 'Sức chứa phải > 0';
        if (offeringForm.startPeriod >= offeringForm.endPeriod) newErrors.endPeriod = 'Tiết kết thúc phải sau tiết bắt đầu';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCourseForm()) return;

        setLoading(true);
        try {
            const majorCodesArray = courseForm.majorCodes
                .split(',')
                .map(m => m.trim().toUpperCase())
                .filter(m => m.length > 0);

            const payload = {
                courseCode: courseForm.courseCode.trim().toUpperCase(),
                courseName: courseForm.courseName.trim(),
                credits: courseForm.credits,
                yearLevel: courseForm.yearLevel,
                majorCodes: majorCodesArray
            };

            if (editingCourseId) {
                await http.put(`/admin/course/update/${editingCourseId}`, payload);
                alert('Cập nhật môn học thành công!');
            } else {
                await http.post('/admin/course/create', payload);
                alert('Tạo môn học thành công!');
            }

            resetCourseForm();
            fetchCourses(coursePagination.page);
        } catch (error: any) {
            console.error('Error saving course:', error);
            alert(error.data?.message || error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCourse = (course: Course) => {
        setCourseForm({
            courseCode: course.courseCode,
            courseName: course.courseName,
            credits: course.credits,
            yearLevel: course.yearLevel,
            majorCodes: course.majors.join(', ')
        });
        setEditingCourseId(course.id);
        setShowCourseForm(true);
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;

        setLoading(true);
        try {
            await http.delete(`/admin/course/delete/${id}`);
            alert('Xóa môn học thành công!');
            fetchCourses(coursePagination.page);
        } catch (error: any) {
            console.error('Error deleting course:', error);
            alert(error.data?.message || error.message || 'Có lỗi xảy ra khi xóa');
        } finally {
            setLoading(false);
        }
    };

    const resetCourseForm = () => {
        setShowCourseForm(false);
        setEditingCourseId(null);
        setCourseForm({ courseCode: '', courseName: '', credits: 3, yearLevel: 1, majorCodes: '' });
        setErrors({});
    };

    const handleSaveOffering = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateOfferingForm()) return;

        setLoading(true);
        try {
            const payload = {
                courseCode: offeringForm.courseCode.trim().toUpperCase(),
                semesterName: offeringForm.semesterName.trim(),
                schoolYear: offeringForm.schoolYear.trim(),
                capacity: offeringForm.capacity,
                dayOfWeek: getDayName(offeringForm.dayOfWeek),
                startPeriod: offeringForm.startPeriod,
                endPeriod: offeringForm.endPeriod,
                room: offeringForm.room.trim(),
                teacherCode: offeringForm.teacherCode.trim() || undefined,
                offeringCode: offeringForm.offeringCode.trim() || undefined
            };

            if (editingOfferingId) {
                await http.put(`/admin/course/offering/update/${editingOfferingId}`, payload);
                alert('Cập nhật lớp học phần thành công!');
            } else {
                await http.post('/admin/course/add-offering', payload);
                alert('Tạo lớp học phần thành công!');
            }

            resetOfferingForm();
            fetchOfferings();
        } catch (error: any) {
            console.error('Error saving offering:', error);
            alert(error.data?.message || error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleEditOffering = (offering: CourseOffering) => {
        // Reverse mapping for dayOfWeek (string -> number)
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayIndex = days.indexOf(offering.dayOfWeek);

        setOfferingForm({
            courseCode: offering.courseCode,
            semesterName: offering.semesterName,
            schoolYear: offering.schoolYear,
            capacity: offering.capacity,
            dayOfWeek: dayIndex !== -1 ? dayIndex : 2,
            startPeriod: offering.startPeriod,
            endPeriod: offering.endPeriod,
            room: offering.room,
            teacherCode: offering.teacherCode || '',
            offeringCode: '' // Don't pre-fill offering code to avoid confusion or keep it empty for auto-gen logic if needed
        });
        setEditingOfferingId(offering.id);
        setShowOfferingForm(true);
        setActiveTab('offerings');
    };

    const handleDeleteOffering = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lớp học phần này?')) return;

        setLoading(true);
        try {
            await http.delete(`/admin/course/offering/delete/${id}`);
            alert('Xóa lớp học phần thành công!');
            fetchOfferings();
        } catch (error: any) {
            console.error('Error deleting offering:', error);
            alert(error.data?.message || error.message || 'Có lỗi xảy ra khi xóa');
        } finally {
            setLoading(false);
        }
    };

    const resetOfferingForm = () => {
        setShowOfferingForm(false);
        setEditingOfferingId(null);
        setOfferingForm({
            courseCode: '',
            semesterName: '',
            schoolYear: '',
            capacity: 40,
            dayOfWeek: 2,
            startPeriod: 1,
            endPeriod: 3,
            room: '',
            teacherCode: '',
            offeringCode: ''
        });
        setErrors({});
    };

    const handleViewStudents = async (offeringId: string) => {
        setLoading(true);
        try {
            console.log('Fetching students for offering:', offeringId);
            const data = await http.get<any>(`/admin/course/offering/${offeringId}/registrations`);
            console.log('Received data:', data);
            setRegistrationData(data);
            setSelectedOfferingId(offeringId);
            setShowStudentsModal(true);
            console.log('Modal should show now, showStudentsModal:', true);
        } catch (error: any) {
            console.error('Error fetching registrations:', error);
            alert(error.data?.message || error.message || 'Có lỗi khi tải danh sách sinh viên');
        } finally {
            setLoading(false);
        }
    };

    const getDayName = (day: number) => {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[day] || 'N/A';
    };

    return (
        <AdminLayout>
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quản lý môn học</h1>
                        <p className="text-gray-600 dark:text-gray-400">Tạo và quản lý các môn học và lớp học phần</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'courses'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <BookOpen className="inline h-5 w-5 mr-2" />
                        Môn học
                    </button>
                    <button
                        onClick={() => setActiveTab('offerings')}
                        className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'offerings'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <Calendar className="inline h-5 w-5 mr-2" />
                        Lớp học phần
                    </button>
                </div>

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div>
                        <button
                            onClick={() => {
                                resetCourseForm();
                                setShowCourseForm(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-6"
                        >
                            <Plus className="h-5 w-5" /> Thêm môn học
                        </button>

                        {/* Course Form */}
                        {showCourseForm && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {editingCourseId ? 'Cập nhật môn học' : 'Thêm môn học mới'}
                                </h2>
                                <form onSubmit={handleSaveCourse} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Course Code */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã học phần <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={courseForm.courseCode}
                                            onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                                            placeholder="VD: IT101"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.courseCode ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.courseCode && <p className="mt-1 text-sm text-red-500">{errors.courseCode}</p>}
                                    </div>

                                    {/* Course Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Tên môn học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={courseForm.courseName}
                                            onChange={e => setCourseForm({ ...courseForm, courseName: e.target.value })}
                                            placeholder="VD: Lập trình căn bản"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.courseName ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.courseName && <p className="mt-1 text-sm text-red-500">{errors.courseName}</p>}
                                    </div>

                                    {/* Credits */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Số tín chỉ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="15"
                                            value={courseForm.credits}
                                            onChange={e => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.credits ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.credits && <p className="mt-1 text-sm text-red-500">{errors.credits}</p>}
                                    </div>

                                    {/* Year Level */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Năm học <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={courseForm.yearLevel}
                                            onChange={e => setCourseForm({ ...courseForm, yearLevel: parseInt(e.target.value) })}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.yearLevel ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <option value={1}>Năm 1</option>
                                            <option value={2}>Năm 2</option>
                                            <option value={3}>Năm 3</option>
                                            <option value={4}>Năm 4</option>
                                            <option value={5}>Năm 5</option>
                                        </select>
                                        {errors.yearLevel && <p className="mt-1 text-sm text-red-500">{errors.yearLevel}</p>}
                                    </div>

                                    {/* Major Codes */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã chuyên ngành (phân cách bằng dấu phẩy)
                                        </label>
                                        <input
                                            type="text"
                                            value={courseForm.majorCodes}
                                            onChange={e => setCourseForm({ ...courseForm, majorCodes: e.target.value })}
                                            placeholder="VD: CNTT, KTPM, HTTT"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">Để trống nếu áp dụng cho tất cả chuyên ngành</p>
                                    </div>

                                    {/* Buttons */}
                                    <div className="md:col-span-2 flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                        >
                                            {loading ? 'Đang xử lý...' : (editingCourseId ? 'Cập nhật' : 'Tạo môn học')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetCourseForm}
                                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Courses Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Mã HP</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tên môn học</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tín chỉ</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Năm học</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Chuyên ngành</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading && courses.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</td>
                                            </tr>
                                        ) : courses.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Chưa có môn học nào</td>
                                            </tr>
                                        ) : (
                                            courses.map(course => (
                                                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-semibold text-gray-900 dark:text-white">{course.courseCode}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{course.courseName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{course.credits}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            Năm {course.yearLevel}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                        {course.majors.length > 0 ? course.majors.join(', ') : 'Tất cả'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditCourse(course)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                                            title="Sửa"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCourse(course.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {coursePagination.totalPages > 1 && (
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Hiển thị {((coursePagination.page - 1) * coursePagination.pageSize) + 1} - {Math.min(coursePagination.page * coursePagination.pageSize, coursePagination.total)} trong tổng số {coursePagination.total} môn học
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchCourses(coursePagination.page - 1)}
                                                disabled={coursePagination.page === 1}
                                                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trang {coursePagination.page} / {coursePagination.totalPages}</span>
                                            <button
                                                onClick={() => fetchCourses(coursePagination.page + 1)}
                                                disabled={coursePagination.page === coursePagination.totalPages}
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
                )}

                {/* Offerings Tab */}
                {activeTab === 'offerings' && (
                    <div>
                        <button
                            onClick={() => {
                                resetOfferingForm();
                                setShowOfferingForm(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-6"
                        >
                            <Plus className="h-5 w-5" /> Thêm lớp học phần
                        </button>

                        {/* Offering Form */}
                        {showOfferingForm && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {editingOfferingId ? 'Cập nhật lớp học phần' : 'Thêm lớp học phần mới'}
                                </h2>
                                <form onSubmit={handleSaveOffering} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Course Code */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã học phần <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.courseCode}
                                            onChange={e => setOfferingForm({ ...offeringForm, courseCode: e.target.value })}
                                            placeholder="VD: IT101"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.courseCode ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.courseCode && <p className="mt-1 text-sm text-red-500">{errors.courseCode}</p>}
                                    </div>

                                    {/* Semester Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Tên kỳ học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.semesterName}
                                            onChange={e => setOfferingForm({ ...offeringForm, semesterName: e.target.value })}
                                            placeholder="VD: HK1"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.semesterName ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.semesterName && <p className="mt-1 text-sm text-red-500">{errors.semesterName}</p>}
                                    </div>

                                    {/* School Year */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Năm học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.schoolYear}
                                            onChange={e => setOfferingForm({ ...offeringForm, schoolYear: e.target.value })}
                                            placeholder="VD: 2024-2025"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.schoolYear ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.schoolYear && <p className="mt-1 text-sm text-red-500">{errors.schoolYear}</p>}
                                    </div>

                                    {/* Capacity */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Sức chứa <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={offeringForm.capacity}
                                            onChange={e => setOfferingForm({ ...offeringForm, capacity: parseInt(e.target.value) })}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.capacity ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.capacity && <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>}
                                    </div>

                                    {/* Day of Week */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Thứ <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={offeringForm.dayOfWeek}
                                            onChange={e => setOfferingForm({ ...offeringForm, dayOfWeek: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        >
                                            <option value={0}>Chủ nhật</option>
                                            <option value={1}>Thứ 2</option>
                                            <option value={2}>Thứ 3</option>
                                            <option value={3}>Thứ 4</option>
                                            <option value={4}>Thứ 5</option>
                                            <option value={5}>Thứ 6</option>
                                            <option value={6}>Thứ 7</option>
                                        </select>
                                    </div>

                                    {/* Start Period */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Tiết bắt đầu <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={offeringForm.startPeriod}
                                            onChange={e => setOfferingForm({ ...offeringForm, startPeriod: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                    </div>

                                    {/* End Period */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Tiết kết thúc <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={offeringForm.endPeriod}
                                            onChange={e => setOfferingForm({ ...offeringForm, endPeriod: parseInt(e.target.value) })}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.endPeriod ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.endPeriod && <p className="mt-1 text-sm text-red-500">{errors.endPeriod}</p>}
                                    </div>

                                    {/* Room */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Phòng học <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.room}
                                            onChange={e => setOfferingForm({ ...offeringForm, room: e.target.value })}
                                            placeholder="VD: A101"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.room ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.room && <p className="mt-1 text-sm text-red-500">{errors.room}</p>}
                                    </div>

                                    {/* Teacher Code */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã giáo viên (tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.teacherCode}
                                            onChange={e => setOfferingForm({ ...offeringForm, teacherCode: e.target.value })}
                                            placeholder="VD: GV001"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Offering Code */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã lớp học phần (tùy chọn)
                                        </label>
                                        <input
                                            type="text"
                                            value={offeringForm.offeringCode}
                                            onChange={e => setOfferingForm({ ...offeringForm, offeringCode: e.target.value })}
                                            placeholder="Để trống để tự động tạo"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="md:col-span-2 flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                        >
                                            {loading ? 'Đang xử lý...' : (editingOfferingId ? 'Cập nhật' : 'Tạo lớp học phần')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetOfferingForm}
                                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Offerings Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Mã HP</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tên môn học</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Kỳ học</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Lịch học</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Phòng</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sức chứa</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Giáo viên</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading && offerings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</td>
                                            </tr>
                                        ) : offerings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Chưa có lớp học phần nào</td>
                                            </tr>
                                        ) : (
                                            offerings.map(offering => (
                                                <tr key={offering.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-semibold text-gray-900 dark:text-white">{offering.courseCode}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{offering.courseName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                        {offering.semesterName} - {offering.schoolYear}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                        {offering.dayOfWeek}, Tiết {offering.startPeriod}-{offering.endPeriod}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{offering.room}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{offering.capacity}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                        {offering.teacherName || 'Chưa phân công'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleViewStudents(offering.id)}
                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                                                            title="Xem sinh viên"
                                                        >
                                                            <Users className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditOffering(offering)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                                            title="Sửa"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOffering(offering.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students Modal */}
                {showStudentsModal && registrationData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            Danh sách sinh viên đăng ký
                                        </h2>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <p><span className="font-semibold">Môn học:</span> {registrationData.offeringInfo.courseCode} - {registrationData.offeringInfo.courseName}</p>
                                            <p><span className="font-semibold">Kỳ học:</span> {registrationData.offeringInfo.semesterName} - {registrationData.offeringInfo.schoolYear}</p>
                                            <p><span className="font-semibold">Phòng:</span> {registrationData.offeringInfo.room}</p>
                                            <p><span className="font-semibold">Sĩ số:</span> {registrationData.offeringInfo.enrolled}/{registrationData.offeringInfo.capacity}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowStudentsModal(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {registrationData.students.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p>Chưa có sinh viên nào đăng ký</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">STT</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">MSSV</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Họ tên</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Lớp</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Chuyên ngành</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {registrationData.students.map((student: any, index: number) => (
                                                    <tr key={student.studentCode} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{index + 1}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="font-semibold text-gray-900 dark:text-white">{student.studentCode}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{student.fullName}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{student.className}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{student.majorName}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                                <button
                                    onClick={() => setShowStudentsModal(false)}
                                    className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
