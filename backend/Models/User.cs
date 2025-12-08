using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using backend.Models.SystemTranings;
using backend.Models.SystemTranings.Specialization;
using backend.Models.SystemTranings.Training;
using Microsoft.AspNetCore.Identity;

namespace backend.Models
{
    public class User : IdentityUser
    {
        public string FullName { get; set; }

        public string? StaffCode { get; set; }
        public bool IsStaff { get; set; }

         public string? TeacherCodes { get; set; }
         public bool IsTeacher => Role == "Teacher";

        public string? StudentCode { get; set; }
        public string? Class { get; set; }
        public string? MajorName { get; set; }
        public string? MajorCode { get; set; }

        public DateTime DateOfBirth { get; set; }

        public string Role { get; set; }
        public bool IsStudent { get; set; }
        
        public int TrainingPoints { get; set; } = 0;
        public string? SchoolYear { get; set; } 
        public int? YearLevel { get; set; }

        public string? CCCD { get; set; }
        public string? PlaceBorn { get; set; }
        public DateTime? DateOfCCCD { get; set; }
        public string? PlaceOfCCCD { get; set; }

        [JsonIgnore]
        public virtual Wallet Wallet { get; set; }
        public ICollection<ActivityRegistration> ActivityRegistrations { get; set; }
        public ICollection<ParentInfo> Parents { get; set; }

        public Guid? MajorId { get; set; }
        public Specialization? Specialization { get; set; }
         public ICollection<CourseRegistration> CourseRegistrations { get; set; } = new List<CourseRegistration>();
    }
}