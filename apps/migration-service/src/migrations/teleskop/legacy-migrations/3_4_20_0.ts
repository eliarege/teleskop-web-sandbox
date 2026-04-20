import type { Knex } from 'knex'

export async function legacyMigration_3_4_20_0(_knex: Knex) {
  // This is already handled by 000_init-database.sql migration.
  // Keeping this here just for reference. No actual schema changes are needed for this version.

  // await knex.raw(`
  //   IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BADATA_ADDITIONS]') AND type in (N'U'))
  //   BEGIN
  //   CREATE TABLE BADATA_ADDITIONS(
  //   BATCHKEY int NOT NULL,
  //   ADDITIONCOUNT tinyint NOT NULL,
  //   STARTTIME datetime not null,
  //   ENDTIME datetime null,
  //   PROGRAMNO int not null,
  //   COMPLETED bit null,
  //   CONSTRAINT PK_BADATA_ADDITIONS PRIMARY KEY (BATCHKEY, ADDITIONCOUNT),
  //   INDEX IND_BADATA_ADDITIONS_BATCHKEY_ADDITIONCOUNT NONCLUSTERED (BATCHKEY, ADDITIONCOUNT),
  //   CONSTRAINT FK_BADATA_ADDITIONS_BADATA FOREIGN KEY(BATCHKEY) REFERENCES BADATA (BATCHKEY) ON UPDATE CASCADE ON DELETE CASCADE )
  //   END
  // `)
}
