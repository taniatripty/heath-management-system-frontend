import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import ScheduleTable from "@/components/module/Admin/ScheduleManagement/ScheduleTable"
import { getSchedules } from "@/services/schedule.services"

const ScheduleManagementPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const params = await searchParams
  const queryString = Object.entries(params)
    .flatMap(([key, value]) => {
      if (value === undefined) {
        return []
      }

      const values = Array.isArray(value) ? value : [value]
      return values.map(
        (item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`,
      )
    })
    .join("&")
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["schedules", queryString],
    queryFn: () => getSchedules(queryString),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScheduleTable initialQueryString={queryString} />
    </HydrationBoundary>
  )
}

export default ScheduleManagementPage
