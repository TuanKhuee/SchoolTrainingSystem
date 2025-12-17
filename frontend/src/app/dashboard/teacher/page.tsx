"use client";

import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/http-client";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import Link from "next/link";
import TeacherDashboardLayout from "@/components/layouts/TeacherDashboardLayout";

interface TimetableSlot {
    dayOfWeek: string;
    startPeriod: number;
    endPeriod: number;
    roomCode: string;
    offeringCode: string;
    courseName: string;
    semesterId: string;
}

interface Semester {
    id: string;
    name: string;
    schoolYear: string;
    isActive: boolean;
}

export default function TeacherDashboardPage() {
    const { user } = useAuth({ requireAuth: true });
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [allTimetable, setAllTimetable] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");

    useEffect(() => {
        if (user && user.role === "Teacher") {
            fetchData();
            fetchSemesters();
        }
    }, [user]);

    useEffect(() => {
        if (selectedSemesterId) {
            const filtered = allTimetable.filter(t => t.semesterId === selectedSemesterId);
            setTimetable(filtered);
        } else {
            setTimetable(allTimetable);
        }
    }, [selectedSemesterId, allTimetable]);

    const fetchSemesters = async () => {
        try {
            const response = await http.get<{ data: Semester[] }>("/semester/all?pageSize=100");
            setSemesters(response.data);

            const activeSemester = response.data.find((s) => s.isActive);
            if (activeSemester) {
                setSelectedSemesterId(activeSemester.id);
            } else if (response.data.length > 0) {
                setSelectedSemesterId(response.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching semesters:", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use the same API as "My Courses" page
            const offerings = await http.get<Array<{
                id: string;
                offeringCode: string;
                courseCode: string;
                courseName: string;
                credits: number;
                semesterName: string;
                schoolYear: string;
                dayOfWeek: string;
                startPeriod: number;
                endPeriod: number;
                room: string;
                studentCount: number;
                semesterId: string;
            }>>("/teacher/course/my-offerings");

            // Transform to timetable format
            const timetableData: TimetableSlot[] = offerings.map(offering => ({
                dayOfWeek: offering.dayOfWeek,
                startPeriod: offering.startPeriod,
                endPeriod: offering.endPeriod,
                roomCode: offering.room,
                offeringCode: offering.offeringCode,
                courseName: offering.courseName,
                semesterId: offering.semesterId
            }));

            setAllTimetable(timetableData);
            // If semester is already selected, filter immediately
            if (selectedSemesterId) {
                setTimetable(timetableData.filter(t => t.semesterId === selectedSemesterId));
            } else {
                setTimetable(timetableData);
            }
        } catch (error) {
            console.error("Error fetching teacher data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const daysOfWeek = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <TeacherDashboardLayout>
            <div className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Bảng điều khiển Giảng viên
                </h1>

                {/* Timetable Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-6 w-6 text-blue-500" />
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Thời khóa biểu tuần
                        </h2>
                    </div>

                    {/* Semester Dropdown */}
                    {semesters.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <label htmlFor="semester-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Học kỳ:
                            </label>
                            <select
                                id="semester-select"
                                value={selectedSemesterId}
                                onChange={(e) => setSelectedSemesterId(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {semesters.map((semester) => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name} - {semester.schoolYear}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold text-center min-w-[80px]">
                                        Tiết
                                    </th>
                                    {daysOfWeek.map((day) => (
                                        <th key={day} className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold text-center min-w-[140px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((period) => (
                                    <tr key={period}>
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium bg-gray-50 dark:bg-gray-700/50">
                                            Tiết {period}
                                        </td>
                                        {daysOfWeek.map((day) => {
                                            const slot = timetable.find(
                                                (t) => t.dayOfWeek === day && period >= t.startPeriod && period <= t.endPeriod
                                            );

                                            // Only render the cell content at the start period to avoid duplicates
                                            const shouldRender = slot && period === slot.startPeriod;
                                            const rowSpan = slot ? slot.endPeriod - slot.startPeriod + 1 : 1;

                                            // Skip cells that are part of a rowspan
                                            const isPartOfSpan = timetable.some(
                                                (t) => t.dayOfWeek === day && period > t.startPeriod && period <= t.endPeriod
                                            );

                                            if (isPartOfSpan) {
                                                return null;
                                            }

                                            return (
                                                <td
                                                    key={`${day}-${period}`}
                                                    rowSpan={shouldRender ? rowSpan : 1}
                                                    className={`border border-gray-300 dark:border-gray-600 p-2 text-xs ${shouldRender
                                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                                        : "bg-white dark:bg-gray-800"
                                                        }`}
                                                >
                                                    {shouldRender && slot && (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-semibold text-sm leading-tight">
                                                                {slot.courseName}
                                                            </div>
                                                            <div className="text-xs opacity-90">
                                                                {slot.offeringCode}
                                                            </div>
                                                            <div className="text-xs opacity-90 mt-1">
                                                                📍 {slot.roomCode}
                                                            </div>
                                                            <Link
                                                                href={`/dashboard/teacher/offerings/${slot.offeringCode}`}
                                                                className="text-xs underline mt-1 text-white hover:text-blue-100"
                                                            >
                                                                Xem lớp
                                                            </Link>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
