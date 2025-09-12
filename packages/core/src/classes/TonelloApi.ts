import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import type {
  TConfiguration,
  TFunctionBody,
  TInputOutputList,
  TProgram,
  TProgramList,
  TResponse,
} from '../types/tonello.ts'

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

  async fetchProgramList(): Promise<TResponse<TProgramList>> {
    return await this.fetch('/api/v1/getProgramsList')
  }

  async fetchFunctions(): Promise<TResponse<TFunctionBody>> {
    return await this.fetch('/api/v1/getFunctions')
  }

  async fetchInputOutputList(): Promise<TResponse<TInputOutputList>> {
    return await this.fetch('/api/v1/getInputOutputList')
  }

  async fetchConfiguration(): Promise<TResponse<TConfiguration>> {
    return await this.fetch('/api/v1/getConfiguration')
  }

  async getProgram(code: string | number): Promise<TResponse<TProgram>> {
    return await this.fetch('/api/v1/getProgram', { query: { code } })
  }

  async getProgramsList(): Promise<TResponse<TProgramList>> {
    return await this.fetch('/api/v1/getProgramsList')
  }

  async updateProgram(program: TProgram): Promise<TResponse<void>> {
    return await this.fetch('/api/v1/putProgram', {
      method: 'POST',
      body: { program },
    })
  }
}
