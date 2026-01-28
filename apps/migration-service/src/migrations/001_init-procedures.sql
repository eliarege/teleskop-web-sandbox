
IF OBJECT_ID('clearParams', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[clearParams](@machIdToDelete int)
 AS
 BEGIN
     SET NOCOUNT ON;
 	DECLARE @ResultVar int, @machId int, @cmdNo int, @cmdSetNo int, @prmIndex int, @releaseDate datetime, @relEndDate datetime
 	Declare @mach2 int, @progNo2 int, @machver int
 	Declare @mainStep int, @prllStep int
 	Declare cmds cursor for
       SELECT  MACHINEID, COMMANDNO, MACHINECOMMANDSETNO, RELEASEDATE, RELEASEENDDATE FROM BAMASTERCOMMANDS
       Where MACHINEID = @machIdToDelete
 	Open cmds
 	FETCH NEXT FROM cmds INTO @machId, @cmdNo, @cmdSetNo, @releaseDate, @relEndDate
 	While @@FETCH_STATUS = 0
 	  Begin
 	    if @relEndDate is Null
 	      begin
 	        Declare prgArch cursor for
               SELECT MACHINEID,PROGNO,MACHINEPRGVERSIONNO FROM BAMASTERPRGHEADER Where RELEASEDATE >= @releaseDate And RELEASEENDDATE Is Null
 	      end
 	    else
 	      begin
 	        Declare prgArch cursor for
 	          SELECT MACHINEID,PROGNO,MACHINEPRGVERSIONNO FROM BAMASTERPRGHEADER Where RELEASEDATE >= @releaseDate And RELEASEENDDATE <= @relEndDate
 	      end
 	    Open prgArch
 	    FETCH NEXT FROM prgArch INTO @mach2, @progNo2, @machver
 	    While @@FETCH_STATUS = 0
 	      Begin
 	        Declare stps cursor for
 	          SELECT MAINSTEP, PARALELSTEP FROM BAMASTERSTEPS Where MACHINEID=@mach2 And PROGNO=@progNo2 And MACHINEPRGVERSIONNO=@machver And COMMANDNO=@cmdNo
 	        open stps
 	        FETCH NEXT FROM stps INTO  @mainStep, @prllStep
 	        While @@FETCH_STATUS = 0
 	          begin
 				Delete From BAMASTERSTEPPARAMS Where MACHINEID=@mach2 And MACHINEPRGVERSIONNO=@machver
 				And PROGNO=@progNo2 And MAINSTEP=@mainStep And PARALELSTEP=@prllStep And PARAMETERINDEX in
 				( Select PARAMETERINDEX From BACOMMANDPARAMETERS Where MACHINEID =
 				@mach2 And MACHINECOMMANDSETNO = @cmdSetNo And COMMANDNO = @cmdNo And USEDEFAULT = 1  )
 	            FETCH NEXT FROM stps INTO  @mainStep, @prllStep
 	          end
 	        close stps
 	        deallocate stps
 	        FETCH NEXT FROM prgArch INTO @mach2, @progNo2, @machver
 	      End
 	    close prgArch
 	    deallocate prgArch
 	    FETCH NEXT FROM cmds INTO @machId, @cmdNo, @cmdSetNo, @releaseDate, @relEndDate
 	  End
 	close cmds
 	deallocate cmds
 END;
  ');
END;

IF OBJECT_ID('clearPrms1', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[clearPrms1](@machIdToDelete int)
  AS
  BEGIN
    SET NOCOUNT ON;
    Delete From BFMASTERSTEPINPUTOUTPUTS Where MACHINEID = @machIdToDelete And IOTYPE <> 5
    Delete From BAMASTERSTEPINPUTOUTPUTS Where MACHINEID = @machIdToDelete And IOTYPE <> 5
    Declare @machId int, @cmdNo int
     Declare @prgNo int, @mains int, @prllS int
     Declare cmds cursor for
       SELECT  MACHINEID, COMMANDNO FROM BFMASTERCOMMANDS Where MACHINEID = @machIdToDelete
     Open cmds
     FETCH NEXT FROM cmds INTO @machId, @cmdNo
     While @@FETCH_STATUS = 0
       Begin
         Declare prg Cursor For
           Select PROGNO, MAINSTEP, PARALELSTEP From BFMASTERSTEPS Where COMMANDNO=@cmdNo And MACHINEID=@machId
         Open prg
         FETCH NEXT FROM prg INTO @prgNo, @mains, @prllS
         While @@FETCH_STATUS = 0
           Begin
             Delete From BFMASTERSTEPPARAMS Where MACHINEID=@machId And PROGNO=@prgNo And MAINSTEP=@mains And
             PARALELSTEP=@prllS And PARAMETERINDEX in
             ( Select PARAMETERINDEX From BFCOMMANDPARAMETERS Where MACHINEID = @machId And COMMANDNO = @cmdNo And USEDEFAULT = 1 )
             FETCH NEXT FROM prg INTO @prgNo, @mains, @prllS
           End
         close prg
         deallocate prg
         FETCH NEXT FROM cmds INTO @machId, @cmdNo
       End
 	close cmds
 	deallocate cmds
 END;
  ');
END;

IF OBJECT_ID('ContainsNumber', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[ContainsNumber](@StringList nvarchar(max), @Number int,@seperator char(1) = '','')
  RETURNS bit
  AS
    BEGIN
    -- declare @StringList nvarchar(max)=''676,25'', @Number int=25,@seperator char(1) = '',''
  	declare @output nvarchar(55)= ''''
  	declare @oneChar char(1)
  	declare @i int
   declare @intValue int
  	select @i = 0
  	set @StringList = RTRIM(LTRIM(@StringList))
  	while @i < len(@StringList)
  	begin
  		set @i = @i + 1
  		set @oneChar  = substring(@StringList, @i, 1)
  		if(@i = len(@StringList) and @oneChar <> @seperator)
  			set @output =  @output + @oneChar;
  		if(@oneChar = @seperator or @i = len(@StringList))
  		begin
  		  set @intValue = cast(RTRIM(LTRIM(@output)) as int)
  		  set @output = ''''
  		  if(@intValue =@Number)
 		    --select 1
  		   return 1;
  		end
  		else
  		begin
  		  set @output =  @output + @oneChar;
  		end;

  	end
  	 return 0;
 	--select 0
     END;
  ');
END;

IF OBJECT_ID('ContainsNumberDefault', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[ContainsNumberDefault](@StringList nvarchar(max), @Number int)
 RETURNS bit
 AS
   BEGIN
 	RETURN dbo.ContainsNumber(@StringList,@Number,DEFAULT)
    END;
  ');
END;

IF OBJECT_ID('F_MAKE_VARIABLENAME', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[F_MAKE_VARIABLENAME] (@OLDNAME varchar(255)) returns varchar(255)
AS
BEGIN
declare @newname varchar(255);
  set @newname=upper(@oldname);
  set @newname=REPLACE(@newname,''.'',''_'');
  set @newname=REPLACE(@newname,'' '',''_'');
  set @newname=REPLACE(@newname,''-'',''_'');
  set @newname=REPLACE(@newname,''<'',''_'');
  set @newname=REPLACE(@newname,''>'',''_'');
  set @newname=REPLACE(@newname,''%'',''_'');
  set @newname=REPLACE(@newname,''&'',''_'');
  set @newname=REPLACE(@newname,'''''''',''_'');
  set @newname=REPLACE(@newname,''+'',''_'');
  set @newname=REPLACE(@newname,''/'',''_'');
  set @newname=REPLACE(@newname,''\\'',''_'');
  set @newname=REPLACE(@newname,''?'',''_'');
  set @newname=REPLACE(@newname,''='',''_'');
  set @newname=REPLACE(@newname,''"'',''_'');
  set @newname=REPLACE(@newname,''İ'',''_'');
  set @newname=REPLACE(@newname,''Ğ'',''_'');
  set @newname=REPLACE(@newname,''Ü'',''_'');
  set @newname=REPLACE(@newname,''Ş'',''_'');
  set @newname=REPLACE(@newname,''Ö'',''_'');
  set @newname=REPLACE(@newname,''Ç'',''_'');
  set @newname=REPLACE(@newname,''ğ'',''_'');
  set @newname=REPLACE(@newname,''ş'',''_'');
  set @newname=REPLACE(@newname,''ö'',''_'');
  set @newname=REPLACE(@newname,''ç'',''_'');
  set @newname=REPLACE(@newname,''ü'',''_'');
  set @newname=REPLACE(@newname,''ı'',''_'');
  set @newname=REPLACE(@newname,'' '',''_'');
  set @newname=REPLACE(@newname,''('',''_'');
  set @newname=REPLACE(@newname,'')'',''_'');
  return @newname
END;
  ');
END;

IF OBJECT_ID('F_MAKE_VARIABLENAME_NEW', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[F_MAKE_VARIABLENAME_NEW] (@OLDNAME varchar(255))
RETURNS varchar (255) AS
BEGIN
return @oldname
END;
  ');
END;

IF OBJECT_ID('fGenerateBatchKey', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[fGenerateBatchKey]()
RETURNS int
AS
BEGIN
	-- Declare the return variable here
	DECLARE @maxBAkey int;
	DECLARE @res int;

	SET @maxBAkey = ISNULL((SELECT MAX(BATCHKEY) FROM BADATA), 0);

	SET @res=@maxBAkey;

	IF @res = 0
		SET @res = ISNULL((SELECT MAX(LAST_BATCHKEY) FROM TFCOMDRIVERSETTINGS), 0);

	SET @res = @res + 1;

	RETURN @res;
END;
  ');
END;

IF OBJECT_ID('getActiveUser', 'IF') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[getActiveUser](@machIs int, @startDate nvarchar(25), @endDate nvarchar(25))
 RETURNS TABLE as
 Return
 Select Top 1 USERID, USERNAME, USERLASTNAME, ACTIVITYDATE From BAUSERACTIVITY
 Where MACHINEID=@machIs And
 ACTIVITYDATE>=@startDate And ACTIVITYDATE<=@endDate
 Order By ACTIVITYDATE Desc;
  ');
END;

IF OBJECT_ID('getActiveUserAsString', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[getActiveUserAsString]
 (@machIs int, @startDate nvarchar(25), @endDate nvarchar(25))
 RETURNS nvarchar(255)
 AS
 BEGIN
 DECLARE @ResultVar nvarchar(255)
 Set @ResultVar = ''''
 Select Top 1 @ResultVar = CONVERT(nvarchar(5), USERID) + ''. '' +  USERNAME + '' '' + USERLASTNAME From BAUSERACTIVITY
 Where MACHINEID=@machIs And
 ACTIVITYDATE>=@startDate And ACTIVITYDATE<=@endDate
 RETURN @ResultVar
 END;
  ');
END;

IF OBJECT_ID('GetCommandType', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[GetCommandType](@MachineId int, @CommandNo int)
 RETURNS  INT
 AS
   --DECLARE @MachineId int = 3, @CommandNo int = 56
   BEGIN
   -- TCommandType = (cmdNone 0, cmdAutoChemical 1, cmdManChemical 2, cmdAutoDye 3, cmdManDye 4, cmdDosage 5, cmdSalt 6, cmdGenericMaterialOne 7, cmdGenericMaterialTwo 8);
   -- cmdTypeChemicalReq           = 100;
   -- cmdTypeManualChemicalReq     = 101;
   -- cmdTypeDyeReq                = 200;
   -- cmdTypeManualDyeReq          = 201;
   -- cmdTypeCTTransfer            = 300;
   -- cmdTypeDTTransfer            = 400;
   -- cmdTypeRTTransfer            = 500;
   -- cmdTypePhControl             = 600;
   -- cmdTypeSample                = 700;
   -- cmdTypeSaltReq               = 800;
   -- cmdTypeGenericMaterialOneReq = 810;
   -- cmdTypeGenericMaterialTwoReq = 820;
   -- cmdOperatorWarningCommands   = 900;

      DECLARE @Result int = 0;
 	 DECLARE @CommandType int
      IF  EXISTS( SELECT * FROM  BFCOMMANDTYPES M WHERE machineId = @MachineId AND  commandNo = @CommandNo)
 	 BEGIN
 		SELECT @CommandType = commandType FROM  BFCOMMANDTYPES M WHERE machineId = @MachineId AND commandNo = @CommandNo
 		IF( @CommandType = 100)
 		 SET @Result = 1;
 		ELSE IF( @CommandType = 101)
 		 SET @Result = 2;
 		ELSE IF( @CommandType = 200)
 		 SET @Result = 3;
 		ELSE IF( @CommandType = 201)
 		 SET @Result = 4;
 		ELSE IF( @CommandType = 800)
 		 SET @Result = 6;
 		ELSE IF( @CommandType = 810)
 		 SET @Result = 7;
 		ELSE IF( @CommandType = 820)
 		 SET @Result = 8;
 	 END
 	 RETURN @Result;
 END;
  ');
END;

IF OBJECT_ID('getInterventionWithAlarms', 'TF') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[getInterventionWithAlarms](@batchKey int)
 RETURNS @batchInterventions TABLE ( eventStart datetime, eventCode int, operator nvarchar(255), eventExplanation nvarchar(255))
 AS
 BEGIN
    	Declare @eStart datetime, @eCode int, @eExpl nvarchar(255), @eOper nvarchar(255)
     Declare @batchStart nvarchar(25), @tmpDate datetime, @tmpInt int, @tmpOp nvarchar(255)
     Select @tmpDate = STARTTIME, @tmpInt = MACHINEID, @tmpOp=OPRNAME From BADATA Where BATCHKEY = @batchKey
     Set @batchStart = convert(varchar, @tmpDate, 120)
     declare @rdate datetime, @rcode int, @rOp nvarchar(255), @rExp nvarchar(255)
     Declare interv cursor for
    	Select INTERVENTTIME, 1, dbo.getActiveUserAsString(@tmpInt, @batchStart, convert(varchar, INTERVENTTIME, 120)), EXPLANATION From BAINTERVENTION
    	Where BATCHKEY = @batchKey
    	OPEN interv
    	FETCH NEXT FROM interv INTO @rdate, @rcode, @rOp, @rExp
      While @@FETCH_STATUS = 0
        Begin
          if @rOp = ''''
            Set @rOp = @tmpOp
          insert Into @batchInterventions Values(@rdate, @rcode, @rOp, @rExp)
          FETCH NEXT FROM interv INTO @rdate, @rcode, @rOp, @rExp
        End
     Declare alrm cursor for
    	Select STARTTIME, 2, dbo.getActiveUserAsString(@tmpInt, @batchStart, convert(varchar, STARTTIME, 120)), EXPLANATION From BAALARM
    	Where BATCHKEY = @batchKey
    	OPEN alrm
    	FETCH NEXT FROM alrm INTO @rdate, @rcode, @rOp, @rExp
      While @@FETCH_STATUS = 0
        Begin
          if @rOp = ''''
            Set @rOp = @tmpOp
          if @rExp <> ''''
            insert Into @batchInterventions Values(@rdate, @rcode, @rOp, @rExp)
          FETCH NEXT FROM alrm INTO @rdate, @rcode, @rOp, @rExp
        End
  	RETURN
  END;
  ');
END;

IF OBJECT_ID('GetProgramVersionNumber', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[GetProgramVersionNumber](@date datetime,@prgNo int,@machineID int)
 RETURNS int
 AS
   BEGIN
     DECLARE @Result INT = -1
 	SELECT @Result = MACHINEPRGVERSIONNO FROM BAMASTERPRGHEADER WHERE  MACHINEID = @machineID AND PROGNO = @prgNo AND
 	RELEASEDATE < @date AND RELEASEENDDATE > @date
 	RETURN @Result;
    END;
  ');
END;

IF OBJECT_ID('GetTranslatedString', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION dbo.GetTranslatedString (@Keyword NVARCHAR(200), @LangId SMALLINT)
 RETURNS NVARCHAR(200)
 AS
 BEGIN
 DECLARE @RESULT NVARCHAR(200);

 SELECT @RESULT = T.VALUE
   FROM BATRANSLATE T
  WHERE T.KEYWORD = @Keyword
    AND T.LNGID = @LangId;

 RETURN ISNULL(@RESULT, @Keyword);
 END;
  ');
END;

IF OBJECT_ID('GetWashingParamsTable', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[GetWashingParamsTable]
  @MACHINEID int ,@WASHPROGNO int
 AS
 BEGIN
     --DECLARE @MACHINEID  int=104 ,@WASHPROGNO int=1
  DECLARE @PROGNO INT, @PROGINDEX INT;
  DECLARE @WASHINGPARAMID INT,@PARAMNAME NVARCHAR(50);
  DECLARE @PARAMCOUNT INT = 1;
  DECLARE  @washParams table (
  PROGNO INT,
  PROGINDEX INT,
  PARAM1 NVARCHAR(50),
  PARAMVAL1 DECIMAL,
  PARAM2 NVARCHAR(50),
  PARAMVAL2 DECIMAL,
  PARAM3 NVARCHAR(50),
  PARAMVAL3 DECIMAL,
  PARAM4 NVARCHAR(50),
  PARAMVAL4 DECIMAL,
  PARAM5 NVARCHAR(50),
  PARAMVAL5 DECIMAL,
  PARAM6 NVARCHAR(50),
  PARAMVAL6 DECIMAL,
  PARAM7 NVARCHAR(50),
  PARAMVAL7 DECIMAL,
  PARAM8 NVARCHAR(50),
  PARAMVAL8 DECIMAL,
  PARAM9 NVARCHAR(50),
  PARAMVAL9 DECIMAL,
  PARAM10 NVARCHAR(50),
  PARAMVAL10 DECIMAL,
  PARAM11 NVARCHAR(50),
  PARAMVAL11 DECIMAL,
  PARAM12 NVARCHAR(50),
  PARAMVAL12 DECIMAL
  );

  DECLARE @WASHPARAMINFOS TABLE(
    WASHINGPARAMID INT,
    PARAMNAME NVARCHAR(50)
  )

  SELECT V.WASHINGPARAMID,  P.NAME PARAMNAME,  V.VALUE PARAMVALUE ,V.PROGNO,V.PHASESTEPNO INTO #TEMPPARAMVALS
  FROM BFWASHINGPRGHEADER PR
  INNER JOIN BFWASHINGPRGPHASIS PH ON PH.WASHINGPROGNO = PR.WASHINGPROGNO AND PH.MACHINEID = PR.MACHINEID
  INNER JOIN  BFWASHINGPHASEPARAMVALUES V ON V.PROGNO = PH.PROGNO AND V.MACHINEID = PH.MACHINEID AND V.WASHINGPROGNO = PR.WASHINGPROGNO AND V.PHASESTEPNO = PH.STEPNO
  INNER JOIN BFWASHINGPARAMETER P ON P.WASHINGPARAMID = V.WASHINGPARAMID
  WHERE  PR.WASHINGPROGNO = @WASHPROGNO AND PR.MACHINEID = @MACHINEID ORDER BY  PH.STEPNO, V.WASHINGPARAMID

  INSERT INTO
    @WASHPARAMINFOS
  SELECT DISTINCT   V.WASHINGPARAMID ,P.NAME FROM #TEMPPARAMVALS V
  INNER JOIN BFWASHINGPARAMETER P ON P.WASHINGPARAMID = V.WASHINGPARAMID
  ORDER BY V.WASHINGPARAMID

  DECLARE PHASES_CURSOR CURSOR FOR

  SELECT PH.PROGNO , PH.STEPNO FROM
  BFWASHINGPRGPHASIS PH
  WHERE PH.WASHINGPROGNO = @WASHPROGNO AND PH.MACHINEID =  @MACHINEID ORDER BY STEPNO

  OPEN PHASES_CURSOR
  FETCH NEXT FROM PHASES_CURSOR   INTO @PROGNO, @PROGINDEX

  WHILE @@FETCH_STATUS = 0
  BEGIN
  INSERT INTO @washParams(PROGNO,PROGINDEX)
  SELECT
  @PROGNO,
  @PROGINDEX

  DECLARE PARAMS_CURSOR CURSOR FOR
  SELECT WASHINGPARAMID , PARAMNAME FROM
  @WASHPARAMINFOS
  ORDER BY WASHINGPARAMID

  OPEN PARAMS_CURSOR
  FETCH NEXT FROM PARAMS_CURSOR   INTO @WASHINGPARAMID, @PARAMNAME
  SET @PARAMCOUNT = 1;
  WHILE @@FETCH_STATUS =0
  BEGIN

      IF @PARAMCOUNT = 1
   BEGIN
    UPDATE P
    SET PARAM1 = @PARAMNAME,
    PARAMVAL1 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 2
   BEGIN
    UPDATE P
    SET PARAM2 = @PARAMNAME,
    PARAMVAL2 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 3
   BEGIN
    UPDATE P
    SET PARAM3 = @PARAMNAME,
    PARAMVAL3 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX ;
   END
   ELSE IF @PARAMCOUNT = 4
   BEGIN
    UPDATE P
    SET PARAM4 = @PARAMNAME,
    PARAMVAL4 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 5
   BEGIN
    UPDATE P
    SET PARAM5 = @PARAMNAME,
    PARAMVAL5 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 6
   BEGIN
    UPDATE P
    SET PARAM6 = @PARAMNAME,
    PARAMVAL6 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 7
   BEGIN
    UPDATE P
    SET PARAM7 = @PARAMNAME,
    PARAMVAL7 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 8
   BEGIN
    UPDATE P
    SET PARAM8 = @PARAMNAME,
    PARAMVAL8 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX ;
   END
   ELSE IF @PARAMCOUNT = 9
   BEGIN
    UPDATE P
    SET PARAM9 = @PARAMNAME,
    PARAMVAL9 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 10
   BEGIN
    UPDATE P
    SET PARAM10 = @PARAMNAME,
    PARAMVAL10 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 11
   BEGIN
    UPDATE P
    SET PARAM11 = @PARAMNAME,
    PARAMVAL11 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END
   ELSE IF @PARAMCOUNT = 12
   BEGIN
    UPDATE P
    SET PARAM12 = @PARAMNAME,
    PARAMVAL12 =T.PARAMVALUE
    FROM @washParams P
    LEFT JOIN #TEMPPARAMVALS  T ON T.PROGNO = P.PROGNO AND T.PHASESTEPNO = P.PROGINDEX AND T.WASHINGPARAMID = @WASHINGPARAMID
    WHERE P.PROGNO =@PROGNO  AND P.PROGINDEX = @PROGINDEX  ;
   END

   SET @PARAMCOUNT =  @PARAMCOUNT + 1;
   FETCH NEXT FROM PARAMS_CURSOR   INTO @WASHINGPARAMID, @PARAMNAME
  END;
  CLOSE PARAMS_CURSOR;
  DEALLOCATE PARAMS_CURSOR;

   FETCH NEXT FROM PHASES_CURSOR   INTO @PROGNO, @PROGINDEX

  END

  DROP TABLE #TEMPPARAMVALS
  CLOSE PHASES_CURSOR;
  DEALLOCATE PHASES_CURSOR;

  SELECT * FROM @WASHPARAMS
 END;
  ');
END;

IF OBJECT_ID('HAS_NOTE', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[HAS_NOTE] (@JOBORDER AS nvarchar(20) )
 RETURNS bit AS
 BEGIN
 	declare @noteCount int;
 	declare @hasNote bit;
 	SET @noteCount = ISNULL((SELECT COUNT(*) FROM PTBATCHNOTES WHERE JOBORDER = @JOBORDER AND USERTYPE = 1 AND SHOWONSCREEN = 1), 0);
 	if @noteCount = 0
 		set @hasNote = 0
 	else
 		set @hasNote = 1;
 	return @hasNote;
 END;
  ');
END;

IF OBJECT_ID('P_CLEAN_TB', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_CLEAN_TB]  @TBLNAME VARCHAR(50), @WHERECLAUSE VARCHAR(999)
AS
    DECLARE @QRY  VARCHAR(999);
    SET @QRY = ''DELETE FROM '' + @TBLNAME + @WHERECLAUSE;
    EXECUTE sp_executesql @QRY;
  ');
END;

IF OBJECT_ID('P_CLONE_EQ', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_CLONE_EQ] @NewMachine_Id INT, @CloneMachineID INT
AS
  DECLARE @QRY VARCHAR;
  DECLARE @EQINDEX INT;
  DECLARE @EQID INT;
  DECLARE @EQNAME VARCHAR(30);
  DECLARE @vICON  BINARY;
  SET @QRY = ''SELECT EQUIPMENTINDEX, EQUIPMENTID,NAME  FROM BFMACHEQUIPMENT WHERE MACHINEID = '' + @CloneMachineID;

  DECLARE crsr CURSOR FOR SELECT EQUIPMENTINDEX, EQUIPMENTID,NAME, ICON  FROM BFMACHEQUIPMENT WHERE MACHINEID = @CloneMachineID;
    open crsr;
      FETCH NEXT FROM crsr INTO @EQINDEX, @EQID, @EQNAME,@vICON;
      WHILE @@FETCH_STATUS = 0
	BEGIN
      	INSERT INTO BFMACHEQUIPMENT VALUES (@NewMachine_Id, @EQINDEX, @EQID, @EQNAME, @vICON);
	FETCH NEXT FROM crsr INTO @EQINDEX, @EQID, @EQNAME, @vICON;
    	END
    CLOSE crsr;
  ');
END;

IF OBJECT_ID('P_CLONE_EQ', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_CLONE_EQ] @NewMachine_Id INT, @CloneMachineID INT
AS
  DECLARE @QRY VARCHAR;
  DECLARE @EQINDEX INT;
  DECLARE @EQID INT;
  DECLARE @EQNAME VARCHAR(30);
  DECLARE @vICON  BINARY;
  SET @QRY = ''SELECT EQUIPMENTINDEX, EQUIPMENTID,NAME  FROM BFMACHEQUIPMENT WHERE MACHINEID = '' + @CloneMachineID;

  DECLARE crsr CURSOR FOR SELECT EQUIPMENTINDEX, EQUIPMENTID,NAME, ICON  FROM BFMACHEQUIPMENT WHERE MACHINEID = @CloneMachineID;
    open crsr;
      FETCH NEXT FROM crsr INTO @EQINDEX, @EQID, @EQNAME,@vICON;
      WHILE @@FETCH_STATUS = 0
	BEGIN
      	INSERT INTO BFMACHEQUIPMENT VALUES (@NewMachine_Id, @EQINDEX, @EQID, @EQNAME, @vICON);
	FETCH NEXT FROM crsr INTO @EQINDEX, @EQID, @EQNAME, @vICON;
    	END
    CLOSE crsr;
  ');
END;

IF OBJECT_ID('P_COPY_PRG', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_COPY_PRG] @SOURCEMACHINEID INT, @SOURCEPRGNO INT, @DESTINATIONMACHINEID INT, @DESTINATIONPRGNO INT ,@ISUPDATEPRG BIT
             AS
             declare @mainStep int, @paraStep int, @cmdNo int, @geciciStr varchar(255), @srcFunc varchar(15), @destFunc varchar(15)
             IF @ISUPDATEPRG = 1  AND EXISTS(SELECT 1 FROM BFMASTERPRGHEADER WHERE MACHINEID = @DESTINATIONMACHINEID AND PROGNO = @DESTINATIONPRGNO)
   		  BEGIN
   		    DELETE FROM BFMASTERSTEPS WHERE MACHINEID = @DESTINATIONMACHINEID AND PROGNO = @DESTINATIONPRGNO;

   			  UPDATE  P
   			  SET PROCESSCODE = UP.PROCESSCODE , NAME = UP.NAME , DURATION = UP.DURATION , TOTALSTEP = UP.TOTALSTEP , CHANGEDATE = GETDATE(),TBBCHANGESOURCE = UP.TBBCHANGESOURCE ,
   			  LOCKEDBY = UP.LOCKEDBY,USERCOMMENT = UP.USERCOMMENT , ISDELETED = UP.ISDELETED ,ISCHANGED = UP.ISCHANGED,PRGSTATE = 1,TBBPRGCHANGEDEVENT=0,
   			  SOURCEMACHID = UP.SOURCEMACHID ,TotalChemReq = UP.TotalChemReq ,TotalDyeReq = up.TotalDyeReq,ManChemReq = up.ManChemReq,AutoChemReq = up.AutoChemReq,AutoDyeReq = up.AutoDyeReq,
   			  ManDyeReq= up.ManDyeReq,DefaultRecipeNo= up.DefaultRecipeNo,ICONNAME= up.ICONNAME, ORDEROFREQUESTS = up.ORDEROFREQUESTS, TOTALSALTREQ = up.TOTALSALTREQ,
           TOTALGM1REQ = up.TOTALGM1REQ, TOTALGM2REQ = up.TOTALGM2REQ, PHASEVERSION = up.PHASEVERSION, INTERVENTIONFREEPROGRAM = up.INTERVENTIONFREEPROGRAM
   			  FROM BFMASTERPRGHEADER P
   			  INNER JOIN BFMASTERPRGHEADER UP ON UP.MACHINEID = @SOURCEMACHINEID AND UP.PROGNO = @SOURCEPRGNO WHERE P.MACHINEID = @DESTINATIONMACHINEID AND P.PROGNO = @DESTINATIONPRGNO;
     		  END
     		  ELSE
     		  BEGIN
     		    DELETE FROM BFMASTERPRGHEADER WHERE MACHINEID = @DESTINATIONMACHINEID AND PROGNO = @DESTINATIONPRGNO;
     		      INSERT INTO BFMASTERPRGHEADER
     			  SELECT @DESTINATIONMACHINEID, @DESTINATIONPRGNO, PROCESSCODE, NAME, DURATION, TOTALSTEP, GETDATE(), TBBCHANGESOURCE,
     			  GETDATE(), LOCKEDBY, CREATIONDATE, USERCOMMENT, ISDELETED, ISCHANGED, 1, 0, @SOURCEMACHINEID, TotalChemReq, TotalDyeReq,ManChemReq,AutoChemReq,AutoDyeReq,ManDyeReq,DefaultRecipeNo,ICONNAME
     			  ,ORDEROFREQUESTS, TOTALSALTREQ, TOTALGM1REQ, TOTALGM2REQ, PHASEVERSION, INTERVENTIONFREEPROGRAM, ADDITIONALPROCESSCODE
     			  FROM BFMASTERPRGHEADER WHERE MACHINEID = @SOURCEMACHINEID AND PROGNO = @SOURCEPRGNO;
     		  END;

               INSERT INTO BFMASTERSTEPS
               SELECT @DESTINATIONMACHINEID, @DESTINATIONPRGNO, MAINSTEP, PARALELSTEP, BFMASTERSTEPS.COMMANDNO, ISCONDITIONAL, CONDITIONSTR, BFMASTERSTEPS.ERRORS, BFMASTERSTEPS.THEORETICDURATION
               FROM BFMASTERSTEPS INNER JOIN BFMASTERCOMMANDS ON BFMASTERSTEPS.COMMANDNO = BFMASTERCOMMANDS.COMMANDNO
               WHERE BFMASTERSTEPS.MACHINEID = @SOURCEMACHINEID AND BFMASTERCOMMANDS.MACHINEID = @SOURCEMACHINEID AND PROGNO = @SOURCEPRGNO AND ISDELETED = 0;

               -- 11.12.12 selman, komut parametrelerini alrken
               -- 1) edit edilemeyen parametreleri komutun kendi tanmndan alalm
               -- 2) edit edilebilen parametreleri,
               -- 2.A) kaynak makinede var ise ve deer uygun ise kaynak makineden alalm
               -- 2.B) kaynak makinede var ancak deer uygun deilse varsaylan deeri yaz ve deer deiti bilgisini errors''a yaz
               -- 2.C) Kaynak makinede yok ise hedef makineye ekle ve varsaylan deerlerle eklendi bilgisini erros''a yaz

               -- 14.12.12 selman komut iolarn alrken
               -- 1) seilebilir olmayan iolar konfigrasyondan direkt ykle
               -- 2) seilebilir ama edit edilemez (ismi - olanlar) iolar konfigrasyondan direkt ykle
               -- 2.A) seilebilir ama edit edilemez iolarn seimlerini konfigrasyondan ykle
               -- 3) seilebilen iolar
               -- 3.A) seilmi sradaki iolarn hepsi konfigrasyonda var ise seim srasn koruyarak kaynak makineden ykle
               -- 3.B) seilmi sradaki iolarn hepsi yok ise varsaylan ykle ve varsaylana ekildi uyars ekle

               declare @prmIndex int, @tmpBool bit, @isFormulaExistsOnDest bit
               declare prmTable cursor for

               SELECT stps.MAINSTEP, stps.PARALELSTEP, stps.COMMANDNO, src.TBBFUNTIONNAME as srcF, def.TBBFUNTIONNAME as destF
               FROM BFMASTERSTEPS stps
               Left join BFMASTERCOMMANDS src On src.MACHINEID = @SOURCEMACHINEID And stps.COMMANDNO = src.COMMANDNO
               Left join BFMASTERCOMMANDS def On def.MACHINEID = @DESTINATIONMACHINEID And stps.COMMANDNO = def.COMMANDNO
               Where stps.MACHINEID = @DESTINATIONMACHINEID And PROGNO = @DESTINATIONPRGNO Order By MAINSTEP, PARALELSTEP Asc

               OPEN prmTable
               FETCH NEXT FROM prmTable INTO @mainStep, @paraStep, @cmdNo, @srcFunc, @destFunc
               WHILE @@FETCH_STATUS = 0
                 BEGIN
                   declare @chrIndexDest int, @chrIndexSrc int
                   set @chrIndexDest = CHARINDEX(''.'', @destFunc)
                   set @chrIndexSrc = CHARINDEX(''.'', @srcFunc)
                   if( (@chrIndexDest = 0 And @chrIndexSrc = 0  And @destFunc = @srcFunc) Or
                       ( @chrIndexDest > 0 And @chrIndexSrc > 0  And SUBSTRING(@destFunc, 0, @chrIndexDest) = SUBSTRING(@srcFunc, 0, @chrIndexSrc) ) Or
                       ( @chrIndexDest = 0 And @chrIndexSrc > 0 And @destFunc = SUBSTRING(@srcFunc, 0, @chrIndexSrc) ) Or
                       ( @chrIndexDest > 0 And @chrIndexSrc = 0 And @srcFunc = SUBSTRING(@destFunc, 0, @chrIndexDest) ) )
                     BEGIN

                       -- editable olmayan parametreleri kaydet
                       -- 20.04.2015, iptal edildi
                       -- INSERT INTO BFMASTERSTEPPARAMS
                       -- SELECT @DESTINATIONPRGNO, @mainStep, @paraStep, PARAMETERINDEX, @DESTINATIONMACHINEID, VALUE, CONTAINSVARIABLE, '''', 0
                       -- FROM BFCOMMANDPARAMETERS WHERE MACHINEID = @DESTINATIONMACHINEID AND COMMANDNO = @cmdNo And USEDEFAULT = ''True'';
                       -- 20.04.2015

                       declare @prmI int, @prmValue nvarchar(255), @prmMinValue nvarchar(255), @prmMaxValue nvarchar(255), @prmType int, @useFormula bit
                       declare @prmSelection nvarchar(1023), @prmSelectionList nvarchar(1023), @prmContVar bit
                       declare visPrm cursor for Select PARAMETERINDEX, VALUE, PARAMETERTYPE, PARAMLOWLIMIT, PARAMHIGHLIMIT, SELECTIONLIST, SELECTIONVALUES, CONTAINSVARIABLE, USEFORMULA From BFCOMMANDPARAMETERS
                       Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And USEDEFAULT = ''False''
                       Order By PARAMETERINDEX Asc
                       Open visPrm

                       FETCH NEXT FROM visPrm INTO @prmI, @prmValue, @prmType, @prmMinValue, @prmMaxValue, @prmSelectionList, @prmSelection, @prmContVar, @useFormula
                       WHILE @@FETCH_STATUS = 0
                         BEGIN
                           if Exists(Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI)
                             BEGIN
                               if Exists(Select Value From BFCOMMANDPARAMETERS Where MACHINEID = @SOURCEMACHINEID And COMMANDNO = @cmdNo And PARAMETERINDEX = @prmI And USEDEFAULT = ''False'')
                                 BEGIN
                                   if ( @prmType = 0 ) -- float parameter
                                     BEGIN
                                       declare @geciciFlt float
                                       set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep
     								  And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
                                       set @geciciFlt = CONVERT(NUMERIC(9,3),REPLACE(@geciciStr,'','',''.'')) -- CONVERT(Float, @geciciStr)
                                       if( ( @geciciFlt >= CONVERT(Float, @prmMinValue) ) And ( @geciciFlt <= CONVERT(Float, @prmMaxValue) ) )
                                         BEGIN
                                           Insert Into BFMASTERSTEPPARAMS
                                           Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '''', 0, 0)
                                         END
                                       else
              BEGIN
                                           Insert Into BFMASTERSTEPPARAMS
                                           Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 2, 0)
     									  -- buradaki 2 dyeingProgram.pas''tan geliyor.
                                         END
                                     END
                                   ELSE If( @prmType = 1 ) -- seilebilir liste
                                     BEGIN
       							    -- 01.04.2014 selman
                                       set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep
     								  And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
                                       if ( @useFormula = ''True'' ) -- global komut forml destei, hedef makine forml kullanyor.
                                         Begin
                                           set @tmpBool = ( Select USEFORMULA From BFCOMMANDPARAMETERS Where MACHINEID = @SOURCEMACHINEID And COMMANDNO = @cmdNo
     									  And PARAMETERINDEX = @prmI )
                                           if ( @tmpBool = ''True'' ) -- kaynak makinede de forml var
                                             begin
                                               Set @isFormulaExistsOnDest = CAST( CASE WHEN EXISTS(Select formulaId From BFCOMMANDFORMULAS Where machineId = @DESTINATIONMACHINEID
     										  And formulaId = @geciciStr) THEN 1 ELSE 0 END AS BIT)
                                               if ( @isFormulaExistsOnDest = ''True'' ) -- atanm forml hedef bilgisayarda var
                                                 Begin
                                                   Insert Into BFMASTERSTEPPARAMS
                                                   Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '''', 0, 0)
                                                 End
                                               Else -- atanm forml hedef bilgisayarda yok, varsaylan deeri ile alalm.
                                                 Begin
                                                   Insert Into BFMASTERSTEPPARAMS
                                                   Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 2, 0)
                                                 End
                                             End
                                           Else -- kaynak makine forml kullanmyor.
                                             Begin
                                               Insert Into BFMASTERSTEPPARAMS
                                               Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 2, 0)
                                             End
                                         End
                                       -- 01.04.2014 selman
                                       else
                      Begin
                                           set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And
     									  MAINSTEP = @mainStep And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
                                           if(CHARINDEX(''"'' + @geciciStr + ''"'', @prmSelection, 0) > 0 )
                                             BEGIN
                                               Insert Into BFMASTERSTEPPARAMS
                                               Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '''', 0, 0)
                                             END
                                           else
                                             BEGIN
                     Insert Into BFMASTERSTEPPARAMS
                                               Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 2, 0)
                                             END
                                         End
                                     END
                                 END
                               else
                                 BEGIN
                                   Insert Into BFMASTERSTEPPARAMS
                                   Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 1, 0) -- buradaki 1 dyeingProgram.pas''tan geliyor.
                                 END
                             END
                           else
                             BEGIN
                               Insert Into BFMASTERSTEPPARAMS
                               Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '''', 1, 0) -- buradaki 1 dyeingProgram.pas''tan geliyor.
                             END
                           FETCH NEXT FROM visPrm INTO @prmI, @prmValue, @prmType, @prmMinValue, @prmMaxValue, @prmSelectionList, @prmSelection, @prmContVar, @useFormula
                         END
                       CLOSE visPrm
                       DEALLOCATE visPrm

                       -- tm iolar ekle
                       Insert Into BFMASTERSTEPINPUTOUTPUTS
                       Select @DESTINATIONPRGNO, @mainStep, @paraStep, IOINDEX, @DESTINATIONMACHINEID, IOID, IOTYPE, 0
                       From BFCOMMANDINPUTOUTPUTS
                       Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOTYPE = 5
                       -- yukardaki satra ''And IOTYPE = 5'' eklendi, 20.04.2015

                       -- seilmii var iolarn seimlerini ekle ( IOTYPE = 5 And NAME = ''-'' ) 18.12.12 selman
                       Insert Into BFMASTERSTEPSELECTIONLIST
                       Select l.SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, l.IOINDEX, @DESTINATIONMACHINEID, l.IOID, l.IOTYPE
                       From BFCOMMANDSELECTIONLIST l
                       Right Join BFCOMMANDINPUTOUTPUTS i
                       On l.MACHINEID = i.MACHINEID And l.COMMANDNO = i.COMMANDNO And l.IOINDEX = i.IOINDEX
                       Where l.MACHINEID = @DESTINATIONMACHINEID And l.COMMANDNO = @cmdNo And l.ISDEFAULT = ''True'' and l.IOTYPE = 5 And l.NAME = ''-'' and i.IOTYPE = 5

                       -- editable iolarn ilemleri
                       declare @ioIndex int
                       declare @ioName nvarchar(255)
                       declare visIo cursor for
                       Select IOINDEX, NAME From BFCOMMANDINPUTOUTPUTS
                       Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOTYPE = 5 -- And NAME <> ''-''
                       Open visIo

                       FETCH NEXT FROM visIo INTO @ioIndex, @ioName
           WHILE @@FETCH_STATUS = 0
                         BEGIN
                           If(@ioName = ''-'')
                             BEGIN
                               Insert Into BFMASTERSTEPSELECTIONLIST
                               Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, IOINDEX, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
                               Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = ''True''
                             END
                           Else
                             BEGIN
                               declare @srcMaxSelected int, @desSelCoun int
                               set @srcMaxSelected = ( Select MAX(SELECTIONINDEX) as SELECTIONINDEX From BFMASTERSTEPSELECTIONLIST
     						  Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO
                                 And MAINSTEP = @mainStep And PARALELSTEP = @paraStep And IOINDEX = @ioIndex )
                               set @desSelCoun = ( Select MAX(SELECTINDEX) as SELECTINDEX From BFCOMMANDSELECTIONLIST Where MACHINEID = @DESTINATIONMACHINEID
     						  And COMMANDNO = @cmdNo And IOINDEX = @ioIndex  )

                               if(@srcMaxSelected is null ) -- kaynak programda hi io seilmemi veya bu sradaki io seilebilir deil veya bu srada bir io yok
                                 BEGIN
                                   Insert Into BFMASTERSTEPSELECTIONLIST
                                   Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, @ioIndex, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
                                   Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = ''True''

                                   Update BFMASTERSTEPINPUTOUTPUTS Set ERRORWARNING = 2 Where MACHINEID = @DESTINATIONMACHINEID And PROGNO = @DESTINATIONPRGNO And
     							  MAINSTEP = @mainStep And PARALELSTEP = @paraStep And IOINDEX = @ioIndex
                                 END
                               Else if(@srcMaxSelected > @desSelCoun)  -- seilebilirden daha byk seilmi, seimi resetliyoruz
                                 BEGIN
                                   Insert Into BFMASTERSTEPSELECTIONLIST
                                   Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, @ioIndex, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
                                   Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = ''True''

                                   Update BFMASTERSTEPINPUTOUTPUTS Set ERRORWARNING = 1 Where MACHINEID = @DESTINATIONMACHINEID And PROGNO = @DESTINATIONPRGNO And
     							  MAINSTEP = @mainStep And PARALELSTEP = @paraStep And IOINDEX = @ioIndex
                                 END
                               Else
                                 BEGIN
                                   Insert Into BFMASTERSTEPSELECTIONLIST
                                   Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, @ioIndex, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
                                   Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And SELECTINDEX in
                                   ( Select SELECTIONINDEX From BFMASTERSTEPSELECTIONLIST Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep
     							  And PARALELSTEP = @paraStep And IOINDEX = @ioIndex )
                                 END
                             END
                           FETCH NEXT FROM visIo INTO @ioIndex, @ioName

                         END
                       CLOSE visIo
                       DEALLOCATE visIo

                  END
                   ELSE -- fonksiyonlar farkl
                     BEGIN

                       -- parametreleri komut tanmndan ykle
                       Insert Into BFMASTERSTEPPARAMS
                       Select @DESTINATIONPRGNO, @mainStep, @paraStep, PARAMETERINDEX, @DESTINATIONMACHINEID, VALUE, CONTAINSVARIABLE, '''', 0, 0  From BFCOMMANDPARAMETERS
                       Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And USEDEFAULT = ''False''
                       -- 20.04.2015 st satra (And USEDEFAULT = ''True'') eklendi

                       -- iolar komut tanmndan ykle
                       Insert Into BFMASTERSTEPINPUTOUTPUTS
                       Select @DESTINATIONPRGNO, @mainStep, @paraStep, IOINDEX, @DESTINATIONMACHINEID, IOID, IOTYPE, 0
                       From BFCOMMANDINPUTOUTPUTS
                       Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOTYPE = 5
                       -- 20.04.2015, st satra (And IOTYPE = 5) eklendi

                       -- io seimlerini ykle
                  -- 20.04.2015 deitirildi, eski hali
                       -- Insert Into BFMASTERSTEPSELECTIONLIST
                       -- Select SELECTINDEX, @DESTINATIONPRGNO, @mainStep, @paraStep, IOINDEX, @DESTINATIONMACHINEID, SELECTEDIOID, IOTYPE from BFCOMMANDSELECTIONLIST
                       -- Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo
                       Insert Into BFMASTERSTEPSELECTIONLIST
                       Select l.SELECTINDEX, @DESTINATIONPRGNO, @mainStep, @paraStep, l.IOINDEX, @DESTINATIONMACHINEID, l.SELECTEDIOID, l.IOTYPE
                       from BFCOMMANDSELECTIONLIST l
                       Right Join BFCOMMANDINPUTOUTPUTS i
                       On l.MACHINEID = i.MACHINEID And l.COMMANDNO = i.COMMANDNO And l.IOINDEX = i.IOINDEX
                       Where l.MACHINEID = @DESTINATIONMACHINEID And l.COMMANDNO = @cmdNo and i.IOTYPE = 5
                       -- 20.04.2015

                       -- program admn hatal olarak iaretle
                       Update BFMASTERSTEPS Set ERRORS = 4 -- buradaki 4 dyeingProgram.pas taki TACommandErrorItem tanmndan geliyor
                       Where MACHINEID = @DESTINATIONMACHINEID And PROGNO = @DESTINATIONPRGNO And MAINSTEP = @mainStep And PARALELSTEP = @paraStep

                     END
                   FETCH NEXT FROM prmTable INTO @mainStep, @paraStep, @cmdNo, @srcFunc, @destFunc
                 END

               CLOSE prmTable
               DEALLOCATE prmTable
               -- 11.12.12 selman,

               INSERT INTO BFMASTERPRGVARIABLEVALUES
               SELECT @DESTINATIONMACHINEID, @DESTINATIONPRGNO, VARIABLEID, VALUE
               FROM BFMASTERPRGVARIABLEVALUES WHERE MACHINEID = @SOURCEMACHINEID AND PROGNO = @SOURCEPRGNO;

               UPDATE destTable SET destTable.OPTIMIZED = sourceTable.OPTIMIZED
               FROM   BFMASTERSTEPPARAMS AS destTable
                   INNER JOIN BFMASTERSTEPPARAMS AS sourceTable
                       ON destTable.MAINSTEP = sourceTable.MAINSTEP And destTable.PARALELSTEP = sourceTable.PARALELSTEP
                       And destTable.PARAMETERINDEX = sourceTable.PARAMETERINDEX And destTable.MACHINEID = @DESTINATIONMACHINEID AND destTable.PROGNO = @DESTINATIONPRGNO
               WHERE
                   sourceTable.MACHINEID = @SOURCEMACHINEID AND sourceTable.PROGNO = @SOURCEPRGNO AND sourceTable.OPTIMIZED = 1;
  ');
