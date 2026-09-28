import { useMemo } from 'react'
import type { SmartSelectOption } from '@/components/ui/smart-select'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'

export function useVehicleOwnerOptions() {
  const customers = useCustomers({
    search: '',
    type: 'all',
    page: 1,
    pageSize: 100,
  })

  const options = useMemo<SmartSelectOption[]>(
    () =>
      (customers.data?.data ?? []).map((customer) => ({
        value: customer.id,
        label: `${customerDisplayName(customer)} · ${customer.documentNumber}`,
        searchTerms: [
          customer.documentNumber,
          customer.phone,
          customerDisplayName(customer),
        ],
      })),
    [customers.data],
  )

  return {
    options,
    isPending: customers.isPending,
    isError: customers.isError,
    refetch: customers.refetch,
  }
}
