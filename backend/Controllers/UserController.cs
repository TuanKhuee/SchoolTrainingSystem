using System;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserController> _logger;

        public UserController(UserManager<User> userManager, ILogger<UserController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                // Get current user ID from JWT token
                var userId = User.FindFirstValue("UserId");
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { Message = "Không tìm thấy thông tin người dùng" });

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound(new { Message = "Không tìm thấy người dùng" });

                // Verify current password
                var isCurrentPasswordCorrect = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
                if (!isCurrentPasswordCorrect)
                    return BadRequest(new { Message = "Mật khẩu hiện tại không đúng" });

                // Change password
                var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { Message = "Đổi mật khẩu thất bại", Errors = errors });
                }

                return Ok(new { Message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đổi mật khẩu");
                return StatusCode(500, new { Message = "Lỗi server khi đổi mật khẩu" });
            }
        }
    }
}