END;

IF OBJECT_ID('P_COPY_WASH_PRG', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_COPY_WASH_PRG] @SOURCEMACHINEID INT, @SOURCEPRGNO INT, @DESTINATIONMACHINEID INT, @DESTINATIONPRGNO INT  ,@RETURN_VALUE INT OUTPUT
    	  AS
    	--  declare @mainStep int, @paraStep int, @cmdNo int, @geciciStr varchar(255), @srcFunc varchar(15), @destFunc varchar(15)
   	BEGIN TRY
    	  BEGIN TRAN COPY
    	  --declare @SOURCEMACHINEID INT  = 104, @SOURCEPRGNO INT = 10, @DESTINATIONMACHINEID INT = 105, @DESTINATIONPRGNO INT = 10,@RETURN_VALUE INT
    	  DELETE FROM  BFWASHINGPRGHEADER
    	  WHERE MACHINEID =  @DESTINATIONMACHINEID AND WASHINGPROGNO = @DESTINATIONPRGNO ;

    	  INSERT INTO BFWASHINGPRGHEADER (MACHINEID,WASHINGPROGNO,NAME,DURATION,TOTALSTEP,PROCESSTYPE,TotalChemReq,TotalDyeReq,ManChemReq,
    	  AutoChemReq,AutoDyeReq,ManDyeReq,CHANGEDATE,CREATEDATE,ISDELETED,ISCHANGED,PRGSTATE,USERCOMMENT,LOCKEDBY,DefaultRecipeNo, TOTALSALTREQ, TOTALGM1REQ, TOTALGM2REQ)
    	  SELECT @DESTINATIONMACHINEID, @DESTINATIONPRGNO,  NAME, DURATION, TOTALSTEP,PROCESSTYPE,TotalChemReq, TotalDyeReq,ManChemReq,AutoChemReq,AutoDyeReq,
  	  ManDyeReq,null,
    	  GETDATE(),  ISDELETED, ISCHANGED,1,USERCOMMENT,LOCKEDBY, DefaultRecipeNo
    	  , TOTALSALTREQ, TOTALGM1REQ, TOTALGM2REQ
    	  FROM BFWASHINGPRGHEADER WHERE MACHINEID = @SOURCEMACHINEID AND WASHINGPROGNO = @SOURCEPRGNO;

    	  INSERT INTO BFWASHINGPRGPHASIS
    	  SELECT @DESTINATIONMACHINEID, @DESTINATIONPRGNO, STEPNO, PROGNO, THEORICDURATION, PHASEVERSION
    	  FROM BFWASHINGPRGPHASIS
    	  WHERE MACHINEID = @SOURCEMACHINEID AND WASHINGPROGNO = @SOURCEPRGNO ;

          INSERT INTO BFWASHINGPHASEPARAMVALUES (WASHINGPROGNO,MACHINEID,PHASESTEPNO,WASHINGPARAMID,VALUE,PROGNO,PARAMINDEX)
          SELECT  @DESTINATIONPRGNO, @DESTINATIONMACHINEID ,PHASESTEPNO,WASHINGPARAMID,VALUE, PROGNO, PARAMINDEX
          FROM BFWASHINGPHASEPARAMVALUES
          WHERE MACHINEID = @SOURCEMACHINEID AND WASHINGPROGNO = @SOURCEPRGNO ;

    	  INSERT INTO BFWASHINGPARAMMAPPING
   	  (M.MACHINEID,M.COMMANDNO,M.PARAMINDEX,M.WASHINGPARAMID)
          SELECT  DISTINCT @DESTINATIONMACHINEID,M.COMMANDNO ,M.PARAMINDEX,M.WASHINGPARAMID
          FROM BFWASHINGPARAMMAPPING M
   	   INNER JOIN BFWASHINGPHASEPARAMVALUES V ON V.MACHINEID = M.MACHINEID AND M.WASHINGPARAMID = V.WASHINGPARAMID
   	   LEFT JOIN BFWASHINGPARAMMAPPING EX ON EX.MACHINEID = @DESTINATIONMACHINEID AND EX.COMMANDNO = M.COMMANDNO AND EX.PARAMINDEX = M.PARAMINDEX
  	   AND EX.WASHINGPARAMID = M.WASHINGPARAMID
   	   WHERE EX.MACHINEID IS NULL AND  M.MACHINEID = @SOURCEMACHINEID AND V.WASHINGPROGNO = @SOURCEPRGNO;

    	  set @RETURN_VALUE = 1
    	  COMMIT TRAN COPY
   	  END TRY
       BEGIN CATCH
          ROLLBACK TRAN COPY
          SET @RETURN_VALUE = 0
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
       END CATCH;
  ');
