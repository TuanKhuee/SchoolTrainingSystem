"use client";

import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/http-client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Users, CheckSquare, GraduationCap, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

interface Student {
    id: string;
    fullName: string;
    studentCode: string;
    majorCode: string;
    registeredAt: string;
}

interface AttendanceRecord {
    date: string;
    isPresent: boolean;
}

interface StudentAttendance {
    studentId: string;
    studentCode: string;
    fullName: string;
    majorCode: string;
    attendances: AttendanceRecord[];
}

interface StudentGrade {
    studentId: string;
    studentCode: string;
    studentName: string;
    process?: number;
    midterm?: number;
    final?: number;
    total?: number;
    gpa?: number;
    letterGrade?: string;
}

interface PagedStudentResult {
    items: Student[];
    totalCount: number;
    totalPages: number;
    pageIndex: number;
    pageSize: number;
}

interface OfferingDetails {
    offeringCode: string;
    courseCode: string;
    courseName: string;
    semesterName: string;
    schoolYear: string;
    students?: PagedStudentResult | Student[]; // Handle both for safety/transition
}

// Disable prerendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

export default function OfferingDetailsPage() {
    const { user } = useAuth({ requireAuth: true });
    const params = useParams();
    const searchParams = useSearchParams();
    const offeringCode = params.offeringCode as string;
    const initialTab = (searchParams.get("activeTab") as "students" | "attendance" | "grades") || "students";

    const [activeTab, setActiveTab] = useState<"students" | "attendance" | "grades">(initialTab);
    const [offering, setOffering] = useState<OfferingDetails | null>(null);
    const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
    const [gradesData, setGradesData] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEditingGrades, setIsEditingGrades] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    useEffect(() => {
        if (user && offeringCode) {
            fetchData(currentPage);
        }
    }, [user, offeringCode, activeTab, currentPage]);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            if (activeTab === "students") {
                const data = await http.get<any>(`/teacher/course/offering/${offeringCode}/students?page=${page}&limit=${LIMIT}`);
                // API now returns { offeringCode, ..., students: { items: [], ... } }

                // Handle structure adjustment if needed based on API response casing
                const studentsData = data.students || data.Students;

                if (studentsData && studentsData.items) {
                    setOffering({ ...data, students: studentsData });
                    setTotalPages(studentsData.totalPages);
                } else if (Array.isArray(studentsData)) {
                    // Fallback for non-paginated response
                    setOffering({ ...data, students: { items: studentsData, totalCount: studentsData.length, totalPages: 1, pageIndex: 1, pageSize: LIMIT } });
                    setTotalPages(1);
                } else {
                    setOffering(data); // Unexpected structure
                }

            } else if (activeTab === "attendance") {
                const data = await http.get<any>(`/teacher/course/offering/${offeringCode}/attendance`);
                setOffering({
                    offeringCode: data.offeringCode,
                    courseCode: data.courseCode,
                    courseName: data.courseName,
                    semesterName: data.semesterName,
                    schoolYear: data.schoolYear
                });
                setAttendanceData(data.students);
            } else if (activeTab === "grades") {
                const [gradesResponse, offeringData] = await Promise.all([
                    http.get<any[]>(`/teacher/course/offering/grades/classification?offeringCode=${offeringCode}`),
                    http.get<any>(`/teacher/course/offering/${offeringCode}/students?page=1&limit=1`) // Fetch minimal student data for offering info
                ]);

                // Map data directly from API response
                const gradesWithClassification = gradesResponse.map(g => ({
                    studentId: g.studentId,
                    studentCode: g.studentCode,
                    studentName: g.studentName,
                    process: g.process,
                    midterm: g.midterm,
                    final: g.final,
                    total: g.total,
                    gpa: g.gpa,
                    letterGrade: g.letterGrade
                }));

                setGradesData(gradesWithClassification);
                if (!offering) {
                    // Ensure compatible structure
                    setOffering({
                        offeringCode: offeringData.offeringCode,
                        courseCode: offeringData.courseCode,
                        courseName: offeringData.courseName,
                        semesterName: offeringData.semesterName,
                        schoolYear: offeringData.schoolYear
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleTakeAttendance = async () => {
        setSaving(true);
        try {
            // Construct the payload matching StudentAttendanceDto structure
            const studentsPayload = attendanceData.map(student => {
                // Find if there is an attendance record for the selected date
                const record = student.attendances.find(a => a.date.startsWith(attendanceDate));
                return {
                    StudentId: student.studentId,
                    StudentCode: student.studentCode,
                    FullName: student.fullName,
                    IsPresent: record ? record.isPresent : false
                };
            });

            await http.post("/teacher/course/offering/attendance", {
                OfferingCode: offeringCode,
                Date: attendanceDate,
                Students: studentsPayload
            });
            alert("Điểm danh thành công!");
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error taking attendance:", error);
            alert("Lỗi khi điểm danh.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateGrades = async () => {
        setSaving(true);
        try {
            // Let's refetch with GetStudentGrades for the payload mapping if we are saving
            const gradesForEdit = await http.get<any[]>(`/teacher/course/offering/${offeringCode}/grades`);
            console.log("Grades for edit (raw):", gradesForEdit);

            const payload = gradesData.map(g => {
                // Handle both camelCase and PascalCase from backend response
                const registration = gradesForEdit.find(r => (r.studentId || r.StudentId) === g.studentId);

                if (!registration) {
                    console.warn(`Could not find registration for student ${g.studentId}`);
                }

                return {
                    RegistrationId: registration?.id || registration?.Id,
                    StudentCode: g.studentCode,
                    MidTerm: g.midterm,
                    FinalTerm: g.final
                };
            }).filter(p => p.RegistrationId); // Filter out any missing IDs

            console.log("Payload sending to backend:", payload);

            await http.post(`/teacher/course/offering/grades?offeringCode=${offeringCode}`, payload);
            alert("Cập nhật điểm thành công!");
            setIsEditingGrades(false); // Exit edit mode
            fetchData();
        } catch (error: any) {
            console.error("Error updating grades:", error);
            if (error.data) {
                console.error("Error data:", error.data);
            }
            alert(`Lỗi khi cập nhật điểm: ${error.message || "Chi tiết trong console"}`);
        } finally {
            setSaving(false);
        }
    };

    // Helper to update local attendance state
    const toggleAttendance = (studentId: string) => {
        setAttendanceData(prev => prev.map(student => {
            if (student.studentId === studentId) {
                const existingRecordIndex = student.attendances.findIndex(a => a.date.startsWith(attendanceDate));
                let newAttendances = [...student.attendances];

                if (existingRecordIndex >= 0) {
                    newAttendances[existingRecordIndex] = {
                        ...newAttendances[existingRecordIndex],
                        isPresent: !newAttendances[existingRecordIndex].isPresent
                    };
                } else {
                    newAttendances.push({ date: attendanceDate, isPresent: true });
                }
                return { ...student, attendances: newAttendances };
            }
            return student;
        }));
    };

    // Helper to update local grade state
    const updateGrade = (studentId: string, field: 'midterm' | 'final', value: number) => {
        setGradesData(prev => prev.map(s => {
            if (s.studentId === studentId) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };


    if (loading && !offering) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard/teacher/courses"
                    className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách lớp
                </Link>

                {offering && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {offering.courseName}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                                {offering.offeringCode}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                {offering.semesterName} - {offering.schoolYear}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("students")}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${activeTab === "students"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        <Users className="h-5 w-5" />
                        Sinh viên
                    </button>
                    <button
                        onClick={() => setActiveTab("attendance")}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${activeTab === "attendance"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        <CheckSquare className="h-5 w-5" />
                        Điểm danh
                    </button>
                    <button
                        onClick={() => setActiveTab("grades")}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${activeTab === "grades"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    >
                        <GraduationCap className="h-5 w-5" />
                        Điểm số
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "students" && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">STT</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mã SV</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Họ và tên</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ngành</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Helper function or check for array items vs flat array */}
                                        {(offering?.students && 'items' in offering.students ? offering.students.items : (Array.isArray(offering?.students) ? offering?.students : []))?.map((student, index) => (
                                            <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{(currentPage - 1) * LIMIT + index + 1}</td>
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{student.studentCode}</td>
                                                <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{student.fullName}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.majorCode}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="py-4 border-t dark:border-gray-700">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === "attendance" && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Ngày điểm danh:</label>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleTakeAttendance}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "Đang lưu..." : "Lưu điểm danh"}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">STT</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mã SV</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Họ và tên</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">Trạng thái</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Lịch sử vắng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.map((student, index) => {
                                            const currentRecord = student.attendances.find(a => a.date.startsWith(attendanceDate));
                                            const isPresent = currentRecord ? currentRecord.isPresent : false;

                                            return (
                                                <tr key={student.studentId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{index + 1}</td>
                                                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{student.studentCode}</td>
                                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{student.fullName}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isPresent}
                                                            onChange={() => toggleAttendance(student.studentId)}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">
                                                        {student.attendances.filter(a => !a.isPresent).length} buổi vắng
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "grades" && (
                        <div>
                            <div className="flex items-center justify-end mb-6 gap-2">
                                {!isEditingGrades ? (
                                    <button
                                        onClick={() => setIsEditingGrades(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Chỉnh sửa điểm
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditingGrades(false);
                                                fetchData();
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleUpdateGrades}
                                            disabled={saving}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {saving ? "Đang lưu..." : "Lưu bảng điểm"}
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">STT</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mã SV</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Họ và tên</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">CC (20%)</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">GK (30%)</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">CK (50%)</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">Tổng kết</th>
                                            <th className="py-3 px-4 font-semibold text-center text-gray-700 dark:text-gray-300">Điểm chữ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gradesData.map((student, index) => (
                                            <tr key={student.studentId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{index + 1}</td>
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{student.studentCode}</td>
                                                <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{student.studentName}</td>
                                                <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{student.process?.toFixed(1) || '-'}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {isEditingGrades ? (
                                                        <input
                                                            type="number"
                                                            min="0" max="10" step="0.1"
                                                            value={student.midterm || 0}
                                                            onChange={(e) => updateGrade(student.studentId, 'midterm', parseFloat(e.target.value))}
                                                            className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 dark:text-white">{student.midterm?.toFixed(1) || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isEditingGrades ? (
                                                        <input
                                                            type="number"
                                                            min="0" max="10" step="0.1"
                                                            value={student.final || 0}
                                                            onChange={(e) => updateGrade(student.studentId, 'final', parseFloat(e.target.value))}
                                                            className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 dark:text-white">{student.final?.toFixed(1) || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                                                    {student.total?.toFixed(1) || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold">
                                                    <span className={`px-2 py-1 rounded ${student.letterGrade === 'F' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                        {student.letterGrade || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
