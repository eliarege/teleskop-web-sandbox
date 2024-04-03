export class DatabaseQueryError extends Error {
  query?: string
  constructor(message: string, query?: string) {
    super(message)
    this.name = 'DatabaseQueryError'
    this.query = query
  }
}
