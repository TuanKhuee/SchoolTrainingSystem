using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class UpdateCourseOfferingDto
    {
        [Required]
        public string CourseCode { get; set; }

        [Required]
        public string SemesterName { get; set; }

        [Required]
        public string SchoolYear { get; set; }

        public string? OfferingCode { get; set; }

        [Range(1, 200)]
        public int Capacity { get; set; }

        public string DayOfWeek { get; set; }
        public int StartPeriod { get; set; }
        public int EndPeriod { get; set; }
        public string Room { get; set; }
        public string? TeacherCode { get; set; }
    }
}
