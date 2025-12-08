using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.BackgroundDto
{
    public class TemporaryResidenceResponse
    {
        public Guid Id { get; set; }
        public string StudentCode { get; set; }
        public string? UserId { get; set; }
        public string Address { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Note { get; set; }
        public Guid SemesterId { get; set; }

    }
}