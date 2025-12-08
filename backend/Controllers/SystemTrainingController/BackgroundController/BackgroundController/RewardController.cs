using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto.BackgroundDto;
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
    public class RewardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RewardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/Reward/add
        [HttpPost("add")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddReward([FromBody] RewardDto dto)
        {
            var student = await _context.Users.FirstOrDefaultAsync(s => s.StudentCode == dto.StudentCode);
            if (student == null)
                return NotFound(new { message = "Không tìm thấy sinh viên." });

            var semester = await _context.Semesters
                .FirstOrDefaultAsync(s => s.Name == dto.SemesterName && s.SchoolYear == dto.SchoolYear);

            if (semester == null)
            {
                return BadRequest($"Không tìm thấy kỳ học {dto.SemesterName} - {dto.SchoolYear}");
            }

            var reward = new Reward
            {
                StudentCode = dto.StudentCode,
                Title = dto.Title,
                Description = dto.Description,
                Date = dto.Date,
                UserId = student.Id,
                SemesterId = semester.Id
            };

            _context.Rewards.Add(reward);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm khen thưởng thành công.", data = reward });
        }

        // GET: api/Reward/student/{studentCode}
        [HttpGet("student/{studentCode}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetRewardsByStudent(string studentCode)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userStudentCode = User.FindFirst("StudentCode")?.Value;

            // Nếu là student thì chỉ được xem của chính mình
            if (userRole == "Student" && userStudentCode != studentCode)
            {
                return Forbid(); // Trả về 403 Forbidden
            }

            var rewards = await _context.Rewards
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

            return Ok(rewards);
        }



        // 🟠 ADMIN sửa
        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateReward(Guid id, [FromBody] RewardDto dto)
        {
            var reward = await _context.Rewards.FindAsync(id);
            if (reward == null)
                return NotFound(new { message = "Không tìm thấy khen thưởng." });

            reward.Title = dto.Title;
            reward.Description = dto.Description;
            reward.Date = dto.Date;
            reward.StudentCode = dto.StudentCode;



            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật khen thưởng thành công.", data = reward });
        }

        // 🔴 ADMIN xóa
        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReward(Guid id)
        {
            var reward = await _context.Rewards.FindAsync(id);
            if (reward == null)
                return NotFound(new { message = "Không tìm thấy khen thưởng." });

            _context.Rewards.Remove(reward);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa khen thưởng thành công." });
        }

    }
}