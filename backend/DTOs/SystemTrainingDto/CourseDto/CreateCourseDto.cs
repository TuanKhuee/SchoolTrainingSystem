using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CreateCourseDto
    {
        [Required]
        [StringLength(20)]
        public string CourseCode { get; set; }

        [Required]
        [StringLength(100)]
        public string CourseName { get; set; }

        [Range(1, 15, ErrorMessage = "Số tín chỉ phải nằm trong khoảng 1–10.")]
        public int Credits { get; set; }

        public List<string> MajorCodes { get; set; } = new List<string>();
        
        [Required]
        public int YearLevel { get; set; }
    }
}