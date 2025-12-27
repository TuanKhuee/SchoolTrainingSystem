using backend.Models;
using backend.Models.Products;

namespace backend.Tests.Fixtures;

public static class TestDataFixture
{
    public static User CreateTestStudent(string email = "student@vku.udn.vn", string studentCode = "20IT001")
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            Email = email,
            FullName = "Test Student",
            Role = "Student",
            StudentCode = studentCode,
            IsStudent = true,
            DateOfBirth = new DateTime(2002, 1, 1),
            EmailConfirmed = true
        };
    }

    public static User CreateTestTeacher(string email = "teacher@vku.udn.vn", string teacherCode = "GV001")
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            Email = email,
            FullName = "Test Teacher",
            Role = "Teacher",
            TeacherCodes = teacherCode,
            IsStudent = false,
            DateOfBirth = new DateTime(1985, 1, 1),
            EmailConfirmed = true
        };
    }

    public static User CreateTestAdmin(string email = "admin@vku.udn.vn")
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            Email = email,
            FullName = "Test Admin",
            Role = "Admin",
            IsStudent = false,
            DateOfBirth = new DateTime(1980, 1, 1),
            EmailConfirmed = true
        };
    }

    public static User CreateTestStaff(string email = "staff@vku.udn.vn", string staffCode = "NV001")
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            Email = email,
            FullName = "Test Staff",
            Role = "Staff",
            StaffCode = staffCode,
            IsStudent = false,
            DateOfBirth = new DateTime(1990, 1, 1),
            EmailConfirmed = true
        };
    }

    public static Wallet CreateTestWallet(string userId, decimal balance = 1000m)
    {
        return new Wallet
        {
            UserId = userId,
            Address = "0x" + Guid.NewGuid().ToString("N"),
            PrivateKey = Guid.NewGuid().ToString("N"),
            Balance = balance
        };
    }

    public static Products CreateTestProduct(string name = "Test Product", decimal price = 100m, int stock = 50)
    {
        return new Products
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Description = "Test product description",
            Price = price,
            Stock = stock,
            ImageUrl = "/images/test-product.jpg",
            CategoryId = Guid.NewGuid()
        };
    }

    public static CartItem CreateTestCartItem(string studentId, Guid productId, int quantity = 1)
    {
        return new CartItem
        {
            CartItemId = Guid.NewGuid(),
            StudentId = studentId,
            ProductId = productId,
            Quantity = quantity
        };
    }

    public static Order CreateTestOrder(string studentId, decimal totalAmount = 500m)
    {
        return new Order
        {
            OrderId = Guid.NewGuid(),
            StudentId = studentId,
            TotalAmount = totalAmount,
            CreatedAt = DateTime.UtcNow,
            Items = new List<OrderItem>()
        };
    }
}
