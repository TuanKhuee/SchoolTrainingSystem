using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.Transfer
{
    public class CheckoutDto
    {
        public string StudentAddress { get; set; } = null!;
        public string TxHash { get; set; } = null!;
    }
}