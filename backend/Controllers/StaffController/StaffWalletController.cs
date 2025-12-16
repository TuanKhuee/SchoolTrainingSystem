using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.Models;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Services;

namespace backend.Controllers.StaffController
{
    [Authorize(Roles = "Staff")]
    [Route("api/staff/wallet")]
    [ApiController]
    public class StaffWalletController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly WalletService _walletService;
        private readonly ILogger<StaffWalletController> _logger;
        private readonly BlockchainService _blockchainService;

        public StaffWalletController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            WalletService walletService,
            BlockchainService blockchainService,
            ILogger<StaffWalletController> logger)
        {
            _context = context;
            _userManager = userManager;
            _walletService = walletService;
            _blockchainService = blockchainService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetStaffWallet()
        {
            var userId = User.FindFirstValue("UserId");
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { Message = "User not found" });

            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound(new { Message = "No wallet found" });

            // Get VKU Token balance from service (which prioritizes blockchain but falls back to DB)
            var vkuBalance = await _walletService.GetWalletBalance(wallet.Address);

            return Ok(new
            {
                Address = wallet.Address,
                VkuBalance = vkuBalance,
                TokenSymbol = "VKU",
                ContractAddress = _blockchainService.VkuCoinAddress
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            var userId = User.FindFirstValue("UserId");

            var transactions = await _context.TransactionLogs
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Amount,
                    t.TransactionType,
                    t.Description,
                    t.TransactionHash,
                    t.CreatedAt,
                    Sender = "Hệ thống" // Default sender since we check ActivityReward mostly. 
                                        // Future improvement: Add SenderId to TransactionLog
                })
                .ToListAsync();

            return Ok(transactions);
        }
    }
}
