using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.Products
{
    public class Order
    {
        public Guid OrderId { get; set; } = Guid.NewGuid();
        public string StudentId { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? TransactionHash { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}