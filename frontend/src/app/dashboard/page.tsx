"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/lib/admin.utils";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FileSpreadsheet, Users, Calendar, ListTodo, BookOpen, Clock, Key } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  // Use auth hook to ensure only authenticated users can access this page
  const { user } = useAuth({ requireAuth: true });
  // Check for admin role
  const { isAdmin } = useAdminAuth();
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('User data:', user);
    if (user && user.role === "Student") {
      console.log('Fetching timetable for student...');
      fetchTimetable();
    }
  }, [user]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      console.log('Calling timetable API...');
      const data = await http.get<DaySchedule[]>("/student/course/timetable");
      console.log('Timetable data received:', data);
      setTimetable(data);
    } catch (error: any) {
      console.error("Error fetching timetable:", error);
      console.error("Error details:", error.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: "Thêm sinh viên",
      description: "Tải lên File Excel để nhập thông tin sinh viên",
      icon: <FileSpreadsheet className="h-8 w-8 text-blue-500" />,
      href: "/dashboard/admin/import-users",
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Quản lý hoạt động",
      description: "Xem và quản lý các hoạt động",
      icon: <ListTodo className="h-8 w-8 text-indigo-500" />,
      href: "/dashboard/admin/activities",
      color: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Thêm Hoạt động",
      description: "Tạo hoạt động mới để sinh viên tham gia",
      icon: <Calendar className="h-8 w-8 text-green-500" />,
      href: "/dashboard/admin/activities/add",
      color: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Thêm giáo viên",
      description: "Tạo tài khoản mới cho giáo viên",
      icon: <Users className="h-8 w-8 text-yellow-500" />,
      href: "/dashboard/admin/teachers/add",
      color: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Thêm nhân viên căn tin",
      description: "Tạo tài khoản mới cho nhân viên căn tin",
      icon: <Users className="h-8 w-8 text-red-500" />,
      href: "/dashboard/admin/staff/add",
      color: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Quản lý thông tin phụ huynh",
      description: "Tra cứu và cập nhật thông tin phụ huynh",
      icon: <Users className="h-8 w-8 text-orange-500" />,
      href: "/dashboard/admin/parents",
      color: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  const adminCardsCourse = [
    {
      title: "Quản lý kỳ học",
      description: "Xem và tạo kỳ học cho sinh viên",
      icon: <Calendar className="h-8 w-8 text-purple-500" />,
      href: "/dashboard/admin/semesters",
      color: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Quản lý môn học",
      description: "Xem và quản lý các môn học",
      icon: <BookOpen className="h-8 w-8 text-cyan-500" />,
      href: "/dashboard/admin/courses",
      color: "bg-cyan-50 dark:bg-cyan-900/20",
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto py-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Dashboard
        </h1>

        {/* Student Timetable Section */}
        {user && user.role === "Student" && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Thời khóa biểu
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
              </div>
            ) : timetable.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Bạn chưa có thời khóa biểu. Hãy đăng ký học phần để xem lịch học.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {timetable.map((daySchedule) => (
                  <div
                    key={daySchedule.day}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      {daySchedule.day}
                    </h3>
                    <div className="space-y-3">
                      {daySchedule.lessons.map((lesson, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {lesson.courseName}
                            </h4>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                              {lesson.courseCode}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Tiết {lesson.startPeriod} - {lesson.endPeriod}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">📍</span>
                              <span>Phòng: {lesson.room}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">👨‍🏫</span>
                              <span>{lesson.teacherName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {isAdmin && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Quản lý người dùng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {adminCards.map((card) => (
                <Link key={card.title} href={card.href}>
                  <div
                    className={`${card.color} p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {card.title}
                      </h2>
                      {card.icon}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {card.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Quản lý chương trình học của sinh viên
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminCardsCourse.map((card) => (
            <Link key={card.title} href={card.href}>
              <div
                className={`${card.color} p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </h2>
                  {card.icon}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
