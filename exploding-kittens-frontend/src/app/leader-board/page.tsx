import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import LeaderBoardList from '@/app/(components)/LeaderBoardList'
import { getAllUsersWithRanking } from '@/api'


const LeaderBoard = async ()=>{

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey:['users'],
    queryFn:getAllUsersWithRanking,
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