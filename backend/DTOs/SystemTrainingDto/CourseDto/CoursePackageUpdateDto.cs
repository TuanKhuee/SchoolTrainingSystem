using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CoursePackageUpdateDto
    {
        public string PackageName { get; set; }
        public int YearLevel { get; set; }
        public string MajorName { get; set; }
    }
}