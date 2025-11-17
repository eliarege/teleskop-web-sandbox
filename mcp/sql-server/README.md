# Teleskop SQL Server MCP Server

A read-only Model Context Protocol (MCP) server for SQL Server databases. This server provides safe, read-only access to SQL Server databases through the MCP protocol.

## Features

- **Read-Only Access**: Only SELECT queries are allowed - all modification operations are blocked
- **Schema Discovery**: Explore database structure, tables, columns, and constraints
- **Safe Query Execution**: Built-in validation to prevent data modification
- **Connection Pooling**: Efficient connection management
- **Type-Safe**: Written in TypeScript with full type safety

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run the server
pnpm start
```

## Configuration

The server is configured using environment variables:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_SERVER` | SQL Server hostname or IP | `192.168.16.92` |
| `DB_DATABASE` | Database name | `Ozen_Teleskop` |
| `DB_USER` | Database username | `sa` |
| `DB_PASSWORD` | Database password | `your-password` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PORT` | SQL Server port | `1433` |
| `DB_ENCRYPT` | Enable TLS encryption | `true` |
| `DB_TRUST_SERVER_CERT` | Trust self-signed certificates | `false` |
| `DB_CONNECTION_TIMEOUT` | Connection timeout (ms) | `15000` |
| `DB_REQUEST_TIMEOUT` | Query timeout (ms) | `15000` |

### Example Configuration

Create a `.env` file:

```env
DB_SERVER=192.168.16.92
DB_PORT=1433
DB_DATABASE=Ozen_Teleskop
DB_USER=sa
DB_PASSWORD=35427
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
DB_CONNECTION_TIMEOUT=15000
DB_REQUEST_TIMEOUT=15000
```

## MCP Configuration

Add the server to your MCP settings (e.g., `.vscode/mcp.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "teleskop-sqlserver": {
      "command": "pnpm",
      "args": ["exec", "teleskop-mcp-sqlserver"],
      "env": {
        "DB_SERVER": "192.168.16.92",
        "DB_PORT": "1433",
        "DB_DATABASE": "Teleskop",
        "DB_USER": "sa",
        "DB_PASSWORD": "your-password",
        "DB_ENCRYPT": "false",
        "DB_TRUST_SERVER_CERT": "true"
      }
    }
  }
}
```

## Available Tools

### 1. `query`

Execute a read-only SELECT query on the database.

**Parameters:**
- `query` (string, required): The SQL SELECT query to execute

**Example:**
```sql
SELECT TOP 10 * FROM BFMACHINES
```

**Note:** Only SELECT statements are allowed. INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, EXEC, and EXECUTE are blocked.

### 2. `list_tables`

List all tables in the database with their schema, row counts, and space usage.

**Parameters:**
- `schema` (string, optional): Filter by schema name (e.g., "dbo")

**Returns:**
- SchemaName: The schema containing the table
- TableName: Name of the table
- RowCount: Number of rows in the table
- TotalSpaceKB: Disk space used in kilobytes

### 3. `describe_table`

Get detailed information about a specific table including columns, data types, and constraints.

**Parameters:**
- `table` (string, required): The table name to describe
- `schema` (string, optional): The schema name (defaults to "dbo")

**Returns:**
- ColumnName: Name of the column
- DataType: SQL Server data type
- MaxLength: Maximum length for string types
- Precision: Precision for numeric types
- Scale: Scale for numeric types
- IsNullable: Whether the column allows NULL
- IsIdentity: Whether the column is an identity column
- IsPrimaryKey: Whether the column is part of the primary key
- DefaultValue: Default value constraint if any

**Example:**
```javascript
describe_table({ table: "BFMACHINES", schema: "dbo" })
```

### 4. `list_schemas`

List all schemas in the database (excluding system schemas).

**Returns:**
- SchemaName: Name of the schema
- SchemaId: Internal schema ID

### 5. `search_columns`

Search for columns across all tables by name pattern.

**Parameters:**
- `pattern` (string, required): Column name pattern (use `%` as wildcard)

**Returns:**
- SchemaName: Schema containing the table
- TableName: Table containing the column
- ColumnName: Name of the column
- DataType: SQL Server data type
- IsNullable: Whether the column allows NULL

**Example:**
```javascript
search_columns({ pattern: "%MACHINE%" })
```

## Security Features

### Read-Only Enforcement

The server implements multiple layers of protection:

1. **Query Validation**: All queries are checked before execution
2. **Keyword Blocking**: Queries starting with modification keywords are rejected
3. **No EXEC/EXECUTE**: Stored procedure execution is blocked to prevent side effects

### Blocked Operations

The following SQL keywords are blocked at the start of queries:
- `INSERT`
- `UPDATE`
- `DELETE`
- `DROP`
- `CREATE`
- `ALTER`
- `TRUNCATE`
- `EXEC` / `EXECUTE`

## Usage Examples

### Basic Query
```sql
SELECT * FROM BFMACHINES WHERE MACHINEID = 1
```

### Join Query
```sql
SELECT
  m.MACHINEID,
  m.IP,
  c.NAME as CommandName
FROM BFMASTERCOMMANDS c
INNER JOIN BFMACHINES m ON c.MACHINEID = m.MACHINEID
WHERE m.MACHINEID = 1
```

### Aggregate Query
```sql
SELECT
  MACHINEID,
  COUNT(*) as CommandCount
FROM BFMASTERCOMMANDS
GROUP BY MACHINEID
ORDER BY CommandCount DESC
```

### Schema Exploration
```javascript
// List all tables
list_tables()

// List tables in specific schema
list_tables({ schema: "dbo" })

// Get table structure
describe_table({ table: "BFMACHINES" })

// Find columns with "MACHINE" in the name
search_columns({ pattern: "%MACHINE%" })
```

## Development

### Build
```bash
pnpm build
```

### Watch Mode
```bash
pnpm dev
```

### Type Check
```bash
pnpm type-check
```

## Troubleshooting

### Connection Issues

**Error: Login failed for user**
- Verify DB_USER and DB_PASSWORD are correct
- Check SQL Server authentication mode (ensure SQL Server and Windows Authentication is enabled)

**Error: A network-related or instance-specific error occurred**
- Verify DB_SERVER and DB_PORT are correct
- Check firewall rules allow connections to SQL Server
- Ensure SQL Server is configured to accept TCP/IP connections

**Error: Certificate chain validation failed**
- Set `DB_TRUST_SERVER_CERT=true` for self-signed certificates
- Or set `DB_ENCRYPT=false` for unencrypted connections (not recommended for production)

### Query Execution Issues

**Error: Query rejected: [KEYWORD] statements are not allowed**
- The server only allows SELECT queries
- Remove any INSERT, UPDATE, DELETE, or other modification statements

**Error: Timeout expired**
- Increase `DB_REQUEST_TIMEOUT` value
- Optimize your query to run faster
- Add appropriate indexes to the queried tables

## Architecture

```
┌─────────────────┐
│   MCP Client    │
│  (Claude/VSC)   │
└────────┬────────┘
         │ stdio
         │
┌────────▼────────┐
│   MCP Server    │
│  (Node.js/TS)   │
├─────────────────┤
│  - Query Val.   │
│  - Tool Handlers│
│  - Connection   │
│    Pool         │
└────────┬────────┘
         │ TDS Protocol
         │
┌────────▼────────┐
│  SQL Server     │
│   Database      │
└─────────────────┘
```
