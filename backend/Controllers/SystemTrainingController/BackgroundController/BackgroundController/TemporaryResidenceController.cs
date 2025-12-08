using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto.BackgroundDto;
using backend.Models.SystemTranings.BackgroundStu;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.BackgroundController.BackgroundController
{
    [Route("api/[controller]")]
    [ApiController]
    public class TemporaryResidenceController : Controller
    {
        private readonly ApplicationDbContext _context;

        public TemporaryResidenceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ [1] Student thêm khai báo tạm trú
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> CreateTemporaryResidence([FromBody] TemporaryResidenceDto dto)
        {
            var studentCode = User.FindFirst("StudentCode")?.Value;
            if (studentCode == null) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.StudentCode == studentCode);

            var residence = new TemporaryResidence
            {
                StudentCode = studentCode,
                UserId = user?.Id,
                Address = dto.Address,
                City = dto.City,
                District = dto.District,
                Ward = dto.Ward,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Note = dto.Note,
                SemesterId = dto.SemesterId
            };

            _context.TemporaryResidences.Add(residence);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Khai báo tạm trú thành công!" });
        }

        // ✅ [2] Xem tất cả (Admin)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.TemporaryResidences
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();
            return Ok(list);
        }

        // ✅ [3] Xem theo StudentCode
        [HttpGet("student/{studentCode}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetByStudent(string studentCode)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var userStudentCode = User.FindFirst("StudentCode")?.Value;

            if (role == "Student" && userStudentCode != studentCode)
                return Forbid();

            var list = await _context.TemporaryResidences
                .Where(t => t.StudentCode == studentCode)
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            return Ok(list);
        }

        // ✅ [4] Sửa tạm trú (chỉ chính chủ hoặc admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> Update(Guid id, [FromBody] TemporaryResidenceDto dto)
        {
            var existing = await _context.TemporaryResidences.FindAsync(id);
            if (existing == null) return NotFound();

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var studentCode = User.FindFirst("StudentCode")?.Value;

            if (role == "Student" && existing.StudentCode != studentCode)
                return Forbid();

            existing.Address = dto.Address;
            existing.City = dto.City;
            existing.District = dto.District;
            existing.StartDate = dto.StartDate;
            existing.EndDate = dto.EndDate;
            existing.Note = dto.Note;
            existing.SemesterId = dto.SemesterId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin tạm trú thành công!" });
        }

        // ✅ [5] Xóa khai báo tạm trú
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var existing = await _context.TemporaryResidences.FindAsync(id);
            if (existing == null) return NotFound();

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var studentCode = User.FindFirst("StudentCode")?.Value;

            if (role == "Student" && existing.StudentCode != studentCode)
                return Forbid();

            _context.TemporaryResidences.Remove(existing);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa khai báo tạm trú thành công!" });
        }
    }
}