# Backend Testing Guide

## Overview

This directory contains comprehensive unit and integration tests for the SchoolTrainingSystem backend. The test suite uses xUnit, Moq, FluentAssertions, and Entity Framework Core In-Memory database.

## Test Structure

```
backend.Tests/
├── Controllers/          # Controller layer tests
│   └── AuthControllerTests.cs
├── Services/            # Service layer tests
│   ├── AuthServiceTests.cs
│   ├── ProductServiceTests.cs
│   └── CartServiceTests.cs
├── Integration/         # Integration tests
│   └── DatabaseIntegrationTests.cs
├── TestHelpers/         # Test utility classes
│   ├── TestDbContextFactory.cs
│   └── MockUserManager.cs
└── Fixtures/           # Test data fixtures
    └── TestDataFixture.cs
```

## Running Tests

### Run All Tests
```powershell
# From solution root
dotnet test

# With detailed output
dotnet test --verbosity detailed
```

### Run Specific Test Class
```powershell
dotnet test --filter "FullyQualifiedName~AuthServiceTests"
```

### Run Tests with Coverage
```powershell
# Generate coverage report
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover

# Generate HTML coverage report (requires ReportGenerator)
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
reportgenerator -reports:./backend.Tests/coverage.cobertura.xml -targetdir:./coverage-report
```

## Writing New Tests

### Service Tests

Service tests should use in-memory database and mock external dependencies:

```csharp
public class MyServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly MyService _service;

    public MyServiceTests()
    {
        _context = TestDbContextFactory.CreateInMemoryDbContext();
        _service = new MyService(_context);
    }

    [Fact]
    public async Task MyMethod_WithValidInput_ReturnsExpectedResult()
    {
        // Arrange
        var testData = TestDataFixture.CreateTestEntity();
        _context.Entities.Add(testData);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.MyMethod(testData.Id);

        // Assert
        result.Should().NotBeNull();
        result.Property.Should().Be(expectedValue);
    }
}
```

### Controller Tests

Controller tests should mock service dependencies:

```csharp
public class MyControllerTests
{
    private readonly Mock<MyService> _mockService;
    private readonly MyController _controller;

    public MyControllerTests()
    {
        _mockService = new Mock<MyService>();
        _controller = new MyController(_mockService.Object);
    }

    [Fact]
    public async Task MyAction_WithValidRequest_ReturnsOk()
    {
        // Arrange
        _mockService.Setup(x => x.MyMethod(It.IsAny<string>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.MyAction(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }
}
```

### Integration Tests

Integration tests verify database operations and data relationships:

```csharp
[Fact]
public async Task CanSaveAndRetrieveEntity()
{
    // Arrange
    var context = TestDbContextFactory.CreateInMemoryDbContext();
    var entity = TestDataFixture.CreateTestEntity();

    // Act
    context.Entities.Add(entity);
    await context.SaveChangesAsync();

    var retrieved = await context.Entities.FindAsync(entity.Id);

    // Assert
    retrieved.Should().NotBeNull();
    retrieved.Property.Should().Be(entity.Property);
}
```

## Test Data Management

Use `TestDataFixture` to create consistent test data:

```csharp
// Create test users
var student = TestDataFixture.CreateTestStudent();
var teacher = TestDataFixture.CreateTestTeacher();
var admin = TestDataFixture.CreateTestAdmin();

// Create test entities
var wallet = TestDataFixture.CreateTestWallet(userId, balance: 1000m);
var product = TestDataFixture.CreateTestProduct("Product Name", price: 100m);
var cartItem = TestDataFixture.CreateTestCartItem(userId, productId, quantity: 2);
```

## Mocking Strategies

### UserManager Mocking

Use `MockUserManager` helper for authentication tests:

```csharp
// Mock successful authentication
var mockUserManager = MockUserManager.CreateWithUser(user, password);

// Mock invalid password
var mockUserManager = MockUserManager.CreateWithInvalidPassword(user);

// Mock non-existent user
var mockUserManager = MockUserManager.CreateWithNonExistentUser();
```

### Service Mocking

Mock external services (blockchain, email, etc.):

```csharp
var mockBlockchainService = new Mock<BlockchainService>();
mockBlockchainService.Setup(x => x.GetBalance(It.IsAny<string>()))
    .ReturnsAsync(1000m);
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Arrange-Act-Assert**: Follow AAA pattern for clarity
3. **Descriptive Names**: Test names should describe what is being tested and expected outcome
4. **One Assertion Per Test**: Focus each test on a single behavior
5. **Use FluentAssertions**: Makes assertions more readable
6. **Clean Up**: In-memory database is automatically disposed after each test
7. **Mock External Dependencies**: Don't make real blockchain/email calls in tests

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI pipeline:
1. Restores dependencies
2. Builds the solution
3. Runs all tests
4. Generates coverage reports
5. Publishes test results
6. Comments coverage on PRs

## Coverage Goals

- **Service Layer**: > 70% coverage
- **Controller Layer**: > 60% coverage
- **Overall**: > 65% coverage

## Troubleshooting

### Tests Failing Locally

1. Ensure you have .NET 9.0 SDK installed
2. Restore packages: `dotnet restore`
3. Clean and rebuild: `dotnet clean && dotnet build`
4. Check for conflicting package versions

### In-Memory Database Issues

If you encounter database-related test failures:
- Ensure each test uses a unique database name
- Check that navigation properties are properly configured
- Verify that required relationships are set up

### Mock Setup Issues

If mocks aren't working as expected:
- Verify the method signature matches exactly
- Use `It.IsAny<T>()` for flexible parameter matching
- Check that the mock is properly injected into the tested class

## Additional Resources

- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [FluentAssertions Documentation](https://fluentassertions.com/)
- [EF Core In-Memory Database](https://docs.microsoft.com/en-us/ef/core/providers/in-memory/)
