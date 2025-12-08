"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, GraduationCap, RefreshCw, Users, Home, Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { parentInfoService, ParentInfo } from "@/services/parent-info.service";
import { temporaryResidenceService, TemporaryResidence, CreateTemporaryResidenceDto } from "@/services/temporary-residence.service";
import { httpClient } from "@/lib/http-client";
import DashboardLayout from "@/components/layouts/DashboardLayout";

interface Semester {
  id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Disable prerendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { user, isAuthenticated, wallet } = useAuth({
    requireAuth: true,
    redirectTo: "/login",
  });

  const refreshWalletBalance = useAuthStore(
    (state) => state.refreshWalletBalance
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [residences, setResidences] = useState<TemporaryResidence[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [loadingResidences, setLoadingResidences] = useState(false);
  const [showResidenceForm, setShowResidenceForm] = useState(false);
  const [editingResidence, setEditingResidence] = useState<TemporaryResidence | null>(null);
  const [formData, setFormData] = useState<CreateTemporaryResidenceDto>({
    address: "",
    city: "",
    district: "",
    ward: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    note: "",
    semesterId: "",
  });

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

  const fetchParentInfo = async () => {
    if (!user?.studentCode) return;

    setLoadingParents(true);
    try {
      const data = await parentInfoService.getParentInfo(user.studentCode);
      setParents(data);
    } catch (error) {
      console.error("Failed to fetch parent info:", error);
    } finally {
      setLoadingParents(false);
    }
  };

  const fetchResidences = async () => {
    if (!user?.studentCode) return;

    setLoadingResidences(true);
    try {
      const data = await temporaryResidenceService.getByStudent(user.studentCode);
      setResidences(data);
    } catch (error) {
      console.error("Failed to fetch residences:", error);
    } finally {
      setLoadingResidences(false);
    }
  };


  const fetchSemesters = async () => {
    try {
      console.log("Fetching semesters...");
      const result = await httpClient<{ data: Semester[] }>("/Semester/all?page=1&pageSize=100");
      console.log("Semesters response:", result);
      console.log("Semesters data:", result.data);
      setSemesters(result.data || []);
      if (!result.data || result.data.length === 0) {
        console.warn("No semesters found in database");
      }
    } catch (error: any) {
      console.error("Failed to fetch semesters:", error);
      console.error("Error details:", error.message, error.status);
      // Set empty array if fetch fails
      setSemesters([]);
    }
  };

  const handleSubmitResidence = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingResidence) {
        await temporaryResidenceService.update(editingResidence.id, formData);
      } else {
        await temporaryResidenceService.create(formData);
      }

      setShowResidenceForm(false);
      setEditingResidence(null);
      setFormData({
        address: "",
        city: "",
        district: "",
        ward: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        note: "",
        semesterId: "",
      });
      fetchResidences();
    } catch (error) {
      console.error("Failed to save residence:", error);
      alert("Có lỗi xảy ra khi lưu thông tin tạm trú");
    }
  };

  const handleEditResidence = (residence: TemporaryResidence) => {
    setEditingResidence(residence);
    setFormData({
      address: residence.address,
      city: residence.city,
      district: residence.district,
      ward: residence.ward || "",
      startDate: residence.startDate.split('T')[0],
      endDate: residence.endDate ? residence.endDate.split('T')[0] : "",
      note: residence.note || "",
      semesterId: residence.semesterId,
    });
    setShowResidenceForm(true);
  };

  const handleDeleteResidence = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khai báo tạm trú này?")) return;

    try {
      await temporaryResidenceService.delete(id);
      fetchResidences();
    } catch (error) {
      console.error("Failed to delete residence:", error);
      alert("Có lỗi xảy ra khi xóa thông tin tạm trú");
    }
  };

  const handleCancelForm = () => {
    setShowResidenceForm(false);
    setEditingResidence(null);
    setFormData({
      address: "",
      city: "",
      district: "",
      ward: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      note: "",
      semesterId: "",
    });
  };

  useEffect(() => {
    handleRefreshBalance();

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
    if (user?.studentCode) {
      fetchParentInfo();
      fetchResidences();
      fetchSemesters();
    }
  }, [user?.studentCode]);

  if (!user || !isAuthenticated) {
    return null;
  }

  const father = parents.find(p => p.relationship === "Cha" || p.relationship === "Father");
  const mother = parents.find(p => p.relationship === "Mẹ" || p.relationship === "Mother");

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>

        <div className="space-y-6">
          {/* Wallet and Profile Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wallet Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Số dư ví
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {wallet?.balance || 0} VKU
                </div>
                <p className="text-xs text-muted-foreground">
                  Số dư hiện tại
                </p>
                <a
                  href="/wallet"
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  Xem chi tiết ví
                </a>
              </CardContent>
            </Card>

            {/* Profile Card */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thông tin sinh viên</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="bg-blue-600 p-4 text-white rounded-lg mb-4">
                  <h2 className="text-xl font-bold">{user.fullName}</h2>
                  <p className="text-blue-100 text-sm">Mã sinh viên: {user.studentCode || "N/A"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border-b pb-2">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-medium">{user.email || "N/A"}</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="text-xs text-muted-foreground">Tên đăng nhập</div>
                    <div className="text-sm font-medium">{user.userName || "N/A"}</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="text-xs text-muted-foreground">Ngày sinh</div>
                    <div className="text-sm font-medium">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : "N/A"}
                    </div>
                  </div>
                  {user.class && (
                    <div className="border-b pb-2">
                      <div className="text-xs text-muted-foreground">Lớp</div>
                      <div className="text-sm font-medium">{user.class}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parent Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thông tin phụ huynh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingParents ? (
                <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
              ) : parents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Chưa có thông tin phụ huynh</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Father Info */}
                  {father && (
                    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Thông tin Cha</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Họ tên:</span>
                          <span className="ml-2 font-medium">{father.fullName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ngày sinh:</span>
                          <span className="ml-2">{new Date(father.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {father.cccd && (
                          <div>
                            <span className="text-muted-foreground">CCCD:</span>
                            <span className="ml-2">{father.cccd}</span>
                          </div>
                        )}
                        {father.education && (
                          <div>
                            <span className="text-muted-foreground">Trình độ:</span>
                            <span className="ml-2">{father.education}</span>
                          </div>
                        )}
                        {father.career && (
                          <div>
                            <span className="text-muted-foreground">Nghề nghiệp:</span>
                            <span className="ml-2">{father.career}</span>
                          </div>
                        )}
                        {father.phone && (
                          <div>
                            <span className="text-muted-foreground">Điện thoại:</span>
                            <span className="ml-2">{father.phone}</span>
                          </div>
                        )}
                        {father.email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2">{father.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mother Info */}
                  {mother && (
                    <div className="border rounded-lg p-4 bg-pink-50 dark:bg-pink-950">
                      <h3 className="font-semibold text-pink-700 dark:text-pink-300 mb-3">Thông tin Mẹ</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Họ tên:</span>
                          <span className="ml-2 font-medium">{mother.fullName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ngày sinh:</span>
                          <span className="ml-2">{new Date(mother.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {mother.cccd && (
                          <div>
                            <span className="text-muted-foreground">CCCD:</span>
                            <span className="ml-2">{mother.cccd}</span>
                          </div>
                        )}
                        {mother.education && (
                          <div>
                            <span className="text-muted-foreground">Trình độ:</span>
                            <span className="ml-2">{mother.education}</span>
                          </div>
                        )}
                        {mother.career && (
                          <div>
                            <span className="text-muted-foreground">Nghề nghiệp:</span>
                            <span className="ml-2">{mother.career}</span>
                          </div>
                        )}
                        {mother.phone && (
                          <div>
                            <span className="text-muted-foreground">Điện thoại:</span>
                            <span className="ml-2">{mother.phone}</span>
                          </div>
                        )}
                        {mother.email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2">{mother.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Temporary Residence */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Khai báo tạm trú</CardTitle>
              <div className="flex items-center gap-2">
                {!showResidenceForm && (
                  <Button
                    size="sm"
                    onClick={() => setShowResidenceForm(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm mới
                  </Button>
                )}
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {showResidenceForm && (
                <form onSubmit={handleSubmitResidence} className="mb-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">
                      {editingResidence ? "Chỉnh sửa tạm trú" : "Thêm khai báo tạm trú mới"}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelForm}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Địa chỉ *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Thành phố *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Quận/Huyện *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Phường/Xã</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>


                    <div>
                      <label className="block text-sm font-medium mb-1">Học kỳ *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.semesterId}
                        onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                      >
                        <option value="">-- Chọn học kỳ --</option>
                        {semesters.map((sem) => (
                          <option key={sem.id} value={sem.id}>
                            {sem.name} - {sem.schoolYear}
                          </option>
                        ))}
                      </select>
                      {semesters.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Không có học kỳ nào. Vui lòng liên hệ admin để thêm học kỳ.
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Ghi chú</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button type="submit">
                      {editingResidence ? "Cập nhật" : "Thêm mới"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelForm}>
                      Hủy
                    </Button>
                  </div>
                </form>
              )}

              {loadingResidences ? (
                <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
              ) : residences.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Chưa có khai báo tạm trú</div>
              ) : (
                <div className="space-y-3">
                  {residences.map((residence) => {
                    const semester = semesters.find(s => s.id === residence.semesterId);
                    return (
                      <div key={residence.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{residence.address}</h4>
                            <p className="text-sm text-muted-foreground">
                              {residence.ward && `${residence.ward}, `}{residence.district}, {residence.city}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditResidence(residence)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteResidence(residence.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Từ ngày:</span>
                            <span className="ml-2">{new Date(residence.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          {residence.endDate && (
                            <div>
                              <span className="text-muted-foreground">Đến ngày:</span>
                              <span className="ml-2">{new Date(residence.endDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                          {semester && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Học kỳ:</span>
                              <span className="ml-2">{semester.name} - {semester.schoolYear}</span>
                            </div>
                          )}
                          {residence.note && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Ghi chú:</span>
                              <span className="ml-2">{residence.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
