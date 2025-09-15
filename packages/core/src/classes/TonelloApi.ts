import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import type {
  TonelloConfiguration,
  TonelloFunctionBody,
  TonelloInputOutputList,
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

  async fetchProgramList(): Promise<TonelloResponse<TonelloProgramList>> {
    return await this.fetch('/api/v1/getProgramsList')
  }

  async fetchFunctions(): Promise<TonelloResponse<TonelloFunctionBody>> {
    return await this.fetch('/api/v1/getFunctions')
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
}
