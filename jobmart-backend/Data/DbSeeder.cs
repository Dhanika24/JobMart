using BCrypt.Net;
using jobmart.Models;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAdminAsync(
            WebApplication app)
        {
            using IServiceScope scope =
                app.Services.CreateScope();

            ApplicationDbContext context =
                scope.ServiceProvider
                    .GetRequiredService<
                        ApplicationDbContext>();

            await context.Database
                .MigrateAsync();

            bool adminExists =
                await context.Users
                    .AnyAsync(user =>
                        user.Role == "Admin");

            if (adminExists)
            {
                return;
            }

            var admin =
                new User
                {
                    FullName =
                        "Nethmi Perera",

                    Email =
                        "admin@jobmart.lk",

                    PasswordHash =
                        BCrypt.Net.BCrypt
                            .HashPassword(
                                "Admin@123"),

                    Role =
                        "Admin",

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow
                };

            context.Users.Add(admin);

            await context.SaveChangesAsync();
        }
    }
}