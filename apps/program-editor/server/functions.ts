import type { TbbFtpClient, withTbbFtpClient } from 'tbb-ftp-client'
import type { Knex } from 'knex'
import { ErrorCode, PError } from './error'
import { db } from './database'
import type { Machine, MachineCommand, Program, ProgramHeader } from './types'

interface TransactionOptions {
  trx?: Knex.Transaction
}

interface FileTransferOptions {
  ftp?: TbbFtpClient
}

/**
 *
 * Veritabanı üzerinden makinenin adresi alınır.
 *
 * @throws Makine yok
 *
 * @param machineId
 */
export async function getMachineHost(machineId: number): Promise<string> {
  //
}

export async function getRemoteProgramList(machineId: number, options?: FileTransferOptions) {

}

/**
 * Makinedeki programı yükler.
 *
 * @throws Makine veya program yok
 * @throws Makineye erişim yok
 *
 * @param machineId Makinenin teleskop veritabanındaki ID'si
 * @param programNo Yüklenecek programın numarası
 */
export async function downloadProgramFromMachine(machineId: number, programNo: number): Promise<Program> {

}

export async function uploadProgramToMachine(machineId: number, program: Program): Promise<void> {

}

/**
 * Veritabanında tüm makineleri verir.
 */
export async function fetchAllMachines(): Promise<Machine[]> {

}

/**
 * Makinenin tüm programları veri tabanından alır.
 *
 * @throws Makine Yok
 */
export async function fetchAllProgramHeaders(machineId: number): Promise<ProgramHeader[]> {

}

/**
 * Veritabanında id'si verilen makineyi verir.
 *
 * @throws A
 *
 * @param machineId
 */
export async function fetchMachine(machineId: number): Promise<Machine[]> {

}

/**
 * Veritabanından makine için tanımlı komutları alır.
 *
 * @throws Makine yok
 *
 * @param machineId
 */
export async function fetchCommands(machineId: number): Promise<MachineCommand[]> {

}

/**
 *
 * Veritabanından ilgili programı alır.
 *
 * @param machineId
 * @param programNo
 */
export async function fetchProgram(machineId: number, programNo: number): Promise<Program> {

}

export interface InsertProgramOptions extends TransactionOptions {
  force?: boolean
}

/**
 *
 * Veritabanına verilen programı yazar.
 *
 * @throws Makine yok
 * @throws Geçersiz program
 * @throws Program zaten var (force: true ise bu hata gelmemeli)
 *
 *
 * @param machineId
 * @param program
 */
export async function insertProgram(machineId: number, program: Program, options?: InsertProgramOptions): Promise<void> {

}

/**
 * Veritabanından ilgili programı siler.
 *
 * @throws Makine Yok
 * @throws Program Yok
 */
export function deleteProgramFromDatabase(machineId: number, programNo: number, options?: TransactionOptions) {

}

/**
 * Makineden ilgili programı siler.
 *
 * @throws Makine Yok
 * @throws Makineye erişim yok
 * @throws Program Yok
 */
export function deleteProgramFromMachine(machineId: number, programNo: number, options?: FileTransferOptions) {

}

/**
 * Makinenin tüm arşivli programlarını database'den alır. (Adımları almaz)
 */
export function fetchAllArchivedProgramHeader(machineId: number, programNo: number) {

}

/**
 * Arşivli programı veri tabanından alır.
 */
export function fetchArchivedProgram(machineId: number, programNo: number, versionNo: number) {

}

/**
 * Arşivli programı yükler. Eğer aktif program versiyonu verilirse, fonksiyon birşey yapmamalı, ama hatada dönmemeli.
 *
 * @throws Makine Yok
 * @throws Program Yok
 * @throws Arşivli Program Yok
 */
export function loadArchivedProgram(machineId: number, programNo: number, versionNo: number, options?: TransactionOptions) {

}

/**
 * Aktif programı arşivler. Yeni Programı Ekler, eskisiyle değiştirir. (Full replace)
 *
 * @throws Makine Yok
 * @throws Program Yok
 * @throws Program Invalid
 */
export async function updateProgram(machineId: number, programNo: Program, program: Program): Promise<void> {

}

/**
 * Programın veritabanında arşivlendiğinden emin olur.
 *
 * Arşivlenmemişse veya hatalı arşivlenmişse, düzeltir.
 *
 */
export function ensureProgramIsArchived(machineId: number, programNo: number) {

}

/**
 * İki programı karşılaştırır. İlk farklılıkta cevap döner.
 */
export function comparePrograms(programA: Program, programB: Program): boolean {

}

/**
 * İki programı karşılaştırır. Tüm farkları döner.
 */
export function compareProgramsInDetail(programA: Program, programB: Program): unknown {

}
