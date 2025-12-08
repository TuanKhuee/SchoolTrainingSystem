using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class Course
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(20)]
        public string CourseCode { get; set; }  // Mã học phần, ví dụ: "IT101"

        [Required]
        [StringLength(100)]
        public string CourseName { get; set; }  // Tên học phần

        public int Credits { get; set; } // Số tín chỉ
        public int YearLevel { get; set; }  // Năm học phần
        public Guid? CoursePackageId { get; set; }
        public CoursePackage? CoursePackage { get; set; }
        public ICollection<CourseOffering>? Offerings { get; set; }
        public ICollection<CourseMajor>? CourseMajors { get; set; } = new List<CourseMajor>();
       
    }
}