using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.Products
{
    public class CartItem
    {
        public Guid CartItemId { get; set; } = Guid.NewGuid();
        public string StudentId { get; set; } = null!; // AspNetUsers.Id (string)
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public Products? Product { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}