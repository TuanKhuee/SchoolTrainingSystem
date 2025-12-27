using backend.Models.Products;
using backend.Services;
using backend.Tests.Fixtures;
using backend.Tests.TestHelpers;
using Data;
using FluentAssertions;

namespace backend.Tests.Services;

public class ProductServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly ProductService _productService;

    public ProductServiceTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _productService = new ProductService(_context);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllProducts()
    {
        // Arrange
        var product1 = TestDataFixture.CreateTestProduct("Product 1", 100m);
        var product2 = TestDataFixture.CreateTestProduct("Product 2", 200m);

        _context.Products.AddRange(product1, product2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _productService.GetAllAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(p => p.Name == "Product 1");
        result.Should().Contain(p => p.Name == "Product 2");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsCorrectProduct()
    {
        // Arrange
        var product = TestDataFixture.CreateTestProduct("Test Product", 150m);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        var result = await _productService.GetByIdAsync(product.ProductId);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Product");
        result.Price.Should().Be(150m);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenProductNotFound()
    {
        // Act
        var result = await _productService.GetByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_AddsNewProduct()
    {
        // Arrange
        var product = TestDataFixture.CreateTestProduct("New Product", 250m);

        // Act
        var result = await _productService.CreateAsync(product);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New Product");

        var savedProduct = await _context.Products.FindAsync(product.ProductId);
        savedProduct.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateAsync_ModifiesExistingProduct()
    {
        // Arrange
        var product = TestDataFixture.CreateTestProduct("Original Name", 100m);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var updatedProduct = new Products
        {
            Name = "Updated Name",
            Description = "Updated Description",
            Price = 200m,
            Stock = 75,
            ImageUrl = "/images/updated.jpg",
            CategoryId = product.CategoryId
        };

        // Act
        var result = await _productService.UpdateAsync(product.ProductId, updatedProduct);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Updated Name");
        result.Price.Should().Be(200m);
        result.Stock.Should().Be(75);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenProductNotFound()
    {
        // Arrange
        var updatedProduct = TestDataFixture.CreateTestProduct("Updated", 100m);

        // Act
        var result = await _productService.UpdateAsync(Guid.NewGuid(), updatedProduct);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_RemovesProduct()
    {
        // Arrange
        var product = TestDataFixture.CreateTestProduct("To Delete", 100m);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        var result = await _productService.DeleteAsync(product.ProductId);

        // Assert
        result.Should().BeTrue();

        var deletedProduct = await _context.Products.FindAsync(product.ProductId);
        deletedProduct.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenProductNotFound()
    {
        // Act
        var result = await _productService.DeleteAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetPagedAsync_ReturnsCorrectPage()
    {
        // Arrange
        for (int i = 1; i <= 25; i++)
        {
            var product = TestDataFixture.CreateTestProduct($"Product {i}", i * 10m);
            _context.Products.Add(product);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _productService.GetPagedAsync(page: 2, limit: 10);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(25);
        result.PageIndex.Should().Be(2);
        result.PageSize.Should().Be(10);
    }
}
