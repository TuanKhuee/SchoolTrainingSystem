using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CourseOfferingTeacherResponseDto
    {
        public Guid Id { get; set; }
        public string OfferingCode { get; set; }
        public string CourseCode { get; set; }
        public string CourseName { get; set; }
        public int Credits { get; set; }
        public string SemesterName { get; set; }
        public string SchoolYear { get; set; }
        public string DayOfWeek { get; set; }
        public int? StartPeriod { get; set; }
        public int? EndPeriod { get; set; }
        public string Room { get; set; }
        public int StudentCount { get; set; }
    }
}