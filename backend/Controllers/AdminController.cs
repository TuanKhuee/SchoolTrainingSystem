using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs;
using backend.DTOs.Transfer;
using backend.Models;
using backend.Models.SystemTranings.Training;
using Data;
using DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Services;

namespace backend.Controllers
{
    [Authorize]
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ExcelService _excelService;
        private readonly WalletService _walletService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            UserManager<User> userManager,
            ExcelService excelService,
            WalletService walletService,
            ApplicationDbContext context,
            ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _excelService = excelService;
            _walletService = walletService;
            _context = context;
            _logger = logger;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("import-users")]
        public async Task<IActionResult> ImportUsers(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Vui lòng chọn file" });

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
                return BadRequest(new { Message = "Chỉ chấp nhận file Excel (.xlsx, .xls)" });

            try
            {
                using var stream = file.OpenReadStream();

                // ✅ ExcelService giờ trả về List<UserImportResult>
                var results = await _excelService.ReadUsersFromExcel(stream);

                return Ok(new
                {
                    Message = $"Hoàn thành import {results.Count} người dùng",
                    Results = results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý file Excel");
                return StatusCode(500, new { Message = "Lỗi khi xử lý file Excel", Error = ex.Message });
            }
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("students/all")]
        public async Task<IActionResult> GetStudents()
        {
            try
            {
                // Lấy tất cả sinh viên với thông tin ví
                var students = await _userManager.Users
                    .Where(u => u.Role == "Student")
                    .Include(u => u.Wallet)
                    .Select(u => new StudentDto
                    {
                        StudentCode = u.StudentCode,
                        FullName = u.FullName,
                        Email = u.Email,
                        Class = u.Class,
                        DateOfBirth = u.DateOfBirth,
                        WalletAddress = u.Wallet.Address,
                        WalletBalance = u.Wallet.Balance,
                    })
                    .ToListAsync();

                return Ok(students);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching students");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("students-by-class/{className}")]
        public async Task<IActionResult> GetStudentsByClass(string className)
        {
            try
            {
                // Lấy danh sách sinh viên cùng lớp
                var students = await _userManager.Users
                    .Where(u => u.Class == className && u.Role == "Student")
                    .Select(u => new StudentDto
                    {
                        StudentCode = u.StudentCode,
                        FullName = u.FullName,
                        Email = u.Email,
                        DateOfBirth = u.DateOfBirth,
                        WalletAddress = u.Wallet.Address,
                        WalletBalance = u.Wallet.Balance
                    })
                    .ToListAsync();

                return Ok(new
                {
                    ClassName = className,
                    TotalStudents = students.Count,
                    Students = students
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting students for class {className}");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("update-student/{studentCode}")]
        public async Task<IActionResult> UpdateStudent(string studentCode, [FromBody] UpdateStudentDto dto)
        {
            try
            {
                var student = await _userManager.Users
                    .Include(u => u.Wallet)
                    .FirstOrDefaultAsync(u => u.StudentCode == studentCode && u.Role == "Student");

                if (student == null)
                    return NotFound(new { Message = "Student not found" });

                // Lưu thông tin cũ
                var originalValues = new
                {
                    FullName = student.FullName,
                    Class = student.Class,
                    DateOfBirth = student.DateOfBirth,
                    Email = student.Email
                };

                // Chỉ cập nhật các trường có giá trị thực sự thay đổi
                if (dto.FullName != null)
                    student.FullName = dto.FullName;

                if (dto.Class != null)
                    student.Class = dto.Class;

                if (dto.DateOfBirth.HasValue)
                    student.DateOfBirth = dto.DateOfBirth.Value;

                if (!string.IsNullOrEmpty(dto.NewEmail))
                {
                    if (await _userManager.FindByEmailAsync(dto.NewEmail) != null)
                        return BadRequest(new { Message = "Email already exists" });

                    student.Email = dto.NewEmail;
                    student.UserName = dto.NewEmail;
                }

                // Kiểm tra xem có thay đổi gì không
                var changesDetected = student.FullName != originalValues.FullName ||
                                     student.Class != originalValues.Class ||
                                     student.DateOfBirth != originalValues.DateOfBirth ||
                                     student.Email != originalValues.Email;

                if (!changesDetected)
                    return Ok(new { Message = "No changes detected", Student = originalValues });

                var result = await _userManager.UpdateAsync(student);

                if (!result.Succeeded)
                    return BadRequest(new { Errors = result.Errors });

                return Ok(new
                {
                    Message = "Update successful",
                    Original = originalValues,
                    Updated = new
                    {
                        student.FullName,
                        student.Class,
                        student.DateOfBirth,
                        student.Email,
                        student.Wallet?.Address
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating student {studentCode}");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }


        [Authorize(Roles = "Admin")]
        [HttpDelete("delete-student/{studentCode}")]
        public async Task<IActionResult> DeleteStudent(string studentCode)
        {
            try
            {
                // Tìm sinh viên (không include wallet để xóa cascade)
                var student = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.StudentCode == studentCode && u.Role == "Student");

                if (student == null)
                    return NotFound(new { Message = "Không tìm thấy sinh viên" });

                // Xóa wallet trước (nếu cần xử lý gì đó trước khi xóa)
                var wallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.UserId == student.Id);

                if (wallet != null)
                    _context.Wallets.Remove(wallet);

                // Xóa user
                var result = await _userManager.DeleteAsync(student);

                if (!result.Succeeded)
                    return BadRequest(new { Errors = result.Errors });

                return Ok(new
                {
                    Message = $"Đã xóa sinh viên {studentCode}",
                    DeletedEmail = student.Email,
                    DeletedWallet = wallet?.Address
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi xóa sinh viên {studentCode}");
                return StatusCode(500, new { Message = "Lỗi server khi xóa" });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("reset-student-password/{studentCode}")]
        public async Task<IActionResult> ResetStudentPassword(string studentCode, [FromBody] ResetPasswordDto dto)
        {
            try
            {
                var student = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.StudentCode == studentCode && u.Role == "Student");

                if (student == null)
                    return NotFound(new { Message = "Không tìm thấy sinh viên" });

                // Remove old password
                var removeResult = await _userManager.RemovePasswordAsync(student);
                if (!removeResult.Succeeded)
                    return BadRequest(new { Message = "Lỗi khi xóa mật khẩu cũ", Errors = removeResult.Errors });

                // Add new password
                var addResult = await _userManager.AddPasswordAsync(student, dto.NewPassword);
                if (!addResult.Succeeded)
                    return BadRequest(new { Message = "Lỗi khi đặt mật khẩu mới", Errors = addResult.Errors });

                return Ok(new { Message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi đổi mật khẩu sinh viên {studentCode}");
                return StatusCode(500, new { Message = "Lỗi server khi đổi mật khẩu" });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("reset-teacher-password/{teacherCode}")]
        public async Task<IActionResult> ResetTeacherPassword(string teacherCode, [FromBody] ResetPasswordDto dto)
        {
            try
            {
                var teacher = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.TeacherCodes == teacherCode && u.Role == "Teacher");

                if (teacher == null)
                    return NotFound(new { Message = "Không tìm thấy giáo viên" });

                // Remove old password
                var removeResult = await _userManager.RemovePasswordAsync(teacher);
                if (!removeResult.Succeeded)
                    return BadRequest(new { Message = "Lỗi khi xóa mật khẩu cũ", Errors = removeResult.Errors });

                // Add new password
                var addResult = await _userManager.AddPasswordAsync(teacher, dto.NewPassword);
                if (!addResult.Succeeded)
                    return BadRequest(new { Message = "Lỗi khi đặt mật khẩu mới", Errors = addResult.Errors });

                return Ok(new { Message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi đổi mật khẩu giáo viên {teacherCode}");
                return StatusCode(500, new { Message = "Lỗi server khi đổi mật khẩu" });
            }
        }


        [Authorize(Roles = "Admin")]
        [HttpPost("create-teacher")]
        public async Task<IActionResult> CreateTeacher([FromBody] CreateTeacherDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra email đã tồn tại chưa
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return Conflict(new { Message = "Email đã được sử dụng" });

            // Kiểm tra TeacherCode đã tồn tại chưa
            var existingTeacherCode = await _userManager.Users
                .AnyAsync(u => u.TeacherCodes == dto.TeacherCode && u.Role == "Teacher");

            if (existingTeacherCode)
                return Conflict(new { Message = "Mã giáo viên đã tồn tại" });

            // Tạo user Teacher
            var teacher = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                UserName = dto.Email,
                Role = "Teacher",
                TeacherCodes = dto.TeacherCode,
                PhoneNumber = dto.PhoneNumber,

            };

            // Tạo tài khoản với password do Admin cung cấp
            var result = await _userManager.CreateAsync(teacher, dto.Password);

            if (!result.Succeeded)
            {
                // Hiển thị lỗi chi tiết nếu mật khẩu không hợp lệ
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { Message = "Tạo tài khoản teacher thất bại", Errors = errors });
            }

            return Ok(new
            {
                Message = "Tạo tài khoản teacher thành công",
                Teacher = new
                {
                    teacher.FullName,
                    teacher.Email,
                    teacher.TeacherCodes,
                    Password = dto.Password,
                    teacher.PhoneNumber
                }
            });
        }

        // 🔹 Lấy danh sách tất cả giáo viên
        [Authorize(Roles = "Admin")]
        [HttpGet("teachers")]
        public async Task<IActionResult> GetTeachers()
        {
            var teachers = await _userManager.Users
                .Where(u => u.Role == "Teacher")
                .OrderBy(u => u.TeacherCodes)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    TeacherCode = u.TeacherCodes,
                    u.PhoneNumber

                })
                .ToListAsync();

            return Ok(teachers);
        }



        // 🔹 Cập nhật thông tin giáo viên
        [Authorize(Roles = "Admin")]
        [HttpPut("update-teacher/{teacherCode}")]
        public async Task<IActionResult> UpdateTeacher(string teacherCode, [FromBody] UpdateTeacherDto dto)
        {
            try
            {
                var teacher = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.TeacherCodes == teacherCode && u.Role == "Teacher");

                if (teacher == null)
                    return NotFound(new { Message = "Không tìm thấy giáo viên" });

                // Lưu thông tin cũ
                var originalValues = new
                {
                    FullName = teacher.FullName,
                    PhoneNumber = teacher.PhoneNumber,
                    Email = teacher.Email
                };

                // ❗ Gán giá trị mới từ DTO
                teacher.FullName = dto.FullName;
                teacher.PhoneNumber = dto.PhoneNumber;

                // Nếu thay đổi email thì phải dùng SetEmailAsync
                if (teacher.Email != dto.NewEmail)
                {
                    var emailResult = await _userManager.SetEmailAsync(teacher, dto.NewEmail);
                    if (!emailResult.Succeeded)
                        return BadRequest(new { Errors = emailResult.Errors });
                }

                // Update các trường còn lại
                var result = await _userManager.UpdateAsync(teacher);

                if (!result.Succeeded)
                    return BadRequest(new { Errors = result.Errors });

                return Ok(new
                {
                    Message = "Cập nhật thành công",
                    Original = originalValues,
                    Updated = new
                    {
                        teacher.FullName,
                        teacher.PhoneNumber,
                        teacher.Email,
                        TeacherCode = teacher.TeacherCodes
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi cập nhật giáo viên {teacherCode}");
                return StatusCode(500, new { Message = "Lỗi server khi cập nhật" });
            }
        }

        private List<string> GetChangedFields(object oldObj, object newObj)
        {
            var changedFields = new List<string>();
            var oldProps = oldObj.GetType().GetProperties();
            var newProps = newObj.GetType().GetProperties();

            foreach (var oldProp in oldProps)
            {
                var newProp = newProps.FirstOrDefault(p => p.Name == oldProp.Name);
                if (newProp != null)
                {
                    var oldValue = oldProp.GetValue(oldObj)?.ToString();
                    var newValue = newProp.GetValue(newObj)?.ToString();

                    if (oldValue != newValue)
                    {
                        changedFields.Add(oldProp.Name);
                    }
                }
            }

            return changedFields;
        }





        [Authorize(Roles = "Admin")]
        [HttpGet("check-transaction/{txHash}")]
        public async Task<IActionResult> CheckTransactionStatus(
            string txHash,
            [FromServices] BlockchainService blockchainService)
        {
            try
            {
                // Create a Web3 instance
                var web3 = new Nethereum.Web3.Web3(blockchainService.GetNodeUrl());

                // Get transaction receipt
                var receipt = await web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);

                if (receipt == null)
                {
                    return Ok(new
                    {
                        TxHash = txHash,
                        Status = "Pending",
                        Message = "Transaction is still pending or not found"
                    });
                }

                bool success = receipt.Status.Value == 1;

                // Get transaction itself for more details
                var tx = await web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(txHash);

                return Ok(new
                {
                    TxHash = txHash,
                    Status = success ? "Success" : "Failed",
                    BlockNumber = receipt.BlockNumber.Value,
                    BlockHash = receipt.BlockHash,
                    GasUsed = receipt.GasUsed.Value.ToString(),
                    From = tx?.From,
                    To = tx?.To,
                    Value = tx != null ? Nethereum.Web3.Web3.Convert.FromWei(tx.Value.Value).ToString() : "0",
                    // Logs = receipt.Logs.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking transaction {txHash}");
                return StatusCode(500, new
                {
                    Message = "Error checking transaction status",
                    Error = ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("my-wallet")]
        public async Task<IActionResult> GetAdminWallet([FromServices] BlockchainService blockchainService)
        {
            try
            {
                var userId = User.FindFirstValue("UserId");
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return Unauthorized(new { Message = "Không tìm thấy người dùng admin" });

                var wallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.UserId == userId);

                if (wallet == null)
                    return NotFound(new { Message = "Không tìm thấy ví admin" });

                // Get VKU Token balance using WalletService
                var vkuBalance = await _walletService.GetWalletBalance(wallet.Address);

                // Sync wallet balance to ensure database is up to date
                await _walletService.SyncWalletBalance(wallet.Address);

                return Ok(new
                {
                    Address = wallet.Address,
                    VkuBalance = vkuBalance,
                    TokenSymbol = "VKU",
                    ContractAddress = blockchainService.VkuCoinAddress
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin wallet");
                return StatusCode(500, new { Message = "Lỗi khi lấy thông tin ví admin", Error = ex.Message });
            }
        }

        [HttpPost("create-Staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null)
                return BadRequest("Email đã tồn tại");

            var staff = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                Role = "Staff",
                IsStaff = true
            };

            var result = await _userManager.CreateAsync(staff, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // Tạo ví blockchain cho staff
            await _walletService.CreateWalletWithZeroBalance(staff.Id);

            return Ok(new { message = "Tạo tài khoản staff thành công!" });
        }
    }
}