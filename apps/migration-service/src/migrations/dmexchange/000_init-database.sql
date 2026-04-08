-- COMMANDTIMEOUTREASONS definition
IF OBJECT_ID('COMMANDTIMEOUTREASONS','U') IS NULL
BEGIN
    CREATE TABLE COMMANDTIMEOUTREASONS (
        ID bigint IDENTITY(1,1) NOT NULL,
        BATCHKEY int NOT NULL,
        DYELOT nvarchar(20) COLLATE Turkish_CI_AS NOT NULL,
        PROGNO int NOT NULL,
        PROGNAME nvarchar(80) COLLATE Turkish_CI_AS NOT NULL,
        PROGTYPE nvarchar(80) COLLATE Turkish_CI_AS NOT NULL,
        PRGINDEX tinyint NOT NULL,
        STEPNO int NOT NULL,
        COMMANDNO int NOT NULL,
        COMMANDNAME nvarchar(200) COLLATE Turkish_CI_AS NOT NULL,
        OPERATORNAME nvarchar(200) COLLATE Turkish_CI_AS NOT NULL,
        STARTTIME datetime NOT NULL,
        ENDTIME datetime NULL,
        REASONID int NOT NULL,
        REASONTEXT nvarchar(150) COLLATE Turkish_CI_AS NOT NULL,
        ERPREAD tinyint NULL,
        CONSTRAINT PK_BACOMMANDTIMEOUTREASONS PRIMARY KEY (ID)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IND_BACOMMANDTIMEOUTREASONS_BATCHKEY'
      AND object_id = OBJECT_ID('COMMANDTIMEOUTREASONS')
)
BEGIN
    CREATE NONCLUSTERED INDEX IND_BACOMMANDTIMEOUTREASONS_BATCHKEY
    ON COMMANDTIMEOUTREASONS (BATCHKEY);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IND_BACOMMANDTIMEOUTREASONS_DYELOT_STARTTIME'
      AND object_id = OBJECT_ID('COMMANDTIMEOUTREASONS')
)
BEGIN
    CREATE NONCLUSTERED INDEX IND_BACOMMANDTIMEOUTREASONS_DYELOT_STARTTIME
    ON COMMANDTIMEOUTREASONS (DYELOT ASC, STARTTIME ASC);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IND_COMMANDTIMEOUTREASONS_ERPREAD'
      AND object_id = OBJECT_ID('COMMANDTIMEOUTREASONS')
)
BEGIN
    CREATE NONCLUSTERED INDEX IND_COMMANDTIMEOUTREASONS_ERPREAD
    ON COMMANDTIMEOUTREASONS (ERPREAD);
END;


