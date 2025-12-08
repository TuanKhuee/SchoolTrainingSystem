using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.SystemTranings.Training
{
    public class CourseMajor
    {
        public Guid Id { get; set; }

        public Guid CourseId { get; set; }
        public Course Course { get; set; }

        [StringLength(10)]
        public string MajorCode { get; set; }
    }
}