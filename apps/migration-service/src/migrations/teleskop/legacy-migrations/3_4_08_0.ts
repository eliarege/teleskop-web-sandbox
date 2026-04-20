import type { Knex } from 'knex'

export async function legacyMigration_3_4_08_0(_knex: Knex) {
  // These are handled by 000_init-database.sql migration.
  // Keeping this here just for reference. No actual schema changes are needed for this version.

  // await knex.raw(`
  //   CREATE TABLE BACHEMICALREQUESTSTRINGS(
  //     ID INT IDENTITY(1,1),
  //     REQUEST NVARCHAR(250),
  //     BATCHKEY INT,
  //     REQUESTTIME DATETIME,
  //     ISREQUEST tinyint Not NULL Default 1,
  //     CONSTRAINT PK_BACHEMICALREQUESTSTRINGS PRIMARY KEY (ID ASC) )
  // `)
}
