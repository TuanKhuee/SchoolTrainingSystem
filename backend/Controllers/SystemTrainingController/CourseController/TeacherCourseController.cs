using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using backend.DTOs.SystemTrainingDto.CourseDto;
using backend.Models.SystemTranings.Training;
using backend.DTOs.SystemTrainingDto.TeacherDto;

namespace backend.Controllers.SystemTrainingController.CourseController
{
    [Authorize(Roles = "Teacher")]
    [Route("api/teacher/course")]
    [ApiController]
    public class TeacherCourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeacherCourseController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔹 Lấy tất cả lớp học phần của giáo viên
        [HttpGet("my-offerings")]
        public async Task<IActionResult> GetMyCourseOfferings()
        {
            var teacherId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(teacherId))
                return Unauthorized(new { message = "Không thể xác định giáo viên." });

            var offerings = await _context.CourseOfferings
                .Where(o => o.TeacherId == teacherId)
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .Include(o => o.Registrations)
                .Select(o => new CourseOfferingTeacherResponseDto
                {
                    Id = o.Id,
                    OfferingCode = o.OfferingCode,
                    CourseCode = o.Course != null ? o.Course.CourseCode : "",
                    CourseName = o.Course != null ? o.Course.CourseName : "",
                    Credits = o.Course != null ? o.Course.Credits : 0,
                    SemesterName = o.Semester != null ? o.Semester.Name : "",
                    SchoolYear = o.Semester != null ? o.Semester.SchoolYear : "",
                    DayOfWeek = o.DayOfWeek,
                    StartPeriod = o.StartPeriod,
                    EndPeriod = o.EndPeriod,
                    Room = o.Room,
                    StudentCount = o.Registrations != null ? o.Registrations.Count : 0
                })
                .ToListAsync();

