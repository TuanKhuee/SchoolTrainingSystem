using System;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using backend.Models;
using backend.Models.Products;
using Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nethereum.Hex.HexTypes;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;

namespace Services
{
    public class StudentPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StudentPaymentService> _logger;
        private readonly string _vkuCoinAddress;
        private readonly string _vkuCoinAbi;
        private readonly string _centralWalletPrivateKey;
        private readonly string _nodeUrl;

        // expose for controllers if needed
        public string VkuCoinAddress => _vkuCoinAddress;
        public string VkuCoinAbi => _vkuCoinAbi;

        public StudentPaymentService(
            ApplicationDbContext context,
            ILogger<StudentPaymentService> logger,
            BlockchainService blockchainService)
        {
            _context = context;
            _logger = logger;

            _vkuCoinAddress = blockchainService.VkuCoinAddress ?? throw new ArgumentNullException(nameof(blockchainService.VkuCoinAddress));
            // load ABI (blocking here for simplicity)
            _vkuCoinAbi = blockchainService.LoadAbi("VkuCoin").GetAwaiter().GetResult();
            _centralWalletPrivateKey = blockchainService.CentralWalletPrivateKey ?? throw new ArgumentNullException(nameof(blockchainService.CentralWalletPrivateKey));
            _nodeUrl = blockchainService.GetNodeUrl() ?? throw new ArgumentNullException(nameof(blockchainService.GetNodeUrl));
        }

        // Checkout toàn bộ giỏ hàng của student (high-level)
        public async Task<CheckoutResult> CheckoutCart(string studentId)
        {
            // 1. load student & staff
            var student = await _context.Users.Include(u => u.Wallet).FirstOrDefaultAsync(u => u.Id == studentId);
            var staff = await _context.Users.Include(u => u.Wallet).FirstOrDefaultAsync(u => u.Role == "Staff");

            if (student?.Wallet == null) return new CheckoutResult(false, "Student wallet not found");
            if (staff?.Wallet == null) return new CheckoutResult(false, "Staff wallet not found");

            // 2. load cart
            var cartItems = await _context.CartItems.Include(c => c.Product)
                .Where(c => c.StudentId == studentId).ToListAsync();

            if (!cartItems.Any()) return new CheckoutResult(false, "Cart is empty");

            decimal totalAmount = cartItems.Sum(c => c.Product!.Price * c.Quantity);
            if (totalAmount <= 0) return new CheckoutResult(false, "Invalid total amount");

            // 3. ensure student has token allowance or auto-approve
            // We'll:
            //  - check allowance(student, central)
            //  - if allowance < amount: top-up small ETH to student (from central) so student can send approve()
            //  - call approve() signed with studentPrivateKey (so student gives allowance to central)
            //  - then central calls transferFrom(student, staff, amount)

            var studentAddress = student.Wallet.Address;
            var centralAccount = new Account(_centralWalletPrivateKey);
            var centralWeb3 = new Web3(centralAccount, _nodeUrl);

            try
            {
                // get decimals
                var contractForDecimals = centralWeb3.Eth.GetContract(_vkuCoinAbi, _vkuCoinAddress);
                var decimalsFn = contractForDecimals.GetFunction("decimals");
                byte decimals = await decimalsFn.CallAsync<byte>();

                // compute wei amount for token
                var weiAmount = UnitConversion.Convert.ToWei(totalAmount, decimals);

                // 3.1 check allowance
                var allowance = await GetAllowanceAsync(studentAddress, centralAccount.Address);

                if (allowance < weiAmount)
                {
                    // need to auto-approve: ensure student has ETH for gas, then call approve from student's key
                    // 1) top-up minimal ETH to student if needed
                    var needsEth = await StudentNeedsEthForApprove(studentAddress);
                    if (needsEth)
                    {
                        var topUpReceipt = await TopUpEthToStudentAsync(centralWeb3, centralAccount.Address, studentAddress, 0.002m); // 0.002 ETH
                        if (topUpReceipt == null)
                        {
                            return new CheckoutResult(false, "Failed to top-up ETH to student for approve gas");
                        }
                    }

                    // 2) call approve using student's private key
                    if (string.IsNullOrEmpty(student.Wallet.PrivateKey))
                        return new CheckoutResult(false, "Student private key missing for auto-approve");

                    var approveResult = await ApproveFromStudentAsync(student.Wallet.PrivateKey, centralAccount.Address, weiAmount);
                    if (!approveResult.Success)
                        return new CheckoutResult(false, $"Approve failed: {approveResult.Message}");

                    // refresh allowance
                    allowance = await GetAllowanceAsync(studentAddress, centralAccount.Address);
                    if (allowance < weiAmount)
                        return new CheckoutResult(false, "Allowance still insufficient after approve");
                }

                // 3.2 central calls transferFrom(student, staff, amount)
                var transferResult = await TransferFromByCentralAsync(centralWeb3, centralAccount, studentAddress, staff.Wallet.Address, weiAmount);
                if (!transferResult.Success)
                    return new CheckoutResult(false, $"Transfer failed: {transferResult.Message}");

                // 4. Create order and update DB
                var order = new Order
                {
                    StudentId = studentId,
                    TotalAmount = totalAmount,
                    TransactionHash = transferResult.TransactionHash,
                    CreatedAt = DateTime.UtcNow
                };

                foreach (var item in cartItems)
                {
                    order.Items.Add(new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Product!.Price
                    });

                    // decrease stock
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product != null) product.Stock -= item.Quantity;
                }

                _context.Orders.Add(order);
                _context.CartItems.RemoveRange(cartItems);

