using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class StudentDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string StudentCode { get; set; }
        public string MajorCode { get; set; }
        public DateTime RegisteredAt { get; set; }
    }
}