END;

IF OBJECT_ID('P_DELETE_PRG', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_DELETE_PRG] @IN_MACHINEID INT, @IN_PRGNO INT ,@ISDELETESTEPS BIT
 AS
   IF @ISDELETESTEPS= 1
   BEGIN
 	 DELETE FROM BFMASTERSTEPS WHERE MACHINEID= @IN_MACHINEID  AND PROGNO= @IN_PRGNO;
   END
   ELSE
   BEGIN
     DELETE FROM BFMASTERPRGHEADER WHERE MACHINEID= @IN_MACHINEID  AND PROGNO= @IN_PRGNO;
   END;
  ');
END;

IF OBJECT_ID('P_SEND_COMMANDS_TO_ACTIVITY', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_SEND_COMMANDS_TO_ACTIVITY] @IN_MACHINEID INT
AS
  declare @MAX_VERSION integer;
  declare @MY_TIME timestamp;
  select @MY_TIME= CAST (GETDATE() AS TIMESTAMP);
  select @MAX_VERSION=-1;
  select @MAX_VERSION = (select MAX(MACHINECOMMANDSETNO) from BAMASTERCOMMANDS where MACHINEID = @IN_MACHINEID);
  if @MAX_VERSION is null
    select @MAX_VERSION=0;
  update BAMASTERCOMMANDS set RELEASEENDDATE = @MY_TIME where(MACHINEID = @IN_MACHINEID and MACHINECOMMANDSETNO =
    @MAX_VERSION);
  select @MAX_VERSION=@MAX_VERSION+1;
  /***************************************************************/
  insert into BAMASTERCOMMANDS (MACHINEID, MACHINECOMMANDSETNO, RELEASEDATE, RELEASEENDDATE, COMMANDNO,
      FUNCTIONID, TBBFUNTIONNAME, NAME, ACTIVATED, ADVICELIST, DONTUSELIST, ISRUNMANUAL, COMMANDTYPE,
      MOVEPARALLEL, TBBCHANGETIME, X, Y, A, B, MAXA, ISTEMPERATURE, ISUNLOAD, ICON, GROUPID, ISDELETED)
    select @IN_MACHINEID, @MAX_VERSION, @MY_TIME, null, COMMANDNO,
      FUNCTIONID, TBBFUNTIONNAME, NAME, ACTIVATED, ADVICELIST, DONTUSELIST, ISRUNMANUAL, COMMANDTYPE,
      MOVEPARALLEL, TBBCHANGETIME, X, Y, A, B, MAXA, ISTEMPERATURE, ISUNLOAD, ICON, GROUPID, 0
      from BFMASTERCOMMANDS where MACHINEID = @IN_MACHINEID AND ISDELETED = 0;
  insert into BAMASTERCOMMANDSALARMS (MACHINEID, MACHINECOMMANDSETNO, COMMANDNO, ALARMINDEX, ALARMNO, ALARM, UNIVERSALALARMNO)
    select @IN_MACHINEID, @MAX_VERSION, COMMANDNO, ALARMINDEX, ALARMNO, ALARM, UNIVERSALALARMNO from
      BFMASTERCOMMANDSALARMS where MACHINEID = @IN_MACHINEID;
  insert into BAMASTERCOMMANDRETURNVALUES (MACHINEID, MACHINECOMMANDSETNO, COMMANDNO, RETURNVALUEINDEX, RETURNVALUENAME, CANSHOW, SPRELATION)
    select @IN_MACHINEID, @MAX_VERSION, COMMANDNO, RETURNVALUEINDEX, RETURNVALUENAME, CANSHOW, SPRELATION from
      BFMASTERCOMMANDRETURNVALUES where MACHINEID = @IN_MACHINEID;
  insert into BACOMMANDINPUTOUTPUTS (MACHINEID, MACHINECOMMANDSETNO, COMMANDNO, IOINDEX, IOID, IOTYPE, NAME)
    select @IN_MACHINEID, @MAX_VERSION, COMMANDNO, IOINDEX, IOID, IOTYPE, NAME from
      BFCOMMANDINPUTOUTPUTS where MACHINEID = @IN_MACHINEID;
  insert into BACOMMANDSELECTIONLIST (MACHINEID, MACHINECOMMANDSETNO, COMMANDNO, IOINDEX, SELECTINDEX, IOTYPE, IOID, NAME, SELECTEDIOID, ISDEFAULT)
    select @IN_MACHINEID, @MAX_VERSION, COMMANDNO, IOINDEX, SELECTINDEX, IOTYPE, IOID, NAME, SELECTEDIOID, ISDEFAULT from
      BFCOMMANDSELECTIONLIST where MACHINEID = @IN_MACHINEID;
  insert into BACOMMANDPARAMETERS (MACHINEID, MACHINECOMMANDSETNO, COMMANDNO, PARAMETERINDEX, PARAMSTRING, VALUE, PARAMETERTYPE,
      SELECTIONLIST, SELECTIONVALUES, UNITCODE, PARAMLOWLIMIT, PARAMHIGHLIMIT, CONTAINSVARIABLE, TEMPERATURE, USEDEFAULT, ISCOMMANDVARIABLE, TBBFORMUL)
    select @IN_MACHINEID, @MAX_VERSION, COMMANDNO, PARAMETERINDEX, PARAMSTRING, VALUE, PARAMETERTYPE,
      SELECTIONLIST, SELECTIONVALUES, UNITCODE, PARAMLOWLIMIT, PARAMHIGHLIMIT, CONTAINSVARIABLE, TEMPERATURE, USEDEFAULT, ISCOMMANDVARIABLE, TBBFORMUL from
      BFCOMMANDPARAMETERS where MACHINEID = @IN_MACHINEID;
  ');
