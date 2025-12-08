using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CoursePackageDto
    {
        public Guid Id { get; set; }
        public string PackageName { get; set; }
        public int YearLevel { get; set; }
        public string MajorName { get; set; }
        public string Description { get; set; }

        // Thông tin các môn học thuộc gói này (nếu cần hiển thị cùng)
        public List<CourseSummaryDto>? Courses { get; set; }
    }
}