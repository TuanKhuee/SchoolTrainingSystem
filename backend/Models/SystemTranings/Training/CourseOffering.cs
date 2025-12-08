using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class CourseOffering
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        [StringLength(50)]
        public string OfferingCode { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        public string? TeacherId { get; set; }  // Thêm giáo viên
        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }


        [Required]
        public Guid SemesterId { get; set; }

        [Range(1, 200)]
        public int Capacity { get; set; } // Số lượng sinh viên tối đa
        [StringLength(10)]
        public string? ClassCode { get; set; } // VD: "IT101-01"

        public string? DayOfWeek { get; set; } // Ví dụ: "Thứ 2"
        public int? StartPeriod { get; set; }  // Ví dụ: 1
        public int? EndPeriod { get; set; }
        public string? Room { get; set; } // Ví dụ: "Phòng A1"

        // Navigation properties
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [ForeignKey("SemesterId")]
        public Semester? Semester { get; set; }

        public ICollection<CourseRegistration>? Registrations { get; set; }
    }
}