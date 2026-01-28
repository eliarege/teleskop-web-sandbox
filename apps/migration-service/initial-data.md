# TELESKOP BAŞLANGIÇ VERİLERİ

Bu bölümde, **boş bir Teleskop veritabanı** kurulduğunda
uygulamanın doğru çalışabilmesi için **eklenmesi gereken zorunlu veriler**
listelenmektedir.

| Tablo Adı                  | Kayıt Sayısı |
| -------------------------- | ------------ |
| TFTELESKOPSETTINGS         | 18           |
| BFMACHGROUP                | 10           |
| BFWaterTypes               | 6            |
| BFUNITS                    | 4            |
| TFTeleskopUsers            | 3            |
| BFUSERS                    | 3            |
| DYTFSETTINGS               | 2            |
| BFTREATMENTPARAMETERGROUPS | 1            |
| DYTFELIARUSER              | 1            |
| BFRECIPETYPES              | 1            |
| TFDBCLEANDATE              | 1            |
| BFPROCESSTYPES             | 1            |
| BFGRUP                     | 1            |
| TFCOMDRIVERSETTINGS        | 1            |
| TFDBVERSION                | 1            |

### TFTELESKOPSETTINGS (18)

| ID  | VALUE |
| --- | ----- |
| 1   | 0     |
| 2   | 0     |
| 3   | 0     |
| 4   | +\_   |
| 5   | 1     |
| 6   | 0     |
| 7   | -1    |
| 8   | 0     |
| 9   | 0     |
| 10  | 0     |
| 11  | 10    |
| 12  |       |
| 13  |       |
| 14  |       |
| 15  |       |
| 16  |       |
| 17  |       |
| 18  |       |

### BFMACHGROUP (10)

| GROUPID | GROUPNAME | GROUPTYPE | MMVisible |
| ------- | --------- | --------- | --------- |
| 0       | Kumas HT  | 0         | True      |
| 1       | Kumas OF  | 1         | True      |
| 2       | Bobin     | 2         | True      |
| 3       | Numune    | 3         | True      |
| 4       | Flok      | 4         | True      |
| 5       | Diger     | 9         | True      |
| 6       | Diger     | 9         | True      |
| 7       | Diger     | 9         | True      |
| 8       | Diger     | 9         | True      |
| 9       | Diger     | 9         | True      |

### BFWaterTypes (6)

| waterTypeId | waterTypeName | waterTypeNameEn |
| ----------- | ------------- | --------------- |
| 1           |               |                 |
| 2           |               |                 |
| 3           |               |                 |
| 4           |               |                 |
| 5           |               |                 |
| 6           |               |                 |

### BFUNITS (4)

| UNITID | UNITNAME |
| ------ | -------- |
| 1      | gr/lt    |
| 2      | %        |
| 3      | gr       |
| 4      | ml/lt    |

### TFTeleskopUsers (3)

| userLoginName    | userName         | userSurname      | userPass                         | userEditor | userMachines | userArchive | userMonitor | userReport | userUsers | userCommunicationDriver | userId | userEmail | userPlanningBoard |
| ---------------- | ---------------- | ---------------- | -------------------------------- | ---------- | ------------ | ----------- | ----------- | ---------- | --------- | ----------------------- | ------ | --------- | ----------------- |
| VARSAYILAN       | VARSAYILAN       | VARSAYILAN       |                                  | 1          | 1            | 1           | 1           | 1          | 0         | 0                       | 0      | NULL      | 00                |
| Eliar            | Eliar            | Eliar            | 810080a267233bda0a1514a2d1a5558d | FF         | FF           | 1           | 1           | 1          | F         | 3                       | 1      | NULL      | 3F                |
| Geçici Kullanici | Geçici Kullanici | Geçici Kullanici |                                  | FF         | FF           | 1           | 1           | 1          | F         | 3                       | 100    | NULL      | 00                |

### BFUSERS (3)

| userID | userName   | userSurname | userPass | userMode | userInfo | userActive | userDeleted | userMode2  | userType |
| ------ | ---------- | ----------- | -------- | -------- | -------- | ---------- | ----------- | ---------- | -------- |
| 0      | VARSAYILAN | VARSAYILAN  | 1111     | 0x110050 |          | 1          | 0           | 0x00000017 | 1        |
| 1      | ELIAR      | YETKILISI   | 35427    | 0x1ffff  |          | 1          | 0           | 0x00000017 | 1        |
| 100    | GECICI     | KULLANICI   | 1984     | 0x1ffff  |          | 1          | 0           | 0x00000017 | 1        |

### DYTFSETTINGS (2)

| settingId | settingValue |
| --------- | ------------ |
| 1         | 144          |
| 2         | 80\*80       |

### BFTREATMENTPARAMETERGROUPS (1)

| ID  | GROUPNAME | TEMPERATURECONTROLCOMMAND |
| --- | --------- | ------------------------- |
| 1   | Eliar     | NULL                      |

### DYTFELIARUSER (1)

| USERNAME | FULLNAME | DESCRIPTION | PASSWORD | ISSUPERUSER |
| -------- | -------- | ----------- | -------- | ----------- |
| q        | q        | q           | q        | 1           |

### BFRECIPETYPES (1)

| ID  | TYPENAME |
| --- | -------- |
| 1   | Boyama   |

### TFDBCLEANDATE (1)

| LAST_BACONSUMPTIONTIMESTAMP_CLEANDATE | LAST_BAMASTERPRGHEADER_CLEANDATE | LAST_BAMASTERCOMMANDS_CLEANDATE | LAST_BADATA_CLEANDATE |
| ------------------------------------- | -------------------------------- | ------------------------------- | --------------------- |
| 2004-02-10 09:16:00                   | 2004-02-10 09:16:00              | 2004-02-10 09:16:00             | 2004-02-10 09:16:00   |

### BFPROCESSTYPES (1)

| PROCESSCODE | PROCESSNAME | NOTE | BOYAPRGMI |
| ----------- | ----------- | ---- | --------- |
| 0           | Dyeing      | NULL | 1         |

### BFGRUP (1)

| GRUPNO | GRUPNAME | NOTE |
| ------ | -------- | ---- |
| 0      | Genel    |      |

### TFCOMDRIVERSETTINGS (1)

| COMDRIVERCOMPUTERNAME | IP   | SERVERPORT | REQUESTNAME | REQUESTPATH | ACTPATH | REQTYPE | DYESTUFFDISPENSER | LAST_BATCHKEY | COMPANY_NAME |
| --------------------- | ---- | ---------- | ----------- | ----------- | ------- | ------- | ----------------- | ------------- | ------------ |
| NULL                  | NULL | NULL       | NULL        | NULL        | NULL    | NULL    | 1                 | NULL          | Has Örme     |

### TFDBVERSION (1)

| DBVERSION | appMajor | appMinor |
| --------- | -------- | -------- |
| 3.4.32.0  | 0        | 10       |
