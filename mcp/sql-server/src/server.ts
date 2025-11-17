#!/usr/bin/env node

/**
 * Read-only MCP Server for SQL Server
 *
 * This server provides read-only access to SQL Server databases through the Model Context Protocol.
 * It supports querying data, inspecting schema, and discovering database structure.
 */

import process from 'node:process'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import sql from 'mssql'
import { z } from 'zod'

// Environment variable validation schema
const envSchema = z.object({
  DB_SERVER: z.string().min(1, 'DB_SERVER is required'),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_DATABASE: z.string().min(1, 'DB_DATABASE is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_ENCRYPT: z.enum(['true', 'false']).default('true'),
  DB_TRUST_SERVER_CERT: z.enum(['true', 'false']).default('false'),
  DB_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(15000),
  DB_REQUEST_TIMEOUT: z.coerce.number().int().positive().default(15000),
})

type Env = z.infer<typeof envSchema>

// Parse and validate environment variables
function getConfig(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration error:')
      for (const issue of error.issues) {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`)
      }
    }
    process.exit(1)
  }
}

const config = getConfig()

// SQL Server connection configuration
const sqlConfig: sql.config = {
  server: config.DB_SERVER,
  port: config.DB_PORT,
  database: config.DB_DATABASE,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  options: {
    encrypt: config.DB_ENCRYPT === 'true',
    trustServerCertificate: config.DB_TRUST_SERVER_CERT === 'true',
    connectTimeout: config.DB_CONNECTION_TIMEOUT,
    requestTimeout: config.DB_REQUEST_TIMEOUT,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Global connection pool
let pool: sql.ConnectionPool | null = null

// Initialize connection pool
async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  pool = await sql.connect(sqlConfig)
  return pool
}

// Execute a read-only query with safety checks
async function executeReadOnlyQuery(query: string, params?: Record<string, any>): Promise<sql.IResult<any>> {
  // Simple safety check - prevent modification statements
  const upperQuery = query.trim().toUpperCase()
  const modifyingKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE']

  for (const keyword of modifyingKeywords) {
    if (upperQuery.startsWith(keyword)) {
      throw new Error(`Query rejected: ${keyword} statements are not allowed (read-only mode)`)
    }
  }

  const pool = await getPool()
  const request = pool.request()

  // Add parameters if provided
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  return await request.query(query)
}

// Format query results for display
function formatResults(result: sql.IResult<any>): string {
  if (result.recordset.length === 0) {
    return 'No results found.'
  }

  const rows = result.recordset
  const columns = Object.keys(rows[0])

  // Create a simple table format
  let output = `\nResults (${rows.length} rows):\n\n`

  // Header
  output += `${columns.join(' | ')}\n`
  output += `${columns.map(c => '-'.repeat(c.length)).join('-+-')}\n`

  // Rows (limit to first 100 for readability)
  const displayRows = rows.slice(0, 100)
  for (const row of displayRows) {
    output += `${columns.map(col => String(row[col] ?? '')).join(' | ')}\n`
  }

  if (rows.length > 100) {
    output += `\n... and ${rows.length - 100} more rows\n`
  }

  return output
}

// Create and configure the MCP server
const server = new Server(
  {
    name: 'teleskop-mcp-sqlserver',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: 'Execute a read-only SELECT query on the SQL Server database. Only SELECT statements are allowed.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL SELECT query to execute',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the current database with their schema and row counts',
        inputSchema: {
          type: 'object',
          properties: {
            schema: {
              type: 'string',
              description: 'Optional: Filter tables by schema name (e.g., "dbo")',
            },
          },
        },
      },
      {
        name: 'describe_table',
        description: 'Get detailed information about a table including columns, data types, and constraints',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'The table name to describe',
            },
            schema: {
              type: 'string',
              description: 'Optional: The schema name (defaults to "dbo")',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'list_schemas',
        description: 'List all schemas in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_columns',
        description: 'Search for columns across all tables by name pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Column name pattern to search for (use % as wildcard)',
            },
          },
          required: ['pattern'],
        },
      },
    ],
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'query': {
        const { query } = request.params.arguments as { query: string }

        if (!query || typeof query !== 'string') {
          throw new Error('Query parameter is required and must be a string')
        }

        const result = await executeReadOnlyQuery(query)

        return {
          content: [
            {
              type: 'text',
              text: formatResults(result),
            },
          ],
        }
      }

      case 'list_tables': {
        const { schema } = request.params.arguments as { schema?: string }

        const query = `
          SELECT
            s.name AS SchemaName,
            t.name AS TableName,
            p.rows AS RowCount,
            CAST(SUM(a.total_pages) * 8 AS BIGINT) AS TotalSpaceKB
          FROM sys.tables t
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          LEFT JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id < 2
          INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
          LEFT JOIN sys.allocation_units a ON p.partition_id = a.container_id
          WHERE t.is_ms_shipped = 0
            ${schema ? 'AND s.name = @schema' : ''}
          GROUP BY s.name, t.name, p.rows
          ORDER BY s.name, t.name
        `

        const result = await executeReadOnlyQuery(query, schema ? { schema } : undefined)

        return {
          content: [
            {
              type: 'text',
              text: formatResults(result),
            },
          ],
        }
      }

      case 'describe_table': {
        const { table, schema = 'dbo' } = request.params.arguments as { table: string, schema?: string }

        if (!table || typeof table !== 'string') {
          throw new Error('Table parameter is required and must be a string')
        }

        const query = `
          SELECT
            c.name AS ColumnName,
            t.name AS DataType,
            c.max_length AS MaxLength,
            c.precision AS Precision,
            c.scale AS Scale,
            c.is_nullable AS IsNullable,
            c.is_identity AS IsIdentity,
            ISNULL(i.is_primary_key, 0) AS IsPrimaryKey,
            dc.definition AS DefaultValue
          FROM sys.columns c
          INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
          INNER JOIN sys.tables tbl ON c.object_id = tbl.object_id
          INNER JOIN sys.schemas s ON tbl.schema_id = s.schema_id
          LEFT JOIN sys.index_columns ic ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          LEFT JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND i.is_primary_key = 1
          LEFT JOIN sys.default_constraints dc ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
          WHERE tbl.name = @table
            AND s.name = @schema
          ORDER BY c.column_id
        `

        const result = await executeReadOnlyQuery(query, { table, schema })

        if (result.recordset.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Table '${schema}.${table}' not found.`,
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: formatResults(result),
            },
          ],
        }
      }

      case 'list_schemas': {
        const query = `
          SELECT
            name AS SchemaName,
            schema_id AS SchemaId
          FROM sys.schemas
          WHERE name NOT IN ('sys', 'INFORMATION_SCHEMA')
          ORDER BY name
        `

        const result = await executeReadOnlyQuery(query)

        return {
          content: [
            {
              type: 'text',
              text: formatResults(result),
            },
          ],
        }
      }

      case 'search_columns': {
        const { pattern } = request.params.arguments as { pattern: string }

        if (!pattern || typeof pattern !== 'string') {
          throw new Error('Pattern parameter is required and must be a string')
        }

        const query = `
          SELECT
            s.name AS SchemaName,
            t.name AS TableName,
            c.name AS ColumnName,
            ty.name AS DataType,
            c.is_nullable AS IsNullable
          FROM sys.columns c
          INNER JOIN sys.tables t ON c.object_id = t.object_id
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          WHERE c.name LIKE @pattern
            AND t.is_ms_shipped = 0
          ORDER BY s.name, t.name, c.name
        `

        const result = await executeReadOnlyQuery(query, { pattern })

        return {
          content: [
            {
              type: 'text',
              text: formatResults(result),
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})

// Start the server
async function main() {
  try {
    // Test database connection
    await getPool()
    console.error('Successfully connected to SQL Server database')

    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error('Teleskop SQL Server MCP server running on stdio')
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Cleanup on exit
process.on('SIGINT', async () => {
  console.error('\nShutting down...')
  if (pool) {
    await pool.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.error('\nShutting down...')
  if (pool) {
    await pool.close()
  }
  process.exit(0)
})

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
