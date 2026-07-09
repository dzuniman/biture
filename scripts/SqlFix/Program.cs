using Npgsql;

var conn = new NpgsqlConnection("Host=localhost;Port=5432;Database=Biture;Username=postgres;Password=password");
conn.Open();

// List all migrations
Console.WriteLine("=== Migration History ===");
using (var cmd = new NpgsqlCommand("SELECT \"MigrationId\", \"ProductVersion\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\"", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read())
        Console.WriteLine($"  {reader.GetString(0)} ({reader.GetString(1)})");
}

// Check if Margin column exists
Console.WriteLine("\n=== Quotes table columns ===");
using (var cmd2 = new NpgsqlCommand("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Quotes' ORDER BY ordinal_position", conn))
using (var reader2 = cmd2.ExecuteReader())
{
    while (reader2.Read())
        Console.WriteLine($"  {reader2.GetString(0)}: {reader2.GetString(1)}");
}

conn.Close();
