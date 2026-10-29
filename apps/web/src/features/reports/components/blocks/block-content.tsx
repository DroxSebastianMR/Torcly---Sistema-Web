import type { BlockData } from '../../types/reports.types'
import { InventoryBlockContent } from './inventory-block'
import { PaymentsBlockContent } from './payments-block'
import { SalesBlockContent } from './sales-block'
import { ServicesBlockContent } from './services-block'
import { WorkshopBlockContent } from './workshop-block'

export function BlockContent({ data }: { data: BlockData }) {
  switch (data.block) {
    case 'sales':
      return <SalesBlockContent data={data} />
    case 'payments':
      return <PaymentsBlockContent data={data} />
    case 'inventory':
      return <InventoryBlockContent data={data} />
    case 'services':
      return <ServicesBlockContent data={data} />
    case 'workshop':
      return <WorkshopBlockContent data={data} />
  }
}
