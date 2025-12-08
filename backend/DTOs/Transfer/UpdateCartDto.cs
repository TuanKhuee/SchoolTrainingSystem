using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.Transfer
{
    public class UpdateCartDto
    {
        public Guid CartItemId { get; set; }
        public int Quantity { get; set; }
    }
}