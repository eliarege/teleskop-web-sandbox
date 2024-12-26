# Teleskop Archive

- `server/functions/io.ts` eklendi. IO Değerler çekmek için fonksiyonlar bulunduruyor.
- `server/functions/etc.ts` eklendi. IO Değerleri dışındaki, iş emri çalışma sürecinde değişken değerleri dönen fonksiyonları bulunduruyor.
- `server/api/batch/batch/[batchkey]/theoretical-programs.get.ts` güncellendi. Performans arttırıldı.
- `server/functions/Cacheable.ts` eklendi. Bu belki ilerde kullanılır. (Veya `utils`'e aktarılır.)
- `server/utils/constants.ts` IOType

/api/batch/[batchkey] Değişiklikleri

- theoretical-programs.get (Performans)
- io-values.get (Eklendi, `io` klasöründeki endpoint'ların tamamını dönüyor.)

- theoretical-commands.get (Silindi, onun yerine `utils/functions` daki `flattenPrograms` kullanılacak)
