using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.ParentDto
{
    public class ParentInfoDto
    {
        public string? FullName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? CCCD { get; set; }
        public string? PlaceBorn { get; set; }
        public string? Education { get; set; }
        public string? Career { get; set; }
        public string? Living { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string Relationship { get; set; }
    }
}