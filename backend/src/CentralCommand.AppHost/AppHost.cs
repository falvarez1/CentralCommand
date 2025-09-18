var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.CentralCommand_Api>("centralcommand-api");

builder.Build().Run();
