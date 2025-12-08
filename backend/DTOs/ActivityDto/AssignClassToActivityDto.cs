using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace DTOs.ActivityDto
{
    public class AssignClassToActivityDto
    {
        [Required]
        public string ClassNames { get; set; } 
    }
}