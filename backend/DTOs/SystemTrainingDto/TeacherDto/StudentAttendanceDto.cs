using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.TeacherDto
{
    public class StudentAttendanceDto
    {
        public string StudentId { get; set; }
        public string StudentCode { get; set; }
        public string FullName { get; set; }
        public bool IsPresent { get; set; }
    }
}