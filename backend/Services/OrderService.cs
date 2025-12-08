using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using backend.Models.Products;
using Data;
using Microsoft.EntityFrameworkCore;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.StandardTokenEIP20;
using Nethereum.Util;
using Nethereum.Web3;
using Services;

namespace backend.Services
{
    public class OrderService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly WalletService _walletService;

        public OrderService(ApplicationDbContext db, IConfiguration config, WalletService walletService)
        {
            _db = db;
            _config = config;
            _walletService = walletService;
        }

        /// <summary>
        /// Checkout (non-custodial recommended): frontend sends txHash after student signs transfer token -> canteenAddress.
        /// Server verifies txHash on chain (ERC20) and then creates Order.
        /// </summary>
        public async Task<Order> CheckoutAsync(string studentId, string studentAddress, string txHash)
        {
            // Load cart
            var cart = await _db.CartItems.Include(c => c.Product)
                .Where(c => c.StudentId == studentId).ToListAsync();
            if (!cart.Any()) throw new Exception("Cart is empty");

            decimal total = cart.Sum(c => c.Product!.Price * c.Quantity);
            if (total <= 0) throw new Exception("Total invalid");

            // config blockchain
            var rpc = _config["Blockchain:NodeUrl"];
            var tokenAddress = _config["Blockchain:VkuCoinAddress"]; // ERC20 token address
            if (string.IsNullOrEmpty(rpc) || string.IsNullOrEmpty(tokenAddress))
                throw new Exception("Blockchain config missing");

            // Lấy canteen address từ DB
            var canteenWallet = await _db.Users
                .Include(u => u.Wallet)
                .Where(u => u.Role == "Staff" && u.IsStaff == true)
                .Select(u => u.Wallet)
                .FirstOrDefaultAsync();

            if (canteenWallet == null)
                throw new Exception("Canteen wallet not found");

            var canteenAddress = canteenWallet.Address;

            var web3 = new Web3(rpc);

            // 1) verify tx receipt exists
            var receipt = await web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
            if (receipt == null) throw new Exception("Transaction not mined yet or not found");

            // 2) verify transfer event: from studentAddress => canteenAddress with amount == total
            var tokenService = new StandardTokenService(web3, tokenAddress);
            var decimals = await tokenService.DecimalsQueryAsync();
            var expectedValue = UnitConversion.Convert.ToWei(total, (int)decimals); // BigInteger

            var transferEvent = web3.Eth.GetEvent<TransferEventDTO>(tokenAddress);
            var allTransfers = transferEvent.DecodeAllEventsForEvent(receipt.Logs);
            bool matched = allTransfers.Any(e =>
                string.Equals(e.Event.From, studentAddress, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(e.Event.To, canteenAddress, StringComparison.OrdinalIgnoreCase) &&
                e.Event.Value == expectedValue);

            if (!matched)
                throw new Exception("Transfer event not found or amount mismatch. Ensure the tx transfers correct amount to canteen.");

            // 3) create order inside DB transaction
            using (var tx = await _db.Database.BeginTransactionAsync())
            {
                foreach (var item in cart)
                {
                    var p = await _db.Products.FindAsync(item.ProductId);
                    if (p == null) throw new Exception($"Product {item.ProductId} not found");
                    if (p.Stock < item.Quantity) throw new Exception($"Not enough stock for {p.Name}");
                    p.Stock -= item.Quantity;
                }

                var order = new Order
                {
                    StudentId = studentId,
                    TotalAmount = total,
                    TransactionHash = txHash,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Orders.Add(order);
                await _db.SaveChangesAsync();

                foreach (var item in cart)
                {
                    _db.OrderItems.Add(new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Product!.Price
                    });
                }

                // clear cart
                _db.CartItems.RemoveRange(cart);

                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return order;
            }
        }

    }

    // DTO for decoding Transfer events
    public class TransferEventDTO : IEventDTO
    {
        [Parameter("address", "_from", 1, true)]
        public string From { get; set; }

        [Parameter("address", "_to", 2, true)]
        public string To { get; set; }

        [Parameter("uint256", "_value", 3, false)]
        public BigInteger Value { get; set; }
    }
}
