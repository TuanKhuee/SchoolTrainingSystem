using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CourseRegistrationResponseDto
    {
        public Guid RegistrationId { get; set; }
        public string StudentCode { get; set; }
        public string CourseCode { get; set; }
        public string CourseName { get; set; }
        public int Credits { get; set; }
        public string TeacherCode { get; set; }
        public string TeacherName { get; set; }
        public string SemesterName { get; set; }
        public string SchoolYear { get; set; }
        public string DayOfWeek { get; set; }
        public int? StartPeriod { get; set; }
        public int? EndPeriod { get; set; }
    }
}