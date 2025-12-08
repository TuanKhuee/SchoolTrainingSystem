using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.Transfer
{
    public class CartAddDto
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }
}