import { httpClient } from "@/lib/http-client";

export interface TemporaryResidence {
    id: string;
    studentCode: string;
    address: string;
    city: string;
    district: string;
    ward?: string;
    startDate: string;
    endDate?: string;
    note?: string;
    semesterId: string;
}

export interface CreateTemporaryResidenceDto {
    address: string;
    city: string;
    district: string;
    ward?: string;
    startDate: string;
    endDate?: string;
    note?: string;
    semesterId: string;
}

export const temporaryResidenceService = {
    async getByStudent(studentCode: string): Promise<TemporaryResidence[]> {
        return httpClient<TemporaryResidence[]>(
            `/TemporaryResidence/student/${studentCode}`
        );
    },

    async create(data: CreateTemporaryResidenceDto): Promise<{ message: string }> {
        return httpClient<{ message: string }>("/TemporaryResidence", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(
        id: string,
        data: CreateTemporaryResidenceDto
    ): Promise<{ message: string }> {
        return httpClient<{ message: string }>(`/TemporaryResidence/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<{ message: string }> {
        return httpClient<{ message: string }>(`/TemporaryResidence/${id}`, {
            method: "DELETE",
        });
    },
};
