import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import LeaderBoardList from '@/app/(components)/LeaderBoardList'
import { apolloClient, GET_USER_WITH_RANKINGS } from "@/graphql"

export const dynamic = 'force-dynamic'

const LeaderBoard = async ()=>{

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey:['users'],
    queryFn:async ()=>{
      const response = await apolloClient.query({
        query:GET_USER_WITH_RANKINGS,
        fetchPolicy: "no-cache" 
      })
      return response?.data?.getUsersWithRanking
    },
    gcTime:0,
    staleTime:0
  })


  const dehydratedState = dehydrate(queryClient)

  return (
    <>
    <HydrationBoundary state={dehydratedState}>
      <LeaderBoardList/>
    </HydrationBoundary>
    </>
  )
}

export default LeaderBoard