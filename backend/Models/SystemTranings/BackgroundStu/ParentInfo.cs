using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace backend.Models.SystemTranings
{
    [Index(nameof(StudentCode), nameof(Relationship), IsUnique = true)]
    public class ParentInfo
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Thông tin phụ huynh
        public string? FullName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? CCCD { get; set; }
        public string? PlaceBorn { get; set; }
        public string? Education { get; set; }
        public string? Career { get; set; }
        public string? Living { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string Relationship { get; set; }

        // Quan hệ với User (sinh viên)
        [Required]
        public string UserId { get; set; }   // foreign key thật
        [ForeignKey("UserId")]
        public User User { get; set; }

        // Lưu thêm StudentCode để tra cứu (không dùng làm foreign key)
        public string StudentCode { get; set; }
    }

}