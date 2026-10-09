// import DoctorTable from '@/components/module/Admin/DoctorManagement/DoctorTable'

// export default function DoctorManagementPage() {
//   return <DoctorTable />
// }


import { getDoctors } from "@/services/doctor.services";
import DoctorTable from "@/components/module/Admin/DoctorManagement/DoctorTable";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

const DoctorsManagementPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const queryParamsObjects = await searchParams;
  /*
  {
  searchTerm: "cardio",
  page: "1",
  limit: "10",
  gender: "MALE",
  "appointFee[gt]": "500",
}
  */
  // ?searchTerm=cardio&page=1&limit=10&gender=MALE&appointFee[gt]=500

  // const queryString = Object.keys(queryParamsObjects).map((key) => `${key}=${queryParamsObjects[key]}`).join("&");

  //if the value is an array, we need to convert it to multiple query params with the same key
  const queryString = Object.keys(queryParamsObjects)
    .map((key) => {
      const value = queryParamsObjects[key];
      if (value === undefined) {
        return "";
      }

      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
          .join("&");
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean)
    .join("&");

  const queryClient = new QueryClient();

  await queryClient.query({
    queryKey: ["doctors", queryString],
    queryFn: () => getDoctors(queryString),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorTable initialQueryString={queryString} />
    </HydrationBoundary>
  );
};

export default DoctorsManagementPage
