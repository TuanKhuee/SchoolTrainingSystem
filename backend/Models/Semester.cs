using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using backend.Models.SystemTranings.BackgroundStu;
using backend.Models.SystemTranings.Training;

namespace backend.Models
{
    public class Semester
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(10)]
        public string Name { get; set; }  // Ví dụ: "HK1", "HK2"

        [Required]
        [StringLength(20)]
        public string SchoolYear { get; set; }  // Ví dụ: "2024-2025"

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; }

        // Quan hệ: một kỳ học có nhiều Reward và Discipline
        public ICollection<Reward>? Rewards { get; set; }
        public ICollection<Discipline>? Disciplines { get; set; }
        public ICollection<CourseOffering>? CourseOfferings { get; set; }
    }
}