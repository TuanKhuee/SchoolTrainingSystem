using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.BackgroundDto
{
    public class RewardDto
    {
        public string StudentCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string SemesterName { get; set; } = string.Empty;  // "HK1"
        public string SchoolYear { get; set; } = string.Empty;

    }
}