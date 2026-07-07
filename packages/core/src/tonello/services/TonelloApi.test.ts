import { expect, test, vi, describe } from 'vitest'
import { TonelloApi } from './TonelloApi'
import { TonelloDatetimeResponse, TonelloResponse } from '../..'

type PublicInterface<T> = { [K in keyof T]: T[K] };
type TonelloApiMock = PublicInterface<TonelloApi> & { fetch: ReturnType<typeof vi.fn> }

const createOkResponse = <T>(data: T): TonelloResponse<T> => ({
  result: {
    status: 'success',
    code: 200,
    message: 'OK',
  },
  data,
})

const mockTonelloApi = (): TonelloApiMock => {
  const api = new TonelloApi('http://localhost:8080') as unknown as TonelloApiMock
  api.fetch = vi.fn()
  return api
}

test('getDatetime', async () => {
  const api = mockTonelloApi()
  const dateTimeString = '2024-06-10T10:50:00+06:00'

  api.fetch.mockResolvedValue(createOkResponse<TonelloDatetimeResponse>({
    dateTime: dateTimeString,
  }))

  const result = await api.fetchDatetime()

  expect(result.date.getTime()).toBe(new Date(dateTimeString).getTime())
  expect(result.tzOffset).toBe(-360)
})

describe('updateDatetime', () => {
  test('with explicit tzOffset', async () => {
    const api = mockTonelloApi()
    const dateTimeString = '2024-06-10T10:50:00+06:00'
    const tzOffset = -360

    await api.updateDatetime(new Date(dateTimeString), tzOffset)

    expect(api.fetch).toHaveBeenCalledWith('/api/v1/setDateTime', {
      method: 'GET',
      query: { date: '2024-06-10', time: '10:50:00' },
    })
  })

  test('without explicit tzOffset', async () => {
    const api = mockTonelloApi()
    const dateTimeString = '2025-10-12T15:30:00-04:00'

    // updateDatetime will call fetchDatetime to get the tzOffset, so we need to mock that response first
    api.fetch.mockResolvedValueOnce(createOkResponse<TonelloDatetimeResponse>({
      dateTime: dateTimeString,
    }))

    await api.updateDatetime(new Date(dateTimeString))

    expect(api.fetch).toHaveBeenCalledWith('/api/v1/setDateTime', {
      method: 'GET',
      query: { date: '2025-10-12', time: '15:30:00' },
    })
  })

  test('UTC', async () => {
    const api = mockTonelloApi()
    const dateTimeString = '2025-10-12T15:30:00Z'

    // updateDatetime will call fetchDatetime to get the tzOffset, so we need to mock that response first
    api.fetch.mockResolvedValueOnce(createOkResponse<TonelloDatetimeResponse>({
      dateTime: dateTimeString,
    }))

    await api.updateDatetime(new Date(dateTimeString))

    expect(api.fetch).toHaveBeenCalledWith('/api/v1/setDateTime', {
      method: 'GET',
      query: { date: '2025-10-12', time: '15:30:00' },
    })
  })

})