                // update cached balances (optional — you may prefer to call SyncWalletBalance)
                student.Wallet.Balance -= totalAmount;
                staff.Wallet.Balance += totalAmount;

                // add tx log
                _context.TransactionLogs.Add(new TransactionLog
                {
                    UserId = studentId,
                    Amount = (int)totalAmount,
                    TransactionType = "Purchase",
                    Description = $"Checkout payment to staff {staff.Id}",
                    TransactionHash = transferResult.TransactionHash,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                return new CheckoutResult(true, "Checkout successful", order.OrderId, transferResult.TransactionHash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckoutCart error");
                return new CheckoutResult(false, ex.Message);
            }
        }

        // get allowance student -> central : returns BigInteger (raw token amount)
        private async Task<BigInteger> GetAllowanceAsync(string ownerAddress, string spenderAddress)
        {
            try
            {
                var web3 = new Web3(_nodeUrl);
                var contract = web3.Eth.GetContract(_vkuCoinAbi, _vkuCoinAddress);
                var allowanceFunction = contract.GetFunction("allowance");
                var allowance = await allowanceFunction.CallAsync<BigInteger>(ownerAddress, spenderAddress);
                return allowance;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetAllowanceAsync failed");
                return BigInteger.Zero;
            }
        }

        // check if student has enough ETH to send approve tx (approx)
        private async Task<bool> StudentNeedsEthForApprove(string studentAddress)
        {
            try
            {
                var web3 = new Web3(_nodeUrl);
                var balanceWei = await web3.Eth.GetBalance.SendRequestAsync(studentAddress);
                // require at least ~0.0005 ETH
                var minWei = Web3.Convert.ToWei(0.0005m);
                return balanceWei.Value < minWei;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "StudentNeedsEthForApprove failed");
                // if uncertain, return true to top up
                return true;
            }
        }

        // top-up small ETH amount from central to student to allow approve tx
        private async Task<TransactionReceipt?> TopUpEthToStudentAsync(Web3 centralWeb3, string fromAddress, string toAddress, decimal ethAmount)
        {
            try
            {
                // Use transfer service to send ETH and wait
                var transferService = centralWeb3.Eth.GetEtherTransferService();
                var receipt = await transferService.TransferEtherAndWaitForReceiptAsync(toAddress, ethAmount);
                return receipt;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TopUpEthToStudentAsync failed");
                return null;
            }
        }

        // Approve from student (uses student private key) so central can call transferFrom
        private async Task<TransactionResult> ApproveFromStudentAsync(string studentPrivateKey, string spenderAddress, BigInteger weiAmount)
        {
            try
            {
                var studentAccount = new Account(studentPrivateKey);
                var web3 = new Web3(studentAccount, _nodeUrl);

                var contract = web3.Eth.GetContract(_vkuCoinAbi, _vkuCoinAddress);
                var approveFunction = contract.GetFunction("approve");

                // send approve signed by student
                var txHash = await approveFunction.SendTransactionAsync(
                    studentAccount.Address,
                    new HexBigInteger(200000),
                    new HexBigInteger(0),
                    spenderAddress,
                    weiAmount
                );

                // wait for receipt
                var receipt = await web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
                int retry = 0;
                while (receipt == null && retry < 30)
                {
                    await Task.Delay(1000);
                    receipt = await web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
                    retry++;
                }

                if (receipt == null || receipt.Status.Value != 1)
                    return new TransactionResult(false, $"Approve tx failed or not mined: {txHash}");

                return new TransactionResult(true, "Approve succeeded", null, txHash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ApproveFromStudentAsync failed");
                return new TransactionResult(false, ex.Message);
            }
        }

        // Central (relayer) calls transferFrom(student, staff, amount)
        private async Task<TransactionResult> TransferFromByCentralAsync(Web3 centralWeb3, Account centralAccount, string studentAddress, string staffAddress, BigInteger weiAmount)
        {
            try
            {
                var contract = centralWeb3.Eth.GetContract(_vkuCoinAbi, _vkuCoinAddress);
                var transferFromFn = contract.GetFunction("transferFrom");

                var txHash = await transferFromFn.SendTransactionAsync(
                    centralAccount.Address,
                    new HexBigInteger(900000),
                    new HexBigInteger(0),
                    studentAddress,
                    staffAddress,
                    weiAmount
                );

                // wait for receipt
                var receipt = await centralWeb3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
                int retry = 0;
                while (receipt == null && retry < 30)
                {
                    await Task.Delay(1000);
                    receipt = await centralWeb3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
                    retry++;
                }

                if (receipt == null || receipt.Status.Value != 1)
                    return new TransactionResult(false, $"transferFrom failed or not mined: {txHash}");

                return new TransactionResult(true, "transferFrom succeeded", null, txHash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TransferFromByCentralAsync failed");
                return new TransactionResult(false, ex.Message);
            }
        }

        // ---- Models for results ----
        public class TransactionResult
        {
            public bool Success { get; }
            public string Message { get; }
            public decimal? NewBalance { get; }
            public string TransactionHash { get; }

            public TransactionResult(bool success, string message, decimal? newBalance = null, string transactionHash = null)
            {
                Success = success;
                Message = message;
                NewBalance = newBalance;
                TransactionHash = transactionHash;
            }
        }

        public class CheckoutResult
        {
            public bool Success { get; }
            public string Message { get; }
            public Guid? OrderId { get; }
            public string? TransactionHash { get; }

            public CheckoutResult(bool success, string message, Guid? orderId = null, string? transactionHash = null)
            {
                Success = success;
                Message = message;
                OrderId = orderId;
                TransactionHash = transactionHash;
            }
        }
    }
}
