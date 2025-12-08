using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CoursePackageCreateDto
    {
        public string PackageName { get; set; }     // Tên gói (VD: "Năm nhất", "Năm hai")
        public int YearLevel { get; set; }
        public string MajorName { get; set; }         // Số thứ tự năm học (1, 2, 3, 4)
    }
}