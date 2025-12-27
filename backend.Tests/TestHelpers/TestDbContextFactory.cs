using Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.TestHelpers;

public static class TestDbContextFactory
{
    public static ApplicationDbContext CreateInMemoryDbContext(string databaseName = "")
    {
        if (string.IsNullOrEmpty(databaseName))
        {
            databaseName = Guid.NewGuid().ToString();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        var context = new ApplicationDbContext(options);
        return context;
    }

    public static ApplicationDbContext CreateInMemoryDbContextWithData(string databaseName = "")
    {
        var context = CreateInMemoryDbContext(databaseName);

        // Seed with test data if needed
        SeedTestData(context);

        return context;
    }

    private static void SeedTestData(ApplicationDbContext context)
    {
        // Add common test data here if needed
        context.SaveChanges();
    }
}
