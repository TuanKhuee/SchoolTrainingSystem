using backend.Models;
using backend.Models.Products;
using backend.Tests.Fixtures;
using backend.Tests.TestHelpers;
using Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.Integration;

public class DatabaseIntegrationTests
{
    [Fact]
    public async Task CanConnectToInMemoryDatabase()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();

        // Act
        var canConnect = await context.Database.CanConnectAsync();

        // Assert
        canConnect.Should().BeTrue();
    }

    [Fact]
    public async Task CanSaveAndRetrieveUser()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = TestDataFixture.CreateTestStudent();

        // Act
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var retrievedUser = await context.Users.FindAsync(user.Id);

        // Assert
        retrievedUser.Should().NotBeNull();
        retrievedUser!.Email.Should().Be(user.Email);
        retrievedUser.FullName.Should().Be(user.FullName);
        retrievedUser.Role.Should().Be("Student");
    }

    [Fact]
    public async Task CanSaveAndRetrieveWallet()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = TestDataFixture.CreateTestStudent();
        var wallet = TestDataFixture.CreateTestWallet(user.Id, 1000m);

        // Act
        context.Users.Add(user);
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        var retrievedWallet = await context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == user.Id);

        // Assert
        retrievedWallet.Should().NotBeNull();
        retrievedWallet!.Balance.Should().Be(1000m);
        retrievedWallet.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task CanUpdateWalletBalance()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = TestDataFixture.CreateTestStudent();
        var wallet = TestDataFixture.CreateTestWallet(user.Id, 1000m);

        context.Users.Add(user);
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        // Act
        wallet.Balance = 1500m;
        context.Wallets.Update(wallet);
        await context.SaveChangesAsync();

        var updatedWallet = await context.Wallets.FindAsync(wallet.Id);

        // Assert
        updatedWallet!.Balance.Should().Be(1500m);
    }

    [Fact]
    public async Task CanSaveProductWithCategory()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var category = new Category
        {
            CategoryId = Guid.NewGuid(),
            Name = "Test Category",
            Description = "Test Description"
        };
        var product = TestDataFixture.CreateTestProduct("Test Product", 100m);
        product.CategoryId = category.CategoryId;

        // Act
        context.Categories.Add(category);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var retrievedProduct = await context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.ProductId == product.ProductId);

        // Assert
        retrievedProduct.Should().NotBeNull();
        retrievedProduct!.Category.Should().NotBeNull();
        retrievedProduct.Category!.Name.Should().Be("Test Category");
    }

    [Fact]
    public async Task CanCreateOrderWithItems()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct("Test Product", 100m);
        var order = TestDataFixture.CreateTestOrder(user.Id, 200m);

        var orderItem = new OrderItem
        {
            OrderItemId = Guid.NewGuid(),
            OrderId = order.OrderId,
            ProductId = product.ProductId,
            Quantity = 2
        };

        // Act
        context.Users.Add(user);
        context.Products.Add(product);
        context.Orders.Add(order);
        context.OrderItems.Add(orderItem);
        await context.SaveChangesAsync();

        var retrievedOrder = await context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderId == order.OrderId);

        // Assert
        retrievedOrder.Should().NotBeNull();
        retrievedOrder!.Items.Should().HaveCount(1);
        retrievedOrder.TotalAmount.Should().Be(200m);
    }

    [Fact(Skip = "In-memory database doesn't support transaction rollback")]
    public async Task TransactionRollback_OnError()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = TestDataFixture.CreateTestStudent();

        // Act & Assert
        using (var transaction = await context.Database.BeginTransactionAsync())
        {
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Rollback transaction
            await transaction.RollbackAsync();
        }

        // Verify user was not saved
        var retrievedUser = await context.Users.FindAsync(user.Id);
        retrievedUser.Should().BeNull();
    }

    [Fact]
    public async Task CanQueryUsersByRole()
    {
        // Arrange
        var context = TestDbContextFactory.CreateInMemoryDbContext();
        var student1 = TestDataFixture.CreateTestStudent("student1@vku.udn.vn");
        var student2 = TestDataFixture.CreateTestStudent("student2@vku.udn.vn");
        var teacher = TestDataFixture.CreateTestTeacher();

        context.Users.AddRange(student1, student2, teacher);
        await context.SaveChangesAsync();

        // Act
        var students = await context.Users
            .Where(u => u.Role == "Student")
            .ToListAsync();

        // Assert
        students.Should().HaveCount(2);
        students.Should().AllSatisfy(s => s.Role.Should().Be("Student"));
    }
}
