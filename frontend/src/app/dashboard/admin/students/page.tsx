"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { Student, UpdateStudentDto } from "@/types/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, Users, Coins, Pencil, Trash, X, Key } from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/lib/admin.utils";
import { toast } from "sonner";

// Disable prerendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

export default function StudentsPage() {
  // Use auth hook to ensure only authenticated users can access this page
  useAuth({ requireAuth: true });
  // Check for admin role
  useAdminAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("all");

  async function fetchStudents(className?: string) {
    try {
      setIsLoading(true);
      setError(null);

      const filterClass = className || selectedClass;
      const studentsData = await adminService.getAllStudents(filterClass);
      setStudents(studentsData);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchClasses() {
    try {
      const classesData = await adminService.getAllClasses();
      setClasses(classesData);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  }

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    fetchStudents(newClass);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
  };

  const handleDelete = async (studentCode: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sinh viên này không?")) return;

    try {
      await adminService.deleteStudent(studentCode);
      setStudents(students.filter((s) => s.studentCode !== studentCode));
      toast.success("Xóa sinh viên thành công");
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "Lỗi khi xóa sinh viên");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const updateData: UpdateStudentDto = {
      fullName: formData.get("fullName") as string,
      class: formData.get("class") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      newEmail: formData.get("email") as string,
    };

    try {
      await adminService.updateStudent(editingStudent.studentCode, updateData);

      // Update local list
      setStudents(students.map(s =>
        s.studentCode === editingStudent.studentCode
          ? {
            ...s,
            fullName: updateData.fullName || s.fullName,
            class: updateData.class || s.class,
            dateOfBirth: updateData.dateOfBirth || s.dateOfBirth,
            email: updateData.newEmail || s.email
          }
          : s
      ));

      setEditingStudent(null);
      toast.success("Cập nhật thành công");
    } catch (error: any) {
      console.error("Error updating student:", error);
      toast.error(error.message || "Lỗi khi cập nhật thông tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPassword) return;

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.resetStudentPassword(resettingPassword.studentCode, newPassword);
      setResettingPassword(null);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading students...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle size={32} />
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchStudents()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">All Students</h1>
          </div>

          {students.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No students found.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>
                    {students.length} student(s) in total
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-sm">
                  <span className="text-sm font-medium whitespace-nowrap px-2">Lọc theo lớp:</span>
                  <select
                    className="h-9 w-[250px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedClass}
                    onChange={handleClassChange}
                  >
                    <option value="all">Tất cả sinh viên</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Code</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.studentCode}>
                        <TableCell className="font-medium">
                          {student.studentCode}
                        </TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>
                          {student.class ? (
                            <Badge variant="outline">{student.class}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          {format(new Date(student.dateOfBirth), "PPP")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              {student.walletBalance} coins
                            </Badge>
                            {student.walletAddress && (
                              <span className="text-xs text-muted-foreground">
                                {student.walletAddress.slice(0, 6)}...{student.walletAddress.slice(-4)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(student)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(student.studentCode)}
                              title="Delete"
                            >
                              <Trash className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setResettingPassword(student)}
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4 text-orange-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Cập nhật thông tin sinh viên
              </h2>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={editingStudent.fullName}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lớp
                </label>
                <input
                  type="text"
                  name="class"
                  defaultValue={editingStudent.class}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingStudent.email}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  defaultValue={editingStudent.dateOfBirth ? format(new Date(editingStudent.dateOfBirth), "yyyy-MM-dd") : ""}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Đổi mật khẩu - {resettingPassword.fullName}
              </h2>
              <button
                onClick={() => {
                  setResettingPassword(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResettingPassword(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
