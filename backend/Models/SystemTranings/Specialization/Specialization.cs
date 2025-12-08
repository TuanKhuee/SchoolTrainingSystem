using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Specialization
{
    public class Specialization
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string MajorCode { get; set; } = string.Empty;
        public string MajorName { get; set; } = string.Empty;

        // Liên kết 1-n với Student
        public ICollection<User>? Users { get; set; }
    }
}