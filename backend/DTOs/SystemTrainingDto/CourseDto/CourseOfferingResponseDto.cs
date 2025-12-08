using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CourseOfferingResponseDto
    {
        public Guid Id { get; set; }
        public string CourseCode { get; set; }
        public string CourseName { get; set; }
        public int Credits { get; set; }
        public string SemesterName { get; set; }
        public string SchoolYear { get; set; }
        public int Capacity { get; set; }
        public string DayOfWeek { get; set; }  // Thứ mấy học
        public int? StartPeriod { get; set; }     // Tiết học (VD: "Tiết 1-3")
        public int? EndPeriod { get; set; }
        public string? Room { get; set; }  // Phòng học
         public string? TeacherCode { get; set; }
        public string? TeacherName { get; set; }
    }
}