using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models.Products;
using Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class CartService
    {
        private readonly ApplicationDbContext _db;
        public CartService(ApplicationDbContext db) { _db = db; }

        public async Task AddAsync(string studentId, Guid productId, int qty)
        {
            if (qty <= 0) throw new ArgumentException("Quantity must be > 0");
            var product = await _db.Products.FindAsync(productId);
            if (product == null) throw new Exception("Product not found");

            var exist = await _db.CartItems
                .FirstOrDefaultAsync(c => c.StudentId == studentId && c.ProductId == productId);

            if (exist != null) exist.Quantity += qty;
            else _db.CartItems.Add(new CartItem { StudentId = studentId, ProductId = productId, Quantity = qty });

            await _db.SaveChangesAsync();
        }

        public async Task<List<CartItem>> GetCartAsync(string studentId)
        {
            return await _db.CartItems
                .Include(c => c.Product)
                .Where(c => c.StudentId == studentId)
                .ToListAsync();
        }

        public async Task UpdateQuantityAsync(string studentId, Guid cartItemId, int qty)
        {
            var item = await _db.CartItems.FirstOrDefaultAsync(c => c.CartItemId == cartItemId && c.StudentId == studentId);
            if (item == null) throw new Exception("Cart item not found");
            if (qty <= 0) { _db.CartItems.Remove(item); }
            else item.Quantity = qty;
            await _db.SaveChangesAsync();
        }

        public async Task RemoveAsync(string studentId, Guid cartItemId)
        {
            var item = await _db.CartItems.FirstOrDefaultAsync(c => c.CartItemId == cartItemId && c.StudentId == studentId);
            if (item == null) return;
            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync();
        }

        public async Task ClearAsync(string studentId)
        {
            var items = _db.CartItems.Where(c => c.StudentId == studentId);
            _db.CartItems.RemoveRange(items);
            await _db.SaveChangesAsync();
        }
    }
}
