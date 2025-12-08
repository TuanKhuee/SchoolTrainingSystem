using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CourseSummaryDto
    {
        public string CourseCode { get; set; }
        public string CourseName { get; set; }
        public int Credit { get; set; }
        public List<string>? SemesterNames { get; set; }
    }
}