using System;
using System.Linq;
using System.Threading.Tasks;
using Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.StaffController
{
    [ApiController]
    [Route("api/staff/dashboard")]
    [Authorize(Roles = "Staff")]
    public class StaffDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StaffDashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;

            var totalProducts = await _context.Products.CountAsync();

            var todayOrders = await _context.Orders
                .Where(o => o.CreatedAt.Date == today)
                .CountAsync();

            var totalCustomers = await _context.Orders
                .Select(o => o.StudentId)
                .Distinct()
                .CountAsync();

            // Revenue for last 7 days
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => today.AddDays(-i))
                .OrderBy(d => d)
                .ToList();

            var revenueData = await _context.Orders
                .Where(o => o.CreatedAt >= today.AddDays(-6))
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            var revenueStats = last7Days.Select(date => new
            {
                Date = date.ToString("dd/MM"),
                Revenue = revenueData.FirstOrDefault(r => r.Date == date)?.Revenue ?? 0
            });

            // Top 5 selling products
            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Product != null)
                .GroupBy(oi => oi.Product.Name)
                .Select(g => new
                {
                    Name = g.Key,
                    Sold = g.Sum(oi => oi.Quantity)
                })
                .Take(5)
                .ToListAsync();

            // Stock distribution for Pie Chart
            var products = await _context.Products.ToListAsync();
            var stockDistribution = new[]
            {
                new { Name = "Còn hàng (>10)", Value = products.Count(p => p.Stock > 10), Fill = "#22c55e" }, // Green
                new { Name = "Sắp hết (≤10)", Value = products.Count(p => p.Stock > 0 && p.Stock <= 10), Fill = "#eab308" }, // Yellow
                new { Name = "Hết hàng", Value = products.Count(p => p.Stock == 0), Fill = "#ef4444" } // Red
            }.Where(x => x.Value > 0).ToList();

            // Monthly Revenue (Last 30 days)
            var last30Days = Enumerable.Range(0, 30)
                .Select(i => today.AddDays(-i))
                .OrderBy(d => d)
                .ToList();

            var monthlyRevenueData = await _context.Orders
                .Where(o => o.CreatedAt >= today.AddDays(-29))
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            var monthlyRevenueStats = last30Days.Select(date => new
            {
                Date = date.ToString("dd/MM"),
                Revenue = monthlyRevenueData.FirstOrDefault(r => r.Date == date)?.Revenue ?? 0
            });

            return Ok(new
            {
                TotalProducts = totalProducts,
                TodayOrders = todayOrders,
                TotalCustomers = totalCustomers,
                RevenueStats = revenueStats,
                TopProducts = topProducts,
                StockDistribution = stockDistribution,
                MonthlyRevenueStats = monthlyRevenueStats
            });
        }
    }
}
