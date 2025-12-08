using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DTOs.BlockchainDto
{
    public class BatchCompleteActivityDto
    {
         public string[] UserIds { get; set; }
        public string ActivityId { get; set; }
    }
}