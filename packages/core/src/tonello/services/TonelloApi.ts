import type { $Fetch } from 'ofetch'
import { $fetch } from 'ofetch'
import { subMinutes } from 'date-fns'
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

const ISO_TIMEZONE_REGEX = /([+-]\d{2}):?(\d{2})$/

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

  async fetchDatetime(timeout = 5000): Promise<{ date: Date, tzOffset: number }> {
    const { data } = await this.fetch<TonelloResponse<TonelloDatetimeResponse>>('/api/v1/getDateTime', { timeout })
    // Tonello API returns ISO string with local timezone, can be directly parsed by Date constructor
    const date = new Date(data.dateTime)
    let tzOffset = 0
    if (ISO_TIMEZONE_REGEX.test(data.dateTime)) {
      const [, hours, minutes] = data.dateTime.match(ISO_TIMEZONE_REGEX)!
      // To conform to getTimezoneOffset() convention, we need to invert the sign of the offset
      tzOffset = -1 * (parseInt(hours) * 60 + parseInt(minutes))
    }
    return { date, tzOffset }
  }

  /**
   *
   * @param datetime Date to set on Tonello machine
   * @param tzOffset Minutes offset from UTC, if not provided will be fetched from Tonello API
   */
  async updateDatetime(datetime: Date, tzOffset?: number): Promise<void> {
    if (!tzOffset) {
      const dt = await this.fetchDatetime()
      tzOffset = dt.tzOffset
    }

    const adjusted = tzOffset ? subMinutes(datetime, tzOffset) : datetime
    const [date, time] = adjusted.toISOString().slice(0, -5).split('T')
    await this.fetch('/api/v1/setDateTime', {
      method: 'GET',
      query: { date, time },
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