-- Dyelot_Finish_Reason definition
IF OBJECT_ID('Dyelot_Finish_Reason','U') IS NULL
BEGIN
    CREATE TABLE Dyelot_Finish_Reason (
        DyelotFinishReasonCode varchar(16) COLLATE Turkish_CI_AS NOT NULL,
        FinishType varchar(12) COLLATE Turkish_CI_AS NOT NULL,
        FinishName varchar(50) COLLATE Turkish_CI_AS NOT NULL,
        FinishReferenceCode int NOT NULL,
        ImportState smallint NULL
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UNIQ_Dyelot_Finish_Reason_DyelotFinishReasonCode'
      AND object_id = OBJECT_ID('Dyelot_Finish_Reason')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UNIQ_Dyelot_Finish_Reason_DyelotFinishReasonCode
    ON Dyelot_Finish_Reason (DyelotFinishReasonCode);
END;


-- Dyelot_History definition
IF OBJECT_ID('Dyelot_History','U') IS NULL
BEGIN
    CREATE TABLE Dyelot_History (
        AutoKey bigint IDENTITY(1,1) NOT NULL,
        MachineNo int NOT NULL,
        OperatorID int NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NOT NULL,
        DyelotState int NOT NULL,
        DyelotFinishReason varchar(100) COLLATE Turkish_CI_AS NULL,
        [Date] datetime DEFAULT getdate() NOT NULL,
        FlagErpRead int DEFAULT 0 NOT NULL,
        DateErpRead datetime NULL,
        AckErp varchar(500) COLLATE Turkish_CI_AS NULL,
        [timestamp] timestamp NOT NULL,
        EventDate datetime DEFAULT getdate() NOT NULL,
        FinishReferenceCode int NULL,
        DyelotFinishReasonCode varchar(16) COLLATE Turkish_CI_AS NULL,
        CONSTRAINT PK__Dyelot_H__FECF3FA97C09B51E PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Dyelot_History_Dyelot'
      AND object_id = OBJECT_ID('Dyelot_History')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Dyelot_History_Dyelot
    ON Dyelot_History (Dyelot);
END;


-- Dyelot_Parameter definition
IF OBJECT_ID('Dyelot_Parameter','U') IS NULL
BEGIN
    CREATE TABLE Dyelot_Parameter (
        AutoKey bigint IDENTITY(1,1) NOT NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NOT NULL,
        ReDye smallint NULL,
        TreatmentCnt smallint NULL,
        TreatmentParaCnt smallint NULL,
        TreatmentParaNo smallint NULL,
        TreatmentParaValue real NULL,
        CONSTRAINT PK_Dyelot_Parameter_1 PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Dyelot_Parameter_Dyelot'
      AND object_id = OBJECT_ID('Dyelot_Parameter')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Dyelot_Parameter_Dyelot
    ON Dyelot_Parameter (Dyelot);
END;


-- Dyelot_Procedure definition
IF OBJECT_ID('Dyelot_Procedure','U') IS NULL
BEGIN
    CREATE TABLE Dyelot_Procedure (
        AutoKey int IDENTITY(1,1) NOT NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NULL,
        ReDye smallint NULL,
        TreatmentCnt smallint NULL,
        TreatmentNo int NULL,
        PumpSpeed float NULL,
        ReelSpeed float NULL,
        NozzleValue float NULL,
        LiquorRatio real NULL,
        CONSTRAINT PK_Dyelot_Procedure PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Dyelot_Procedure_Dyelot'
      AND object_id = OBJECT_ID('Dyelot_Procedure')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Dyelot_Procedure_Dyelot
    ON Dyelot_Procedure (Dyelot);
END;


-- Dyelot_Recipe definition
IF OBJECT_ID('Dyelot_Recipe','U') IS NULL
BEGIN
    CREATE TABLE Dyelot_Recipe (
        AutoKey int IDENTITY(1,1) NOT NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NULL,
        ReDye smallint NULL,
        CallOff smallint NULL,
        Counter smallint NULL,
        ProductName varchar(50) COLLATE Turkish_CI_AS NULL,
        Amount real NULL,
        Unit varchar(10) COLLATE Turkish_CI_AS NULL,
        ActualAmount real NULL,
        KindOfStation smallint NULL,
        ProductID int NULL,
        KindOfProduct smallint NULL,
        ProductCode varchar(50) COLLATE Turkish_CI_AS NULL,
        RecipeAmount real NULL,
        TreatmentNo int NULL,
        Preparation_counter smallint NULL,
        Program_order smallint NULL,
        WATER real NULL,
        LOTNO nvarchar(255) COLLATE Turkish_CI_AS NULL,
        CallOffManuel smallint NULL,
        extparam1 int NULL,
        extparam2 int NULL,
        CONSTRAINT PK_Dyelot_Recipe PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Dyelot_Recipe_Dyelot'
      AND object_id = OBJECT_ID('Dyelot_Recipe')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Dyelot_Recipe_Dyelot
    ON Dyelot_Recipe (Dyelot);
END;


-- Dyelots definition
IF OBJECT_ID('Dyelots','U') IS NULL
BEGIN
    CREATE TABLE Dyelots (
        AutoKey int IDENTITY(1,1) NOT NULL,
        DyelotRefNo varchar(6) COLLATE Turkish_CI_AS NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NOT NULL,
        ExternalDyelot varchar(20) COLLATE Turkish_CI_AS NOT NULL,
        ReDye smallint NOT NULL,
        Machine varchar(4) COLLATE Turkish_CI_AS NOT NULL,
        Color int NULL,
        State smallint NULL,
        ImportState smallint NULL,
        StartTime datetime NULL,
        EndTime datetime NULL,
        OrderNo varchar(20) COLLATE Turkish_CI_AS NULL,
        Customer varchar(20) COLLATE Turkish_CI_AS NULL,
        Article varchar(20) COLLATE Turkish_CI_AS NULL,
        RecipeNo varchar(50) COLLATE Turkish_CI_AS NULL,
        Text1 varchar(20) COLLATE Turkish_CI_AS NULL,
        Text2 varchar(20) COLLATE Turkish_CI_AS NULL,
        Text3 varchar(20) COLLATE Turkish_CI_AS NULL,
        Text4 varchar(20) COLLATE Turkish_CI_AS NULL,
        Text5 varchar(20) COLLATE Turkish_CI_AS NULL,
        Weight real NULL,
        LiquorRatio real NULL,
        LiquorQuantity real NULL,
        Parameter1 real NULL,
        Parameter2 real NULL,
        Parameter3 real NULL,
        Parameter4 real NULL,
        Parameter5 real NULL,
        Parameter6 real NULL,
        Parameter7 real NULL,
        Parameter8 real NULL,
        Parameter9 real NULL,
        Parameter10 real NULL,
        Parameter11 real NULL,
        Parameter12 real NULL,
        Parameter13 real NULL,
        Parameter14 real NULL,
        Parameter15 real NULL,
        Parameter16 real NULL,
        Parameter17 real NULL,
        Parameter18 real NULL,
        Parameter19 real NULL,
        Parameter20 real NULL,
        Note1 real NULL,
        Note2 varchar(60) COLLATE Turkish_CI_AS NULL,
        Note3 real NULL,
        Note4 varchar(60) COLLATE Turkish_CI_AS NULL,
        Note5 varchar(60) COLLATE Turkish_CI_AS NULL,
        RunTime int NULL,
        SetTime int NULL,
        OperatorTime int NULL,
        HoldAlarmTime int NULL,
        StopAlarmTime int NULL,
        ManualTime int NULL,
        CorrectionTime int NULL,
        StopTime int NULL,
        PrepTime int NULL,
        Time1 int NULL,
        Time2 int NULL,
        Time3 int NULL,
        Water1 real NULL,
        Water2 real NULL,
        Power real NULL,
        HeatingEnergy real NULL,
        CoolingEnergy real NULL,
        Consumption1 real NULL,
        Consumption2 real NULL,
        AlarmCnt smallint NULL,
        InterventionCnt smallint NULL,
        SendTime datetime NULL,
        Coupling int NULL,
        Slavemachine1 varchar(50) COLLATE Turkish_CI_AS NULL,
        endState smallint NULL,
        Parameter21 real NULL,
        Parameter22 real NULL,
        Parameter23 real NULL,
        Parameter24 real NULL,
        Parameter25 real NULL,
        Parameter26 real NULL,
        Parameter27 real NULL,
        Parameter28 real NULL,
        Parameter29 real NULL,
        Parameter30 real NULL,
        StartingOperator int NULL,
        FinishingOperator int NULL,
        ColourNo varchar(50) COLLATE Turkish_CI_AS NULL,
        ColourDescript varchar(50) COLLATE Turkish_CI_AS NULL,
        ColourGroup varchar(20) COLLATE Turkish_CI_AS NULL,
        FiberGroup varchar(20) COLLATE Turkish_CI_AS NULL,
        DyeGroup varchar(20) COLLATE Turkish_CI_AS NULL,
        DyeType varchar(20) COLLATE Turkish_CI_AS NULL,
        Parameter31 real NULL,
        Parameter32 real NULL,
        Parameter33 real NULL,
        Parameter34 real NULL,
        Parameter35 real NULL,
        Parameter36 real NULL,
        Parameter37 real NULL,
        Parameter38 real NULL,
        Parameter39 real NULL,
        Parameter40 real NULL,
        Parameter41 real NULL,
        Parameter42 real NULL,
        Parameter43 real NULL,
        Parameter44 real NULL,
        Parameter45 real NULL,
        Parameter46 real NULL,
        Parameter47 real NULL,
        Parameter48 real NULL,
        Parameter49 real NULL,
        Parameter50 real NULL,
        StartConfirm smallint DEFAULT 0 NOT NULL,
        EndConfirm smallint DEFAULT 0 NOT NULL,
        ActualMachine int DEFAULT -1 NULL,
        LastCompletedRequest int DEFAULT -1 NULL,
        ReadyToStart smallint NULL,
        BlockReason nvarchar(50) COLLATE Turkish_CI_AS NULL,
        Steam real NULL,
        TotalWater real NULL,
        Water3 real NULL,
        Water4 real NULL,
        Water5 real NULL,
        Water6 real NULL,
        FabricQualityInfo varchar(100) COLLATE Turkish_CI_AS NULL,
        FabricLotNumber varchar(32) COLLATE Turkish_CI_AS NULL,
        DyehouseNumber int DEFAULT -1 NULL,
        WITHOUTRECIPE bit NULL,
        CreateDate date DEFAULT getdate() NULL,
        PROCESSTYPE tinyint NULL,
        CONSTRAINT PK_Dyelots PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Dyelots_Dyelot'
      AND object_id = OBJECT_ID('Dyelots')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Dyelots_Dyelot
    ON Dyelots (Dyelot);
END;


-- LastAutoKeyValue definition
IF OBJECT_ID('LastAutoKeyValue','U') IS NULL
BEGIN
    CREATE TABLE LastAutoKeyValue (
        Id int IDENTITY(1,1) NOT NULL,
        DyeLotRecipeAutoKey int NULL,
        ManuelCompAutoKey int NULL,
        DytaConsumptionKAutoKey int NULL,
        OtherConsumptionAutoKey int NULL,
        CONSTRAINT PK_LastAutoKeyValue PRIMARY KEY (Id)
    );
END


-- MachineBreakdowns definition
IF OBJECT_ID('MachineBreakdowns','U') IS NULL
BEGIN
    CREATE TABLE MachineBreakdowns (
        AutoKey bigint IDENTITY(1,1) NOT NULL,
        MachineNo int NOT NULL,
        StartTime datetime NOT NULL,
        EndTime datetime NOT NULL,
        BreakdownReason nvarchar(200) COLLATE Turkish_CI_AS NOT NULL,
        Joborder varchar(30) COLLATE Turkish_CI_AS NOT NULL,
        OperatorName1 nvarchar(100) COLLATE Turkish_CI_AS NOT NULL,
        OperatorStartTime1 datetime NOT NULL,
        OperatorEndTime1 datetime NOT NULL,
        OperatorName2 nvarchar(100) COLLATE Turkish_CI_AS NULL,
        OperatorStartTime2 datetime NULL,
        OperatorEndTime2 datetime NULL,
        OperatorName3 nvarchar(100) COLLATE Turkish_CI_AS NULL,
        OperatorStartTime3 datetime NULL,
        OperatorEndTime3 datetime NULL,
        Archived bit DEFAULT 0 NOT NULL,
        CONSTRAINT PK_MachineBreakdowns PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_MachineBreakdowns_Joborder'
      AND object_id = OBJECT_ID('MachineBreakdowns')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_MachineBreakdowns_Joborder
    ON MachineBreakdowns (Joborder);
END;


-- Machine_Groups definition
IF OBJECT_ID('Machine_Groups','U') IS NULL
BEGIN
    CREATE TABLE Machine_Groups (
        MGroupNo smallint NOT NULL,
        MGroupName nvarchar(50) COLLATE Turkish_CI_AS NULL,
        ImportState smallint NULL,
        CONSTRAINT PK_Machine_Groups PRIMARY KEY (MGroupNo)
    );
END


-- Machines definition
IF OBJECT_ID('Machines','U') IS NULL
BEGIN
    CREATE TABLE Machines (
        MachineNo varchar(4) COLLATE Turkish_CI_AS NOT NULL,
        MachineName nvarchar(30) COLLATE Turkish_CI_AS NULL,
        MGroupNo smallint NULL,
        MinVolume real NULL,
        MaxVolume real NULL,
        MinWeight real NULL,
        MaxWeight real NULL,
        ImportState smallint NULL,
        CONSTRAINT PK_Machines PRIMARY KEY (MachineNo)
    );
END


-- Manual_Consumptions definition
IF OBJECT_ID('Manual_Consumptions','U') IS NULL
BEGIN
    CREATE TABLE Manual_Consumptions (
        AutoKey int IDENTITY(1,1) NOT NULL,
        ConsumptionTime datetime NOT NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NULL,
        OrderNo varchar(20) COLLATE Turkish_CI_AS NULL,
        ProductCode varchar(50) COLLATE Turkish_CI_AS NULL,
        ProductName varchar(80) COLLATE Turkish_CI_AS NULL,
        Unit varchar(10) COLLATE Turkish_CI_AS NULL,
        Amount real DEFAULT 0 NOT NULL,
        isOnlineDylot bit DEFAULT 1 NOT NULL,
        LOTNO nvarchar(255) COLLATE Turkish_CI_AS NULL,
        MachineId int DEFAULT -1 NOT NULL,
        Additional bit DEFAULT 'False' NULL,
        Repair bit DEFAULT 'False' NULL,
        CONSTRAINT PK__Manual_C__FECF3FA9276EDEB3 PRIMARY KEY (AutoKey)
    );
END

-- INDEX
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ind_Manual_Consumptions_Dyelot'
      AND object_id = OBJECT_ID('Manual_Consumptions')
)
BEGIN
    CREATE NONCLUSTERED INDEX ind_Manual_Consumptions_Dyelot
    ON Manual_Consumptions (Dyelot);
END;


-- Operators definition
IF OBJECT_ID('Operators','U') IS NULL
BEGIN
    CREATE TABLE Operators (
        OperatorID int NOT NULL,
        OperatorName varchar(50) COLLATE Turkish_CI_AS NOT NULL,
        OperatorGroup smallint NULL,
        CONSTRAINT PK_Operators PRIMARY KEY (OperatorID)
    );
END


-- Other_Consumptions definition
IF OBJECT_ID('Other_Consumptions','U') IS NULL
BEGIN
    CREATE TABLE Other_Consumptions (
        AutoKey int IDENTITY(1,1) NOT NULL,
        ConsumptionTime datetime NOT NULL,
        Dyelot varchar(20) COLLATE Turkish_CI_AS NULL,
        OrderNo varchar(20) COLLATE Turkish_CI_AS NULL,
        ProductCode varchar(50) COLLATE Turkish_CI_AS NULL,
        ProductName varchar(80) COLLATE Turkish_CI_AS NULL,
        Unit varchar(10) COLLATE Turkish_CI_AS NULL,
        Amount real DEFAULT 0 NOT NULL,
        isOnlineDylot bit DEFAULT 1 NOT NULL,
        MachineId int NULL,
        MachineCode nvarchar(30) COLLATE Turkish_CI_AS NULL,
        LOTNO nvarchar(255) COLLATE Turkish_CI_AS NULL,
        Additional bit DEFAULT 'False' NULL,
        Repair bit DEFAULT 'False' NULL,
        CONSTRAINT PK__Other_Co__FECF3FA9C6E728B0 PRIMARY KEY (AutoKey)
    );
END


-- Product definition
IF OBJECT_ID('Product','U') IS NULL
BEGIN
    CREATE TABLE Product (
        ID int IDENTITY(1,1) NOT NULL,
        ShortName varchar(20) COLLATE Turkish_CI_AS NULL,
        Name varchar(80) COLLATE Turkish_CI_AS NULL,
        KindOfProduct smallint NULL,
        ExternalProductID varchar(24) COLLATE Turkish_CI_AS NULL,
        ImportState smallint NULL,
        TeksdataID int DEFAULT 0 NOT NULL,
        DyehouseNumber int DEFAULT -1 NULL,
        CONSTRAINT PK_Product PRIMARY KEY (ID)
    );
END


-- Recipe_Requests definition
IF OBJECT_ID('Recipe_Requests','U') IS NULL
BEGIN
    CREATE TABLE Recipe_Requests (
        AutoKey int IDENTITY(1,1) NOT NULL,
        RecipeNo int NOT NULL,
        DyeRequestCount smallint DEFAULT 0 NOT NULL,
        ChemicalRequestCount smallint DEFAULT 0 NOT NULL,
        PROCESSTYPE tinyint DEFAULT 0 NOT NULL,
        CONSTRAINT PK__Recipe_R__FECF3FA931EC6D26 PRIMARY KEY (AutoKey)
    );
END


-- Treatment_Groups definition
IF OBJECT_ID('Treatment_Groups','U') IS NULL
BEGIN
    CREATE TABLE Treatment_Groups (
        TreatmentGroupNo smallint NOT NULL,
        TreatmentGroupName varchar(30) COLLATE Turkish_CI_AS NULL,
        ImportState smallint NULL,
        CONSTRAINT PK_Treatment_Groups PRIMARY KEY (TreatmentGroupNo)
    );
END


-- Treatment_Parameter definition
IF OBJECT_ID('Treatment_Parameter','U') IS NULL
BEGIN
    CREATE TABLE Treatment_Parameter (
        TreatmentParaNo smallint NOT NULL,
        TreatmentParaName varchar(40) COLLATE Turkish_CI_AS NULL,
        TreatmentParaMin real NULL,
        TreatmentParaMax real NULL,
        TreatmentParaUnit varchar(10) COLLATE Turkish_CI_AS NULL,
        ImportState smallint NULL,
        CONSTRAINT PK_Treatment_Parameter PRIMARY KEY (TreatmentParaNo)
    );
END


-- Treatment_Parameter_Ref definition
IF OBJECT_ID('Treatment_Parameter_Ref','U') IS NULL
BEGIN
    CREATE TABLE Treatment_Parameter_Ref (
        AutoKey int IDENTITY(1,1) NOT NULL,
        TreatmentNo int NULL,
        TreatmentParaCounter smallint NULL,
        TreatmentParaNo smallint NULL,
        ImportState smallint NULL,
        TreatmentType smallint DEFAULT 0 NOT NULL,
        CONSTRAINT PK_Treatment_Parameter_Ref PRIMARY KEY (AutoKey)
    );
END


-- dbSettings definition
IF OBJECT_ID('dbSettings','U') IS NULL
BEGIN
    CREATE TABLE dbSettings (
        DBVERSION int NULL
    );
END


-- dyeRecipe definition
IF OBJECT_ID('dyeRecipe','U') IS NULL
BEGIN
    CREATE TABLE dyeRecipe (
        ID int IDENTITY(1,1) NOT NULL,
        RecipeID int NOT NULL,
        RecipeCode nvarchar(50) COLLATE Turkish_CI_AS NOT NULL,
        RecipeName nvarchar(50) COLLATE Turkish_CI_AS NOT NULL,
        Customer nvarchar(50) COLLATE Turkish_CI_AS NULL,
        Fabric nvarchar(50) COLLATE Turkish_CI_AS NULL,
        Construction nvarchar(50) COLLATE Turkish_CI_AS NULL,
        RecipeType smallint NULL,
        Color int NULL,
        DateCreated smalldatetime NULL,
        DateModified smalldatetime NULL,
        Dyestuff1 int DEFAULT -1 NULL,
        Dyestuff2 int DEFAULT -1 NULL,
        Dyestuff3 int DEFAULT -1 NULL,
        Dyestuff4 int DEFAULT -1 NULL,
        Dyestuff5 int DEFAULT -1 NULL,
        Dyestuff6 int DEFAULT -1 NULL,
        Dyestuff7 int DEFAULT -1 NULL,
        Dyestuff8 int DEFAULT -1 NULL,
        Depth1 real NULL,
        Depth2 real NULL,
        Depth3 real NULL,
        Depth4 real NULL,
        Depth5 real NULL,
        Depth6 real NULL,
        Depth7 real NULL,
        Depth8 real NULL,
        State int NULL,
        CONSTRAINT IX_Recipe UNIQUE (RecipeCode),
        CONSTRAINT PK_Recipe PRIMARY KEY (ID)
    );
END


-- Treatments definition
IF OBJECT_ID('Treatments','U') IS NULL
BEGIN
    CREATE TABLE Treatments (
        TreatmentNo int NOT NULL,
        TreatmentGroupNo smallint NOT NULL,
        TreatmentName nvarchar(200) COLLATE Turkish_CI_AS NULL,
        TreatmentParaCount smallint NULL,
        ImportState smallint NULL,
        TreatmentType smallint DEFAULT 1 NOT NULL,
        CONSTRAINT PK_Treatments PRIMARY KEY (TreatmentNo, TreatmentType),
        CONSTRAINT FK_Treatments_Treatment_Groups FOREIGN KEY (TreatmentGroupNo) REFERENCES Treatment_Groups (TreatmentGroupNo)
    );
END


-- Treatment_MGroups definition
IF OBJECT_ID('Treatment_MGroups','U') IS NULL
BEGIN
    CREATE TABLE Treatment_MGroups (
        AutoKey int IDENTITY(1,1) NOT NULL,
        TreatmentNo int NOT NULL,
        MGroupNo smallint NULL,
        ImportState smallint NULL,
        TreatmentType smallint DEFAULT 0 NOT NULL,
        CONSTRAINT PK_Treatment_MGroups PRIMARY KEY (AutoKey),
        CONSTRAINT FK_Treatment_MGroups_Machine_Groups FOREIGN KEY (MGroupNo) REFERENCES Machine_Groups (MGroupNo),
        CONSTRAINT FK_Treatment_MGroups_Treatments FOREIGN KEY (TreatmentNo, TreatmentType) REFERENCES Treatments (TreatmentNo, TreatmentType)
    );
END
