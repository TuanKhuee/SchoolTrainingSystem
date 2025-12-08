using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.CourseDto
{
    public class CourseResponseDto
    {
         public Guid Id { get; set; }
        public string CourseCode { get; set; }
        public string CourseName { get; set; }
        public int Credits { get; set; }
        public List<string> Majors { get; set; } = new List<string>();
        public int YearLevel { get; set; }   
    }
}