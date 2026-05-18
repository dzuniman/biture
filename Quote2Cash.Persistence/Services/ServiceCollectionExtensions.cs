using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.Persistence.Services
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<Quote2CashDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("Quote2Cash")));

            return services;
        }
    }
}
