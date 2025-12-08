using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto;
using backend.Models;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.SystemTrainingController
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SemesterController : Controller
    {
        private readonly ApplicationDbContext _context;

        public SemesterController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🟢 Tạo mới học kỳ
        [HttpPost("create")]
        public async Task<IActionResult> CreateSemester([FromBody] SemesterDto dto)
        {
            if (dto == null)
                return BadRequest("Dữ liệu không hợp lệ");

            // Kiểm tra trùng tên kỳ học hoặc năm học
            var existing = _context.Semesters.FirstOrDefault(s =>
                s.Name == dto.Name && s.SchoolYear == dto.SchoolYear);

            if (existing != null)
                return BadRequest("Kỳ học đã tồn tại trong năm học này.");

            var semester = new Semester
            {
                Name = dto.Name,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                SchoolYear = dto.SchoolYear,
                IsActive = false
            };

            _context.Semesters.Add(semester);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm kỳ học thành công",
                data = new SemesterDto
                {
                    Id = semester.Id,
                    Name = semester.Name,
                    StartDate = semester.StartDate,
                    EndDate = semester.EndDate,
                    SchoolYear = semester.SchoolYear,
                    IsActive = semester.IsActive
                }
            });
        }

        // 🔵 Lấy tất cả kỳ học (có phân trang)
        [AllowAnonymous]
        [HttpGet("all")]
        public IActionResult GetAllSemesters([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Semesters.AsQueryable();
            var total = query.Count();

            var semesters = query
                .OrderByDescending(s => s.StartDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SemesterDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    SchoolYear = s.SchoolYear,
                    IsActive = s.IsActive
                })
                .ToList();

            return Ok(new
            {
                data = semesters,
                pagination = new
                {
                    page,
                    pageSize,
                    total,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                }
            });
        }

        // 🔵 Lấy kỳ học theo ID
        [AllowAnonymous]
        [HttpGet("{id}")]
        public IActionResult GetSemesterById(Guid id)
        {
            var semester = _context.Semesters.Find(id);

            if (semester == null)
                return NotFound("Không tìm thấy kỳ học");

            return Ok(new
            {
                data = new SemesterDto
                {
                    Id = semester.Id,
                    Name = semester.Name,
                    StartDate = semester.StartDate,
                    EndDate = semester.EndDate,
                    SchoolYear = semester.SchoolYear,
                    IsActive = semester.IsActive
                }
            });
        }

        // 🟡 Cập nhật kỳ học
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateSemester(Guid id, [FromBody] SemesterDto dto)
        {
            var semester = _context.Semesters.Find(id);

            if (semester == null)
                return NotFound("Không tìm thấy kỳ học");

            // Kiểm tra trùng tên (ngoại trừ chính nó)
            var existing = _context.Semesters.FirstOrDefault(s =>
                s.Id != id && s.Name == dto.Name && s.SchoolYear == dto.SchoolYear);

            if (existing != null)
                return BadRequest("Kỳ học đã tồn tại trong năm học này.");

            semester.Name = dto.Name;
            semester.StartDate = dto.StartDate;
            semester.EndDate = dto.EndDate;
            semester.SchoolYear = dto.SchoolYear;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật kỳ học thành công",
                data = new SemesterDto
                {
                    Id = semester.Id,
                    Name = semester.Name,
                    StartDate = semester.StartDate,
                    EndDate = semester.EndDate,
                    SchoolYear = semester.SchoolYear,
                    IsActive = semester.IsActive
                }
            });
        }

        // 🟣 Đánh dấu kỳ học đang hoạt động
        [HttpPatch("toggle-active/{id}")]
        public async Task<IActionResult> ToggleActiveSemester(Guid id)
        {
            var semester = _context.Semesters.Find(id);

            if (semester == null)
                return NotFound("Không tìm thấy kỳ học");

            // Nếu đang set active = true, tắt tất cả kỳ học khác
            if (!semester.IsActive)
            {
                var activeSemesters = _context.Semesters.Where(s => s.IsActive).ToList();
                foreach (var s in activeSemesters)
                {
                    s.IsActive = false;
                }
            }

            semester.IsActive = !semester.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = semester.IsActive ? "Đã đánh dấu kỳ học đang hoạt động" : "Đã tắt trạng thái hoạt động",
                data = new
                {
                    id = semester.Id,
                    isActive = semester.IsActive
                }
            });
        }
    }
}