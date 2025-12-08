using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.TeacherDto
{
    public class AttendanceCreateDto
    {
        public string OfferingCode { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public List<StudentAttendanceDto> Students { get; set; } = new List<StudentAttendanceDto>();
    }
}