using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.BackgroundStu
{
    public class Reward
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string StudentCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty; // ví dụ: "Sinh viên xuất sắc tháng 10"

        [MaxLength(255)]
        public string? Description { get; set; }

        [DataType(DataType.Date)]
        public DateTime Date { get; set; } = DateTime.Now;

        [Required]
        public string UserId { get; set; }   // foreign key thật
        [ForeignKey("UserId")]
        public User User { get; set; }
        public Guid SemesterId { get; set; }
        public Semester? Semester { get; set; }

    }
}