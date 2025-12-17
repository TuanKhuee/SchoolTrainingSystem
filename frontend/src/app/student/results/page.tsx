"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentService } from "@/services/student.service";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Grade {
    courseName: string;
    courseCode: string;
    credits: number;
    semester: string;
    schoolYear: string;
    processScore: number | null;
    midtermScore: number | null;
    finalScore: number | null;
    totalScore: number | null;
}

export default function StudentResultsPage() {
    const [loading, setLoading] = useState(false);
    const [grades, setGrades] = useState<Grade[]>([]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const data = await studentService.getGrades();
            setGrades(data);
        } catch (error) {
            toast.error("Lỗi", {
                description: "Không thể tải kết quả học tập.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const getStatusColor = (score: number | null) => {
        if (score === null) return "bg-gray-500";
        if (score >= 4.0) return "bg-green-500";
        return "bg-red-500";
    };

    const getStatusText = (score: number | null) => {
        if (score === null) return "Chưa có điểm";
        if (score >= 4.0) return "Đạt";
        return "Không đạt";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Kết quả học tập</h1>
                        <p className="text-muted-foreground">
                            Xem điểm chi tiết các học phần đã đăng ký
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchGrades}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bảng điểm cá nhân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã HP</TableHead>
                                        <TableHead>Tên học phần</TableHead>
                                        <TableHead>TC</TableHead>
                                        <TableHead>Học kỳ</TableHead>
                                        <TableHead className="text-right">CC</TableHead>
                                        <TableHead className="text-right">GK</TableHead>
                                        <TableHead className="text-right">CK</TableHead>
                                        <TableHead className="text-right font-bold">Tổng kết</TableHead>
                                        <TableHead className="text-center">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && grades.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : grades.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                Chưa có dữ liệu kết quả học tập.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        grades.map((grade, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{grade.courseCode}</TableCell>
                                                <TableCell>{grade.courseName}</TableCell>
                                                <TableCell>{grade.credits}</TableCell>
                                                <TableCell>
                                                    {grade.semester} ({grade.schoolYear})
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {grade.processScore?.toFixed(1) ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {grade.midtermScore?.toFixed(1) ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {grade.finalScore?.toFixed(1) ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {grade.totalScore?.toFixed(1) ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`${getStatusColor(grade.totalScore)} hover:${getStatusColor(grade.totalScore)}`}>
                                                        {getStatusText(grade.totalScore)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
