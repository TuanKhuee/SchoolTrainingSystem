using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models.Products;
using Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ProductService
    {
        private readonly ApplicationDbContext _db;
        public ProductService(ApplicationDbContext db) { _db = db; }

        public async Task<List<Products>> GetAllAsync() => await _db.Products.ToListAsync();
        public async Task<Products?> GetByIdAsync(Guid id) => await _db.Products.FindAsync(id);

        public async Task<Products> CreateAsync(Products p)
        {
            _db.Products.Add(p);
            await _db.SaveChangesAsync();
            return p;
        }

        public async Task<Products?> UpdateAsync(Guid id, Products updated)
        {
            var p = await _db.Products.FindAsync(id);
            if (p == null) return null;
            p.Name = updated.Name;
            p.Description = updated.Description;
            p.Price = updated.Price;
            p.Stock = updated.Stock;
            p.ImageUrl = updated.ImageUrl;
            await _db.SaveChangesAsync();
            return p;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var p = await _db.Products.FindAsync(id);
            if (p == null) return false;
            _db.Products.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
