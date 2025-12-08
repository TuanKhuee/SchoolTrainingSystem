using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class CoursePackage
    {
         [Key]
        public Guid Id { get; set; }

        [Required, StringLength(100)]
        public string PackageName { get; set; } // VD: "Gói môn học Năm 1 CNTT"

        [Range(1, 4)]
        public int YearLevel { get; set; } // 1: Năm nhất, 2: Năm hai, 3: Năm ba, 4: Năm tư

        [Required, StringLength(100)]
        public string MajorName { get; set; } // VD: "Công nghệ thông tin"

        public string? Description { get; set; }

        // Liên kết ngược tới các môn học
        public ICollection<Course>? Courses { get; set; }
    }
}