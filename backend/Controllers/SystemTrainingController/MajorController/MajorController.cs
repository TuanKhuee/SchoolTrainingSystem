using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto.RegisterMajorDto;
using backend.Models.SystemTranings.Specialization;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController.MajorController
{
    [Route("api/[controller]")]
    [ApiController]
    public class MajorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MajorController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🧩 API: Admin thêm chuyên ngành
        [HttpPost("add")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddMajor([FromBody] CreateMajorDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.MajorCode) || string.IsNullOrWhiteSpace(dto.MajorName))
                return BadRequest("Mã và tên chuyên ngành không được để trống.");

            // Kiểm tra trùng mã chuyên ngành
            var exists = await _context.Specializations.AnyAsync(m => m.MajorCode == dto.MajorCode);
            if (exists)
                return BadRequest("Mã chuyên ngành đã tồn tại.");

            var major = new Specialization
            {
                MajorCode = dto.MajorCode,
                MajorName = dto.MajorName
            };

            _context.Specializations.Add(major);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm chuyên ngành thành công",
                major = new
                {
                    major.Id,
                    major.MajorCode,
                    major.MajorName
                }
            });
        }

        // 🧩 API: Lấy danh sách chuyên ngành
        [HttpGet("list")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMajors()
        {
            var majors = await _context.Specializations.ToListAsync();
            return Ok(majors);
        }

        // 🧩 API: Sinh viên đăng ký chuyên ngành
        [HttpPost("register")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> RegisterMajor([FromBody] RegisterMajorDto dto)
        {
            var studentCode = User.FindFirst("StudentCode")?.Value;
            if (studentCode == null)
                return Unauthorized();

            var student = await _context.Users.FirstOrDefaultAsync(s => s.StudentCode == studentCode);
            if (student == null)
                return NotFound("Không tìm thấy sinh viên.");

            if (student.MajorId != null)
                return BadRequest("Bạn đã đăng ký chuyên ngành rồi.");

            var major = await _context.Specializations.FindAsync(dto.MajorId);
            if (major == null)
                return NotFound("Không tìm thấy chuyên ngành.");

            student.MajorId = major.Id;
            _context.Users.Update(student);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký chuyên ngành thành công", major = major.MajorName });
        }

        // 🧩 API: Admin reset chuyên ngành sinh viên (nếu cần)
        [HttpPut("reset/{studentCode}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetMajor(string studentCode)
        {
            var student = await _context.Users.FirstOrDefaultAsync(s => s.StudentCode == studentCode);
            if (student == null)
                return NotFound("Không tìm thấy sinh viên.");

            student.MajorId = null;
            _context.Users.Update(student);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Reset chuyên ngành thành công." });
        }
    }
}