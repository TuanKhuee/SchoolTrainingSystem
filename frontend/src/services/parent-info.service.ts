import { httpClient } from "@/lib/http-client";

export interface ParentInfo {
    id: string;
    fullName: string;
    dateOfBirth: string;
    cccd: string;
    placeBorn: string;
    education: string;
    career: string;
    living: string;
    phone: string;
    email: string;
    relationship: string;
    studentCode: string;
}

export const parentInfoService = {
    async getParentInfo(studentCode: string): Promise<ParentInfo[]> {
        return httpClient<ParentInfo[]>(`/admin/GetParentInfos/${studentCode}`);
    },
};
