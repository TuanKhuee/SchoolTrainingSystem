using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend.DTOs
{
    public class UpdateTeacherDto
    {
        private const string DefaultStringValue = "string";

        private string _fullName;
        private string _phoneNumber;
        private string _newEmail;

        [StringLength(100)]
        public string FullName
        {
            get => _fullName;
            set => _fullName = (value != DefaultStringValue) ? value : null;
        }

        [Phone]
        public string PhoneNumber
        {
            get => _phoneNumber;
            set => _phoneNumber = (value != DefaultStringValue) ? value : null;
        }

        [EmailAddress]
        public string NewEmail
        {
            get => _newEmail;
            set => _newEmail = (value != DefaultStringValue) ? value : null;
        }
    }
}
