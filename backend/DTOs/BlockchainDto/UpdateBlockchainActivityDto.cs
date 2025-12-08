using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DTOs.BlockchainDto
{
    public class UpdateBlockchainActivityDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string RewardAmount { get; set; }
        public bool IsActive { get; set; }
    }
}