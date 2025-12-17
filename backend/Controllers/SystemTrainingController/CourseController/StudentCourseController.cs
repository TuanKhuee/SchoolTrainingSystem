using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto.CourseDto;
using backend.Models.SystemTranings.Training;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.CourseController
{
    [Route("api/student/course")]
    [ApiController]
    [Authorize(Roles = "Student")]
    public class StudentCourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StudentCourseController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterCourse([FromBody] CourseRegistrationCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lấy lớp học phần
            var offering = await _context.CourseOfferings
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .Include(o => o.Teacher)
                .FirstOrDefaultAsync(o => o.OfferingCode == dto.OfferingCode);

            if (offering == null)
                return NotFound("Không tìm thấy lớp học phần tương ứng.");

            // Lấy StudentId từ JWT
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không thể xác định sinh viên." });

            var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == studentId);
            if (student == null)
                return NotFound("Sinh viên không tồn tại.");

            // Kiểm tra trùng đăng ký
            var exists = await _context.CourseRegistrations
                .AnyAsync(r => r.StudentId == studentId && r.CourseOfferingId == offering.Id);
            if (exists)
                return BadRequest("Bạn đã đăng ký lớp học phần này.");

            // Kiểm tra năm học (nếu có)
            if (student.YearLevel != 0 && offering.Course.YearLevel != 0 &&
                student.YearLevel != offering.Course.YearLevel)
            {
                return BadRequest(new
                {
                    message = $"Môn học này chỉ dành cho Năm {offering.Course.YearLevel}, bạn hiện là Năm {student.YearLevel}."
                });
            }

            // Kiểm tra ngành học
            var allowedMajors = offering.Course.CourseMajors.Select(cm => cm.MajorCode.ToUpper()).ToList();
            if (allowedMajors.Any() && !allowedMajors.Contains(student.MajorCode?.ToUpper()))
            {
                return BadRequest(new
                {
                    message = $"Môn học này không dành cho ngành {student.MajorCode}."
                });
            }

            // Kiểm tra sức chứa
            var registeredCount = await _context.CourseRegistrations
                .CountAsync(r => r.CourseOfferingId == offering.Id);

            if (registeredCount >= offering.Capacity)
            {
                return BadRequest(new
                {
                    message = $"Lớp học phần đã đầy (sức chứa: {offering.Capacity})."
                });
            }

            // Kiểm tra trùng thời khóa biểu
            var existingCourses = await _context.CourseRegistrations
                .Include(r => r.CourseOffering)
                .ThenInclude(o => o.Semester)
                .Where(r => r.StudentId == studentId && r.CourseOffering.SemesterId == offering.SemesterId)
                .ToListAsync();

            bool isConflict = existingCourses.Any(r =>
                r.CourseOffering.DayOfWeek == offering.DayOfWeek &&
                !(offering.EndPeriod < r.CourseOffering.StartPeriod || offering.StartPeriod > r.CourseOffering.EndPeriod)
            );

            if (isConflict)
                return BadRequest(new { message = "Thời khóa biểu bị trùng với lớp đã đăng ký." });

            // Lưu đăng ký
            var registration = new CourseRegistration
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                CourseOfferingId = offering.Id,
                RegisteredAt = DateTime.UtcNow
            };

            _context.CourseRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            // Trả thông tin lớp + giáo viên
            return Ok(new
            {
                message = "Đăng ký học phần thành công!",
                data = new
                {
                    registration.Id,
                    StudentId = student.Id,
                    StudentName = student.FullName,
                    offering.Course.CourseCode,
                    offering.Course.CourseName,
                    offering.Semester.Name,
                    offering.Semester.SchoolYear,
                    TeacherId = offering.Teacher?.Id,
                    TeacherName = offering.Teacher?.FullName,
                    offering.DayOfWeek,
                    offering.StartPeriod,
                    offering.EndPeriod,
                    offering.Room
                }
            });
        }

        [Authorize(Roles = "Student")]
        [HttpDelete("cancel/{offeringId}")]
        public async Task<IActionResult> CancelRegistration(Guid offeringId)
        {
            // Lấy StudentId từ JWT
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không xác định được sinh viên." });

            var registration = await _context.CourseRegistrations
                .FirstOrDefaultAsync(r => r.StudentId == studentId && r.CourseOfferingId == offeringId);

            if (registration == null)
                return NotFound("Bạn chưa đăng ký học phần này.");

            _context.CourseRegistrations.Remove(registration);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Hủy đăng ký thành công" });
        }

        // 🔹 Xem danh sách học phần có thể đăng ký
        [Authorize(Roles = "Student")]
        [HttpGet("available-offerings")]
        public async Task<IActionResult> GetAvailableOfferings([FromQuery] Guid? semesterId = null)
        {
            var query = _context.CourseOfferings
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .Include(o => o.Teacher)
                .AsQueryable();

            if (semesterId.HasValue)
            {
                query = query.Where(o => o.SemesterId == semesterId.Value);
            }

            var offerings = await query.ToListAsync();

            // Lấy danh sách đã đăng ký của sinh viên để đánh dấu
            var studentId = User.FindFirstValue("UserId");
            var registeredOfferingIds = await _context.CourseRegistrations
                .Where(r => r.StudentId == studentId)
                .Select(r => r.CourseOfferingId)
                .ToListAsync();

            var result = offerings.Select(o => new
            {
                o.Id,
                o.OfferingCode,
                CourseCode = o.Course?.CourseCode,
                CourseName = o.Course?.CourseName,
                Credits = o.Course?.Credits ?? 0,
                SemesterName = o.Semester?.Name,
                SchoolYear = o.Semester?.SchoolYear,
                TeacherName = o.Teacher?.FullName,
                o.DayOfWeek,
                o.StartPeriod,
                o.EndPeriod,
                o.Room,
                o.Capacity,
                Registered = _context.CourseRegistrations.Count(r => r.CourseOfferingId == o.Id),
                IsRegistered = registeredOfferingIds.Contains(o.Id)
            }).ToList();

            return Ok(result);
        }

        // 🔹 Xem danh sách học phần đã đăng ký
        [Authorize(Roles = "Student")]
        [HttpGet("my-registrations")]
        public async Task<IActionResult> GetMyRegistrations()
        {
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không xác định được sinh viên." });

            var list = await _context.CourseRegistrations
                .Where(r => r.StudentId == studentId)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Course)
                .Include(r => r.CourseOffering.Semester)
                .Include(r => r.CourseOffering.Teacher)
                .Select(r => new
                {
                    RegistrationId = r.Id,
                    CourseOfferingId = r.CourseOfferingId,
                    CourseCode = r.CourseOffering.Course.CourseCode,
                    CourseName = r.CourseOffering.Course.CourseName,
                    Credits = r.CourseOffering.Course.Credits,
                    SemesterName = r.CourseOffering.Semester.Name,
                    SchoolYear = r.CourseOffering.Semester.SchoolYear,
                    DayOfWeek = r.CourseOffering.DayOfWeek,
                    StartPeriod = r.CourseOffering.StartPeriod,
                    EndPeriod = r.CourseOffering.EndPeriod,
                    Room = r.CourseOffering.Room,
                    TeacherId = r.CourseOffering.Teacher.Id,
                    TeacherName = r.CourseOffering.Teacher.FullName
                })
                .ToListAsync();

            return Ok(list);
        }

        // 🔹 Xem thời khóa biểu
        [Authorize(Roles = "Student")]
        [HttpGet("timetable")]
        public async Task<IActionResult> GetTimetable([FromQuery] Guid? semesterId = null)
        {
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không xác định được sinh viên." });

            var query = _context.CourseRegistrations
                .Where(r => r.StudentId == studentId)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Course)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Teacher)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Semester)
                .AsQueryable();

            // Filter by semester if provided
            if (semesterId.HasValue)
            {
                query = query.Where(r => r.CourseOffering.SemesterId == semesterId.Value);
            }

            var schedule = await query
                .Select(r => new
                {
                    DayOfWeek = r.CourseOffering.DayOfWeek,
                    StartPeriod = r.CourseOffering.StartPeriod,
                    EndPeriod = r.CourseOffering.EndPeriod,
                    Room = r.CourseOffering.Room,
                    CourseName = r.CourseOffering.Course.CourseName,
                    CourseCode = r.CourseOffering.Course.CourseCode,
                    TeacherName = r.CourseOffering.Teacher.FullName,
                    CourseOfferingId = r.CourseOfferingId
                })
                .ToListAsync();

            if (!schedule.Any())
                return Ok(new { message = "Sinh viên chưa có thời khóa biểu." });

            // Nhóm theo thứ và sort theo tiết
            var grouped = schedule
                .GroupBy(x => x.DayOfWeek)
                .OrderBy(g => ConvertDayOfWeekToNumber(g.Key))
                .Select(g => new
                {
                    Day = ConvertDayOfWeekToVietnamese(g.Key),
                    Lessons = g.OrderBy(x => x.StartPeriod).Select(x => new
                    {
                        x.CourseOfferingId,
                        x.CourseCode,
                        x.CourseName,
                        x.Room,
                        x.StartPeriod,
                        x.EndPeriod,
                        x.TeacherName
                    })
                });

            return Ok(grouped);
        }


        private int ConvertDayOfWeekToNumber(string day)
        {
            return day.ToLower() switch
            {
                "monday" => 1,
                "tuesday" => 2,
                "wednesday" => 3,
                "thursday" => 4,
                "friday" => 5,
                "saturday" => 6,
                "sunday" => 7,
                _ => 99
            };
        }
        private string ConvertDayOfWeekToVietnamese(string day)
        {
            return day.ToLower() switch
            {
                "monday" => "Thứ 2",
                "tuesday" => "Thứ 3",
                "wednesday" => "Thứ 4",
                "thursday" => "Thứ 5",
                "friday" => "Thứ 6",
                "saturday" => "Thứ 7",
                "sunday" => "Chủ Nhật",
                _ => day
            };
        }

        // 🔹 Xem kết quả học tập
        [HttpGet("grades")]
        public async Task<IActionResult> GetMyGrades()
        {
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không xác định được sinh viên." });

            var grades = await _context.CourseRegistrations
                .Where(r => r.StudentId == studentId)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Course)
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Semester)
                .Include(r => r.Score)
                .Select(r => new
                {
                    CourseName = r.CourseOffering.Course.CourseName,
                    CourseCode = r.CourseOffering.Course.CourseCode,
                    Credits = r.CourseOffering.Course.Credits,
                    Semester = r.CourseOffering.Semester.Name,
                    SchoolYear = r.CourseOffering.Semester.SchoolYear,
                    ProcessScore = r.Score != null ? r.Score.Process : null,
                    MidtermScore = r.Score != null ? r.Score.Midterm : null,
                    FinalScore = r.Score != null ? r.Score.Final : null,
                    TotalScore = r.Score != null ? r.Score.Total : null,
                })
                .ToListAsync();

            return Ok(grades);
        }

        // 🔹 Xem lịch sử điểm danh
        [HttpGet("attendance/{offeringId}")]
        public async Task<IActionResult> GetAttendanceHistory(Guid offeringId)
        {
            var studentId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized(new { message = "Không xác định được sinh viên." });

            var registration = await _context.CourseRegistrations
                .Include(r => r.Attendances)
                .FirstOrDefaultAsync(r => r.StudentId == studentId && r.CourseOfferingId == offeringId);

            if (registration == null)
                return NotFound(new { message = "Bạn chưa đăng ký lớp học phần này." });

            var history = registration.Attendances
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.IsPresent
                })
                .ToList();

            return Ok(history);
        }
    }
}