import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import { format } from 'date-fns'
import type {
  TonelloBatch,
  TonelloConfiguration,
  TonelloFunction,
  TonelloInputOutputList,
  TonelloMachineStatus,
  TonelloProgram,
  TonelloProgramList,
  TonelloResponse,
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

  async fetchDatetime(): Promise<TonelloResponse<{ dateTime: string }>> {
    return await this.fetch('/api/v1/getDateTime')
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

  async getProgram(code: string | number): Promise<TonelloResponse<TonelloProgram>> {
    return await this.fetch('/api/v1/getProgram', { query: { code } })
  }

  async getProgramsList(): Promise<TonelloResponse<TonelloProgramList>> {
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
