WITH
    CURRENTDATA
    AS
    (
        SELECT
            COALESCE(SUM(c.WaterTotal), 176968.40014648438) as currentWeekTotalWater,
            COALESCE(SUM(c.ELECTRICITY), 315.5) as currentWeekElectricity,
            COALESCE(SUM(c.FM1VALUE), 176968.40014648438) AS currentWeekFM,
            COALESCE(SUM(c.SALT), 0) AS currentWeekSalt,
            COALESCE(SUM(c.STEAM), 2937.5700192451477) AS currentWeekSteam
        FROM BACONSUMPTION c
            INNER JOIN (SELECT
                r.BATCHKEY ,
                r.STARTTIME
            FROM BADATA r
  )AS r ON c.BATCHKEY = r.BATCHKEY
        WHERE
  r.STARTTIME
  BETWEEN
  dateadd(day, (2 - datepart(weekday, getdate())), cast(getdate() as date))
  AND
  dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate()+7 AS date))
    ),
    LASTDATA
    AS
    (
        SELECT
            COALESCE(SUM(c.WaterTotal), 8899395.273823239) as lastWeekTotalWater,
            COALESCE(SUM(c.ELECTRICITY), 8183.650014946237) as lastWeekElectricity,
            COALESCE(SUM(c.FM1VALUE), 8899395.273823239) AS lastWeekFM,
            COALESCE(SUM(c.SALT), 0) AS lastWeekSalt,
            COALESCE(SUM(c.STEAM), 242019.6925020218) AS lastWeekSteam
        FROM BACONSUMPTION c
            INNER JOIN (SELECT
                r.BATCHKEY,
                r.STARTTIME
            FROM BADATA r
  )AS r ON c.BATCHKEY = r.BATCHKEY
        WHERE 
  r.STARTTIME
  BETWEEN
  dateadd(day,(2 - datepart(weekday, dateadd(week, -1, getdate()))),cast(dateadd(week, -1, getdate()) AS date))
  AND
  dateadd(day,(2 - datepart(weekday, getdate())),cast(getdate() as date))
    )
SELECT
    c.currentWeekTotalWater,
    c.currentWeekElectricity,
    c.currentWeekFM,
    c.currentWeekSalt,
    c.currentWeekSteam,
    s.lastWeekElectricity,
    s.lastWeekFM,
    s.lastWeekSalt,
    s.lastWeekSteam,
    s.lastWeekTotalWater
FROM CURRENTDATA c, LASTDATA s