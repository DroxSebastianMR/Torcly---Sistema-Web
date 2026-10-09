import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reports.service'
import type { Period, ReportBlock } from '../types/reports.types'

export const reportKeys = {
  summary: (period: Period) => ['reports', 'summary', period] as const,
  block: (block: ReportBlock, period: Period) =>
    ['reports', 'block', block, period] as const,
}

export const useReportSummary = (period: Period) =>
  useQuery({
    queryKey: reportKeys.summary(period),
    queryFn: ({ signal }) => reportsService.summary(period, signal),
  })

export const useReportBlock = (block: ReportBlock, period: Period) =>
  useQuery({
    queryKey: reportKeys.block(block, period),
    queryFn: ({ signal }) => reportsService.block(block, period, signal),
  })