END;

IF OBJECT_ID('P_SEND_PROG_TO_ACTIVITY', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_SEND_PROG_TO_ACTIVITY] @IN_MACHINEID INT, @IN_PRGNO INT
 AS
 DECLARE @MAX_VERSION INT;
 DECLARE @MY_TIME timestamp;
 SELECT @MY_TIME = CAST ( GETDATE() AS TIMESTAMP);
 SELECT @MAX_VERSION = -1;
 SELECT @MAX_VERSION = (SELECT MAX(MACHINEPRGVERSIONNO)  FROM BAMASTERPRGHEADER WHERE MACHINEID= @IN_MACHINEID AND PROGNO = @IN_PRGNO);
 IF @MAX_VERSION IS NULL
   SET @MAX_VERSION = 0;
 UPDATE BAMASTERPRGHEADER SET RELEASEENDDATE= @MY_TIME WHERE ( MACHINEID= @IN_MACHINEID AND MACHINEPRGVERSIONNO= @MAX_VERSION AND PROGNO= @IN_PRGNO );
 SET @MAX_VERSION = @MAX_VERSION + 1;
 INSERT INTO BAMASTERPRGHEADER
 SELECT @IN_MACHINEID, @MAX_VERSION, @MY_TIME, NULL, @IN_PRGNO, PROCESSCODE, NAME, DURATION, TOTALSTEP, CHANGEDATE, TBBCHANGESOURCE, TBBCHANGEDATE,
 CREATIONDATE, USERCOMMENT, Null as USERNAME, Null as CHANGETIME, Null as WHATCHANGE, 0 as PRGSOURCE, TotalChemReq, TotalDyeReq,ManChemReq,AutoChemReq,
 AutoDyeReq,ManDyeReq,DefaultRecipeNo,ICONNAME,ORDEROFREQUESTS,TOTALSALTREQ,TOTALGM1REQ,TOTALGM2REQ,PHASEVERSION, INTERVENTIONFREEPROGRAM, ADDITIONALPROCESSCODE
 FROM BFMASTERPRGHEADER WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO;
 INSERT INTO BAMASTERSTEPS
 SELECT @IN_MACHINEID, @MAX_VERSION, @IN_PRGNO, MAINSTEP, PARALELSTEP, COMMANDNO, ISCONDITIONAL, CONDITIONSTR, THEORETICDURATION
 FROM BFMASTERSTEPS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO;
 INSERT INTO BAMASTERSTEPPARAMS
 SELECT @IN_MACHINEID, @MAX_VERSION, @IN_PRGNO, MAINSTEP, PARALELSTEP, PARAMETERINDEX, VALUE, CONTAINSVARIABLE, ERRORWARNING, OPTIMIZED
 FROM BFMASTERSTEPPARAMS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO ;
 INSERT INTO BAMASTERSTEPINPUTOUTPUTS
 SELECT @IN_MACHINEID, @MAX_VERSION, @IN_PRGNO, MAINSTEP, PARALELSTEP, IOINDEX, IOID, IOTYPE
 FROM BFMASTERSTEPINPUTOUTPUTS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO;
 INSERT INTO BAMASTERSTEPSELECTIONLIST
 SELECT @IN_MACHINEID, @MAX_VERSION, SELECTIONINDEX, @IN_PRGNO, MAINSTEP, PARALELSTEP, IOINDEX, SELECTEDIOID, IOTYPE
 FROM BFMASTERSTEPSELECTIONLIST WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO;
 INSERT INTO BAMASTERPRGVARIABLEVALUES
 SELECT @IN_MACHINEID, @MAX_VERSION, @IN_PRGNO, VARIABLEID, VALUE
 FROM BFMASTERPRGVARIABLEVALUES WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO ;
  ');
