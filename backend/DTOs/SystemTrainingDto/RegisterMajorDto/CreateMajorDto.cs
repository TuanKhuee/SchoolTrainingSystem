using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs.SystemTrainingDto.RegisterMajorDto
{
    public class CreateMajorDto
    {
         public string MajorCode { get; set; } = string.Empty;
        public string MajorName { get; set; } = string.Empty;
    }
}