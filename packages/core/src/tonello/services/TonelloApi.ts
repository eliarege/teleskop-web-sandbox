import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import { format } from 'date-fns'
import type {
  TonelloAlarmListResponse,
  TonelloBatch,
  TonelloChemicalRequestResponse,
  TonelloConfiguration,
  TonelloDatetimeResponse,
  TonelloEvent,
  TonelloEventListResponse,
  TonelloFunction,
  TonelloInputOutputList,
  TonelloInputOutputValues,
  TonelloMachineStatus,
  TonelloProgram,
  TonelloProgramListResponse,
  TonelloProgramResponse,
  TonelloResponse,
} from '../tonello.types'

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

  async fetchIOValues(): Promise<TonelloInputOutputValues> {
    const response = await this.fetch<TonelloResponse<TonelloInputOutputValues>>('/api/v1/getInputOutput')
    return response.data
  }

  async fetchDatetime(timeout = 5000): Promise<TonelloDatetimeResponse> {
    const { data } = await this.fetch<TonelloResponse<TonelloDatetimeResponse>>('/api/v1/getDateTime', { timeout })
    return data
  }

  async updateDatetime(dateTime: Date): Promise<void> {
    const date = format(dateTime, 'yyyy-MM-dd')
    const time = format(dateTime, 'HH:mm:ss')
    await this.fetch('/api/v1/setDateTime', {
      body: { date, time },
    })
  }

  async fetchEvents(date: string, from: number): Promise<{ from: number, events: TonelloEvent[] }> {
    const response = await this.fetch<TonelloEventListResponse>(
      `/api/v1/getEvents?date=${date}&from=${from}`,
    )
    const eventsDTO = response.eventsList.events
    const events = eventsDTO.map((eventDTO) => {
      const { datetime, ...rest } = eventDTO
      return {
        ...rest,
        datetime: new Date(datetime),
        rawDatetime: datetime,
      } as TonelloEvent
    })
    return {
      from: response.eventsList.from,
      events,
    }
  }

  async fetchLastEvent(): Promise<TonelloEvent> {
    const response = await this.fetch<TonelloResponse<TonelloEvent>>('/api/v1/getLastEvent')
    return response.data
  }

  async fetchFunctions(): Promise<TonelloFunction[]> {
    const { data } = await this.fetch<TonelloResponse<TonelloFunction[]>>('/api/v1/getFunctions')
    return data
  }

  // Bug on Tonello side, status may return `null`, add it just in case
  async fetchStatus(): Promise<TonelloMachineStatus | null> {
    const { data } = await this.fetch<TonelloResponse<TonelloMachineStatus>>('/api/v1/getStatus')
    return data
  }

  async fetchInputOutputList(): Promise<TonelloInputOutputList> {
    const { data } = await this.fetch<TonelloResponse<TonelloInputOutputList>>('/api/v1/getInputOutputList')
    return data
  }

  async fetchConfiguration(): Promise<TonelloConfiguration> {
    const { data } = await this.fetch<TonelloResponse<TonelloConfiguration>>('/api/v1/getConfiguration')
    return data
  }

  async fetchAlarmsList(): Promise<TonelloAlarmListResponse> {
    const { data } = await this.fetch<TonelloResponse<TonelloAlarmListResponse>>('/api/v1/getAlarmsList')
    return data
  }

  async fetchProgram(code: string | number): Promise<TonelloProgram> {
    const response = await this.fetch<TonelloResponse<TonelloProgramResponse>>('/api/v1/getProgram', { query: { code } })
    return response.data.program
  }

  async fetchProgramList(): Promise<TonelloProgram[]> {
    const response = await this.fetch<TonelloProgramListResponse>('/api/v1/getProgramsList')
    return response.programs
  }

  async updateProgram(program: TonelloProgram): Promise<void> {
    await this.fetch('/api/v1/putProgram', {
      method: 'POST',
      body: { program },
    })
  }

  async submitBatch(batch: TonelloBatch): Promise<void> {
    await this.fetch('/api/v1/putBatch', {
      method: 'POST',
      body: { batch },
    })
  }

  async submitChemicalRequestStatus(response: TonelloChemicalRequestResponse): Promise<void> {
    await this.fetch('/api/v1/putChemicalRequestStatus', {
      method: 'POST',
      body: {
        requestStatus: {
          ...response,
          datetime: response.rawDatetime,
          rawDatetime: undefined,
        },
      },
    })
  }

  async deleteBatch(code: string): Promise<void> {
    await this.fetch('/api/v1/deleteBatch', {
      method: 'POST',
      body: { batch: { code } },
    })
  }
}