END;

IF OBJECT_ID('P_SEND_PROG_TO_BF', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[P_SEND_PROG_TO_BF] @IN_MACHINEID INT, @IN_PRGNO INT, @SETNO INT
AS

  DELETE FROM BFMASTERPRGHEADER
  WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO;
  INSERT INTO BFMASTERPRGHEADER
  SELECT @IN_MACHINEID, @IN_PRGNO, PROCESSCODE, NAME, DURATION, TOTALSTEP, CHANGEDATE, TBBCHANGESOURCE,
  TBBCHANGEDATE, NULL, CREATIONDATE, USERCOMMENT, 0, 0, 0, 0, 0,
  TotalChemReq, TotalDyeReq, ManChemReq, AutoChemReq, AutoDyeReq, ManDyeReq, DefaultRecipeNo,
  ICONNAME, ORDEROFREQUESTS, TOTALSALTREQ, TOTALGM1REQ, TOTALGM2REQ, PHASEVERSION, INTERVENTIONFREEPROGRAM, ADDITIONALPROCESSCODE
  FROM BAMASTERPRGHEADER WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO AND MACHINEPRGVERSIONNO = @SETNO;
  INSERT INTO BFMASTERSTEPS (MACHINEID, PROGNO, MAINSTEP, PARALELSTEP, COMMANDNO, ISCONDITIONAL, CONDITIONSTR, ERRORS, THEORETICDURATION)
  SELECT @IN_MACHINEID, @IN_PRGNO, MAINSTEP, PARALELSTEP, COMMANDNO, ISCONDITIONAL, CONDITIONSTR, 0, THEORETICDURATION
  FROM BAMASTERSTEPS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO AND MACHINEPRGVERSIONNO = @SETNO;
  INSERT INTO BFMASTERSTEPPARAMS (PROGNO, MAINSTEP, PARALELSTEP, PARAMETERINDEX, MACHINEID, VALUE, CONTAINSVARIABLE, OPTIMIZEDVALUE, ERRORWARNING, OPTIMIZED)
  SELECT @IN_PRGNO, MAINSTEP, PARALELSTEP, PARAMETERINDEX, @IN_MACHINEID, VALUE, CONTAINSVARIABLE, NULL, ERRORWARNING, OPTIMIZED
  FROM BAMASTERSTEPPARAMS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO AND MACHINEPRGVERSIONNO = @SETNO;
  INSERT INTO BFMASTERSTEPINPUTOUTPUTS (PROGNO, MAINSTEP, PARALELSTEP, IOINDEX, MACHINEID, IOID, IOTYPE, ERRORWARNING)
  SELECT @IN_PRGNO, MAINSTEP, PARALELSTEP, IOINDEX, @IN_MACHINEID, IOID, IOTYPE, 0
  FROM BAMASTERSTEPINPUTOUTPUTS WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO AND MACHINEPRGVERSIONNO = @SETNO;
  INSERT INTO BFMASTERSTEPSELECTIONLIST (SELECTIONINDEX, PROGNO, MAINSTEP, PARALELSTEP, IOINDEX, MACHINEID, SELECTEDIOID, IOTYPE)
  SELECT SELECTIONINDEX, @IN_PRGNO, MAINSTEP, PARALELSTEP, IOINDEX, @IN_MACHINEID, SELECTEDIOID, IOTYPE
  FROM BAMASTERSTEPSELECTIONLIST WHERE MACHINEID = @IN_MACHINEID AND PROGNO = @IN_PRGNO AND MACHINEPRGVERSIONNO = @SETNO;
  ');
END;

IF OBJECT_ID('sp_cleanUpCursor', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[sp_cleanUpCursor] @cursorName varchar(255) AS
 BEGIN

     DECLARE @cursorStatus int
     SET @cursorStatus =  (SELECT cursor_status(''global'',@cursorName))

     DECLARE @sql varchar(255)
     SET @sql = ''''

     IF @cursorStatus > 0
         SET @sql = ''CLOSE ''+ @cursorName

     IF @cursorStatus > -3
         SET @sql = @sql+'' DEALLOCATE ''+ @cursorName

     IF @sql <> ''''
         exec(@sql)

 END;
  ');
END;

IF OBJECT_ID('sp_defragment_indexes', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[sp_defragment_indexes] @maxfrag DECIMAL

AS

/* T.Pullen

This stored procedure checks index fragmentation in a database and defragments
indexes whose scan densities fall below a specified threshold, @magfrag, which
is passed to the SP. This SP was initially based on a code sample in SQL Server 2000
Books Online.

Must be run in the database to be defragmented.

*/


-- Declare variables

SET NOCOUNT ON
DECLARE @tablename VARCHAR (128)
DECLARE @execstr VARCHAR (255)
DECLARE @objectid INT
DECLARE @objectowner VARCHAR(255)
DECLARE @indexid INT
DECLARE @frag DECIMAL
DECLARE @indexname CHAR(255)
DECLARE @dbname sysname
DECLARE @tableid INT
DECLARE @tableidchar VARCHAR(255)

--check this is being run in a user database
SELECT @dbname = db_name()
IF @dbname IN (''master'', ''msdb'', ''model'', ''tempdb'')
BEGIN
PRINT ''This procedure should not be run in system databases.''
RETURN
END

--begin Stage 1? checking fragmentation
-- Declare cursor
DECLARE tables CURSOR FOR
SELECT convert(varchar,so.id)
FROM sysobjects so
JOIN sysindexes si
ON so.id = si.id
WHERE so.type =''U''
AND si.indid < 2
AND si.rows > 0

-- Create the temporary table to hold fragmentation information
CREATE TABLE #fraglist (
ObjectName CHAR (255),
ObjectId INT,
IndexName CHAR (255),
IndexId INT,
Lvl INT,
CountPages INT,
CountRows INT,
MinRecSize INT,
MaxRecSize INT,
AvgRecSize INT,
ForRecCount INT,
Extents INT,
ExtentSwitches INT,
AvgFreeBytes INT,
AvgPageDensity INT,
ScanDensity DECIMAL,
BestCount INT,
ActualCount INT,
LogicalFrag DECIMAL,
ExtentFrag DECIMAL)

-- Open the cursor
OPEN tables

-- Loop through all the tables in the database running dbcc showcontig on each one
FETCH NEXT
FROM tables
INTO @tableidchar

WHILE @@FETCH_STATUS = 0
BEGIN
-- Do the showcontig of all indexes of the table
INSERT INTO #fraglist
EXEC (''DBCC SHOWCONTIG ('' + @tableidchar + '') WITH FAST, TABLERESULTS, ALL_INDEXES, NO_INFOMSGS'')
FETCH NEXT
FROM tables
INTO @tableidchar
END

-- Close and deallocate the cursor
CLOSE tables
DEALLOCATE tables

-- Report the ouput of showcontig for results checking
SELECT * FROM #fraglist

-- Begin Stage 2? (defrag) declare cursor for list of indexes to be defragged
DECLARE indexes CURSOR FOR
SELECT ObjectName, ObjectOwner = user_name(so.uid), ObjectId, IndexName, ScanDensity
FROM #fraglist f
JOIN sysobjects so ON f.ObjectId=so.id
WHERE ScanDensity <= @maxfrag
AND INDEXPROPERTY (ObjectId, IndexName, ''IndexDepth'') > 0

-- Write to output start time for information purposes
SELECT ''Started defragmenting indexes at '' + CONVERT(VARCHAR,GETDATE())

-- Open the cursor
OPEN indexes

-- Loop through the indexes
FETCH NEXT
FROM indexes
INTO @tablename, @objectowner, @objectid, @indexname, @frag

WHILE @@FETCH_STATUS = 0
BEGIN
SET QUOTED_IDENTIFIER ON

SELECT @execstr = ''DBCC DBREINDEX ('' + RTRIM(@tablename) +
'', '' + RTRIM(@indexname) + '') WITH NO_INFOMSGS''
SELECT ''Now executing: ''
SELECT(@execstr)
EXEC (@execstr)

SET QUOTED_IDENTIFIER OFF

FETCH NEXT
FROM indexes
INTO @tablename, @objectowner, @objectid, @indexname, @frag
END

-- Close and deallocate the cursor
CLOSE indexes
DEALLOCATE indexes

-- Report on finish time for information purposes
SELECT ''Finished defragmenting indexes at '' + CONVERT(VARCHAR,GETDATE())

-- Delete the temporary table
DROP TABLE #fraglist;
  ');
END;

IF OBJECT_ID('sp_GenerateBatchKey', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[sp_GenerateBatchKey]
AS
BEGIN
	SET NOCOUNT ON;

    DECLARE @res int;

	SET @res = dbo.fGenerateBatchKey();

	RETURN @res;
END;
  ');
END;

IF OBJECT_ID('spBatchSummary', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spBatchSummary]
@rptstarttime datetime,
@rptendtime datetime
AS
BEGIN

SET NOCOUNT ON;

SELECT JOBORDER AS "İŞ EMRİ NO", MACHINECODE AS "MAKİNE ADI", OPRNAME AS "OPERATÖR", STARTTIME AS "BAŞLAMA ZAMANI", ENDTIME AS "BİTİŞ ZAMANI",
CANCELTIME AS "İPTAL ZAMANI", CAST(((DEVIATION)/3600) AS VARCHAR(8)) + '':'' + CAST(((ABS(DEVIATION)/60)%60) AS VARCHAR(2)) AS "SAPMA (sa:dk)",
(100*REALDURATION)/ACTUAL_THEORETICDURAT AS "YÜZDE", PROGRAMNOLIST AS "PROGRAMLAR", CAST((THEORETICDURAT/3600) AS VARCHAR(8)) + '':'' + CAST((THEORETICDURAT/60)%60 AS VARCHAR(2)) AS "TEORİK SÜRE (sa:dk)",
CAST((ACTUAL_THEORETICDURAT/3600) AS VARCHAR(8)) + '':'' + CAST((ACTUAL_THEORETICDURAT/60)%60 AS VARCHAR(2)) AS  "FİİLİ TEORİK SÜRE (sa:dk)",
CAST((REALDURATION/3600) AS VARCHAR(8)) + '':'' + CAST((REALDURATION/60)%60 AS VARCHAR(2)) AS "GERÇEKLEŞEN SÜRE (sa:dk)",
CAST((STOP_DURATION_ALR/3600) AS VARCHAR(8)) + '':'' + CAST((STOP_DURATION_ALR/60)%60 AS VARCHAR(2)) AS  "ALARM DURUŞ SÜRESİ (sa:dk)",
CAST((STOP_DURATION_OPER/3600) AS VARCHAR(8)) + '':'' + CAST((STOP_DURATION_OPER/60)%60 AS VARCHAR(2)) AS "MANUEL DURUŞ SÜRESİ (sa:dk)" from BADATA where STARTTIME>=@rptstarttime and STARTTIME<=@rptendtime

END;
  ');
END;

IF OBJECT_ID('spClearCurrentIOValues', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spClearCurrentIOValues]
AS
BEGIN
	SET NOCOUNT ON;
	DELETE FROM BAIOVALUES_CURRENT;
END;
  ');
END;

IF OBJECT_ID('spFixCmd_Alr_EndTimes', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spFixCmd_Alr_EndTimes]
@batchkey int,
@endtime datetime
AS
BEGIN
	SET NOCOUNT ON;

    UPDATE BAALARM SET ENDTIME=@endtime WHERE BATCHKEY=@batchkey AND ENDTIME IS NULL;
    UPDATE BAACTUALPRGSTEPS SET ENDTIME=@endtime WHERE BATCHKEY=@batchkey AND ENDTIME IS NULL;
END;
  ');
END;

IF OBJECT_ID('spGetActualTheoreticDuration', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetActualTheoreticDuration]
 @batchkey int,
 @machineid int
 AS
 BEGIN
   SET NOCOUNT ON;
   DECLARE @totalduration int;
   DECLARE @tmpduration int;
   DECLARE @progno int;
   DECLARE mycursor CURSOR FOR (SELECT DISTINCT PRGNO FROM BAACTUALPRGSTEPS WHERE BATCHKEY = @batchkey)
   OPEN mycursor;
   SET @totalduration = 0;
   FETCH NEXT FROM mycursor INTO @progno
     WHILE @@FETCH_STATUS = 0
       BEGIN
 	       SET @tmpduration = 0;
 	       SET @tmpduration = (SELECT DURATION FROM BFMASTERPRGHEADER WHERE MACHINEID=@machineid AND PROGNO=@progno);
 	       -- aşağıdaki kontrol eklendi, 06.03.2015 selman.
         if @tmpduration is null
           begin
             Set @tmpduration = 0;
           end
 		     -- 06.03.2015 işemrinde çalışan program teleskoptan silinmişse işemri teorik süresi 0 hesaplanıyordu
         SET @totalduration = @totalduration + @tmpduration;
 	    FETCH NEXT FROM mycursor INTO @progno
 	  END
   CLOSE mycursor;
   DEALLOCATE mycursor;
   RETURN @totalduration;
 END;
  ');
END;

IF OBJECT_ID('spGetOprStopDurations_Day', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetOprStopDurations_Day]
@rptstarttime datetime,
@rptendtime datetime
AS
BEGIN

SET NOCOUNT ON;

--DECLARE @rptstarttime datetime;
--DECLARE @rptendtime datetime;
DECLARE @alrstarttime datetime;
DECLARE @alrendtime datetime;
DECLARE @currDaystart datetime;
DECLARE @currDayend datetime;


DECLARE @Daycount int;
DECLARE @Day int;
DECLARE @diff datetime;
DECLARE @tmpduration int;

--SET @rptstarttime=''2009-03-04 00::00::00.000'';
--SET @rptendtime=''2009-03-04 23::59::59.999'';
SET @diff = @rptendtime - @rptstarttime;
SET @Daycount=(select dbo.TimeSpanUnits(''d'', @diff));
SET @Day = 0;

CREATE TABLE #MyOprStopDurs_Buffer(
STARTTIME datetime,
ENDTIME datetime)

CREATE TABLE #MyOprStopDurs_Day(
Day int,
Duration int,
StartDay datetime,
EndDay datetime)

INSERT INTO #MyOprStopDurs_Buffer(STARTTIME,ENDTIME)
(SELECT STARTTIME,ENDTIME FROM BAALARM WHERE (ENDTIME IS NOT NULL) AND ALARMNO=6000 AND STARTTIME > DATEADD(Day,-1,@rptstarttime) AND ENDTIME <= DATEADD(Day,1,@rptendtime))
ORDER BY STARTTIME

DECLARE mycursor CURSOR FOR
(SELECT *
FROM #MyOprStopDurs_Buffer)


SET @currDaystart = @rptstarttime;
SET @currDayend = DATEADD(Day,1,@currDaystart);

WHILE (@Day < @Daycount)
  BEGIN
	SET @tmpduration = 0;

	OPEN mycursor;

	FETCH NEXT FROM mycursor INTO @alrstarttime,@alrendtime
	WHILE @@FETCH_STATUS = 0
	  BEGIN
		IF ((@alrstarttime > @currDaystart) AND (@alrendtime < @currDayend)) --A
			BEGIN
			SET @tmpduration = @tmpduration + DATEDIFF(second, @alrstarttime, @alrendtime)
			END
		ELSE
			BEGIN
			IF ((@alrstarttime < @currDayend) AND (@alrendtime > @currDayend)) --B
				BEGIN
				SET @tmpduration = @tmpduration + DATEDIFF(second, @alrstarttime, @currDayend)
				END
			ELSE
				BEGIN
				IF ((@alrstarttime < @currDaystart) AND (@alrendtime > @currDayend)) --D
					BEGIN
					SET @tmpduration = @tmpduration + (3600 * 24);
					END
				ELSE
					BEGIN
					IF ((@alrstarttime < @currDaystart) AND (@alrendtime < @currDayend) AND (@alrendtime > @currDaystart)) --C
						SET @tmpduration = @tmpduration + DATEDIFF(second, @currDaystart, @alrendtime)
					END
				END;
			END;
		FETCH NEXT FROM mycursor INTO @alrstarttime,@alrendtime
	  END

	CLOSE mycursor;

	INSERT INTO #MyOprStopDurs_Day (Day, Duration, startDay, endDay)
	VALUES(@Day, @tmpduration, @currDaystart, @currDayend);

	SET @Day = @Day + 1;
	SET @currDaystart = DATEADD(Day,1,@currDaystart);
	SET @currDayend = DATEADD(Day,1,@currDayend);
  END

DEALLOCATE mycursor;

SELECT * FROM #MyOprStopDurs_Day;

DROP TABLE #MyOprStopDurs_Buffer;
DROP TABLE #MyOprStopDurs_Day;

END;
  ');
END;

IF OBJECT_ID('spGetOprStopDurations_Hour', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetOprStopDurations_Hour]
@rptstarttime datetime,
@rptendtime datetime
AS
BEGIN

SET NOCOUNT ON;

--DECLARE @rptstarttime datetime;
--DECLARE @rptendtime datetime;
DECLARE @alrstarttime datetime;
DECLARE @alrendtime datetime;
DECLARE @currhourstart datetime;
DECLARE @currhourend datetime;


DECLARE @hourcount int;
DECLARE @hour int;
DECLARE @diff datetime;
DECLARE @tmpduration int;

--SET @rptstarttime=''2009-03-04 00::00::00.000'';
--SET @rptendtime=''2009-03-04 23::59::59.999'';
SET @diff = @rptendtime - @rptstarttime;
SET @hourcount=(select dbo.TimeSpanUnits(''h'', @diff));
SET @hour = 0;

CREATE TABLE #MyOprStopDurs_Buffer(
STARTTIME datetime,
ENDTIME datetime)

CREATE TABLE #MyOprStopDurs_Hour(
Hour int,
Duration int,
StartHour datetime,
EndHour datetime)

