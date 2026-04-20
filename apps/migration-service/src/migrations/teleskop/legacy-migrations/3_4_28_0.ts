import type { Knex } from 'knex'

export async function legacyMigration_3_4_28_0(knex: Knex) {
  await knex.raw(`
    ALTER PROCEDURE [dbo].[P_COPY_PRG] @SOURCEMACHINEID INT, @SOURCEPRGNO INT, @DESTINATIONMACHINEID INT, @DESTINATIONPRGNO INT ,@ISUPDATEPRG BIT
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
    -- 2.B) kaynak makinede var ancak deer uygun deilse varsaylan deeri yaz ve deer deiti bilgisini errors'a yaz
    -- 2.C) Kaynak makinede yok ise hedef makineye ekle ve varsaylan deerlerle eklendi bilgisini erros'a yaz

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
    set @chrIndexDest = CHARINDEX('.', @destFunc)
    set @chrIndexSrc = CHARINDEX('.', @srcFunc)
    if( (@chrIndexDest = 0 And @chrIndexSrc = 0  And @destFunc = @srcFunc) Or
    ( @chrIndexDest > 0 And @chrIndexSrc > 0  And SUBSTRING(@destFunc, 0, @chrIndexDest) = SUBSTRING(@srcFunc, 0, @chrIndexSrc) ) Or
    ( @chrIndexDest = 0 And @chrIndexSrc > 0 And @destFunc = SUBSTRING(@srcFunc, 0, @chrIndexSrc) ) Or
    ( @chrIndexDest > 0 And @chrIndexSrc = 0 And @srcFunc = SUBSTRING(@destFunc, 0, @chrIndexDest) ) )
    BEGIN

    -- editable olmayan parametreleri kaydet
    -- 20.04.2015, iptal edildi
    -- INSERT INTO BFMASTERSTEPPARAMS
    -- SELECT @DESTINATIONPRGNO, @mainStep, @paraStep, PARAMETERINDEX, @DESTINATIONMACHINEID, VALUE, CONTAINSVARIABLE, '', 0
    -- FROM BFCOMMANDPARAMETERS WHERE MACHINEID = @DESTINATIONMACHINEID AND COMMANDNO = @cmdNo And USEDEFAULT = 'True';
    -- 20.04.2015

    declare @prmI int, @prmValue nvarchar(255), @prmMinValue nvarchar(255), @prmMaxValue nvarchar(255), @prmType int, @useFormula bit
    declare @prmSelection nvarchar(1023), @prmSelectionList nvarchar(1023), @prmContVar bit
    declare visPrm cursor for Select PARAMETERINDEX, VALUE, PARAMETERTYPE, PARAMLOWLIMIT, PARAMHIGHLIMIT, SELECTIONLIST, SELECTIONVALUES, CONTAINSVARIABLE, USEFORMULA From BFCOMMANDPARAMETERS
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And USEDEFAULT = 'False'
    Order By PARAMETERINDEX Asc
    Open visPrm

    FETCH NEXT FROM visPrm INTO @prmI, @prmValue, @prmType, @prmMinValue, @prmMaxValue, @prmSelectionList, @prmSelection, @prmContVar, @useFormula
    WHILE @@FETCH_STATUS = 0
    BEGIN
    if Exists(Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI)
    BEGIN
    if Exists(Select Value From BFCOMMANDPARAMETERS Where MACHINEID = @SOURCEMACHINEID And COMMANDNO = @cmdNo And PARAMETERINDEX = @prmI And USEDEFAULT = 'False')
    BEGIN
    if ( @prmType = 0 ) -- float parameter
    BEGIN
    declare @geciciFlt float
    set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep
    And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
    set @geciciFlt = CONVERT(NUMERIC(9,3),REPLACE(@geciciStr,',','.')) -- CONVERT(Float, @geciciStr)
    if( ( @geciciFlt >= CONVERT(Float, @prmMinValue) ) And ( @geciciFlt <= CONVERT(Float, @prmMaxValue) ) )
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '', 0, 0)
    END
    else
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 2, 0)
    -- buradaki 2 dyeingProgram.pas'tan geliyor.
    END
    END
    ELSE If( @prmType = 1 ) -- seilebilir liste
    BEGIN
    -- 01.04.2014 selman
    set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And MAINSTEP = @mainStep
    And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
    if ( @useFormula = 'True' ) -- global komut forml destei, hedef makine forml kullanyor.
    Begin
    set @tmpBool = ( Select USEFORMULA From BFCOMMANDPARAMETERS Where MACHINEID = @SOURCEMACHINEID And COMMANDNO = @cmdNo
    And PARAMETERINDEX = @prmI )
    if ( @tmpBool = 'True' ) -- kaynak makinede de forml var
    begin
    Set @isFormulaExistsOnDest = CAST( CASE WHEN EXISTS(Select formulaId From BFCOMMANDFORMULAS Where machineId = @DESTINATIONMACHINEID
    And formulaId = @geciciStr) THEN 1 ELSE 0 END AS BIT)
    if ( @isFormulaExistsOnDest = 'True' ) -- atanm forml hedef bilgisayarda var
    Begin
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '', 0, 0)
    End
    Else -- atanm forml hedef bilgisayarda yok, varsaylan deeri ile alalm.
    Begin
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 2, 0)
    End
    End
    Else -- kaynak makine forml kullanmyor.
    Begin
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 2, 0)
    End
    End
    -- 01.04.2014 selman
    else
    Begin
    set @geciciStr = ( Select Value From BFMASTERSTEPPARAMS Where MACHINEID = @SOURCEMACHINEID And PROGNO = @SOURCEPRGNO And
    MAINSTEP = @mainStep And PARALELSTEP = @paraStep And PARAMETERINDEX = @prmI )
    if(CHARINDEX('"' + @geciciStr + '"', @prmSelection, 0) > 0 )
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @geciciStr, @prmContVar, '', 0, 0)
    END
    else
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 2, 0)
    END
    End
    END
    END
    else
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 1, 0) -- buradaki 1 dyeingProgram.pas'tan geliyor.
    END
    END
    else
    BEGIN
    Insert Into BFMASTERSTEPPARAMS
    Values(@DESTINATIONPRGNO, @mainStep, @paraStep, @prmI, @DESTINATIONMACHINEID, @prmValue, @prmContVar, '', 1, 0) -- buradaki 1 dyeingProgram.pas'tan geliyor.
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
    -- yukardaki satra 'And IOTYPE = 5' eklendi, 20.04.2015

    -- seilmii var iolarn seimlerini ekle ( IOTYPE = 5 And NAME = '-' ) 18.12.12 selman
    Insert Into BFMASTERSTEPSELECTIONLIST
    Select l.SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, l.IOINDEX, @DESTINATIONMACHINEID, l.IOID, l.IOTYPE
    From BFCOMMANDSELECTIONLIST l
    Right Join BFCOMMANDINPUTOUTPUTS i
    On l.MACHINEID = i.MACHINEID And l.COMMANDNO = i.COMMANDNO And l.IOINDEX = i.IOINDEX
    Where l.MACHINEID = @DESTINATIONMACHINEID And l.COMMANDNO = @cmdNo And l.ISDEFAULT = 'True' and l.IOTYPE = 5 And l.NAME = '-' and i.IOTYPE = 5

    -- editable iolarn ilemleri
    declare @ioIndex int
    declare @ioName nvarchar(255)
    declare visIo cursor for
    Select IOINDEX, NAME From BFCOMMANDINPUTOUTPUTS
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOTYPE = 5 -- And NAME <> '-'
    Open visIo

    FETCH NEXT FROM visIo INTO @ioIndex, @ioName
    WHILE @@FETCH_STATUS = 0
    BEGIN
    If(@ioName = '-')
    BEGIN
    Insert Into BFMASTERSTEPSELECTIONLIST
    Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, IOINDEX, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = 'True'
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
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = 'True'

    Update BFMASTERSTEPINPUTOUTPUTS Set ERRORWARNING = 2 Where MACHINEID = @DESTINATIONMACHINEID And PROGNO = @DESTINATIONPRGNO And
    MAINSTEP = @mainStep And PARALELSTEP = @paraStep And IOINDEX = @ioIndex
    END
    Else if(@srcMaxSelected > @desSelCoun)  -- seilebilirden daha byk seilmi, seimi resetliyoruz
    BEGIN
    Insert Into BFMASTERSTEPSELECTIONLIST
    Select SELECTINDEX,  @DESTINATIONPRGNO, @mainStep, @paraStep, @ioIndex, @DESTINATIONMACHINEID, IOID, IOTYPE From BFCOMMANDSELECTIONLIST
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And IOINDEX = @ioIndex And ISDEFAULT = 'True'

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
    Select @DESTINATIONPRGNO, @mainStep, @paraStep, PARAMETERINDEX, @DESTINATIONMACHINEID, VALUE, CONTAINSVARIABLE, '', 0, 0  From BFCOMMANDPARAMETERS
    Where MACHINEID = @DESTINATIONMACHINEID And COMMANDNO = @cmdNo And USEDEFAULT = 'False'
    -- 20.04.2015 st satra (And USEDEFAULT = 'True') eklendi

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
    sourceTable.MACHINEID = @SOURCEMACHINEID AND sourceTable.PROGNO = @SOURCEPRGNO AND sourceTable.OPTIMIZED = 1
  `);
}
