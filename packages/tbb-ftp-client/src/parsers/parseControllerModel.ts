/**
 * Cihaz donanım bilgilerinin bulunduğu dosya, tek satır içerikten oluşur,
 * `-` ile ayrılmış şekilde cihaz modeli, anakart modeli ve plc modeli yer alır.
 *
 * **Path**: `/var/controllerModel`
 *
 * **Example**:
 * ```txt
 * T7700-Giada-TBBPLC
 * ```
 */
export function parseControllerModel(content: string) {
  const parts = content.trim().split('-')
  const controllerModel = {
    productModel: parts[0] || '',
    hardwareModel: parts[1] || '',
    plcModel: parts[2] || '',
  }
  return controllerModel
}