            return Ok(offerings);
        }


        // 🔹 Xem danh sách sinh viên trong lớp học phần theo OfferingCode
        [HttpGet("offering/{offeringCode}/students")]
        public async Task<IActionResult> GetStudentsInOffering(string offeringCode)
        {
            var teacherId = User.FindFirstValue("UserId"); // Hoặc ClaimTypes.NameIdentifier nếu JWT dùng chuẩn này
            if (string.IsNullOrEmpty(teacherId))
                return Unauthorized(new { message = "Không thể xác định giáo viên." });

            var offering = await _context.CourseOfferings
                .Where(o => o.OfferingCode == offeringCode && o.TeacherId == teacherId)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .FirstOrDefaultAsync();

            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này." });

            var students = offering.Registrations.Select(r => new StudentDto
            {
                Id = r.Student.Id,
                FullName = r.Student != null ? r.Student.FullName : "",
                StudentCode = r.Student != null ? r.Student.StudentCode : "",
                MajorCode = r.Student != null ? r.Student.MajorCode : "",
                RegisteredAt = r.RegisteredAt
            }).ToList();

            return Ok(new
            {
                offering.OfferingCode,
                CourseCode = offering.Course != null ? offering.Course.CourseCode : "",
                CourseName = offering.Course != null ? offering.Course.CourseName : "",
                SemesterName = offering.Semester != null ? offering.Semester.Name : "",
                SchoolYear = offering.Semester != null ? offering.Semester.SchoolYear : "",
                Students = students
            });
        }


        // 🔹 Xem thời khóa biểu giáo viên
        [HttpGet("timetable")]
        public async Task<IActionResult> GetTeacherTimetable()
        {
            var teacherId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(teacherId))
                return Unauthorized(new { message = "Không thể xác định giáo viên." });

            var offerings = await _context.CourseOfferings
                .Where(o => o.TeacherId == teacherId)
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .ToListAsync();

            if (!offerings.Any())
                return Ok(new { message = "Bạn chưa có lớp dạy nào." });

            var timetable = offerings
                .GroupBy(o => o.DayOfWeek)
                .OrderBy(g => ConvertDayOfWeekToNumber(g.Key))
                .Select(g => new
                {
                    Day = ConvertDayOfWeekToVietnamese(g.Key),
                    Lessons = g.OrderBy(o => o.StartPeriod).Select(o => new
                    {
                        OfferingCode = o.OfferingCode ?? "",
                        CourseCode = o.Course != null ? o.Course.CourseCode : "",
                        CourseName = o.Course != null ? o.Course.CourseName : "",
                        Room = o.Room ?? "",
                        o.StartPeriod,
                        o.EndPeriod,
                        SemesterName = o.Semester != null ? o.Semester.Name : "",
                        SchoolYear = o.Semester != null ? o.Semester.SchoolYear : ""
                    })
                });

            return Ok(timetable);
        }

        [HttpGet("offering/{offeringCode}/attendance")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetAttendanceByOffering(string offeringCode)
        {
            var teacherId = User.FindFirstValue("UserId"); // hoặc ClaimTypes.NameIdentifier
            if (string.IsNullOrEmpty(teacherId))
                return Unauthorized(new { message = "Không thể xác định giáo viên." });

            var offering = await _context.CourseOfferings
                .Where(o => o.OfferingCode == offeringCode && o.TeacherId == teacherId)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Attendances)
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .FirstOrDefaultAsync();

            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này." });

            var students = offering.Registrations.Select(r => new
            {
                StudentId = r.Student.Id,
                StudentCode = r.Student != null ? r.Student.StudentCode : "",
                FullName = r.Student != null ? r.Student.FullName : "",
                MajorCode = r.Student != null ? r.Student.MajorCode : "",
                Attendances = r.Attendances.Select(a => new
                {
                    a.Date,
                    a.IsPresent
                }).OrderBy(a => a.Date).ToList()
            }).ToList();

            return Ok(new
            {
                offering.OfferingCode,
                CourseCode = offering.Course != null ? offering.Course.CourseCode : "",
                CourseName = offering.Course != null ? offering.Course.CourseName : "",
                SemesterName = offering.Semester != null ? offering.Semester.Name : "",
                SchoolYear = offering.Semester != null ? offering.Semester.SchoolYear : "",
                Students = students
            });
        }
        [HttpPost("offering/attendance")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> TakeAttendance([FromBody] AttendanceCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lấy teacherId từ JWT
            var teacherId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(teacherId))
                return Unauthorized(new { message = "Không thể xác định giáo viên." });

            // Lấy lớp học phần theo OfferingCode và teacher
            var offering = await _context.CourseOfferings
                .Where(o => o.OfferingCode == dto.OfferingCode && o.TeacherId == teacherId)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .FirstOrDefaultAsync();

            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này." });

            foreach (var studentDto in dto.Students)
            {
                var registration = offering.Registrations
                    .FirstOrDefault(r => r.StudentId == studentDto.StudentId);

                if (registration == null)
                    continue;

                var attendance = await _context.Attendances
                    .FirstOrDefaultAsync(a =>
                        a.CourseRegistrationId == registration.Id &&
                        a.Date.Date == dto.Date.Date
                    );

                if (attendance != null)
                {
                    attendance.IsPresent = studentDto.IsPresent;
                }
                else
                {
                    attendance = new Attendance
                    {
                        Id = Guid.NewGuid(),
                        CourseRegistrationId = registration.Id,
                        Date = dto.Date.Date,
                        IsPresent = studentDto.IsPresent
                    };

                    _context.Attendances.Add(attendance);
                }
            }


            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lưu điểm danh: " + ex.Message });
            }

            return Ok(new { message = "Điểm danh đã được cập nhật thành công." });
        }

        [HttpGet("offering/{offeringCode}/grades")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetStudentGrades(string offeringCode)
        {
            var teacherId = User.FindFirstValue("UserId");

            var offering = await _context.CourseOfferings
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Score)
                .FirstOrDefaultAsync(o => o.OfferingCode == offeringCode
                                          && o.TeacherId == teacherId);

            if (offering == null)
                return NotFound("Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này.");

            var result = offering.Registrations.Select(r => new
            {
                r.Id,
                r.StudentId,
                FullName = r.Student != null ? r.Student.FullName : "",
                StudentCode = r.Student != null ? r.Student.StudentCode : "",
                MidTerm = r.Score != null ? r.Score.Midterm : 0,
                FinalTerm = r.Score != null ? r.Score.Final : 0,
                Total = r.Score != null ? r.Score.Total : 0
            });

            return Ok(result);
        }

        [HttpPost("offering/grades")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> UpdateGrades(string offeringCode, [FromBody] List<ScoreUpdateDto> dtoList)
        {
            var teacherId = User.FindFirstValue("UserId");

            // Lấy lớp học phần + các navigation bằng SplitQuery
            var offering = await _context.CourseOfferings
                .AsSplitQuery()
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Score)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Attendances)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .FirstOrDefaultAsync(o => o.OfferingCode == offeringCode && o.TeacherId == teacherId);

            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này." });

            var updatedScores = new List<object>();

            foreach (var dto in dtoList)
            {
                var registration = offering.Registrations.FirstOrDefault(r => r.Id == dto.RegistrationId);
                if (registration == null)
                    continue;

                // Tính Process dựa trên Attendance
                var absentCount = registration.Attendances.Count(a => !a.IsPresent);
                var processScore = Math.Max(10 - absentCount, 0);

                // Nếu chưa có Score → tạo mới
                if (registration.Score == null)
                {
                    registration.Score = new Score
                    {
                        Id = Guid.NewGuid(),
                        CourseRegistrationId = registration.Id,
                        Process = processScore,
                        Midterm = dto.MidTerm ?? 0,
                        Final = dto.FinalTerm ?? 0
                    };

                    // Đánh dấu thêm mới
                    _context.Scores.Add(registration.Score);
                }
                else
                {
                    // Cập nhật Process
                    registration.Score.Process = processScore;

                    if (dto.MidTerm.HasValue)
                        registration.Score.Midterm = dto.MidTerm.Value;

                    if (dto.FinalTerm.HasValue)
                        registration.Score.Final = dto.FinalTerm.Value;

                    // Buộc EF lưu thay đổi (vì đôi khi EF không track Score cũ do all null)
                    _context.Entry(registration.Score).State = EntityState.Modified;
                }

                // Tính lại total
                registration.Score.Total =
                    registration.Score.Process * 0.2f +
                    registration.Score.Midterm * 0.3f +
                    registration.Score.Final * 0.5f;

                updatedScores.Add(new
                {
                    registration.Id,
                    StudentCode = registration.Student != null ? registration.Student.StudentCode : "",
                    FullName = registration.Student != null ? registration.Student.FullName : "",
                    Process = registration.Score.Process,
                    MidTerm = registration.Score.Midterm,
                    FinalTerm = registration.Score.Final,
                    Total = registration.Score.Total
                });
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = "Lỗi khi lưu dữ liệu",
                    error = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }

            return Ok(new
            {
                message = "Cập nhật điểm thành công!",
                data = updatedScores
            });
        }




        [HttpGet("offering/grades/classification")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetGradesClassification(string offeringCode)
        {
            var teacherId = User.FindFirstValue("UserId");

            var offering = await _context.CourseOfferings
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Score)
                .Include(o => o.Registrations)
                    .ThenInclude(r => r.Student)
                .FirstOrDefaultAsync(o => o.OfferingCode == offeringCode && o.TeacherId == teacherId);

            if (offering == null)
                return NotFound("Không tìm thấy lớp học phần hoặc bạn không phải giáo viên lớp này.");

            var result = offering.Registrations.Select(r =>
            {
                var total = r.Score?.Total ?? 0;
                string letterGrade;
                double gpa;

                if (total >= 9)
                {
                    letterGrade = "A";
                    gpa = 4.0;
                }
                else if (total >= 8)
                {
                    letterGrade = "B";
                    gpa = 3.5;
                }
                else if (total >= 7)
                {
                    letterGrade = "C";
                    gpa = 3.0;
                }
                else if (total >= 6)
                {
                    letterGrade = "D";
                    gpa = 2.5;
                }
                else if (total >= 5)
                {
                    letterGrade = "E";
                    gpa = 2.0;
                }
                else
                {
                    letterGrade = "F";
                    gpa = 0.0;
                }

                return new
                {
                    StudentId = r.StudentId,
                    StudentCode = r.Student != null ? r.Student.StudentCode : "",
                    StudentName = r.Student != null ? r.Student.FullName : "",
                    Process = r.Score?.Process,
                    Midterm = r.Score?.Midterm,
                    Final = r.Score?.Final,
                    Total = r.Score?.Total,
                    GPA = gpa,
                    LetterGrade = letterGrade
                };
            }).ToList();

            return Ok(result);
        }


        // 🔹 Helper: Chuyển tên ngày sang số (thứ)
        private int ConvertDayOfWeekToNumber(string? day)
        {
            if (string.IsNullOrEmpty(day)) return 8;
            return day.ToLower() switch
            {
                "monday" => 2,
                "tuesday" => 3,
                "wednesday" => 4,
                "thursday" => 5,
                "friday" => 6,
                "saturday" => 7,
                _ => 8
            };
        }

        // 🔹 Helper: Chuyển sang tên tiếng Việt
        private string ConvertDayOfWeekToVietnamese(string? day)
        {
            if (string.IsNullOrEmpty(day)) return "Không xác định";
            return day.ToLower() switch
            {
                "monday" => "Thứ Hai",
                "tuesday" => "Thứ Ba",
                "wednesday" => "Thứ Tư",
                "thursday" => "Thứ Năm",
                "friday" => "Thứ Sáu",
                "saturday" => "Thứ Bảy",
                _ => day
            };
        }
    }
}
