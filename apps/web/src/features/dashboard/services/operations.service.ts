import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  Attention,
  OperationalSection,
  Period,
  Summary,
} from '../types/operations.types'

const query = (period: Period) =>
  new URLSearchParams(
    Object.entries(period).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString()
export const operationsService = {
  summary: (period: Period, signal?: AbortSignal) =>
    api.get<Summary>(
      `${endpoints.operations.summary}?${query(period)}`,
      signal,
    ),
  attention: (
    section: OperationalSection,
    period: Period,
    signal?: AbortSignal,
  ) =>
    api.get<Attention>(
      `${endpoints.operations.attention(section)}?${query(period)}`,
      signal,
    ),
}
