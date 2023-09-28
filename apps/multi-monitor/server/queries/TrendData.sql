WITH
    CURRENTDATA
    AS
    (
        SELECT
            SUM(c.WaterTotal) as currentWeekTotalWater,
            SUM(c.ELECTRICITY) as currentWeekElectricity,
            SUM(c.FM1VALUE) AS currentWeekFM,
            SUM(c.SALT) AS currentWeekSalt,
            SUM(c.STEAM) AS currentWeekSteam
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
            SUM(c.WaterTotal) as lastWeekTotalWater,
            SUM(c.ELECTRICITY) as lastWeekElectricity,
            SUM(c.FM1VALUE) AS lastWeekFM,
            SUM(c.SALT) AS lastWeekSalt,
            SUM(c.STEAM) AS lastWeekSteam
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