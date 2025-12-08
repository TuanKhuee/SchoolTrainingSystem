using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.BackgroundStu
{
    public class TemporaryResidence
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string StudentCode { get; set; }

        [Required]
        [StringLength(200)]
        public string Address { get; set; } // Địa chỉ tạm trú

        [StringLength(100)]
        public string City { get; set; }

        [StringLength(100)]
        public string District { get; set; }

        [StringLength(100)]
        public string Ward { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }

        [StringLength(500)]
        public string Note { get; set; }

        // Liên kết UserId (tự động lấy theo StudentCode)
        [ForeignKey("User")]
        public string? UserId { get; set; }
        public User User { get; set; }

        public Guid SemesterId { get; set; }
        public Semester? Semester { get; set; }
    }
}