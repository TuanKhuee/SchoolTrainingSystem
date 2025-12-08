using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto;
using backend.Models;
using backend.Models.SystemTranings.BackgroundStu;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.BackgroundController
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DisciplineController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DisciplineController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/Discipline/add
        [HttpPost("add/discipline")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddDiscipline([FromBody] DisciplineDto dto)
        {
            var student = await _context.Users.FirstOrDefaultAsync(s => s.StudentCode == dto.StudentCode);
            if (student == null)
                return NotFound(new { message = "Không tìm thấy sinh viên." });

            var semester = await _context.Semesters
                .FirstOrDefaultAsync(s => s.Name == dto.SemesterName && s.SchoolYear == dto.SchoolYear);
            var discipline = new Discipline
            {
                StudentCode = dto.StudentCode,
                Title = dto.Title,
                Description = dto.Description,
                Date = dto.Date,
                UserId = student.Id,
                SemesterId = semester.Id 
            };

            _context.Disciplines.Add(discipline);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm kỷ luật thành công.", data = discipline });
        }

        // GET: api/Discipline/student/{studentCode}
        [HttpGet("student/{studentCode}")]
        public async Task<IActionResult> GetDisciplinesByStudent(string studentCode)
        {
            var disciplines = await _context.Disciplines
                .Where(d => d.StudentCode == studentCode)
                .OrderByDescending(d => d.Date)
                .ToListAsync();

            return Ok(disciplines);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetDisciplineById(string studentCode)
        {
             var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userStudentCode = User.FindFirst("StudentCode")?.Value;

            // Nếu là student thì chỉ được xem của chính mình
            if (userRole == "Student" && userStudentCode != studentCode)
            {
                return Forbid(); // Trả về 403 Forbidden
            }
            var discipline = await _context.Disciplines
                        .Where(r => r.StudentCode == studentCode)
                        .Include(r => r.Semester)
                        .OrderByDescending(r => r.Date)
                        .Select(r => new
             {
                    r.Id,
                    r.Title,
                    r.Description,
                    r.Date,
                    r.StudentCode,
           Semester = new
           {
               r.Semester.Name,
               r.Semester.SchoolYear,
               r.Semester.StartDate,
               r.Semester.EndDate
           }
       })
       .ToListAsync();

            return Ok(discipline);
        }

        // 🟠 ADMIN sửa
        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDiscipline(Guid id, [FromBody] DisciplineDto dto)
        {
            var discipline = await _context.Disciplines.FindAsync(id);
            if (discipline == null)
                return NotFound(new { message = "Không tìm thấy kỷ luật." });

            discipline.Title = dto.Title;
            discipline.Description = dto.Description;
            discipline.Date = dto.Date;
            discipline.StudentCode = dto.StudentCode;
           

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật kỷ luật thành công.", data = discipline });
        }

        // 🔴 ADMIN xóa
        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDiscipline(Guid id)
        {
            var discipline = await _context.Disciplines.FindAsync(id);
            if (discipline == null)
                return NotFound(new { message = "Không tìm thấy kỷ luật." });

            _context.Disciplines.Remove(discipline);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa kỷ luật thành công." });
        }
    }
}