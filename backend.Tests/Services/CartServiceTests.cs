using backend.Models.Products;
using backend.Services;
using backend.Tests.Fixtures;
using backend.Tests.TestHelpers;
using Data;
using FluentAssertions;

namespace backend.Tests.Services;

public class CartServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly CartService _cartService;

    public CartServiceTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _cartService = new CartService(_context);
    }

    [Fact]
    public async Task AddAsync_AddsNewItemToCart()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct("Test Product", 100m);

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        await _cartService.AddAsync(student.Id, product.ProductId, 2);

        // Assert
        var cartItems = await _cartService.GetCartAsync(student.Id);
        cartItems.Should().HaveCount(1);
        cartItems[0].Quantity.Should().Be(2);
        cartItems[0].ProductId.Should().Be(product.ProductId);
    }

    [Fact]
    public async Task AddAsync_IncreasesQuantity_WhenProductAlreadyInCart()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct("Test Product", 100m);

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Add product first time
        await _cartService.AddAsync(student.Id, product.ProductId, 2);

        // Act - Add same product again
        await _cartService.AddAsync(student.Id, product.ProductId, 3);

        // Assert
        var cartItems = await _cartService.GetCartAsync(student.Id);
        cartItems.Should().HaveCount(1);
        cartItems[0].Quantity.Should().Be(5); // 2 + 3
    }

    [Fact]
    public async Task AddAsync_ThrowsException_WhenQuantityIsZeroOrNegative()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct();
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        Func<Task> act = async () => await _cartService.AddAsync(student.Id, product.ProductId, 0);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Quantity must be > 0");
    }

    [Fact]
    public async Task AddAsync_ThrowsException_WhenProductNotFound()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();

        // Act
        Func<Task> act = async () => await _cartService.AddAsync(student.Id, Guid.NewGuid(), 1);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Product not found");
    }

    [Fact]
    public async Task GetCartAsync_ReturnsUserCartItems()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product1 = TestDataFixture.CreateTestProduct("Product 1", 100m);
        var product2 = TestDataFixture.CreateTestProduct("Product 2", 200m);

        _context.Products.AddRange(product1, product2);
        await _context.SaveChangesAsync();

        await _cartService.AddAsync(student.Id, product1.ProductId, 1);
        await _cartService.AddAsync(student.Id, product2.ProductId, 2);

        // Act
        var result = await _cartService.GetCartAsync(student.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.ProductId == product1.ProductId);
        result.Should().Contain(c => c.ProductId == product2.ProductId);
    }

    [Fact]
    public async Task GetCartAsync_ReturnsEmptyList_WhenCartIsEmpty()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();

        // Act
        var result = await _cartService.GetCartAsync(student.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateQuantityAsync_UpdatesCartItemQuantity()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct();

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        await _cartService.AddAsync(student.Id, product.ProductId, 2);
        var cartItems = await _cartService.GetCartAsync(student.Id);
        var cartItemId = cartItems[0].CartItemId;

        // Act
        await _cartService.UpdateQuantityAsync(student.Id, cartItemId, 5);

        // Assert
        var updatedCart = await _cartService.GetCartAsync(student.Id);
        updatedCart[0].Quantity.Should().Be(5);
    }

    [Fact]
    public async Task UpdateQuantityAsync_RemovesItem_WhenQuantityIsZeroOrNegative()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct();

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        await _cartService.AddAsync(student.Id, product.ProductId, 2);
        var cartItems = await _cartService.GetCartAsync(student.Id);
        var cartItemId = cartItems[0].CartItemId;

        // Act
        await _cartService.UpdateQuantityAsync(student.Id, cartItemId, 0);

        // Assert
        var updatedCart = await _cartService.GetCartAsync(student.Id);
        updatedCart.Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveAsync_RemovesItemFromCart()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product = TestDataFixture.CreateTestProduct();

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        await _cartService.AddAsync(student.Id, product.ProductId, 2);
        var cartItems = await _cartService.GetCartAsync(student.Id);
        var cartItemId = cartItems[0].CartItemId;

        // Act
        await _cartService.RemoveAsync(student.Id, cartItemId);

        // Assert
        var updatedCart = await _cartService.GetCartAsync(student.Id);
        updatedCart.Should().BeEmpty();
    }

    [Fact]
    public async Task ClearAsync_RemovesAllItemsFromCart()
    {
        // Arrange
        var student = TestDataFixture.CreateTestStudent();
        var product1 = TestDataFixture.CreateTestProduct("Product 1");
        var product2 = TestDataFixture.CreateTestProduct("Product 2");

        _context.Products.AddRange(product1, product2);
        await _context.SaveChangesAsync();

        await _cartService.AddAsync(student.Id, product1.ProductId, 1);
        await _cartService.AddAsync(student.Id, product2.ProductId, 2);

        // Act
        await _cartService.ClearAsync(student.Id);

        // Assert
        var cart = await _cartService.GetCartAsync(student.Id);
        cart.Should().BeEmpty();
    }
}
