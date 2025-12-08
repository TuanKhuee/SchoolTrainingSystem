using System.Security.Claims;
using System.Text;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Services;

var builder = WebApplication.CreateBuilder(args);

// Configure database connection
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        })
    );

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });

});

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret is not configured"))),
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddScoped<EmailService>();

// Configure Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API với JWT Auth", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<WalletService>();
builder.Services.AddScoped<ExcelService>();
builder.Services.AddScoped<QRCodeService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<WalletService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<StudentPaymentService>();

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck("Database", () =>
    {
        try
        {
            using var scope = builder.Services.BuildServiceProvider().CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            dbContext.Database.CanConnect();
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(ex.Message);
        }
    });

builder.Services.AddScoped<BlockchainService>();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();

// Configure static file serving for QR codes
app.UseStaticFiles(); // Enables serving files from wwwroot

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Initialize roles and admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        // Apply migrations and create database if it doesn't exist
        var context = services.GetRequiredService<ApplicationDbContext>();
        logger.LogInformation("Attempting to migrate database...");

        // Retry pattern for database connection
        var maxRetryAttempts = 10;
        var retryDelay = TimeSpan.FromSeconds(5);

        for (int retryAttempt = 0; retryAttempt < maxRetryAttempts; retryAttempt++)
        {
            try
            {
                context.Database.Migrate();
                logger.LogInformation("Database migration successful");
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Database migration failed (Attempt {Attempt}/{MaxAttempts})",
                    retryAttempt + 1, maxRetryAttempts);

                if (retryAttempt < maxRetryAttempts - 1)
                {
                    logger.LogInformation("Waiting {Delay} seconds before retry...", retryDelay.TotalSeconds);
                    Thread.Sleep(retryDelay);
                }
                else
                {
                    logger.LogError(ex, "Database migration failed after {MaxAttempts} attempts", maxRetryAttempts);
                    throw;
                }
            }
        }

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<User>>();

        // Create roles if they don't exist
        if (!await roleManager.RoleExistsAsync("Admin"))
            await roleManager.CreateAsync(new IdentityRole("Admin"));

        if (!await roleManager.RoleExistsAsync("Student"))
            await roleManager.CreateAsync(new IdentityRole("Student"));

        if (!await roleManager.RoleExistsAsync("Teacher"))
            await roleManager.CreateAsync(new IdentityRole("Teacher"));

        if (!await roleManager.RoleExistsAsync("Staff"))
            await roleManager.CreateAsync(new IdentityRole("Staff"));

        // Create admin user if it doesn't exist
        var adminEmail = "admin@vku.udn.vn";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin User",
                Role = "Admin",
                DateOfBirth = new DateTime(1990, 1, 1),
                EmailConfirmed = true,
                IsStudent = false
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123456!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        try
        {
            var blockchainService = services.GetRequiredService<BlockchainService>();
            var walletService = services.GetRequiredService<WalletService>();
            var dbContext = services.GetRequiredService<ApplicationDbContext>();

            // Retry pattern for blockchain connection
            var maxBlockchainRetries = 10;
            var blockchainRetryDelay = TimeSpan.FromSeconds(5);
            bool initialized = false;

            for (int retry = 0; retry < maxBlockchainRetries; retry++)
            {
                try
                {
                    initialized = await blockchainService.InitializeAdminWallet();
                    if (initialized)
                    {
                        logger.LogInformation("Successfully connected to blockchain and VKUCoin smart contract");
                        break;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Blockchain connection failed (Attempt {Attempt}/{MaxAttempts})", retry + 1, maxBlockchainRetries);
                }

                if (retry < maxBlockchainRetries - 1)
                {
                    logger.LogInformation("Waiting {Delay} seconds before retry blockchain connection...", blockchainRetryDelay.TotalSeconds);
                    Thread.Sleep(blockchainRetryDelay);
                }
            }

            if (initialized)
            {
                var adminWallet = await dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == adminUser.Id);

                if (adminWallet == null)
                {
                    var address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

                    var initialBalance = await walletService.SyncWalletBalance(address);

                    var privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
                    var privateKeyWithoutPrefix = privateKey.StartsWith("0x") ? privateKey.Substring(2) : privateKey;

                    adminWallet = new Wallet
                    {
                        Address = address,
                        PrivateKey = privateKeyWithoutPrefix,
                        Balance = initialBalance,
                        UserId = adminUser.Id
                    };

                    await dbContext.Wallets.AddAsync(adminWallet);
                    await dbContext.SaveChangesAsync();
                    logger.LogInformation("Admin wallet created successfully");
                }
                else
                {
                    logger.LogInformation("Admin wallet already exists");
                }
            }
            else
            {
                logger.LogError("Failed to initialize blockchain connection after multiple attempts");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during blockchain initialization");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding the database");
    }
}

app.Run();