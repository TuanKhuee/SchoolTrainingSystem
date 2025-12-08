"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    courseRegistrationService,
    CourseOffering,
    CourseRegistration,
} from "@/services/course-registration.service";
import { Loader2, Search, RefreshCw, Trash2, PlusCircle } from "lucide-react";

export default function CourseRegistrationPage() {

    const [loading, setLoading] = useState(false);
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [myRegistrations, setMyRegistrations] = useState<CourseRegistration[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOfferings = async () => {
        setLoading(true);
        try {
            const data = await courseRegistrationService.getAvailableOfferings();
            setOfferings(data);
        } catch (error) {
            toast.error("Lỗi", {
                description: "Không thể tải danh sách học phần.",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRegistrations = async () => {
        setLoading(true);
        try {
            const data = await courseRegistrationService.getMyRegistrations();
            setMyRegistrations(data);
        } catch (error) {
            toast.error("Lỗi", {
                description: "Không thể tải danh sách đã đăng ký.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfferings();
        fetchMyRegistrations();
    }, []);

    const handleRegister = async (offering: CourseOffering) => {
        try {
            await courseRegistrationService.registerCourse({
                offeringCode: offering.offeringCode,
            });
            toast.success("Thành công", {
                description: `Đã đăng ký học phần ${offering.courseName}`,
            });
            // Refresh data
            fetchOfferings();
            fetchMyRegistrations();
        } catch (error: any) {
            toast.error("Đăng ký thất bại", {
                description: error.message || "Có lỗi xảy ra khi đăng ký.",
            });
        }
    };

    const handleCancel = async (offeringId: string) => {
        if (!confirm("Bạn có chắc chắn muốn hủy đăng ký học phần này?")) return;

        try {
            await courseRegistrationService.cancelRegistration(offeringId);
            toast.success("Thành công", {
                description: "Đã hủy đăng ký học phần.",
            });
            // Refresh data
            fetchOfferings();
            fetchMyRegistrations();
        } catch (error: any) {
            toast.error("Hủy thất bại", {
                description: error.message || "Có lỗi xảy ra khi hủy đăng ký.",
            });
        }
    };

    const filteredOfferings = offerings.filter(
        (o) =>
            o.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.offeringCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Đăng ký học phần</h1>
                    <p className="text-muted-foreground">
                        Quản lý đăng ký học phần cho học kỳ hiện tại
                    </p>
                </div>

                <Tabs defaultValue="register" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="register">Đăng ký mới</TabsTrigger>
                        <TabsTrigger value="my-courses">Đã đăng ký</TabsTrigger>
                    </TabsList>

                    <TabsContent value="register" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Danh sách lớp học phần mở</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchOfferings}
                                        disabled={loading}
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                        Làm mới
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên, mã học phần..."
                                        className="flex-1 bg-transparent outline-none text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mã LHP</TableHead>
                                                <TableHead>Môn học</TableHead>
                                                <TableHead>TC</TableHead>
                                                <TableHead>GV</TableHead>
                                                <TableHead>Lịch học</TableHead>
                                                <TableHead>Sĩ số</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading && offerings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredOfferings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        Không tìm thấy lớp học phần nào.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredOfferings.map((offering) => {
                                                    const isRegistered = myRegistrations.some(
                                                        (r) => r.courseCode === offering.courseCode
                                                    );

                                                    return (
                                                        <TableRow key={offering.id}>
                                                            <TableCell className="font-medium">
                                                                {offering.offeringCode}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>{offering.courseName}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {offering.courseCode}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{offering.credits}</TableCell>
                                                            <TableCell>{offering.teacherName}</TableCell>
                                                            <TableCell>
                                                                {offering.dayOfWeek}, Tiết {offering.startPeriod}-{offering.endPeriod}
                                                                <div className="text-xs text-muted-foreground">
                                                                    Phòng {offering.room}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {offering.registered}/{offering.capacity}
                                                            </TableCell>
                                                            <TableCell>
                                                                {isRegistered ? (
                                                                    <Badge variant="secondary">Đã đăng ký</Badge>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleRegister(offering)}
                                                                        disabled={offering.registered >= offering.capacity}
                                                                    >
                                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                                        Đăng ký
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="my-courses" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Lớp học phần đã đăng ký</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchMyRegistrations}
                                        disabled={loading}
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                        Làm mới
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mã LHP</TableHead>
                                                <TableHead>Môn học</TableHead>
                                                <TableHead>TC</TableHead>
                                                <TableHead>GV</TableHead>
                                                <TableHead>Lịch học</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading && myRegistrations.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : myRegistrations.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        Bạn chưa đăng ký lớp học phần nào.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                myRegistrations.map((reg) => (
                                                    <TableRow key={reg.registrationId}>
                                                        <TableCell className="font-medium">
                                                            {reg.courseCode}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>{reg.courseName}</div>
                                                        </TableCell>
                                                        <TableCell>{reg.credits}</TableCell>
                                                        <TableCell>{reg.teacherName}</TableCell>
                                                        <TableCell>
                                                            {reg.dayOfWeek}, Tiết {reg.startPeriod}-{reg.endPeriod}
                                                            <div className="text-xs text-muted-foreground">
                                                                Phòng {reg.room}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleCancel(reg.courseOfferingId)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hủy
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
