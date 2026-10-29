import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  BlockData,
  Period,
  ReportBlock,
  ReportSummary,
} from '../types/reports.types'

const query = (period: Period) =>
  new URLSearchParams(
    Object.entries(period).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString()

export const reportsService = {
  summary: (period: Period, signal?: AbortSignal) =>
    api.get<ReportSummary>(
      `${endpoints.reports.summary}?${query(period)}`,
      signal,
    ),
  block: (block: ReportBlock, period: Period, signal?: AbortSignal) =>
    api.get<BlockData>(
      `${endpoints.reports.block(block)}?${query(period)}`,
      signal,
    ),
}
