using System;

namespace backend.DTOs
{
    public class TeacherDto
    {
        public required string Id { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string TeacherCode { get; set; }
        public required string PhoneNumber { get; set; }
    }
}
