using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs.SystemTrainingDto;
using backend.Models;
using backend.Models.SystemTranings;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.SystemTrainingController
{
    [Authorize]
    [Route("api/admin")]
    [ApiController]
    public class AdminSystemController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminSystemController(
            UserManager<User> userManager,
            ApplicationDbContext context,
            ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        [HttpPost("AddParentInfo/{studentCode}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddParentInfo(string studentCode, [FromBody] ParentInfoDto dto)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.StudentCode == studentCode);
            if (user == null)
                return NotFound(new { message = "Student not found" });

            var parent = new ParentInfo
            {
                UserId = user.Id,
                StudentCode = user.StudentCode,
                FullName = dto.FullName,
                DateOfBirth = dto.DateOfBirth,
                CCCD = dto.CCCD,
                PlaceBorn = dto.PlaceBorn,
                Education = dto.Education,
                Career = dto.Career,
                Living = dto.Living,
                Phone = dto.Phone,
                Email = dto.Email,
                Relationship = dto.Relationship
            };

            _context.ParentInfos.Add(parent);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Parent info added successfully" });
        }

        [HttpGet("GetParentInfos/{studentCode}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetParentInfos(string studentCode)
        {
            var parents = await _context.ParentInfos
                .Where(p => p.StudentCode == studentCode)
                .ToListAsync();

            if (!parents.Any())
                return NotFound(new { message = "No parent info found" });

            return Ok(parents);
        }

        [HttpPut("UpdateParentInfo/{studentCode}/{relationship}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateParentInfo(string studentCode, string relationship, [FromBody] ParentInfoDto dto)
        {
            var parent = await _context.ParentInfos
                .FirstOrDefaultAsync(p => p.StudentCode == studentCode && p.Relationship == relationship);

            if (parent == null)
                return NotFound(new { message = "Không tìm thấy thông tin phụ huynh" });

            // Cập nhật thông tin
            parent.FullName = dto.FullName;
            parent.DateOfBirth = dto.DateOfBirth;
            parent.CCCD = dto.CCCD;
            parent.PlaceBorn = dto.PlaceBorn;
            parent.Education = dto.Education;
            parent.Career = dto.Career;
            parent.Living = dto.Living;
            parent.Phone = dto.Phone;
            parent.Email = dto.Email;

            _context.ParentInfos.Update(parent);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin phụ huynh thành công" });
        }


    }

}