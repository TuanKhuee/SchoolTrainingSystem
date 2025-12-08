using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.Models.Products;
using backend.Models.SystemTranings;
using backend.Models.SystemTranings.BackgroundStu;
using backend.Models.SystemTranings.Specialization;
using backend.Models.SystemTranings.Training;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
           : base(options)
        {
        }

        // === DbSets ===
        public DbSet<User> Users { get; set; }
        public DbSet<Activity> Activities { get; set; }
        public DbSet<ActivityRegistration> ActivityRegistrations { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<TransactionLog> TransactionLogs { get; set; }
        public DbSet<ParentInfo> ParentInfos { get; set; }
        public DbSet<Reward> Rewards { get; set; }
        public DbSet<Discipline> Disciplines { get; set; }
        public DbSet<TemporaryResidence> TemporaryResidences { get; set; }
        public DbSet<Semester> Semesters { get; set; }
        public DbSet<Specialization> Specializations { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<CourseMajor> CourseMajors { get; set; }
        public DbSet<CourseOffering> CourseOfferings { get; set; }
        public DbSet<CourseRegistration> CourseRegistrations { get; set; }
        public DbSet<CoursePackage> CoursePackages { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<Products> Products => Set<Products>();
        public DbSet<CartItem> CartItems => Set<CartItem>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // === User - Wallet (1-1) ===
            builder.Entity<User>(entity =>
            {
                entity.Property(u => u.FullName).HasMaxLength(100);
                entity.Property(u => u.Class).HasMaxLength(50);
                entity.Property(u => u.Role).HasMaxLength(20);

                entity.HasOne(u => u.Wallet)
                    .WithOne(w => w.User)
                    .HasForeignKey<Wallet>(w => w.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Ignore(u => u.TrainingPoints);


            });

            // === Wallet ===
            builder.Entity<Wallet>(entity =>
            {
                entity.HasKey(w => w.Id);
                entity.Property(w => w.Address)
                    .HasMaxLength(42)
                    .IsRequired();

                entity.Property(w => w.PrivateKey)
                    .HasMaxLength(64)
                    .IsRequired();

                entity.Property(w => w.Balance)
                    .HasColumnType("decimal(18,8)")
                    .HasDefaultValue(0m);

                entity.HasIndex(w => w.Address).IsUnique();
            });

            // === ActivityRegistration (many-to-many User-Activity) ===
            builder.Entity<ActivityRegistration>()
                .HasKey(ar => new { ar.StudentId, ar.ActivityId });

            // === TransactionLog ===
            builder.Entity<TransactionLog>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Amount).HasColumnType("decimal(18,8)");
                entity.Property(t => t.TransactionType).HasMaxLength(50).IsRequired();
                entity.Property(t => t.Description).HasMaxLength(255);

                entity.HasOne(t => t.User)
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // === ParentInfo ===
            builder.Entity<ParentInfo>(entity =>
            {
                entity.HasKey(p => p.Id);

                entity.HasOne(p => p.User)
                    .WithMany(u => u.Parents)
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // === COURSE PACKAGE ===
            builder.Entity<CoursePackage>(entity =>
            {
                entity.HasKey(cp => cp.Id);
                entity.Property(cp => cp.PackageName).HasMaxLength(100).IsRequired();
                entity.Property(cp => cp.MajorName).HasMaxLength(100).IsRequired();

                entity.HasMany(cp => cp.Courses)
                    .WithOne(c => c.CoursePackage)
                    .HasForeignKey(c => c.CoursePackageId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // === COURSE ===
            builder.Entity<Course>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.CourseCode).HasMaxLength(20).IsRequired();
                entity.Property(c => c.CourseName).HasMaxLength(100).IsRequired();

                entity.HasOne(c => c.CoursePackage)
                    .WithMany(cp => cp.Courses)
                    .HasForeignKey(c => c.CoursePackageId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // === COURSE MAJOR ===
            builder.Entity<CourseMajor>(entity =>
            {
                entity.ToTable("courseMajors");
                entity.HasKey(cm => cm.Id);
                entity.Property(cm => cm.MajorCode).HasMaxLength(10);

                entity.HasOne(cm => cm.Course)
                    .WithMany(c => c.CourseMajors)
                    .HasForeignKey(cm => cm.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // === COURSE OFFERING ===
            builder.Entity<CourseOffering>(entity =>
            {
                entity.HasKey(co => co.Id);

                entity.HasOne(co => co.Course)
                    .WithMany(c => c.Offerings)
                    .HasForeignKey(co => co.CourseId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(co => co.Semester)
                    .WithMany(s => s.CourseOfferings)
                    .HasForeignKey(co => co.SemesterId)
                    .OnDelete(DeleteBehavior.Restrict);


            });

            // === COURSE REGISTRATION ===
            builder.Entity<CourseRegistration>(entity =>
            {
                entity.HasKey(cr => cr.Id);

                entity.HasOne(cr => cr.CourseOffering)
                    .WithMany(co => co.Registrations)
                    .HasForeignKey(cr => cr.CourseOfferingId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // === SEMESTER ===
            builder.Entity<Semester>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Name).HasMaxLength(10).IsRequired();
                entity.Property(s => s.SchoolYear).HasMaxLength(20).IsRequired();

                entity.HasMany(s => s.CourseOfferings)
                    .WithOne(co => co.Semester)
                    .HasForeignKey(co => co.SemesterId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // === PRODUCTS ===
            builder.Entity<Products>(entity =>
            {
                entity.HasKey(p => p.ProductId);
                entity.Property(p => p.Name).HasMaxLength(100).IsRequired();
                entity.Property(p => p.Description).HasMaxLength(500);
                entity.Property(p => p.Price).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(p => p.Stock).IsRequired();
                entity.Property(p => p.ImageUrl); // Removed MaxLength to support base64 images
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // === ORDER ===
            builder.Entity<Order>(entity =>
            {
                entity.Property(e => e.TotalAmount)
                    .HasColumnType("decimal(18,2)");
            });

            // === ORDER ITEM ===
            builder.Entity<OrderItem>(entity =>
            {
                entity.Property(e => e.UnitPrice)
                    .HasColumnType("decimal(18,2)");
            });


        }


    }
}

