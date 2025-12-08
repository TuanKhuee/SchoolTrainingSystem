"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, GraduationCap, RefreshCw, Clock, Calendar, Key } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { http } from "@/lib/http-client";

interface Lesson {
  courseCode: string;
  courseName: string;
  room: string;
  startPeriod: number;
  endPeriod: number;
  teacherName: string;
}

interface DaySchedule {
  day: string;
  lessons: Lesson[];
}

interface Semester {
  id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function StudentDashboard() {
  const { user, isAuthenticated, wallet } = useAuth({
    requireAuth: true,
    redirectTo: "/login",
  });

  const refreshWalletBalance = useAuthStore(
    (state) => state.refreshWalletBalance
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshWalletBalance();
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await http.get<{ data: Semester[]; pagination: any }>("/semester/all?pageSize=100");
      setSemesters(response.data);

      // Auto-select active semester or first semester
      const activeSemester = response.data.find((s: Semester) => s.isActive);
      if (activeSemester) {
        setSelectedSemesterId(activeSemester.id);
      } else if (response.data.length > 0) {
        setSelectedSemesterId(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchTimetable = async (semesterId?: string) => {
    setLoadingTimetable(true);
    try {
      const endpoint = semesterId
        ? `/student/course/timetable?semesterId=${semesterId}`
        : "/student/course/timetable";
      const data = await http.get<DaySchedule[] | { message: string }>(endpoint);
      console.log('Timetable data:', data);

      // Check if response is an array or object with message
      if (Array.isArray(data)) {
        setTimetable(data);
      } else {
        // Empty response with message
        setTimetable([]);
      }
    } catch (error: any) {
      console.error("Error fetching timetable:", error);
      setTimetable([]);
    } finally {
      setLoadingTimetable(false);
    }
  };

  useEffect(() => {
    handleRefreshBalance();
    fetchSemesters();

    const intervalId = setInterval(handleRefreshBalance, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleRefreshBalance();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      fetchTimetable(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  if (!user || !isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <h2 className="text-xl">Welcome, {user.fullName}</h2>

        {/* Timetable Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-bold">Thời khóa biểu</h2>
            </div>

            {/* Semester Dropdown */}
            {semesters.length > 0 && (
              <div className="flex items-center gap-2">
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

          {loadingTimetable ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : timetable.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Bạn chưa có thời khóa biểu. Hãy đăng ký học phần để xem lịch học.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold text-center min-w-[80px]">
                      Tiết
                    </th>
                    {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((day) => (
                      <th key={day} className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold text-center min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((period) => (
                    <tr key={period}>
                      <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium bg-gray-50 dark:bg-gray-700/50">
                        Tiết {period}
                      </td>
                      {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((day) => {
                        const daySchedule = timetable.find((d) => d.day === day);
                        const lesson = daySchedule?.lessons.find(
                          (l) => period >= l.startPeriod && period <= l.endPeriod
                        );

                        // Only render the cell content at the start period to avoid duplicates
                        const shouldRender = lesson && period === lesson.startPeriod;
                        const rowSpan = lesson ? lesson.endPeriod - lesson.startPeriod + 1 : 1;

                        // Skip cells that are part of a rowspan
                        const isPartOfSpan = daySchedule?.lessons.some(
                          (l) => period > l.startPeriod && period <= l.endPeriod
                        );

                        if (isPartOfSpan) {
                          return null;
                        }

                        return (
                          <td
                            key={day}
                            rowSpan={shouldRender ? rowSpan : 1}
                            className={`border border-gray-300 dark:border-gray-600 p-2 text-xs ${shouldRender
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                              : "bg-white dark:bg-gray-800"
                              }`}
                          >
                            {shouldRender && lesson && (
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-sm leading-tight">
                                  {lesson.courseName}
                                </div>
                                <div className="text-xs opacity-90">
                                  {lesson.courseCode}
                                </div>
                                <div className="text-xs opacity-90 mt-1">
                                  📍 {lesson.room}
                                </div>
                                <div className="text-xs opacity-90">
                                  👨‍🏫 {lesson.teacherName}
                                </div>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
