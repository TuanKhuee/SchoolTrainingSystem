using backend.Services;
using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.CourseController
{
    [Route("api/[controller]")]
    [ApiController]
    public class CreditRegistrationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailService _emailService;

        public CreditRegistrationController(ApplicationDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // 1️⃣ Lấy danh sách sinh viên chưa đủ tín chỉ trong học kỳ đang hoạt động
        [HttpGet("NotEnoughCredits")]
        public async Task<IActionResult> GetStudentsWithInsufficientCredits()
        {
            var semester = await _context.Semesters.FirstOrDefaultAsync(s => s.IsActive);
            if (semester == null)
                return BadRequest("Chưa có học kỳ đang hoạt động.");

            // Lấy tất cả sinh viên (Id là Guid)
            var students = await _context.Users
                .Where(u => u.Role == "Student")
                .Select(u => new
                {
                    u.Id,          // GUID
                    u.FullName,
                    u.Email
                })
                .ToListAsync();

            var studentCredits = new List<object>();

            foreach (var student in students)
            {
                // Tính tổng tín chỉ đăng ký trong học kỳ hiện tại
                var totalCredits = await _context.CourseRegistrations
                    .Where(r => r.StudentId == student.Id               // GUID comparison OK
                        && r.CourseOffering.SemesterId == semester.Id)
                    .SumAsync(r => (int?)r.CourseOffering.Course.Credits) ?? 0;

                if (totalCredits < 14)
                {
                    studentCredits.Add(new
                    {
                        student.FullName,
                        student.Email,
                        TotalCredits = totalCredits
                    });
                }
            }

            return Ok(studentCredits);
        }



        // 2️⃣ Gửi email cảnh báo
        [HttpPost("SendWarningEmails")]
        public async Task<IActionResult> SendWarningEmails()
        {
            var semester = await _context.Semesters.FirstOrDefaultAsync(s => s.IsActive);
            if (semester == null)
                return BadRequest("Chưa có học kỳ đang hoạt động.");

            var students = await _context.Users
                .Where(u => u.Role == "Student")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email
                })
                .ToListAsync();

            int sentCount = 0;

            foreach (var student in students)
            {
                var totalCredits = await _context.CourseRegistrations
                    .Where(r => r.StudentId == student.Id && r.CourseOffering.SemesterId == semester.Id)
                    .SumAsync(r => (int?)r.CourseOffering.Course.Credits) ?? 0;

                if (totalCredits < 14)
                {
                    string subject = "Cảnh báo đăng ký tín chỉ chưa đủ";
                    string body = $@"
                <p>Xin chào {student.FullName},</p>
                <p>Bạn hiện chỉ đăng ký <strong>{totalCredits}</strong> tín chỉ trong học kỳ này.</p>
                <p>Vui lòng bổ sung thêm môn học để đạt tối thiểu 14 tín chỉ.</p>
                <p>Trân trọng,<br>Phòng Đào tạo VKU</p>";

                    await _emailService.SendEmailAsync(student.Email, subject, body);
                    sentCount++;
                }
            }

            return Ok(new { message = $"Đã gửi email cảnh báo đến {sentCount} sinh viên." });
        }

    }
}
