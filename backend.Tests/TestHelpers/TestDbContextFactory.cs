using Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.TestHelpers;

public static class TestDbContextFactory
{
    public static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings =>
            {
                // Suppress warnings that are expected in test scenarios
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning);
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.ContextInitialized);
            })
            .Options;

        var context = new ApplicationDbContext(options);

        // Ensure database is created
        context.Database.EnsureCreated();

        return context;
    }

    public static ApplicationDbContext CreateInMemoryDbContextWithData(string databaseName = "")
    {
        // The CreateInMemoryDbContext method no longer takes a databaseName parameter.
        // If a specific database name is needed for CreateInMemoryDbContextWithData,
        // the logic for creating the context needs to be adjusted, or CreateInMemoryDbContext
        // should be reverted to accept a databaseName.
        // For now, calling the parameterless CreateInMemoryDbContext.
        var context = CreateInMemoryDbContext();

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
