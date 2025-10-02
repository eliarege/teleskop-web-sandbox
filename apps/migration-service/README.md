# Migration Service

Bu proje development modunda çalışmaz. Önce build alıp sonra derlenmiş çıktıyı çalıştırmanız gerekir.

## Build Adımları

Depo kökünden:
```bash
cd apps/migration-service
pnpm install # (root'ta zaten yapmadıysanız)
pnpm build
```

Derlenmiş giriş dosyası: `dist/migrate.mjs`

Çalıştırmak için ortam değişkenlerinizi (.env) ayarladıktan sonra:
```bash
pnpm preview    # node dist/migrate.mjs
```

Son eklenen migration'ı geri almak (rollback / down):
```bash
pnpm preview down   # tek migration geri alır (yoksa bilgi mesajı)
```

Tipik geliştirme akışı:
1. Yeni migration oluştur: `pnpm generate-migration <isim>`
2. Dosyayı düzenle (up / down)
3. Build: `pnpm build`
4. Uygula: `pnpm preview`
5. Gerekirse geri al: `pnpm preview down`
6. Düzenle ve tekrar uygula: adım 2 → 4

Yeni migration oluşturmak için:
```bash
pnpm generate-migration <isim>
```

Log Mesajları:
- Başarılı ileri: `Up successful.`
- Başarılı geri: `Down successful. Rolled back migration: <dosya>` veya `Down: No migration to rollback.`

Notlar:
- `down` komutu sadece en son uygulanan tek migration'ı geri almaya çalışır.
- Knex sürümü tek-tek down desteklemezse son batch'i geri alır.