INSERT INTO #MyOprStopDurs_Buffer(STARTTIME,ENDTIME)
(SELECT STARTTIME,ENDTIME FROM BAALARM WHERE (ENDTIME IS NOT NULL) AND ALARMNO=6000 AND STARTTIME > DATEADD(Hour,-1,@rptstarttime) AND ENDTIME <= DATEADD(Hour,1,@rptendtime))
ORDER BY STARTTIME

DECLARE mycursor CURSOR FOR
(SELECT *
FROM #MyOprStopDurs_Buffer)


SET @currhourstart = @rptstarttime;
SET @currhourend = DATEADD(Hour,1,@currhourstart);

WHILE (@hour < @hourcount)
  BEGIN
	SET @tmpduration = 0;

	OPEN mycursor;

	FETCH NEXT FROM mycursor INTO @alrstarttime,@alrendtime
	WHILE @@FETCH_STATUS = 0
	  BEGIN
		IF ((@alrstarttime > @currhourstart) AND (@alrendtime < @currhourend)) --A
			BEGIN
			SET @tmpduration = @tmpduration + DATEDIFF(second, @alrstarttime, @alrendtime)
			END
		ELSE
			BEGIN
			IF ((@alrstarttime < @currhourend) AND (@alrendtime > @currhourend)) --B
				BEGIN
				SET @tmpduration = @tmpduration + DATEDIFF(second, @alrstarttime, @currhourend)
				END
			ELSE
				BEGIN
				IF ((@alrstarttime < @currhourstart) AND (@alrendtime > @currhourend)) --D
					BEGIN
					SET @tmpduration = @tmpduration + 3600;
					END
				ELSE
					BEGIN
					IF ((@alrstarttime < @currhourstart) AND (@alrendtime < @currhourend) AND (@alrendtime > @currhourstart)) --C
						SET @tmpduration = @tmpduration + DATEDIFF(second, @currhourstart, @alrendtime)
					END
				END;
			END;
		FETCH NEXT FROM mycursor INTO @alrstarttime,@alrendtime
	  END

	CLOSE mycursor;

	INSERT INTO #MyOprStopDurs_Hour (Hour, Duration, starthour, endhour)
	VALUES(@hour, @tmpduration, @currhourstart, @currhourend);

	SET @hour = @hour + 1;
	SET @currhourstart = DATEADD(Hour,1,@currhourstart);
	SET @currhourend = DATEADD(Hour,1,@currhourend);
  END

DEALLOCATE mycursor;

SELECT * FROM #MyOprStopDurs_Hour;

DROP TABLE #MyOprStopDurs_Buffer;
DROP TABLE #MyOprStopDurs_Hour;

END;
  ');
END;

IF OBJECT_ID('spGetStopDur_AlarmCaused', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetStopDur_AlarmCaused]
@batchkey int
AS
BEGIN
	SET NOCOUNT ON;

  DECLARE @res int;

  SET @res = -1;
  SET @res = (SELECT SUM(Durat) AS AlrStopDur FROM
    (SELECT DATEDIFF(second, STARTTIME, ENDTIME) AS Durat FROM  BAALARM WHERE BATCHKEY=@batchkey AND ALARMTYPE=0)A);

  RETURN @res;
END;
  ');
END;

IF OBJECT_ID('spGetStopDur_OperatorCaused', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetStopDur_OperatorCaused]
@batchkey int
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @res int;

  SET @res = -1;
  SET @res = (SELECT SUM(Durat) AS OprStopDur FROM
    (SELECT DATEDIFF(second, STARTTIME, ENDTIME) AS Durat FROM  BAALARM WHERE BATCHKEY=@batchkey AND ALARMNO=6000)A);

  RETURN @res;
END;
  ');
END;

IF OBJECT_ID('spGetTheoricCommandNumbers', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetTheoricCommandNumbers] @BatchKey INT ,@IsArchiveData BIT,@Result INT OUTPUT
      AS

      BEGIN TRY
      -- declare @BatchKey INT=44183 ,@IsArchiveData BIT=0,@Result INT

     --TStepStatus = (stepStatusNoChange=0,stepStatusAdded=1,stepStatusRemovedorSkipped=2);

     DECLARE @ProgVersionNumber int = -1
     DECLARE @FirstStepTime datetime
     DECLARE @MAINSTEP INT,@CHANGEDATE DATETIME,@COMMANDNO INT,@STEPADDED BIT

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
     	[THEORETICDURATION] [int] );

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
      OPTIMIZEDTHEORETICDURATION int );

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


     --Arşiv yada monitor datası olmasına göre @THEORICSTEPS içeriğinin çekileceği veriler değiştiriliyor.

     	IF (@IsArchiveData = 0)
     	BEGIN
     		INSERT INTO @THEORICSTEPS
     		 SELECT
     			(ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
     			S.*
     		 FROM BADATA D
     		 INNER JOIN BFMASTERSTEPS S ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,S.PROGNO) = 1 AND s.MACHINEID = d.MACHINEID
     		 WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey)
     		 ORDER BY D.BATCHKEY DESC
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
     						[THEORETICDURATION] )
     			 SELECT
     				(ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
     				 s.[MACHINEID]
     				,s.[PROGNO]
     				,s.[MAINSTEP]
     				,s.[PARALELSTEP]
     				,s.[COMMANDNO]
     				,s.[ISCONDITIONAL]
     				,s.[CONDITIONSTR]
     				,s.[THEORETICDURATION]
     			 FROM BADATA D
     			 INNER JOIN BAMASTERSTEPS S ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,S.PROGNO) = 1 AND s.MACHINEID = d.MACHINEID
     			 WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey) and
   			 [MACHINEPRGVERSIONNO] = dbo.GetProgramVersionNumber(@FirstStepTime,s.PROGNO,s.MACHINEID)
     			 ORDER BY D.BATCHKEY DESC
     		 END
     		 ELSE
     		 BEGIN
     		 	INSERT INTO @THEORICSTEPS
     			 SELECT
     				(ROW_NUMBER() OVER(ORDER BY D.BATCHKEY desc))-1 AS STEPNO  ,
     				S.*
     			 FROM BADATA D
     			 INNER JOIN BFMASTERSTEPS S ON dbo.ContainsNumberDefault(D.PROGRAMNOLIST,S.PROGNO) = 1 AND s.MACHINEID = d.MACHINEID
     			 WHERE (s.PARALELSTEP = 0 AND d.BATCHKEY = @BatchKey)
     			 ORDER BY D.BATCHKEY DESC
     		END
     	END

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
         exec dbo.sp_cleanUpCursor ''searchSkippedStepsCursor'';
     	exec dbo.sp_cleanUpCursor ''stepSkippedCursor'' ;
     	exec dbo.sp_cleanUpCursor ''stepChangesCursor'' ;
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
      END CATCH;
  ');
END;

IF OBJECT_ID('spGetWashTheoricCommandNumbers', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spGetWashTheoricCommandNumbers] @BatchKey INT ,@IsArchiveData BIT,@Result INT OUTPUT
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


       --Arşiv yada monitor datası olmasına göre @THEORICSTEPS içeriğinin çekileceği veriler değiştiriliyor.

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
           exec dbo.sp_cleanUpCursor ''searchSkippedStepsCursor'';
       	exec dbo.sp_cleanUpCursor ''stepSkippedCursor'' ;
       	exec dbo.sp_cleanUpCursor ''stepChangesCursor'' ;
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
        END CATCH;
  ');
END;

