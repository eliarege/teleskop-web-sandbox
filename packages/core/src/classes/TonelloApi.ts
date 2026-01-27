import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import { format } from 'date-fns'
import type {
  TonelloAlarm,
  TonelloBatch,
  TonelloConfiguration,
  TonelloFunction,
  TonelloInputOutputList,
  TonelloMachineStatus,
  TonelloProgram,
  TonelloProgramList,
  TonelloResponse,
  TonelloResponseWithoutWrapper,
} from '../types/tonello'

export class TonelloApi {
  private fetch: $Fetch = $fetch
  constructor(public readonly baseURL: string) {
    this.fetch = $fetch.create({
      baseURL,
      headers: {
        Accept: 'application/json',
      },
    })
  }

  static createFromHostname(hostname: string): TonelloApi {
    const baseURL = `http://${hostname}:1234`
    return new TonelloApi(baseURL)
  }

  async fetchDatetime(timeout = 5000): Promise<TonelloResponse<{ dateTime: string }>> {
    return await this.fetch('/api/v1/getDateTime', { timeout })
  }

  async updateDatetime(dateTime: Date): Promise<TonelloResponse<void>> {
    const date = format(dateTime, 'yyyy-MM-dd')
    const time = format(dateTime, 'HH:mm:ss')
    return await this.fetch('/api/v1/setDateTime', {
      body: { date, time },
    })
  }

  async fetchProgramList(): Promise<TonelloResponse<TonelloProgramList>> {
    return await this.fetch('/api/v1/getProgramsList')
  }

  async fetchFunctions(): Promise<TonelloResponse<TonelloFunction[]>> {
    return await this.fetch('/api/v1/getFunctions')
  }

  async fetchStatus(): Promise<TonelloResponse<TonelloMachineStatus>> {
    return await this.fetch('/api/v1/getStatus')
  }

  async fetchInputOutputList(): Promise<TonelloResponse<TonelloInputOutputList>> {
    return await this.fetch('/api/v1/getInputOutputList')
  }

  async fetchConfiguration(): Promise<TonelloResponse<TonelloConfiguration>> {
    return await this.fetch('/api/v1/getConfiguration')
  }

  async fetchAlarmsList(): Promise<TonelloResponse<{ alarms: TonelloAlarm[] }>> {
    return await this.fetch('/api/v1/getAlarmsList')
  }

  async fetchProgram(code: string | number): Promise<TonelloResponse<TonelloProgram>> {
    return await this.fetch('/api/v1/getProgram', { query: { code } })
  }

  async fetchProgramsList(): Promise<TonelloResponseWithoutWrapper<TonelloProgramList>> {
    return await this.fetch('/api/v1/getProgramsList')
  }

  async updateProgram(program: TonelloProgram): Promise<TonelloResponse<void>> {
    return await this.fetch('/api/v1/putProgram', {
      method: 'POST',
      body: { program },
    })
  }

  async submitBatch(batch: TonelloBatch): Promise<TonelloResponse<void>> {
    return await this.fetch('/api/v1/putBatch', {
      method: 'POST',
      body: { batch },
    })
  }

  async deleteBatch(code: string): Promise<TonelloResponse<void>> {
    return await this.fetch('/api/v1/deleteBatch', {
      method: 'POST',
      body: { batch: { code } },
    })
  }
}
