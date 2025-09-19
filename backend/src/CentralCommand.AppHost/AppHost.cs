var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server with persistent lifetime and data volume for development
var sql = builder.AddSqlServer("sql")
                 .WithLifetime(ContainerLifetime.Persistent) // Faster inner-loop development
                 .WithDataVolume();                          // Persist data between runs

// Add the CentralCommand database
var db = sql.AddDatabase("centralcommand");

// Add the API project with reference to the database
builder.AddProject<Projects.CentralCommand_Api>("centralcommand-api")
       .WithReference(db)
       .WaitFor(db);

builder.Build().Run();
