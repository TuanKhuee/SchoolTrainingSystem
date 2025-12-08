using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using backend.Models;
using ExcelDataReader;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Services
{
    public class ExcelService
    {
        private readonly ILogger<ExcelService> _logger;
        private readonly WalletService _walletService;
        private readonly UserManager<User> _userManager;
        private readonly Dictionary<string, int> _localCounters = new();

        public ExcelService(ILogger<ExcelService> logger, WalletService walletService, UserManager<User> userManager)
        {
            _logger = logger;
            _walletService = walletService;
            _userManager = userManager;
        }

        public async Task<List<User>> ReadUsersFromExcel(Stream fileStream)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            var users = new List<User>();
            _logger.LogInformation("🔍 Bắt đầu đọc file Excel...");

            try
            {
                using (var reader = ExcelReaderFactory.CreateReader(fileStream))
                {
                    var result = reader.AsDataSet(new ExcelDataSetConfiguration()
                    {
                        ConfigureDataTable = (_) => new ExcelDataTableConfiguration()
                        {
                            UseHeaderRow = true
                        }
                    });

                    var dataTable = result.Tables[0];
                    _logger.LogInformation($"📄 Tổng số dòng đọc được: {dataTable.Rows.Count}");

                    for (int i = 0; i < dataTable.Rows.Count; i++)
                    {
                        var row = dataTable.Rows[i];
                        if (row.ItemArray.All(field => field is DBNull || string.IsNullOrWhiteSpace(field.ToString())))
                            continue;

                        try
                        {
                            string fullName = GetStringValue(TryGetColumnValue(row, "Họ tên", "HoTen"));
                            string major = GetStringValue(TryGetColumnValue(row, "Ngành", "Nganh"));
                            DateTime dob = GetDateValue(TryGetColumnValue(row, "Ngày sinh", "NgaySinh"));
                            string schoolYear = GetStringValue(TryGetColumnValue(row, "Niên khóa", "NienKhoa"));

                            if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(schoolYear) || string.IsNullOrWhiteSpace(major))
                            {
                                _logger.LogWarning($"⚠️ Dòng {i + 1} thiếu dữ liệu bắt buộc.");
                                continue;
                            }

                            // --- Sinh mã ngành & niên khóa ---
                            string yearStart = schoolYear.Split('-')[0];
                            string yearSuffix = yearStart.Substring(2, 2);
                            string majorCode = GetMajorCode(major);

                            // --- Sinh shortName cho email (đã normalize và convert 'đ' -> 'd') ---
                            string shortName = GenerateShortName(fullName); // ví dụ: "khuett" hoặc "sondt"

                            // --- Tạo email dạng shortName.21it@vku.udn.vn ---
                            string email = $"{shortName}.{yearSuffix}{majorCode}@vku.udn.vn";

                            // --- Sinh password dạng Khue10062003@ ---
                            string firstName = fullName.Split(' ').Last();

                            string password = $"{RemoveDiacritics(Capitalize(firstName))}{dob:ddMMyyyy}@";

                            // --- Sinh studentCode ---
                            string prefix = yearSuffix + majorCode;
                            if (!_localCounters.ContainsKey(prefix))
                            {
                                int existingCount = await _userManager.Users
                                    .CountAsync(u => u.StudentCode.StartsWith(prefix));
                                _localCounters[prefix] = existingCount;
                            }

                            _localCounters[prefix]++;
                            string studentCode = $"{prefix}{_localCounters[prefix]:D3}";

                            // --- Kiểm tra user tồn tại chưa (theo tên + DOB + mã ngành) ---
                            var existingUser = await _userManager.Users
                                .FirstOrDefaultAsync(u => u.FullName == fullName && u.DateOfBirth == dob && u.MajorCode == majorCode);

                            if (existingUser == null)
                            {
                                var user = new User
                                {
                                    FullName = fullName,
                                    UserName = email,
                                    Email = email,
                                    StudentCode = studentCode,
                                    MajorName = major,
                                    MajorCode = majorCode,
                                    Class = $"{major} - {schoolYear}",
                                    DateOfBirth = dob,
                                    SchoolYear = schoolYear,
                                    YearLevel = CalculateYearLevel(schoolYear),
                                    Role = "Student",
                                    IsStudent = true
                                };

                                var createResult = await _userManager.CreateAsync(user, password);

                                if (createResult.Succeeded)
                                {
                                    users.Add(user);
                                    await _walletService.CreateWalletWithZeroBalance(user.Id);
                                    _logger.LogInformation($"✅ Đã tạo SV mới: {studentCode} - {email}");
                                }
                                else
                                {
                                    _logger.LogWarning($"❌ Không thể tạo user {studentCode}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"ℹ️ Sinh viên đã tồn tại: {existingUser.StudentCode}");
                                // nếu muốn cập nhật email về chuẩn mới, có thể đặt logic ở đây
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"❌ Lỗi xử lý dòng {i + 1}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🚨 Lỗi khi đọc file Excel");
                throw;
            }

            _logger.LogInformation($"🏁 Hoàn tất import, tạo {users.Count} sinh viên mới");
            return users;
        }

        // ----------------- Helper functions -----------------

        private object TryGetColumnValue(System.Data.DataRow row, params string[] possibleColumnNames)
        {
            foreach (var columnName in possibleColumnNames)
            {
                if (row.Table.Columns.Contains(columnName))
                {
                    return row[columnName];
                }
            }
            return null;
        }

        private string GetStringValue(object value)
        {
            if (value == null || value is DBNull)
                return string.Empty;
            return value.ToString().Trim();
        }

        private DateTime GetDateValue(object value)
        {
            if (value == null || value is DBNull)
                return new DateTime(1900, 1, 1);

            if (value is DateTime date)
                return date;

            if (DateTime.TryParse(value.ToString(), out date))
                return date;

            return new DateTime(1900, 1, 1);
        }

        private string GetMajorCode(string major)
        {
            if (string.IsNullOrEmpty(major)) return "xx";
            major = major.ToLower();
            if (major.Contains("công nghệ thông tin")) return "it";
            if (major.Contains("trí tuệ nhân tạo")) return "ai";
            if (major.Contains("công nghệ kĩ thuật máy tính")) return "ce";
            if (major.Contains("an toàn thông tin")) return "at";
            if (major.Contains("công nghệ truyền thông")) return "ct";
            if (major.Contains("công nghệ tài chính")) return "ft";
            if (major.Contains("quản trị kinh doanh")) return "ba";
            return "xx";
        }

        private string GenerateShortName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return "user";

            // lowercase để consistent
            var parts = fullName.Trim().ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "user";

            // lấy họ cuối cùng (tên) đã remove diacritics và convert đ -> d
            string lastName = RemoveDiacritics(parts.Last());

            // lấy chữ cái đầu của các phần trước tên (họ + tên lót), cũng remove diacritics
            var sb = new StringBuilder();
            foreach (var p in parts.Take(parts.Length - 1))
            {
                var r = RemoveDiacritics(p);
                if (!string.IsNullOrEmpty(r))
                {
                    sb.Append(r[0]); // ký tự đầu tiên sau normalize
                }
            }

            var shortName = (lastName + sb.ToString()).ToLowerInvariant();

            // đảm bảo chỉ còn a-z0-9 (loại bỏ dấu, ký tự đặc biệt)
            shortName = Regex.Replace(shortName, @"[^a-z0-9]", string.Empty);

            if (string.IsNullOrEmpty(shortName)) return "user";
            return shortName;
        }

        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            // Chuyển đ Đ thành d D trước (vì ký tự này không phải ghép dấu)
            text = text.Replace('đ', 'd').Replace('Đ', 'D');

            // Normalize và bỏ ký tự NonSpacingMark
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in normalized)
            {
                var uc = CharUnicodeInfo.GetUnicodeCategory(c);
                if (uc != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            var result = sb.ToString().Normalize(NormalizationForm.FormC);

            // Loại bỏ ký tự không phải ascii letters/digits (ví dụ dấu, khoảng trắng, gạch nối...)
            result = Regex.Replace(result, @"[^A-Za-z0-9]", string.Empty);

            return result;
        }

        private string Capitalize(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            return char.ToUpper(input[0]) + input.Substring(1).ToLower();
        }

        private int CalculateYearLevel(string schoolYear)
        {
            try
            {
                var parts = schoolYear.Split('-');
                if (parts.Length != 2) return -1;

                int startYear = int.Parse(parts[0]);
                DateTime startDate = new DateTime(startYear, 9, 1); // giả sử năm học bắt đầu từ tháng 9

                DateTime now = DateTime.Now;

                if (now < startDate)
                    return 1; // chưa đến thời gian nhập học

                // Số tháng đã trôi qua
                int totalMonths = ((now.Year - startDate.Year) * 12) + now.Month - startDate.Month;

                // index kỳ (mỗi kỳ 6 tháng)
                int semesterIndex = totalMonths / 6;

                int yearLevel = (semesterIndex / 2) + 1;

                if (yearLevel < 1) yearLevel = 1;
                if (yearLevel > 5) yearLevel = 5;

                return yearLevel;

            }
            catch
            {
                return -1;
            }

        }
    }
}
