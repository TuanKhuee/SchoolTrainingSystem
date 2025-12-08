using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class Score
    {
        public Guid Id { get; set; }
        public Guid CourseRegistrationId { get; set; }
        public CourseRegistration? CourseRegistration { get; set; }
        public float? Process { get; set; }
        public float? Midterm { get; set; }
        public float? Final { get; set; }
        public float? Total { get; set; }
    }
}