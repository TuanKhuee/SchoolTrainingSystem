using backend.DTOs.SystemTrainingDto.CourseDto;
using backend.Models.SystemTranings.Training;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.CourseController
{
    [Route("api/admin/course-package")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminCoursePackageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminCoursePackageController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ========================
        // 🟩 CREATE
        // ========================
        [HttpPost("create")]
        public async Task<IActionResult> CreateCoursePackage([FromBody] CoursePackageCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var package = new CoursePackage
            {
                Id = Guid.NewGuid(),
                PackageName = dto.PackageName,
                YearLevel = dto.YearLevel,
                MajorName = dto.MajorName
            };

            _context.CoursePackages.Add(package);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo gói môn học thành công",
                data = new CoursePackageDto
                {
                    Id = package.Id,
                    PackageName = package.PackageName,
                    YearLevel = package.YearLevel,
                    MajorName = package.MajorName,
                }
            });
        }

        // ========================
        // 📋 GET ALL
        // ========================
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCoursePackages()
        {
            var packages = await _context.CoursePackages
                .Include(p => p.Courses)
                .ThenInclude(c => c.Offerings)
                .ThenInclude(o => o.Semester)
                .ToListAsync();

            var result = packages.Select(p => new CoursePackageDto
            {
                Id = p.Id,
                PackageName = p.PackageName,
                YearLevel = p.YearLevel,
                MajorName = p.MajorName,
                Courses = p.Courses?.Select(c => new CourseSummaryDto
                {
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    Credit = c.Credits,
                    // Lấy danh sách kỳ học mà học phần này được mở (nếu có Offering)
                    SemesterNames = c.Offerings != null && c.Offerings.Any()
                        ? c.Offerings.Select(o => o.Semester!.Name).Distinct().ToList()
                        : new List<string>()
                }).ToList()
            }).ToList();

            return Ok(result);
        }

        // ========================
        // 🔍 GET BY ID
        // ========================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCoursePackageById(Guid id)
        {
            var package = await _context.CoursePackages
                .Include(p => p.Courses)
                .ThenInclude(c => c.Offerings)
                .ThenInclude(o => o.Semester)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
                return NotFound("Không tìm thấy gói môn học.");

            var result = new CoursePackageDto
            {
                Id = package.Id,
                PackageName = package.PackageName,
                YearLevel = package.YearLevel,
                MajorName = package.MajorName,
                Courses = package.Courses?.Select(c => new CourseSummaryDto
                {
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    Credit = c.Credits,
                    SemesterNames = c.Offerings != null && c.Offerings.Any()
                        ? c.Offerings.Select(o => o.Semester!.Name).Distinct().ToList()
                        : new List<string>()
                }).ToList()
            };

            return Ok(result);
        }

        // ========================
        // ✏️ UPDATE
        // ========================
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCoursePackage(Guid id, [FromBody] CoursePackageUpdateDto dto)
        {
            var package = await _context.CoursePackages.FindAsync(id);
            if (package == null)
                return NotFound("Không tìm thấy gói môn học.");

            package.PackageName = dto.PackageName;
            package.YearLevel = dto.YearLevel;
            package.MajorName = dto.MajorName;
           

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật gói môn học thành công",
                data = new CoursePackageDto
                {
                    Id = package.Id,
                    PackageName = package.PackageName,
                    YearLevel = package.YearLevel,
                    MajorName = package.MajorName,
                    Description = package.Description
                }
            });
        }

        // ========================
        // ❌ DELETE
        // ========================
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCoursePackage(Guid id)
        {
            var package = await _context.CoursePackages
                .Include(p => p.Courses)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
                return NotFound("Không tìm thấy gói môn học.");

            if (package.Courses != null && package.Courses.Any())
                return BadRequest("Không thể xóa gói còn chứa môn học.");

            _context.CoursePackages.Remove(package);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa gói môn học thành công" });
        }

        // ========================
        // 📆 Lấy gói theo năm học
        // ========================
        [HttpGet("year/{yearLevel}")]
        public async Task<IActionResult> GetByYearLevel(int yearLevel)
        {
            var packages = await _context.CoursePackages
                .Where(p => p.YearLevel == yearLevel)
                .Include(p => p.Courses)
                .ThenInclude(c => c.Offerings)
                .ThenInclude(o => o.Semester)
                .ToListAsync();

            var result = packages.Select(p => new CoursePackageDto
            {
                Id = p.Id,
                PackageName = p.PackageName,
                YearLevel = p.YearLevel,
                MajorName = p.MajorName,
                Description = p.Description,
                Courses = p.Courses?.Select(c => new CourseSummaryDto
                {
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    Credit = c.Credits,
                    SemesterNames = c.Offerings != null && c.Offerings.Any()
                        ? c.Offerings.Select(o => o.Semester!.Name).Distinct().ToList()
                        : new List<string>()
                }).ToList()
            });

            return Ok(result);
        }
    }
}
