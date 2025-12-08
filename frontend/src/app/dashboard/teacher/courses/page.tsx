"use client";

import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/http-client";
import { useEffect, useState } from "react";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";
import TeacherDashboardLayout from "@/components/layouts/TeacherDashboardLayout";

interface CourseOffering {
    offeringCode: string;
    courseCode: string;
    courseName: string;
    semesterName: string;
    schoolYear: string;
    studentCount: number;
}

export default function TeacherCoursesPage() {
    const { user } = useAuth({ requireAuth: true });
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role === "Teacher") {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const offeringsData = await http.get<CourseOffering[]>("/teacher/course/my-offerings");
            setOfferings(offeringsData);
        } catch (error) {
            console.error("Error fetching teacher courses:", error);
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

    return (
        <TeacherDashboardLayout>
            <div className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Lớp học phần của tôi
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offerings.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                            Bạn chưa được phân công lớp học phần nào
                        </div>
                    ) : (
                        offerings.map((offering) => (
                            <Link key={offering.offeringCode} href={`/dashboard/teacher/offerings/${offering.offeringCode}`}>
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {offering.courseName}
                                        </h3>
                                        <Users className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Mã lớp:</span> {offering.offeringCode}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Học kỳ:</span> {offering.semesterName} - {offering.schoolYear}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Số sinh viên:</span> {offering.studentCount}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
