using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class CourseRegistration
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string StudentId { get; set; }  // FK → User.Id

        [ForeignKey("StudentId")]
        public User Student { get; set; }


        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid CourseOfferingId { get; set; }
        [ForeignKey("CourseOfferingId")]
        public CourseOffering? CourseOffering { get; set; }

        public ICollection<Attendance> Attendances { get; set; }
        public Score? Score { get; set; }


    }
}