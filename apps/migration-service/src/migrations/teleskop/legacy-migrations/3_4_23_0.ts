import type { Knex } from 'knex'

export async function legacyMigration_3_4_23_0(knex: Knex) {
  await knex.raw(`
    ALTER PROCEDURE [dbo].[spGetWashTheoricCommandNumbers] @BatchKey INT ,@IsArchiveData BIT,@Result INT OUTPUT
    AS

    BEGIN TRY
    -- declare @BatchKey INT=3 ,@IsArchiveData BIT=1,@Result INT
    -- declare @BatchKey INT=6 ,@IsArchiveData BIT=1,@Result INT
    --TStepStatus = (stepStatusNoChange=0,stepStatusAdded=1,stepStatusRemovedorSkipped=2);

    DECLARE @ProgVersionNumber int = -1
    DECLARE @FirstStepTime datetime
    DECLARE @MAINSTEP INT,@CHANGEDATE DATETIME,@COMMANDNO INT,@STEPADDED BIT,@PHASESTEP INT

    DECLARE @THEORICSTEPS TABLE(
    STEPNO int,
    [MACHINEID] [int] ,
    [PROGNO] [int] ,
    [MAINSTEP] [int] ,
    [PARALELSTEP] [int] ,
    [COMMANDNO] [int] ,
    [ISCONDITIONAL] [bit] ,
    [CONDITIONSTR] varchar(255) ,
    [ERRORS] [tinyint] ,
    [THEORETICDURATION] [int],
    PHASESTEP int,
    PHASENO int);

    DECLARE @BAACTUALSTEPS TABLE(
    [BATCHKEY] [int] ,
    [PRGNO] [int] ,
    [STEPNO] [int] ,
    [PARALLELSTEPNO] [int] ,
    [COMMANDNO] [int] ,
    [STARTTIME] [datetime] ,
    [ENDTIME] [datetime] ,
    [COMMANDENDSTEP] [int] ,
    [THEORETICDURATION] [int] ,
    [PRGINDEX] [int] ,
    PHASENO int,
    PHASEINDEX int,
    OPTIMIZEDTHEORETICDURATION int);

    DECLARE @LASTACTUALSTEPS TABLE(
    [THEORICSTEPNO] decimal(8,3),
    [ACTUALSTEPNO] decimal(8,3),
    [PRGNO] [int],
    [COMMANDNO] [int],
    [STARTTIME] [datetime],
    [ENDTIME] [datetime] ,
    [THEORETICDURATION] [int],
    STEPSTATUS int default 0 ,
    ISWORKED bit default 1);

    DECLARE @LASTRESULTACTUALSTEPS TABLE(
    [THEORICSTEPNO] decimal(8,3),
    [ACTUALSTEPNO] decimal(8,3),
    [PRGNO] [int],
    [COMMANDNO] [int],
    [STARTTIME] [datetime],
    [ENDTIME] [datetime] ,
    [THEORETICDURATION] [int] ,
    STEPSTATUS int default 0 ,
    ISWORKED bit default 1);

    DECLARE @STEPCHANGES TABLE(
    MAINSTEP INT,
    CHANGEDATE DATETIME,
    COMMANDNO INT,
    STEPADDED BIT)

    INSERT INTO @STEPCHANGES
    SELECT
    MAINSTEP
    ,CHANGEDATE
    ,COMMANDNO
    ,STEPADDED
    FROM [dbo].[BASTEPCHANGES]
    WHERE BATCHKEY = @BatchKey  and PARALELSTEP = 0
    ORDER BY CHANGEDATE DESC


    --Ar�iv yada monitor datas� olmas�na g�re @THEORICSTEPS i�eri�inin �ekilece�i veriler de�i�tiriliyor.

    IF (@IsArchiveData = 0)
    BEGIN
    INSERT INTO @THEORICSTEPS
    SELECT
    (ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
    s.[MACHINEID]
    ,WP.WASHINGPROGNO
    ,s.[MAINSTEP]
    ,s.[PARALELSTEP]
    ,s.[COMMANDNO]
    ,s.[ISCONDITIONAL]
    ,s.[CONDITIONSTR]
    ,s.[ERRORS]
    ,s.[THEORETICDURATION]
    ,PH.STEPNO
    ,PH.PROGNO

    FROM BADATA D
    INNER JOIN BFWASHINGPRGHEADER WP ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,WP.WASHINGPROGNO) = 1 AND WP.MACHINEID = d.MACHINEID
    INNER JOIN BFWASHINGPRGPHASIS PH ON PH.WASHINGPROGNO = WP.WASHINGPROGNO AND WP.MACHINEID = PH.MACHINEID
    INNER JOIN BFMASTERSTEPS S ON S.PROGNO = PH.PROGNO AND S.MACHINEID = PH.MACHINEID
    WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey)
    ORDER BY D.BATCHKEY,PH.STEPNO DESC
    END
    ELSE
    BEGIN

    SELECT TOP 1 @FirstStepTime = STARTTIME FROM [dbo].[BAACTUALPRGSTEPS] S
    WHERE S.BATCHKEY = @BatchKey and PARALLELSTEPNO = 0
    ORDER BY s.STARTTIME ASC
    IF EXISTS( SELECT TOP 1 s.[MACHINEID] FROM BADATA D
    INNER JOIN BAMASTERSTEPS S ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,S.PROGNO) = 1 AND s.MACHINEID = d.MACHINEID
    WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey) and
    [MACHINEPRGVERSIONNO] = dbo.GetProgramVersionNumber(@FirstStepTime,s.PROGNO,s.MACHINEID) )
    BEGIN
    INSERT INTO @THEORICSTEPS(
    STEPNO ,
    [MACHINEID]  ,
    [PROGNO]  ,
    [MAINSTEP]  ,
    [PARALELSTEP]  ,
    [COMMANDNO]  ,
    [ISCONDITIONAL]  ,
    [CONDITIONSTR] ,
    [THEORETICDURATION],
    PHASESTEP,
    PHASENO )
    SELECT
    (ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
    s.[MACHINEID]
    ,WP.WASHINGPROGNO
    ,s.[MAINSTEP]
    ,s.[PARALELSTEP]
    ,s.[COMMANDNO]
    ,s.[ISCONDITIONAL]
    ,s.[CONDITIONSTR]
    ,s.[THEORETICDURATION]
    ,PH.STEPNO
    ,PH.PROGNO
    FROM BADATA D
    INNER JOIN BFWASHINGPRGHEADER WP ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,WP.WASHINGPROGNO) = 1 AND WP.MACHINEID = d.MACHINEID
    INNER JOIN BFWASHINGPRGPHASIS PH ON PH.WASHINGPROGNO = WP.WASHINGPROGNO AND WP.MACHINEID = PH.MACHINEID
    INNER JOIN BAMASTERSTEPS S ON S.PROGNO = PH.PROGNO AND S.MACHINEID = PH.MACHINEID
    WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey) and
    S.[MACHINEPRGVERSIONNO] = dbo.GetProgramVersionNumber(@FirstStepTime,s.PROGNO,s.MACHINEID)
    ORDER BY D.BATCHKEY,PH.STEPNO DESC
    END
    ELSE
    BEGIN
    INSERT INTO @THEORICSTEPS
    SELECT
    (ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
    s.[MACHINEID]
    ,WP.WASHINGPROGNO
    ,s.[MAINSTEP]
    ,s.[PARALELSTEP]
    ,s.[COMMANDNO]
    ,s.[ISCONDITIONAL]
    ,s.[CONDITIONSTR]
    ,s.ERRORS
    ,s.[THEORETICDURATION]
    ,PH.STEPNO
    ,PH.PROGNO
    FROM BADATA D
    INNER JOIN BFWASHINGPRGHEADER WP ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,WP.WASHINGPROGNO) = 1 AND WP.MACHINEID = d.MACHINEID
    INNER JOIN BFWASHINGPRGPHASIS PH ON PH.WASHINGPROGNO = WP.WASHINGPROGNO AND WP.MACHINEID = PH.MACHINEID
    INNER JOIN BFMASTERSTEPS S ON S.PROGNO = PH.PROGNO AND S.MACHINEID = PH.MACHINEID
    WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey)
    ORDER BY D.BATCHKEY,PH.STEPNO DESC
    END
    END

    DECLARE theoricStepUpdateCursor CURSOR
    FOR (
    SELECT DISTINCT MAINSTEP, PHASESTEP   FROM
    @THEORICSTEPS

    )
    OPEN theoricStepUpdateCursor;
    DECLARE @NEWMAINSTEP INT = 0
    DECLARE @LASTPHASESTEP INT = 0
    FETCH NEXT FROM theoricStepUpdateCursor INTO @MAINSTEP ,@PHASESTEP
    WHILE @@FETCH_STATUS = 0
    BEGIN
    UPDATE @THEORICSTEPS SET MAINSTEP = @NEWMAINSTEP WHERE MAINSTEP= @MAINSTEP AND PHASESTEP = @PHASESTEP

    SET @NEWMAINSTEP = @NEWMAINSTEP + 1;
    FETCH NEXT FROM theoricStepUpdateCursor INTO @MAINSTEP ,@PHASESTEP
    END
    CLOSE theoricStepUpdateCursor;
    DEALLOCATE theoricStepUpdateCursor;

    INSERT INTO @BAACTUALSTEPS
    SELECT  s.* FROM [dbo].[BAACTUALPRGSTEPS] S
    WHERE S.BATCHKEY = @BatchKey and PARALLELSTEPNO = 0
    ORDER BY s.STARTTIME ASC

    INSERT INTO @LASTACTUALSTEPS
    SELECT
    [STEPNO],
    [STEPNO],
    [PRGNO] ,
    [COMMANDNO] ,
    [STARTTIME] ,
    [ENDTIME]  ,
    [THEORETICDURATION],
    0,
    1
    FROM @BAACTUALSTEPS
    DECLARE @StepChangesCount INT ,@CURRTHEORICSTEPNO FLOAT
    SELECT @StepChangesCount = COUNT(AutoNumber) FROM BASTEPCHANGES Where BATCHKEY = @BatchKey  and PARALELSTEP = 0

    IF(@StepChangesCount > 0)
    BEGIN
    DECLARE stepChangesCursor CURSOR
    FOR (
    SELECT * FROM
    @STEPCHANGES

    )
    OPEN stepChangesCursor;
    DECLARE @STEPSHIFT INT = 0
    FETCH NEXT FROM stepChangesCursor INTO @MAINSTEP ,@CHANGEDATE ,@COMMANDNO ,@STEPADDED
    WHILE @@FETCH_STATUS = 0
    BEGIN
    IF (@STEPADDED = 0)
    BEGIN
    UPDATE @LASTACTUALSTEPS
    SET
    THEORICSTEPNO = THEORICSTEPNO + 1
    WHERE STARTTIME > @CHANGEDATE AND THEORICSTEPNO >= @MAINSTEP

    END
    ELSE IF (@STEPADDED = 1)
    BEGIN
    UPDATE @LASTACTUALSTEPS
    SET
    THEORICSTEPNO = THEORICSTEPNO - 0.001,
    @CURRTHEORICSTEPNO = THEORICSTEPNO - 0.001,
    STEPSTATUS = 1
    WHERE THEORICSTEPNO = @MAINSTEP AND STARTTIME > @CHANGEDATE
    UPDATE @LASTACTUALSTEPS
    SET
    THEORICSTEPNO = THEORICSTEPNO - 1
    WHERE STARTTIME > @CHANGEDATE   AND THEORICSTEPNO > @MAINSTEP  -- TB-99 AND THEORICSTEPNO <> @CURRTHEORICSTEPNO
    END

    FETCH NEXT FROM stepChangesCursor INTO @MAINSTEP ,@CHANGEDATE ,@COMMANDNO ,@STEPADDED
    END
    CLOSE stepChangesCursor;
    DEALLOCATE stepChangesCursor;

    END
    DECLARE @IsStepSkipped BIT = 0
    DECLARE @CurrStepNo FLOAT=0,@LastStepNo FLOAT=-1,@CurrStartTime DATETIME
    INSERT INTO @LASTRESULTACTUALSTEPS
    SELECT
    THEORICSTEPNO,
    ACTUALSTEPNO,
    [PRGNO] ,
    [COMMANDNO] ,
    [STARTTIME] ,
    [ENDTIME]  ,
    [THEORETICDURATION],
    STEPSTATUS,
    ISWORKED
    FROM @LASTACTUALSTEPS
    DECLARE stepSkippedCursor CURSOR
    FOR (
    SELECT
    THEORICSTEPNO
    FROM @LASTACTUALSTEPS
    )
    OPEN stepSkippedCursor;

    FETCH NEXT FROM stepSkippedCursor INTO @CurrStepNo
    WHILE @@FETCH_STATUS = 0
    BEGIN
    IF (@CurrStepNo-@LastStepNo) > 1
    BEGIN
    SET @IsStepSkipped = 1
    BREAK
    END
    FETCH NEXT FROM stepSkippedCursor INTO @CurrStepNo
    END
    CLOSE stepSkippedCursor;
    DEALLOCATE stepSkippedCursor;
    IF (@IsStepSkipped = 1)
    BEGIN

    DECLARE searchSkippedStepsCursor CURSOR
    FOR (
    SELECT
    THEORICSTEPNO ,
    STARTTIME
    FROM @LASTACTUALSTEPS
    )
    OPEN searchSkippedStepsCursor;

    FETCH NEXT FROM searchSkippedStepsCursor INTO @CurrStepNo ,@CurrStartTime
    WHILE @@FETCH_STATUS = 0
    BEGIN
    IF  (@CurrStepNo-@LastStepNo) > 1
    BEGIN
    INSERT INTO @LASTRESULTACTUALSTEPS
    SELECT
    [STEPNO],
    -1,
    PROGNO ,
    [COMMANDNO] ,
    DATEADD(ss,-1,@CurrStartTime)  ,
    null  ,
    [THEORETICDURATION] ,
    2,--stepstatus skipped or removed
    0 -- is not worked
    FROM @THEORICSTEPS where [STEPNO] >@LastStepNo AND [STEPNO] <@CurrStepNo
    END
    SET @LastStepNo = @CurrStepNo
    FETCH NEXT FROM searchSkippedStepsCursor INTO @CurrStepNo ,@CurrStartTime
    END
    CLOSE searchSkippedStepsCursor;
    DEALLOCATE searchSkippedStepsCursor;
    END
    DECLARE @maxActualStep INT , @maxTheoricStep INT,@maxStartTime datetime

    SELECT @maxActualStep = MAX(THEORICSTEPNO) FROM  @LASTACTUALSTEPS
    SELECT @maxTheoricStep = MAX(STEPNO) FROM  @THEORICSTEPS
    IF @maxTheoricStep > @maxActualStep
    BEGIN
    SELECT @maxStartTime = MAX(STARTTIME) FROM  @LASTACTUALSTEPS
    INSERT INTO @LASTRESULTACTUALSTEPS
    SELECT
    [STEPNO],
    -1,
    PROGNO ,
    [COMMANDNO] ,
    DATEADD(ss,1,@maxStartTime)  ,
    null  ,
    [THEORETICDURATION] ,
    2,--stepstatus skipped or removed
    0 -- is not worked
    FROM @THEORICSTEPS where [STEPNO] >@maxActualStep
    END
    SET @Result = 1

    SELECT * FROM @LASTRESULTACTUALSTEPS ORDER BY STARTTIME

    END TRY
    BEGIN CATCH
    exec dbo.sp_cleanUpCursor 'searchSkippedStepsCursor';
    exec dbo.sp_cleanUpCursor 'stepSkippedCursor' ;
    exec dbo.sp_cleanUpCursor 'stepChangesCursor' ;
    SET @Result = 0
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    SELECT
    @ErrorMessage = ERROR_MESSAGE(),
    @ErrorSeverity = ERROR_SEVERITY(),
    @ErrorState = ERROR_STATE();

    -- Use RAISERROR inside the CATCH block to return error
    -- information about the original error that caused
    -- execution to jump to the CATCH block.
    RAISERROR (@ErrorMessage, -- Message text.
    @ErrorSeverity, -- Severity.
    @ErrorState -- State.
    );
    END CATCH
  `)
}
