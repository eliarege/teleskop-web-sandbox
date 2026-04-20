import type { Knex } from 'knex'

export async function legacyMigration_3_4_06_0(_knex: Knex) {
  // These are handled by 000_init-database.sql migration.
  // Keeping this here just for reference. No actual schema changes are needed for this version.

  // await knex.raw(`
  //   CREATE TABLE BADATA_FILES(
  //   ID int IDENTITY(1,1),
  //   BATCHKEY int NOT NULL,
  //   FILETYPE tinyint NOT NULL,
  //   FILECONTENT varbinary(max) NULL,
  //   CONSTRAINT PK_BADATA_FILES PRIMARY KEY (ID ASC),
  //   INDEX IND_BADATA_FILES_BATCHKEY_FILETYPE NONCLUSTERED (BATCHKEY, FILETYPE),
  //   CONSTRAINT FK_BADATA_FILES_BADATA FOREIGN KEY(BATCHKEY) REFERENCES BADATA (BATCHKEY) ON UPDATE CASCADE ON DELETE CASCADE )
  // `)
}
