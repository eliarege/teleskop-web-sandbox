import type { Knex } from 'knex'

export async function legacyMigration_3_4_19_0(_knex: Knex) {
  // These are handled by 000_init-database.sql migration.
  // Keeping this here just for reference. No actual schema changes are needed for this version.

  // await knex.raw(`
  //   CREATE TABLE BAMACHAIN(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [CARD] [int] NOT NULL,
  //   [CANAL] [int] NOT NULL,
  //   [NAME] [nvarchar](50) NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL,
  //   [TBBCHANGETIME] [datetime] NULL,
  //   [CHANGETIME] [datetime] NULL,
  //   [MIMICID] [int] NULL Default 0,
  //   [CALIBTYPE] [smallint] NULL,
  //   [CALIBMAXVALUE] [real] NULL,
  //   [CALIBUNIT] [varchar](10) NULL,
  //   [CALIBLOWERLIMIT] [nvarchar](500) NULL,
  //   [CALIBUPPERLIMIT] [nvarchar](500) NULL,
  //   CONSTRAINT [PK_BAMACHAIN] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO, [ID] ASC)  ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHAIN_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)

  // await knex.raw(`
  //   CREATE TABLE BAMACHAOUT(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [CARD] [int] NOT NULL,
  //   [CANAL] [int] NOT NULL,
  //   [NAME] [nvarchar](50) NULL,
  //   [DEFAULTVALUE] [real] NOT NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL,
  //   [TBBCHANGETIME] [datetime] NULL,
  //   [CHANGETIME] [datetime] NULL,
  //   [MIMICID] [int] NULL Default 0,
  //   CONSTRAINT [PK_BAMACHAOUT] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO,[ID] ASC) ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHAOUT_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)

  // await knex.raw(`
  //   CREATE TABLE BAMACHDIN(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [CARD] [int] NOT NULL,
  //   [CANAL] [int] NOT NULL,
  //   [NAME] [nvarchar](50) NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL,
  //   [TBBCHANGETIME] [datetime] NULL,
  //   [CHANGETIME] [datetime] NULL,
  //   CONSTRAINT [PK_BAMACHDIN] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO,[ID] ASC) ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHDIN_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)

  // await knex.raw(`
  //   CREATE TABLE BAMACHDOUT(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [CARD] [int] NOT NULL,
  //   [CANAL] [int] NOT NULL,
  //   [NAME] [nvarchar](50) NULL,
  //   [DEFAULTVALUE] [int] NOT NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL,
  //   [TBBCHANGETIME] [datetime] NULL,
  //   [CHANGETIME] [datetime] NULL,
  //   CONSTRAINT [PK_BAMACHDOUT] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO,[ID] ASC) ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHDOUT_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)

  // await knex.raw(`
  //   CREATE TABLE BAMACHCOUNTER(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [CARD] [int] NOT NULL,
  //   [CANAL] [int] NOT NULL,
  //   [NAME] [nvarchar](50) NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL,
  //   [TBBCHANGETIME] [datetime] NULL,
  //   [CHANGETIME] [datetime] NULL,
  //   [CALIBUNIT] [varchar](10) NULL,
  //   CONSTRAINT [PK_BAMACHCOUNTER] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO,[ID] ASC) ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHCOUNTER_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)

  // await knex.raw(`
  //   CREATE TABLE BAMACHVIN(
  //   [MACHINEID] [int] NOT NULL,
  //   [MACHINECOMMANDSETNO] [int] NOT NULL,
  //   [ID] [int] NOT NULL,
  //   [BUTTONTYPE] [int] NOT NULL,
  //   [NAME] [nvarchar](100) NULL,
  //   [ENABLED] [bit] NOT NULL,
  //   [ISDELETED] [bit] NOT NULL DEFAULT 0,
  //   CONSTRAINT [PK_BAMACHVIN] PRIMARY KEY CLUSTERED ([MACHINEID], MACHINECOMMANDSETNO,[ID] ASC) ON [PRIMARY],
  //   CONSTRAINT [FK_BAMACHVIN_BFMACHINES] FOREIGN KEY([MACHINEID]) REFERENCES [dbo].[BFMACHINES] ([MACHINEID]) ON UPDATE CASCADE ON DELETE CASCADE
  //   ) ON [PRIMARY]
  // `)
}
