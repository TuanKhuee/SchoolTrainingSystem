using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto.CourseDto;
using backend.Models;
using backend.Models.SystemTranings.Training;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.CourseController
{
    [Route("api/admin/course")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminCourseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminCourseController(ApplicationDbContext context)
        {
            _context = context;
        }

        // -------------------------------
        // 1️⃣  TẠO MÔN HỌC
        // -------------------------------
        [HttpPost("create")]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Courses.AnyAsync(c => c.CourseCode == dto.CourseCode))
                return Conflict(new { message = "Mã học phần đã tồn tại" });

            var course = new Course
            {
                Id = Guid.NewGuid(),
                CourseCode = dto.CourseCode.Trim(),
                CourseName = dto.CourseName.Trim(),
                Credits = dto.Credits,
                YearLevel = dto.YearLevel
            };
            // Tạo liên kết CourseMajor
            foreach (var majorCode in dto.MajorCodes.Distinct())
            {
                course.CourseMajors.Add(new CourseMajor
                {
                    Id = Guid.NewGuid(),
                    MajorCode = majorCode.ToUpper()
                });
            }

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return Ok(new CourseResponseDto
            {
                Id = course.Id,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                Credits = course.Credits,
                Majors = course.CourseMajors?.Select(cm => cm.MajorCode).ToList() ?? new List<string>(),
                YearLevel = course.YearLevel
            });
        }

        // -------------------------------
        // 1️⃣.1️⃣ CẬP NHẬT MÔN HỌC
        // -------------------------------
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var course = await _context.Courses
                .Include(c => c.CourseMajors)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
                return NotFound(new { message = "Không tìm thấy môn học" });

            // Check duplicate code if changed
            if (course.CourseCode != dto.CourseCode.Trim())
            {
                if (await _context.Courses.AnyAsync(c => c.CourseCode == dto.CourseCode.Trim()))
                    return Conflict(new { message = "Mã học phần đã tồn tại" });
            }

            course.CourseCode = dto.CourseCode.Trim();
            course.CourseName = dto.CourseName.Trim();
            course.Credits = dto.Credits;
            course.YearLevel = dto.YearLevel;

            // Update Majors - Delete existing ones from database
            var existingMajors = await _context.CourseMajors
                .Where(cm => cm.CourseId == course.Id)
                .ToListAsync();

            if (existingMajors.Any())
            {
                _context.CourseMajors.RemoveRange(existingMajors);
            }

            // Add new majors
            if (dto.MajorCodes != null && dto.MajorCodes.Any())
            {
                foreach (var majorCode in dto.MajorCodes.Distinct())
                {
                    _context.CourseMajors.Add(new CourseMajor
                    {
                        Id = Guid.NewGuid(),
                        CourseId = course.Id,
                        MajorCode = majorCode.ToUpper()
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật môn học thành công" });
        }

        // -------------------------------
        // 1️⃣.2️⃣ XÓA MÔN HỌC
        // -------------------------------
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
                return NotFound(new { message = "Không tìm thấy môn học" });

            // Check dependencies
            var hasOfferings = await _context.CourseOfferings.AnyAsync(o => o.CourseId == id);
            if (hasOfferings)
                return BadRequest(new { message = "Không thể xóa môn học đã có lớp học phần" });

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa môn học thành công" });
        }

        // -------------------------------
        // 📚 LẤY DANH SÁCH TẤT CẢ MÔN HỌC
        // -------------------------------
        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCourses([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Courses
                .Include(c => c.CourseMajors)
                .AsQueryable();

            var total = await query.CountAsync();

            var coursesQuery = await query
                .OrderBy(c => c.CourseCode)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var courses = coursesQuery.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Credits = c.Credits,
                Majors = c.CourseMajors?.Select(cm => cm.MajorCode).ToList() ?? new List<string>(),
                YearLevel = c.YearLevel
            }).ToList();

            return Ok(new
            {
                data = courses,
                pagination = new
                {
                    page,
                    pageSize,
                    total,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                }
            });
        }

        // -------------------------------
        // 2️⃣  TẠO HỌC PHẦN
        // -------------------------------
        [HttpPost("add-offering")]
        public async Task<IActionResult> AddCourseOffering([FromBody] CreateCourseOfferingDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Dữ liệu không hợp lệ." });

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseCode == dto.CourseCode);
            if (course == null)
                return NotFound(new { message = $"Không tìm thấy học phần {dto.CourseCode}" });

            var semester = await _context.Semesters
                .FirstOrDefaultAsync(s => s.Name == dto.SemesterName && s.SchoolYear == dto.SchoolYear);
            if (semester == null)
                return NotFound(new { message = $"Không tìm thấy kỳ học {dto.SemesterName} - {dto.SchoolYear}" });

            User? teacher = null;
            if (!string.IsNullOrWhiteSpace(dto.TeacherCode))
            {
                teacher = await _context.Users.FirstOrDefaultAsync(u => u.TeacherCodes == dto.TeacherCode && u.Role == "Teacher");
                if (teacher == null)
                    return NotFound(new { message = $"Không tìm thấy giáo viên có mã {dto.TeacherCode}" });

                // 🔹 Kiểm tra trùng lịch giáo viên
                var conflict = await _context.CourseOfferings
                    .Where(o => o.TeacherId == teacher.Id && o.SemesterId == semester.Id)
                    .AnyAsync(o =>
                        o.DayOfWeek == dto.DayOfWeek &&
                        !(dto.EndPeriod < o.StartPeriod || dto.StartPeriod > o.EndPeriod)
                    );

                if (conflict)
                    return BadRequest(new { message = $"Giáo viên {teacher.FullName} đã có lớp học phần trùng lịch." });
            }

            var offeringCode = string.IsNullOrWhiteSpace(dto.OfferingCode)
                ? $"{course.CourseCode}-{semester.Name.Replace(" ", "")}-{semester.SchoolYear.Replace("/", "-")}"
                : dto.OfferingCode;

            var offering = new CourseOffering
            {
                Id = Guid.NewGuid(),
                OfferingCode = offeringCode,
                CourseId = course.Id,
                SemesterId = semester.Id,
                Capacity = dto.Capacity,
                DayOfWeek = dto.DayOfWeek,
                StartPeriod = dto.StartPeriod,
                EndPeriod = dto.EndPeriod,
                Room = dto.Room,
                TeacherId = teacher?.Id
            };

            _context.CourseOfferings.Add(offering);
            await _context.SaveChangesAsync();

            var response = new CourseOfferingResponseDto
            {
                Id = offering.Id,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                Credits = course.Credits,
                SemesterName = semester.Name,
                SchoolYear = semester.SchoolYear,
                Capacity = offering.Capacity,
                DayOfWeek = offering.DayOfWeek,
                StartPeriod = offering.StartPeriod,
                EndPeriod = offering.EndPeriod,
                Room = offering.Room,
                TeacherCode = teacher?.TeacherCodes,
                TeacherName = teacher?.FullName
            };

            return Ok(response);
        }

        // -------------------------------
        // 2️⃣.1️⃣ CẬP NHẬT HỌC PHẦN
        // -------------------------------
        [HttpPut("offering/update/{id}")]
        public async Task<IActionResult> UpdateCourseOffering(Guid id, [FromBody] UpdateCourseOfferingDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Dữ liệu không hợp lệ." });

            var offering = await _context.CourseOfferings.FindAsync(id);
            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần" });

            // Validate Course
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseCode == dto.CourseCode);
            if (course == null)
                return NotFound(new { message = $"Không tìm thấy học phần {dto.CourseCode}" });

            // Validate Semester
            var semester = await _context.Semesters
                .FirstOrDefaultAsync(s => s.Name == dto.SemesterName && s.SchoolYear == dto.SchoolYear);
            if (semester == null)
                return NotFound(new { message = $"Không tìm thấy kỳ học {dto.SemesterName} - {dto.SchoolYear}" });

            // Validate Teacher
            User? teacher = null;
            if (!string.IsNullOrWhiteSpace(dto.TeacherCode))
            {
                teacher = await _context.Users.FirstOrDefaultAsync(u => u.TeacherCodes == dto.TeacherCode && u.Role == "Teacher");
                if (teacher == null)
                    return NotFound(new { message = $"Không tìm thấy giáo viên có mã {dto.TeacherCode}" });

                // Check conflict (excluding current offering)
                var conflict = await _context.CourseOfferings
                    .Where(o => o.TeacherId == teacher.Id && o.SemesterId == semester.Id && o.Id != id)
                    .AnyAsync(o =>
                        o.DayOfWeek == dto.DayOfWeek &&
                        !(dto.EndPeriod < o.StartPeriod || dto.StartPeriod > o.EndPeriod)
                    );

                if (conflict)
                    return BadRequest(new { message = $"Giáo viên {teacher.FullName} đã có lớp học phần trùng lịch." });
            }

            // Update fields
            offering.CourseId = course.Id;
            offering.SemesterId = semester.Id;
            offering.Capacity = dto.Capacity;
            offering.DayOfWeek = dto.DayOfWeek;
            offering.StartPeriod = dto.StartPeriod;
            offering.EndPeriod = dto.EndPeriod;
            offering.Room = dto.Room;
            offering.TeacherId = teacher?.Id;

            if (!string.IsNullOrWhiteSpace(dto.OfferingCode))
            {
                offering.OfferingCode = dto.OfferingCode;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật lớp học phần thành công" });
        }

        // -------------------------------
        // 2️⃣.2️⃣ XÓA HỌC PHẦN
        // -------------------------------
        [HttpDelete("offering/delete/{id}")]
        public async Task<IActionResult> DeleteCourseOffering(Guid id)
        {
            var offering = await _context.CourseOfferings.FindAsync(id);
            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần" });

            // Check if any students registered
            var hasRegistrations = await _context.CourseRegistrations.AnyAsync(r => r.CourseOfferingId == id);
            if (hasRegistrations)
                return BadRequest(new { message = "Không thể xóa lớp học phần đã có sinh viên đăng ký" });

            _context.CourseOfferings.Remove(offering);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa lớp học phần thành công" });
        }
        [HttpGet("offerings")]
        public async Task<IActionResult> GetAllOfferings()
        {
            var offerings = await _context.CourseOfferings
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .Include(o => o.Teacher)
                .ToListAsync();

            var result = offerings.Select(o => new CourseOfferingResponseDto
            {
                Id = o.Id,
                CourseCode = o.Course?.CourseCode,
                CourseName = o.Course?.CourseName,
                Credits = o.Course?.Credits ?? 0,
                SemesterName = o.Semester?.Name,
                SchoolYear = o.Semester?.SchoolYear,
                Capacity = o.Capacity,
                DayOfWeek = o.DayOfWeek,
                StartPeriod = o.StartPeriod,
                EndPeriod = o.EndPeriod,
                Room = o.Room,
                TeacherCode = o.Teacher?.TeacherCodes,
                TeacherName = o.Teacher?.FullName
            }).ToList();

            return Ok(result);
        }


        // -------------------------------
        // 4️⃣  XEM DANH SÁCH SINH VIÊN ĐĂNG KÝ
        // -------------------------------
        [HttpGet("registrations")]
        public async Task<IActionResult> GetRegistrations([FromQuery] string courseCode, [FromQuery] string semesterName)
        {
            var offering = await _context.CourseOfferings
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .FirstOrDefaultAsync(o =>
                    o.Course.CourseCode == courseCode && o.Semester.Name == semesterName);

            if (offering == null)
                return NotFound(new { message = "Học phần không tồn tại" });

            var registrations = await _context.CourseRegistrations
                .Include(r => r.Student)
                .Where(r => r.CourseOfferingId == offering.Id)
                .ToListAsync();

            var result = registrations.Select(r => new CourseRegistrationResponseDto
            {
                StudentCode = r.Student?.StudentCode ?? "",
                CourseCode = offering.Course?.CourseCode ?? "",
                CourseName = offering.Course?.CourseName ?? "",
                SemesterName = offering.Semester?.Name ?? "",
            }).ToList();

            return Ok(result);
        }

        // -------------------------------
        // 4️⃣.1️⃣  XEM DANH SÁCH SINH VIÊN ĐĂNG KÝ (BY ID)
        // -------------------------------
        [HttpGet("offering/{id}/registrations")]
        public async Task<IActionResult> GetOfferingRegistrations(Guid id)
        {
            var offering = await _context.CourseOfferings
                .Include(o => o.Course)
                .Include(o => o.Semester)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (offering == null)
                return NotFound(new { message = "Không tìm thấy lớp học phần" });

            var registrations = await _context.CourseRegistrations
                .Include(r => r.Student)
                .Where(r => r.CourseOfferingId == id)
                .ToListAsync();

            var result = new
            {
                offeringInfo = new
                {
                    courseCode = offering.Course.CourseCode,
                    courseName = offering.Course.CourseName,
                    semesterName = offering.Semester.Name,
                    schoolYear = offering.Semester.SchoolYear,
                    room = offering.Room,
                    capacity = offering.Capacity,
                    enrolled = registrations.Count
                },
                students = registrations.Select(r => new
                {
                    studentCode = r.Student.StudentCode,
                    fullName = r.Student.FullName,
                    className = r.Student.Class,
                    majorName = r.Student.MajorName
                }).ToList()
            };

            return Ok(result);
        }

        // -------------------------------
        // 5️⃣  SINH VIÊN CHƯA ĐỦ TÍN CHỈ
        // -------------------------------
        [HttpGet("insufficient-credits")]
        public async Task<IActionResult> GetStudentsWithInsufficientCredits([FromQuery] string semesterName)
        {
            var semester = await _context.Semesters.FirstOrDefaultAsync(s => s.Name == semesterName);
            if (semester == null)
                return NotFound(new { message = "Kỳ học không tồn tại" });

            var registrations = await _context.CourseRegistrations
                .Include(r => r.CourseOffering)
                    .ThenInclude(o => o.Course)
                .Where(r => r.CourseOffering.SemesterId == semester.Id)
                .ToListAsync();

            var studentCredits = registrations
                .GroupBy(r => r.StudentId)
                .Select(g => new
                {
                    StudentId = g.Key,
                    TotalCredits = g.Sum(r => r.CourseOffering.Course.Credits)
                })
                .ToList();

            var allStudents = await _context.Users
                .Where(u => u.IsStudent)
                .ToListAsync();

            var result = allStudents
                .Select(u => new InsufficientCreditsDto
                {
                    FullName = u.FullName,
                    StudentCode = u.StudentCode,
                    Class = u.Class,
                    MajorName = u.MajorName,
                    SchoolYear = u.SchoolYear,
                    TotalCredits = studentCredits.FirstOrDefault(x => x.StudentId == u.Id)?.TotalCredits ?? 0
                })
                .Where(x => x.TotalCredits < 14)
                .OrderBy(x => x.StudentCode)
                .ToList();

            return Ok(result);
        }
    }
}
