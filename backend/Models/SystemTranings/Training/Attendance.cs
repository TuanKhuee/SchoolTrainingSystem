using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class Attendance
    {
        public Guid Id { get; set; }
        public Guid CourseRegistrationId { get; set; }
        [ForeignKey("CourseRegistrationId")]
        public CourseRegistration CourseRegistration { get; set; }
        public DateTime Date { get; set; }
        public bool IsPresent { get; set; }
    }
}