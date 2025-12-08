using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; }
    }
}
