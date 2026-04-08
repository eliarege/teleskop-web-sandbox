if OBJECT_ID('BFMACHINES_PT_INSERT', 'TR') IS NULL
BEGIN
  EXEC('CREATE TRIGGER BFMACHINES_PT_INSERT ON [BFMACHINES]
    FOR INSERT
    AS
    begin
      declare @teleskopMAchine bit
      select @teleskopMAchine = USEINTELESKOP From inserted
      if(@teleskopMAchine = 1)
        begin
        INSERT INTO PTBATCHPLANQUEUEACCESS (MACHINEID, CANWRITE, ROWVER, LASTCHANGER)
        SELECT ins.MACHINEID, 1, 0, -1
        FROM inserted ins
      end
    end;
  ');
END;


if OBJECT_ID('trig_BADATA_DELETE', 'TR') IS NULL
BEGIN
  EXEC('CREATE TRIGGER trig_BADATA_DELETE ON BADATA AFTER DELETE
    AS
    BEGIN
      SET NOCOUNT ON;

      DECLARE @batchkey int;
        DECLARE crs_badata_delete CURSOR FOR (SELECT BATCHKEY FROM deleted);
      OPEN crs_badata_delete;
      FETCH NEXT FROM crs_badata_delete INTO @batchkey
      WHILE @@FETCH_STATUS = 0
        BEGIN
        DELETE FROM BAIOVALUES_CURRENT WHERE BATCHKEY=@batchkey;
        DELETE FROM BAPVVALUES_CURRENT WHERE BATCHKEY=@batchkey;
        DELETE FROM BACYCLETIMES_CURRENT WHERE BATCHKEY=@batchkey;
        DELETE FROM BADIOVALUES_CURRENT WHERE BATCHKEY=@batchkey;
        DELETE FROM BACALCULATEDVALUES WHERE BATCHKEY=@batchkey;

        FETCH NEXT FROM crs_badata_delete INTO @batchkey
        END
      CLOSE crs_badata_delete;
    DEALLOCATE crs_badata_delete;
    END;
  ');
END;

if OBJECT_ID('trig_BADATA_ENDTIME_UPDATE', 'TR') IS NULL
BEGIN
  EXEC('CREATE TRIGGER [dbo].[trig_BADATA_ENDTIME_UPDATE]
    ON  [dbo].[BADATA] AFTER UPDATE
    AS
    BEGIN
      SET NOCOUNT ON;
        DECLARE @batchkey int;
        DECLARE @endtime datetime;
        DECLARE @canceltime datetime;
        DECLARE mycursor CURSOR FOR (SELECT BATCHKEY,ENDTIME,CANCELTIME FROM INSERTED);
        OPEN mycursor;
        FETCH NEXT FROM mycursor INTO @batchkey,@endtime,@canceltime
        WHILE @@FETCH_STATUS = 0
        BEGIN
            IF (@endtime IS NOT NULL) OR (@canceltime IS NOT NULL)
            BEGIN
            DELETE FROM BAIOVALUES_CURRENT WHERE BATCHKEY=@batchkey;
            DELETE FROM BAPVVALUES_CURRENT WHERE BATCHKEY=@batchkey;
            DELETE FROM BACYCLETIMES_CURRENT WHERE BATCHKEY=@batchkey;
            DELETE FROM BADIOVALUES_CURRENT WHERE BATCHKEY=@batchkey;
            DELETE FROM BACALCULATEDVALUES WHERE BATCHKEY=@batchkey;
            END
          FETCH NEXT FROM mycursor INTO @batchkey,@endtime,@canceltime
        END
        CLOSE mycursor;
        DEALLOCATE mycursor;
    END;
  ');
END;
