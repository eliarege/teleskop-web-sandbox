# Quick Setup Guide

## 1. Install Dependencies

```bash
cd mcp/sql-server
pnpm install
```

## 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

Update these values in `.env`:
```env
DB_SERVER=your-server-ip
DB_DATABASE=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

## 3. Build the Project

```bash
pnpm build
```

## 4. Test the Server

```bash
# Run the server directly
pnpm start
```

The server should output:
```
Successfully connected to SQL Server database
Teleskop SQL Server MCP server running on stdio
```

Press Ctrl+C to stop.

## 5. Configure in VSCode

Add to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "teleskop-sqlserver": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp/sql-server/dist/index.js"
      ],
      "env": {
        "DB_SERVER": "192.168.16.92",
        "DB_PORT": "1433",
        "DB_DATABASE": "Ozen_Teleskop",
        "DB_USER": "sa",
        "DB_PASSWORD": "35427",
        "DB_ENCRYPT": "false",
        "DB_TRUST_SERVER_CERT": "true"
      }
    }
  }
}
```

Replace `/absolute/path/to` with the actual path to your project.

## 6. Restart Copilot

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Developer: Reload Window"
3. Press Enter

The MCP server should now be available in GitHub Copilot!

## 7. Test the Connection

In Copilot chat, try:

```
@teleskop-sqlserver list_tables
```

or

```
@teleskop-sqlserver query "SELECT TOP 5 * FROM BFMACHINES"
```

## Troubleshooting

### Connection Failed

1. Check your database credentials in `.env`
2. Verify SQL Server is running and accessible
3. Check firewall rules allow connections
4. Ensure SQL Server authentication is enabled

### Server Not Showing in Copilot

1. Check the path in `mcp.json` is correct and absolute
2. Verify the server was built: `ls dist/index.js` should show the file
3. Restart VSCode completely (not just reload window)
4. Check VSCode output panel for error messages

### "Query rejected" Error

The server only allows SELECT queries. If you see this error:
- Make sure you're only using SELECT statements
- Don't try to INSERT, UPDATE, DELETE, or execute stored procedures

## Next Steps

- Read the [README.md](README.md) for complete documentation
- Explore available tools: `query`, `list_tables`, `describe_table`, `list_schemas`, `search_columns`
- Check out the usage examples in the README