IF OBJECT_ID('splitListToTable', 'TF') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[splitListToTable] (@list nvarchar(MAX), @delimiter nchar(1) = N'','') RETURNS @tbl TABLE (value int NOT NULL) AS
 BEGIN
 	DECLARE @endpos   int,
             @startpos int,
             @textpos  int,
             @chunklen smallint,
             @tmpstr   nvarchar(4000),
             @leftover nvarchar(4000),
             @tmpval   nvarchar(4000)

 	SET @textpos = 1
 	SET @leftover = ''''
 	WHILE @textpos <= datalength(@list) / 2
 	BEGIN
     SET @chunklen = 4000 - datalength(@leftover) / 2
         SET @tmpstr = @leftover + substring(@list, @textpos, @chunklen)
         SET @textpos = @textpos + @chunklen

         SET @startpos = 0
         SET @endpos = charindex(@delimiter, @tmpstr)

         WHILE @endpos > 0
         BEGIN
 	        SET @tmpval = CONVERT(int, ltrim(rtrim(substring(@tmpstr, @startpos + 1, @endpos - @startpos - 1))))
             IF @tmpval IS NOT NULL
             INSERT @tbl (value) VALUES(@tmpval)
             SET @startpos = @endpos
             SET @endpos = charindex(@delimiter, @tmpstr, @startpos + 1)
         END

         SET @leftover = right(@tmpstr, datalength(@tmpstr) / 2 - @startpos)
 	END

 	DECLARE @strdeger nvarchar(max) = ltrim(rtrim(@leftover)),
             @intdeger int = CONVERT(INT, ltrim(rtrim(@leftover)));
 	IF @strdeger != ''''
 	BEGIN
         INSERT @tbl(value) VALUES (@intdeger)
 	END
 	RETURN
 END;
  ');

