export enum ErrorMessageKey {
  // Bağlantı / Ağ hataları
  Timeout = 'error.timeout',
  ConnectionRefused = 'error.connection_refused',
  NetworkUnreachable = 'error.network_unreachable',
  AddressResolutionFailed = 'error.address_resolution_failed',

  // FTP / TBB istemcisi
  FtpError = 'error.ftp',

  // Veritabanı hataları
  DatabaseQueryError = 'error.db.query',
  DatabaseDeadlock = 'error.db.deadlock',
  DatabaseDuplicateKey = 'error.db.duplicate_key',

  // Validation / Geçersiz parametre
  InvalidMachineId = 'error.invalid_machine_id',
  SseIdRequired = 'error.sse_id_required',

  // Genel
  Unknown = 'error.unknown',
}
