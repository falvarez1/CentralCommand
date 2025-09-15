FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["apps/api/CentralCommand.Api/CentralCommand.Api.csproj", "apps/api/CentralCommand.Api/"]
RUN dotnet restore "apps/api/CentralCommand.Api/CentralCommand.Api.csproj"
COPY . .
WORKDIR "/src/apps/api/CentralCommand.Api"
RUN dotnet build "CentralCommand.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CentralCommand.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CentralCommand.Api.dll"]