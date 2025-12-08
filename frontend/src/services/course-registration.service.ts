import { httpClient } from "@/lib/http-client";

export interface CourseRegistration {
    registrationId: string;
    courseOfferingId: string;
    courseCode: string;
    courseName: string;
    credits: number;
    semesterName: string;
    schoolYear: string;
    dayOfWeek: string;
    startPeriod: number;
    endPeriod: number;
    room: string;
    teacherId: string;
    teacherName: string;
}

export interface CourseOffering {
    id: string;
    offeringCode: string;
    courseCode: string;
    courseName: string;
    credits: number;
    semesterName: string;
    schoolYear: string;
    teacherName: string;
    dayOfWeek: string;
    startPeriod: number;
    endPeriod: number;
    room: string;
    capacity: number;
    registered: number;
}

export interface RegisterCourseDto {
    offeringCode: string;
}

export const courseRegistrationService = {
    // Get my registered courses
    async getMyRegistrations(): Promise<CourseRegistration[]> {
        return httpClient<CourseRegistration[]>("/student/course/my-registrations");
    },

    // Register for a course
    async registerCourse(dto: RegisterCourseDto): Promise<{ message: string; data: any }> {
        return httpClient<{ message: string; data: any }>("/student/course/register", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // Cancel registration
    async cancelRegistration(offeringId: string): Promise<{ message: string }> {
        return httpClient<{ message: string }>(`/student/course/cancel/${offeringId}`, {
            method: "DELETE",
        });
    },

    // Get available course offerings
    async getAvailableOfferings(semesterId?: string): Promise<CourseOffering[]> {
        const url = semesterId
            ? `/student/course/available-offerings?semesterId=${semesterId}`
            : "/student/course/available-offerings";
        return httpClient<CourseOffering[]>(url);
    },
};
