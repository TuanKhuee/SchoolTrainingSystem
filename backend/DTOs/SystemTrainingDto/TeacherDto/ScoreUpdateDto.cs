using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.TeacherDto
{
    public class ScoreUpdateDto
    {
        public Guid RegistrationId { get; set; }  // Dùng để xác định CourseRegistration
        public string StudentCode { get; set; }   // Hiển thị cho giáo viên
        public float? MidTerm { get; set; }
        public float? FinalTerm { get; set; }
    }
}