IF OBJECT_ID('spUpdateMachineStatus', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE spUpdateMachineStatus
   @MACHINEID int,
   @LASTEVENTPROCESSDATE float,
   @LASTEVENTPROCESSID int,
   @RUNNING_JOBORDER nvarchar(50),
   @RUNNING_JOBORDERSTARTTIME datetime,
   @RUNNING_PROGNOLIST varchar(127),
   @RUNNING_BATCHKEY int,
   @RUNNING_BATCHSTATUS int,
   @RUNNING_AUTOMANSTATUS int,
   @RUNNING_PROGRAMID int,
   @RUNNING_PROGRAMNAME nvarchar(150),
   @RUNNING_STEPNO int,
   @RUNNING_CMDNO int,
   @RUNNING_CMDNAME nvarchar(100),
   @RUNNING_ALARMNO int,
   @RUNNING_ALARMNAME nvarchar(150),
   @RUNNING_OPRNO int,
   @RUNNING_OPRNAME nvarchar(100),
   @RUNNING_THEOTIME float,
   @ISCOUPLED bit,
   @REQ_BATCHKEY int,
   @REQ_JOBORDER nvarchar(15),
   @REQ_RECIPEINDEX int,
   @REQ_REQORDERINDEX int,
   @REQ_OPERATIONCODE int,
   @REQ_TARGETRECIPE int,
   @REQ_TANKNO int,
   @REQ_PRIORITY int,
   @REQ_TOTALREQCOUNT int,
   @REQ_PRGNO int,
   @REQ_CMDNO int,
   @REQ_STATUS int,
   @CONS_ELECTIRICITY_START real,
   @CONS_ELECTIRICITY_EXPORT_START real,
   @CONS_ELECTIRICITY_CAPACITIVE_START real,
   @CONS_ELECTIRICITY_REACTIVE_START real,
   @LASTRECEIVEDEVENTDATE Float,
   @LASTRECEIVEDEVENTID int,
   @LASTRECEIVEDBATCHEVENTDATE float,
   @stopReason nvarchar(200),
   @ConnectionStatus Integer,
   @IsSynchronizing BIT,
   @currentTemp Float,
   @currentAlarmStatus Integer,
   @runningCompletionRatio Integer ,
   @lastPingFail datetime ,
   @lastSoapFail datetime ,
   @manuelReason nvarchar(200) ,
   @manuelReasonDateTime datetime ,
   @stopReasonDateTime datetime,
   @manuelCommandActive bit,
   @RUNNINGBATCHDELAY Integer,
   @LASTEVENTCODE Integer,
   @RUNNING_PHASENO int,
   @RUNNING_PHASENAME nvarchar(150),
   @RUNNING_PHASESTEPNO int,
   @BATCHLOADED bit, @LASTEVENTDATE date, @LASTEVENTID int
   AS
   BEGIN
    SET NOCOUNT ON;
    DECLARE @tmpstarttime datetime;
    IF @RUNNING_JOBORDERSTARTTIME = 0
  	 SET @tmpstarttime = NULL
    ELSE
  	 SET @tmpstarttime = @RUNNING_JOBORDERSTARTTIME;
    IF EXISTS (SELECT MACHINEID FROM TFMACHINESTATUS WHERE MACHINEID=@MACHINEID)
    BEGIN
      UPDATE TFMACHINESTATUS SET
  	UPDATETIME=GetDate(),
  	LASTEVENTPROCESSDATE=@LASTEVENTPROCESSDATE,
  	LASTEVENTPROCESSID=@LASTEVENTPROCESSID,
  	RUNNING_JOBORDER=@RUNNING_JOBORDER,
  	RUNNING_JOBORDERSTARTTIME=@tmpstarttime,
  	RUNNING_PROGNOLIST=@RUNNING_PROGNOLIST,
  	RUNNING_BATCHKEY=@RUNNING_BATCHKEY,
  	RUNNING_BATCHSTATUS=@RUNNING_BATCHSTATUS,
  	RUNNING_AUTOMANSTATUS=@RUNNING_AUTOMANSTATUS,
  	RUNNING_PROGRAMID=@RUNNING_PROGRAMID,
  	RUNNING_PROGRAMNAME=@RUNNING_PROGRAMNAME,
  	RUNNING_STEPNO=@RUNNING_STEPNO,
  	RUNNING_CMDNO=@RUNNING_CMDNO,
  	RUNNING_CMDNAME=@RUNNING_CMDNAME,
  	RUNNING_ALARMNO=@RUNNING_ALARMNO,
  	RUNNING_ALARMNAME=@RUNNING_ALARMNAME,
  	RUNNING_OPRNO=@RUNNING_OPRNO,
  	RUNNING_OPRNAME=@RUNNING_OPRNAME,
  	RUNNING_THEOTIME=@RUNNING_THEOTIME,
  	RUNNING_PHASENO=@RUNNING_PHASENO,
  	RUNNING_PHASENAME=@RUNNING_PHASENAME,
 	RUNNING_PHASESTEPNO=@RUNNING_PHASESTEPNO,
  	ISCOUPLED=@ISCOUPLED,
  	REQ_BATCHKEY=@REQ_BATCHKEY,
  	REQ_JOBORDER=@REQ_JOBORDER,
  	REQ_RECIPEINDEX=@REQ_RECIPEINDEX,
  	REQ_REQORDERINDEX=@REQ_REQORDERINDEX,
  	REQ_OPERATIONCODE=@REQ_OPERATIONCODE,
  	REQ_TARGETRECIPE=@REQ_TARGETRECIPE,
  	REQ_TANKNO=@REQ_TANKNO,
  	REQ_PRIORITY=@REQ_PRIORITY,
  	REQ_TOTALREQCOUNT=@REQ_TOTALREQCOUNT,
  	REQ_PRGNO=@REQ_PRGNO,
  	REQ_CMDNO=@REQ_CMDNO,
  	REQ_STATUS=@REQ_STATUS,
  	CONSUMPTION_ELECTRICITY_START=@CONS_ELECTIRICITY_START,
  	CONSUMPTION_ELECTRICITY_EXPORT_START=@CONS_ELECTIRICITY_EXPORT_START,
  	CONSUMPTION_ELECTRICITY_CAPACITIVE_START=@CONS_ELECTIRICITY_CAPACITIVE_START,
  	CONSUMPTION_ELECTRICITY_REACTIVE_START=@CONS_ELECTIRICITY_REACTIVE_START,
  	LASTRECEIVEDEVENTDATE=@LASTRECEIVEDEVENTDATE,
  	LASTRECEIVEDEVENTID=@LASTRECEIVEDEVENTID,
  	LASTRECEIVEDBATCHEVENTDATE=@LASTRECEIVEDBATCHEVENTDATE,
  	stopReason=@stopReason,
    ConnectionStatus = @ConnectionStatus,
    IsSynchronizing = @IsSynchronizing,
    currentTemp = @currentTemp,
    currentAlarmStatus = @currentAlarmStatus ,
    runningCompletionRatio = @runningCompletionRatio ,
    lastPingFail = @lastPingFail ,
    lastSoapFail = @lastSoapFail ,
    manuelReason = @manuelReason ,
    manuelReasonDateTime = @manuelReasonDateTime ,
    stopReasonDateTime = @stopReasonDateTime,
    MANUELCOMMANDACTIVE = @manuelCommandActive,
    RUNNINGBATCHDELAY = @RUNNINGBATCHDELAY,
    LASTEVENTCODE = @LASTEVENTCODE,
    BATCHLOADED = @BATCHLOADED,
    LASTEVENTDATE = @LASTEVENTDATE,
    LASTEVENTID = @LASTEVENTID
  	WHERE MACHINEID=@MACHINEID;
    END
    ELSE
    BEGIN
      INSERT INTO TFMACHINESTATUS VALUES(
  	@MACHINEID,
  	GetDate(),
  	@LASTEVENTPROCESSDATE,
  	@LASTEVENTPROCESSID,
  	@RUNNING_JOBORDER,
  	@tmpstarttime,
  	'''',
  	@RUNNING_BATCHKEY,
  	NULL,
  	NULL,
  	@RUNNING_BATCHSTATUS,
  	@RUNNING_AUTOMANSTATUS,
  	@RUNNING_PROGRAMID,
  	@RUNNING_PROGRAMNAME,
  	@RUNNING_STEPNO,
  	@RUNNING_CMDNO,
  	@RUNNING_CMDNAME,
  	@RUNNING_ALARMNO,
  	@RUNNING_ALARMNAME,
  	@RUNNING_OPRNO,
  	@RUNNING_OPRNAME,
  	@RUNNING_THEOTIME,
  	@ISCOUPLED,
  	@REQ_BATCHKEY,
  	@REQ_JOBORDER,
  	@REQ_RECIPEINDEX,
  	@REQ_REQORDERINDEX,
  	@REQ_OPERATIONCODE,
  	@REQ_TARGETRECIPE,
  	@REQ_TANKNO,
  	@REQ_PRIORITY,
  	@REQ_TOTALREQCOUNT,
  	@REQ_PRGNO,
  	@REQ_CMDNO,
  	@REQ_STATUS,
  	@CONS_ELECTIRICITY_START,
  	@CONS_ELECTIRICITY_EXPORT_START,
  	@CONS_ELECTIRICITY_CAPACITIVE_START,
  	@CONS_ELECTIRICITY_REACTIVE_START,
  	@LASTRECEIVEDEVENTDATE,
  	@LASTRECEIVEDEVENTID,
  	@LASTRECEIVEDBATCHEVENTDATE,
  	@stopReason,
    @ConnectionStatus,
    @IsSynchronizing,
    @currentTemp,
    @currentAlarmStatus ,
    @runningCompletionRatio ,
    @lastPingFail ,
    @lastSoapFail , 0, 0, 0, 0, 0, 0, GetDate(), 0, 0, GetDate(), @manuelReason, 0, 0, @manuelCommandActive, @RUNNINGBATCHDELAY, @LASTEVENTCODE,
    @RUNNING_PHASENO,
    @RUNNING_PHASENAME,
    @RUNNING_PHASESTEPNO,
    0, GetDate() -100, 0
  	)
    END
  END;
  ');
END;

IF OBJECT_ID('spUpdateRequestCounts', 'P') IS NULL
BEGIN
  EXEC('
CREATE PROCEDURE [dbo].[spUpdateRequestCounts] @MachineIDSStr NVARCHAR(MAX),@IsAllMachines BIT,@IncChemRequest  BIT ,@ProgNoIn INT,@Result INT OUTPUT
  AS
  --DECLARE @MachineIDSStr NVARCHAR(MAX) = ''3'',@IsAllMachines BIT = 0,@IncChemRequest  BIT=0,@ProgNoIn INT = 0;
  --DECLARE @Result INT=0;
  -- TCommandType = (cmdNone 0, cmdAutoChemical 1, cmdManChemical 2, cmdAutoDye 3, cmdManDye 4, cmdDosage 5, cmdSalt 6, cmdGenericMaterialOne 7, cmdGenericMaterialTwo 8);
  -- cmdTypeChemicalReq           = 100;
  -- cmdTypeManualChemicalReq     = 101;
  -- cmdTypeDyeReq                = 200;
  -- cmdTypeManualDyeReq          = 201;
  -- cmdTypeCTTransfer            = 300;
  -- cmdTypeDTTransfer            = 400;
  -- cmdTypeRTTransfer            = 500;
  -- cmdTypePhControl             = 600;
  -- cmdTypeSample                = 700;
  -- cmdTypeSaltReq               = 800;
  -- cmdTypeGenericMaterialOneReq = 810;
  -- cmdTypeGenericMaterialTwoReq = 820;
  -- cmdOperatorWarningCommands   = 900;

  -- RECIPETYPE_CHEMICAL = 0;
  -- RECIPETYPE_DYE = 1;
  -- RECIPETYPE_SALT = 2;
  -- RECIPETYPE_SODA = 3;
  -- RECIPETYPE_GENERIC_MATERIAL_ONE = 4;
  -- RECIPETYPE_GENERIC_MATERIAL_TWO = 5;
  -- RECIPETYPE_CHEMICAL_MANUAL = 8;
  -- RECIPETYPE_DYE_MANUAL = 9;

  BEGIN TRAN UpdateRequestCounts
  BEGIN TRY
      DECLARE @PROGRAMIDS TABLE (ID INT)
      DECLARE @MACHINEIDS TABLE (ID INT)
      DECLARE @ORDEREDLIST TABLE (MACHINEID INT,PROGNO INT, MAINSTEP INT, PARALELSTEP INT, COMMANDNO INT )

      DECLARE @cmdNone INT = 0, @cmdAutoChemical INT = 1, @cmdManChemical INT = 2 , @cmdAutoDye INT = 3 , @cmdManDye INT = 4, @cmdDosage INT = 5, @cmdSalt INT = 6, @cmdGenericMaterialOne INT = 7, @cmdGenericMaterialTwo INT = 8;
      DECLARE @mainCommandType INT , @currCommandType INT
      DECLARE @TotalChemReq INT = 0, @AutoChemReq INT = 0, @ManChemReq INT = 0, @AutoDyeReq INT = 0, @ManDyeReq INT = 0, @TotalSaltReq INT = 0, @TotalGM1Req INT = 0, @TotalGM2Req INT =0;
      DECLARE @MachineId INT,@ProgNo INT,@MainStep INT,@ParalelStep INT,@CommandNo INT;
      DECLARE @CurrMachineId INT;
      DECLARE @LastProgNo INT = -2,@LastAutoChemStep INT = -2,@LastAutoDyeStep INT = -2, @lastSaltStep INT = -2, @lastGenericOneStep INT = -2, @lastGenericTwoStep INT = -2;
      DECLARE @LastAutoChemCommandNo INT = -2,@LastMachineId INT = -2, @LastAutoDyeCommandNo INT = -2, @lastSaltCommandNo INT = -2, @lastGenericOneCommandNo INT = -2, @lastGenericTwoCommandNo INT = -2;
      DECLARE @incremented BIT = 0;
      DECLARE @ORDEROFREQUESTS VARCHAR(100) = '''';

      DECLARE @phaseActiveStr NVARCHAR(50) = '''';
      SET @phaseActiveStr = ( SELECT TOP 1 VALUE FROM TFTELESKOPSETTINGS WHERE ID = 2 );
      SET @phaseActiveStr =  LTRIM(RTRIM(@phaseActiveStr));

      IF (@IsAllMachines = 0)
          INSERT INTO @MACHINEIDS select value FROM dbo.splitListToTable( @MachineIDSStr,'','');
      ELSE
          INSERT INTO @MACHINEIDS select distinct MACHINEID from BFMACHINES WHERE INUSE = 1 AND USEINTELESKOP = 1;

      IF(@ProgNoIn > 0)
          BEGIN
              INSERT INTO @PROGRAMIDS VALUES (@ProgNoIn)
          END
      ELSE
          BEGIN
              INSERT INTO @PROGRAMIDS SELECT DISTINCT PROGNO FROM BFMASTERPRGHEADER WHERE MACHINEID IN ( SELECT ID FROM @MACHINEIDS)
          END

      INSERT INTO @ORDEREDLIST SELECT MACHINEID ,PROGNO, MAINSTEP, PARALELSTEP, COMMANDNO From BFMASTERSTEPS WHERE MACHINEID IN (SELECT ID FROM @MACHINEIDS)  AND (@ProgNoIn = 0 OR PROGNO = @ProgNoIn) ORDER BY MACHINEID ,PROGNO

      DECLARE mycursor CURSOR FOR ( SELECT MACHINEID ,PROGNO, MAINSTEP, PARALELSTEP, COMMANDNO FROM @ORDEREDLIST )

      OPEN mycursor;

      FETCH NEXT FROM mycursor INTO @MachineId,@ProgNo,@MainStep,@ParalelStep,@CommandNo

      WHILE @@FETCH_STATUS = 0
          BEGIN
              set @currCommandType = dbo.GetCommandType(@MachineId,@CommandNo)

              IF @currCommandType = @cmdAutoChemical
                  BEGIN
                      IF((@MainStep > @LastAutoChemStep + 1) OR (@IncChemRequest = 1 AND @MainStep > @LastAutoChemStep AND @LastAutoChemCommandNo <> @CommandNo))
                          BEGIN
                              SET @TotalChemReq = @TotalChemReq + 1;
                              SET @AutoChemReq = @AutoChemReq + 1;
                              SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',0'';
                          END
                      SET @LastAutoChemStep = @MainStep;
                      SET @LastAutoChemCommandNo = @CommandNo;
                  END
              ELSE IF @currCommandType = @cmdSalt
                  BEGIN
                      IF((@MainStep > @lastSaltStep + 1) OR (@IncChemRequest = 1 AND @MainStep > @lastSaltStep AND @lastSaltCommandNo <> @CommandNo))
                          BEGIN
                             SET @TotalSaltReq = @TotalSaltReq + 1;
                             SET @TotalChemReq = @TotalChemReq + 1;
                             SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',2'';
                          END
                      SET @lastSaltStep = @MainStep;
                      SET @lastSaltCommandNo = @CommandNo;
                  END
              ELSE IF  @currCommandType = @cmdGenericMaterialOne
                  BEGIN
                      IF((@MainStep > @lastGenericOneStep + 1) OR (@IncChemRequest = 1 AND @MainStep > @lastGenericOneStep AND @lastGenericOneCommandNo <> @CommandNo))
                          BEGIN
                              SET @TotalGM1Req = @TotalGM1Req + 1;
                              SET @TotalChemReq = @TotalChemReq + 1;
                              SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',4'';
                          END
                      SET @lastGenericOneStep = @MainStep;
                      SET @lastGenericOneCommandNo = @CommandNo;
                  END
              ELSE IF  @currCommandType = @cmdGenericMaterialTwo
                  BEGIN
                      IF((@MainStep > @lastGenericTwoStep + 1) OR (@IncChemRequest = 1 AND @MainStep > @lastGenericTwoStep AND @lastGenericTwoCommandNo <> @CommandNo))
                          BEGIN
                             SET @TotalGM2Req = @TotalGM2Req + 1;
                             SET @TotalChemReq = @TotalChemReq + 1;
                             SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',5'';
                          END
                      SET @lastGenericTwoStep = @MainStep;
                      SET @lastGenericTwoCommandNo = @CommandNo;
                  END
              ELSE IF  @currCommandType = @cmdManChemical
                  BEGIN
                      SET @ManChemReq = @ManChemReq + 1;
                      SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',8'';
                  END
              ELSE IF  @currCommandType = @cmdAutoDye
                  BEGIN
                      IF (@MainStep > @LastAutoDyeStep + 1)
                          BEGIN
                              SET @AutoDyeReq = @AutoDyeReq + 1;
                              SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',1'';
                          END
                      SET @LastAutoDyeStep = @MainStep;
                      SET @LastAutoDyeCommandNo = @CommandNo;
                  END
              ELSE IF @currCommandType = @cmdManDye
                  BEGIN
                      SET @ManDyeReq = @ManDyeReq + 1;
                      SET @ORDEROFREQUESTS = @ORDEROFREQUESTS + '',9'';
                  END

              FETCH NEXT FROM mycursor INTO @MachineId,@ProgNo,@MainStep,@ParalelStep,@CommandNo
              IF (@@FETCH_STATUS <> 0 Or @ProgNo <> @LastProgNo Or @MachineId <> @LastMachineId )
                  BEGIN
                      If (LEN(@ORDEROFREQUESTS) > 0)
                        BEGIN
                          SET @ORDEROFREQUESTS = STUFF(@ORDEROFREQUESTS, 1, 1, ''''); -- baştaki virgülü sil
                        END
                      --program g?ncelleme
                      if(@phaseActiveStr <> ''1'') -- faz modu aktif değilse @ORDEROFREQUESTS kullanmaya gerek yok, bu 20 karakteri aşabiliyor.
                          SET @ORDEROFREQUESTS = '''';
                      UPDATE BFMASTERPRGHEADER
                         SET AutoChemReq = @AutoChemReq,
                             ManChemReq = @ManChemReq,
                             AutoDyeReq = @AutoDyeReq,
                             ManDyeReq = @ManDyeReq,
                             TotalChemReq = @TotalChemReq + @ManChemReq,
                             TotalDyeReq = @AutoDyeReq + @ManDyeReq,
                             TOTALSALTREQ = @TotalSaltReq,
                             TOTALGM1REQ = @TotalGM1Req,
                             TOTALGM2REQ = @TotalGM2Req,
                             ORDEROFREQUESTS = @ORDEROFREQUESTS
                       WHERE PROGNO = @LastProgNo AND MACHINEID = @LastMachineId

                      SET @TotalChemReq = 0;
                      SET @AutoChemReq = 0;
                      SET @ManChemReq = 0;
                      SET @AutoDyeReq=0;
                      SET @ManDyeReq=0;
                      SET @TotalSaltReq = 0;
                      SET @TotalGM1Req = 0;
                      SET @TotalGM2Req = 0;
                      SET @LastAutoChemStep = -2;
                      SET @LastAutoDyeStep = -2;
                      SET @lastSaltStep = -2;
                      SET @lastGenericOneStep = -2;
                      SET @lastGenericTwoStep = -2;
                      SET @ORDEROFREQUESTS = '''';
                      SET @LastProgNo = @ProgNo;
                      SET @LastMachineId = @MachineId;
                  END
          END

      CLOSE mycursor;
      DEALLOCATE mycursor;

      COMMIT TRAN UpdateRequestCounts
      SET @Result = 1
      BEGIN TRAN UpdateWashPrgHeader
      BEGIN TRY
          UPDATE BFWASHINGPRGHEADER
          SET TotalChemReq = r.TotalChemReq,
              TotalDyeReq = r.TotalDyeReq,
              ManChemReq = r.ManChemReq,
              AutoChemReq = r.AutoChemReq,
              AutoDyeReq = r.AutoDyeReq,
              ManDyeReq = r.ManDyeReq,
              TOTALSALTREQ = r.TOTALSALTREQ,
              TOTALGM1REQ = r.TOTALGM1REQ,
              TOTALGM2REQ = r.TOTALGM2REQ
          FROM ( SELECT h.MACHINEID, p.WASHINGPROGNO,
                        SUM(h.TotalChemReq) as TotalChemReq,
                        SUM(h.TotalDyeReq) as TotalDyeReq,
          			  SUM(h.ManChemReq) as ManChemReq,
          			  SUM(h.AutoChemReq) as AutoChemReq,
          			  SUM(h.AutoDyeReq) as AutoDyeReq,
                        SUM(h.ManDyeReq) as ManDyeReq,
          			  SUM(h.TOTALSALTREQ) as TOTALSALTREQ,
          			  SUM(h.TOTALGM1REQ) as TOTALGM1REQ,
          			  SUM(h.TOTALGM2REQ) as TOTALGM2REQ FROM BFWASHINGPRGPHASIS p LEFT JOIN BFMASTERPRGHEADER h On p.MACHINEID = h.MACHINEID AND p.PROGNO = h.PROGNO GROUP BY h.MACHINEID, p.WASHINGPROGNO) r
          WHERE BFWASHINGPRGHEADER.MACHINEID = r.MACHINEID AND BFWASHINGPRGHEADER.WASHINGPROGNO = r.WASHINGPROGNO AND BFWASHINGPRGHEADER.MACHINEID IN (SELECT ID FROM @MACHINEIDS)
      	COMMIT TRAN UpdateWashPrgHeader
      END TRY
      BEGIN CATCH
          SET @Result = 2
          ROLLBACK TRAN UpdateRequestCounts
      END CATCH
  END TRY
  BEGIN CATCH
      CLOSE mycursor;
      DEALLOCATE mycursor;
      ROLLBACK TRAN UpdateRequestCounts
      DECLARE @ErrorMessage NVARCHAR(4000),@ErrorSeverity INT,@ErrorState INT;
      SELECT @ErrorMessage = ERROR_MESSAGE(),@ErrorSeverity = ERROR_SEVERITY(),  @ErrorState = ERROR_STATE();
      RAISERROR (@ErrorMessage, @ErrorSeverity,@ErrorState);
      SET @Result = 0
  END CATCH;
  ');
END;

IF OBJECT_ID('TimeSpanUnits', 'FN') IS NULL
BEGIN
  EXEC('
CREATE FUNCTION [dbo].[TimeSpanUnits](@Unit char(1), @TimeSpan datetime)
RETURNS int
AS
  BEGIN
    RETURN case @Unit
        when ''d'' then datediff(day, 0, @TimeSpan)
        when ''h'' then datediff(hour, 0, @TimeSpan)
        when ''m'' then datediff(minute, 0, @TimeSpan)
        when ''s'' then datediff(second, 0, @TimeSpan)
        else Null end
   END;
  ');
END;

IF OBJECT_ID('P_COPY_IOVALUES_FOR_MANUEL_MOD', 'P') IS NULL
BEGIN
  EXEC('
CREATE  PROCEDURE [dbo].[P_COPY_IOVALUES_FOR_MANUEL_MOD]
@IN_MACHINEID  int,
@COPYTIME  TimeStamp
AS
  DECLARE @VAR_IOTYPE INT;
  DECLARE @VAR_IOINDEX INT;
  DECLARE @VAR_IOVALUE FLOAT;
  DECLARE @VAR_IOKEY INT;
  DECLARE @QRY VARCHAR;
  DECLARE @VAR_LOG_TIME TIMESTAMP;
  SELECT @VAR_IOKEY = (select MAX(IOKEY) + 1 FROM BAIOVALUES);

  IF @VAR_IOKEY IS NULL
    SELECT VAR_IOKEY = 0;
  SELECT @QRY = '''';
  DECLARE crsr  CURSOR FOR
  SELECT IOTYPE, IOINDEX, MAX(LOGTIME)  FROM BAIOVALUES  WHERE MACHINEID = @IN_MACHINEID  GROUP BY MACHINEID, IOTYPE, IOINDEX;
  open crsr;
  FETCH NEXT FROM CRSR INTO @VAR_IOTYPE, @VAR_IOINDEX, @VAR_LOG_TIME ;
  WHILE @@FETCH_STATUS = 0
  BEGIN
     SET @VAR_IOVALUE = 0;
     SELECT @VAR_IOVALUE = (SELECT MAX(IOVALUE)  FROM BAIOVALUES WHERE MACHINEID= @IN_MACHINEID AND IOTYPE = @VAR_IOTYPE AND IOINDEX = @VAR_IOINDEX AND LOGTIME= @VAR_LOG_TIME);
     SET  @QRY= @QRY + ''INSERT INTO BAIOVALUES ( MACHINEID, IOKEY, LOGTIME, IOTYPE, IOINDEX, IOVALUE ) '' ;
     SET  @QRY= @QRY + '' VALUES ( '' + @IN_MACHINEID + '', '' + @VAR_IOKEY + '', '''''' + @COPYTIME + '''''', '' + @VAR_IOTYPE + '', '' + @VAR_IOINDEX + '', '' + @VAR_IOVALUE + '' ) ; '' + ''\n'' ;
     SET @VAR_IOKEY = @VAR_IOKEY + 1;
     FETCH NEXT FROM CRSR INTO @VAR_IOTYPE, @VAR_IOINDEX, @VAR_LOG_TIME;
  END
  CLOSE CRSR;
  DEALLOCATE CRSR;

  EXECUTE sp_executesql @QRY;
  RETURN;
  ');
END;
