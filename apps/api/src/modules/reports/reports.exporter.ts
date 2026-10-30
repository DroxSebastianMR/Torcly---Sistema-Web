import ExcelJS from 'exceljs'
import type { ReportBlockData, ReportPeriod } from './reports.types.js'

const workbookTitle = 'Reporte Torcly'
const headerFill = 'EAF2EE'
const headerColor = '53685F'

function addHeading(
  sheet: ExcelJS.Worksheet,
  title: string,
  period: ReportPeriod,
  generatedAt: string,
) {
  sheet.addRow([workbookTitle])
  sheet.addRow([title])
  sheet.addRow([`Período: ${period.from} a ${period.to}`])
  sheet.addRow([`Generado: ${new Date(generatedAt).toLocaleString('es-PE')}`])
  sheet.addRow([])
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: '0F3B2E' } }
  sheet.getCell('A2').font = { bold: true, size: 13 }
}

function addTable(
  sheet: ExcelJS.Worksheet,
  name: string,
  columns: string[],
  rows: Array<Array<string | number>>,
) {
  const startRow = sheet.rowCount + 1
  if (rows.length > 0) {
    sheet.addTable({
      name,
      ref: `A${startRow}`,
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: columns.map((name) => ({ name })),
      rows,
    })
  } else {
    sheet.addRow(columns)
  }
  const header = sheet.getRow(startRow)
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: headerColor } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerFill },
    }
  })
  sheet.columns.forEach((column) => {
    column.width = Math.min(42, Math.max(14, Number(column.width ?? 14)))
  })
}

function addBlockSheet(workbook: ExcelJS.Workbook, data: ReportBlockData) {
  const sheet = workbook.addWorksheet(data.descriptor.label.slice(0, 31))
  addHeading(sheet, data.descriptor.label, data.period, data.generatedAt)

  switch (data.block) {
    case 'sales':
      addTable(
        sheet,
        'SalesTrend',
        ['Período', 'Ventas confirmadas', 'Importe'],
        data.trend.map((point) => [point.label, point.count, point.amount]),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'SalesComposition',
        ['Tipo', 'Código', 'Descripción', 'Cantidad', 'Importe'],
        data.composition.map((row) => [
          row.type === 'PRODUCT' ? 'Producto' : 'Servicio',
          row.code,
          row.name,
          row.quantity,
          row.amount,
        ]),
      )
      break
    case 'payments':
      addTable(
        sheet,
        'PaymentsTrend',
        ['Período', 'Pagos', 'Compensaciones', 'Neto'],
        data.trend.map((point) => [
          point.label,
          point.grossCollected,
          point.compensated,
          point.netCollected,
        ]),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'PaymentStatuses',
        ['Estado', 'Ventas', 'Saldo'],
        Object.entries(data.metrics.byStatus).map(([status, value]) => [
          status,
          value.count,
          value.amount,
        ]),
      )
      break
    case 'inventory':
      addTable(
        sheet,
        'InventoryTrend',
        [
          'Período',
          'Inicial',
          'Entradas',
          'Salidas',
          'Ajustes ingreso',
          'Ajustes egreso',
          'Neto',
        ],
        data.trend.map((point) => [
          point.label,
          point.initial,
          point.entry,
          point.exit,
          point.adjustmentIn,
          point.adjustmentOut,
          point.amount,
        ]),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'LowStock',
        ['Código', 'Producto', 'Stock', 'Mínimo', 'Unidad'],
        data.lowStock.map((row) => [
          row.code,
          row.name,
          row.stock,
          row.minimumStock,
          row.unitLabel,
        ]),
      )
      break
    case 'services':
      addTable(
        sheet,
        'ServicesTrend',
        ['Período', 'Unidades', 'Importe'],
        data.trend.map((point) => [point.label, point.count, point.amount]),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'TopServices',
        ['Código', 'Servicio', 'Cantidad', 'Importe'],
        data.top.map((row) => [row.code, row.name, row.quantity, row.amount]),
      )
      break
    case 'workshop':
      addTable(
        sheet,
        'WorkshopTrend',
        ['Período', 'Órdenes creadas', 'Entregadas'],
        data.trend.map((point) => [
          point.label,
          point.ordersCreated,
          point.delivered,
        ]),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'WorkshopStatuses',
        ['Estado de orden', 'Cantidad'],
        Object.entries(data.metrics.workOrdersByStatus),
      )
      sheet.addRow([])
      addTable(
        sheet,
        'AppointmentStatuses',
        ['Estado de cita', 'Cantidad'],
        Object.entries(data.metrics.appointmentsByStatus),
      )
      break
  }
  sheet.views = [{ state: 'frozen', ySplit: 5 }]
}

export async function createReportsWorkbook({
  period,
  generatedAt,
  blocks,
}: {
  period: ReportPeriod
  generatedAt: string
  blocks: ReportBlockData[]
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Torcly'
  workbook.created = new Date(generatedAt)
  workbook.subject = `Reportes ${period.from} a ${period.to}`

  const summary = workbook.addWorksheet('Resumen')
  addHeading(summary, 'Resumen de reportes', period, generatedAt)
  addTable(
    summary,
    'ReportSummary',
    ['Bloque', 'Fuente', 'Criterio'],
    blocks.map((block) => [
      block.descriptor.label,
      block.descriptor.source,
      block.descriptor.criteria,
    ]),
  )
  summary.views = [{ state: 'frozen', ySplit: 5 }]
  for (const block of blocks) addBlockSheet(workbook, block)

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
