using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto
{
    public class SemesterDto
    {
        public Guid Id { get; set; }          // Mã định danh kỳ học
        public string Name { get; set; }      // Tên kỳ học
        public DateTime StartDate { get; set; }  // Ngày bắt đầu
        public DateTime EndDate { get; set; }    // Ngày kết thúc
        public string SchoolYear { get; set; }   // Năm học
        public bool IsActive { get; set; }       // Trạng thái hoạt động
    }
}