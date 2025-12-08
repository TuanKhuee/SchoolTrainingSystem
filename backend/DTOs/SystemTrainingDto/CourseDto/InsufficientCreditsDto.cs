using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class InsufficientCreditsDto
    {
        public string FullName { get; set; }
        public string StudentCode { get; set; }
        public string Class { get; set; }
        public string MajorName { get; set; }
        public string SchoolYear { get; set; }
        public int TotalCredits { get; set; }
    }
}