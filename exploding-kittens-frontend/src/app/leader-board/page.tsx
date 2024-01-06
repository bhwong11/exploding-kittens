import { dehydrate, HydrationBoundary, QueryClient, useQuery } from '@tanstack/react-query'
import LeaderBoardList from '@/app/(components)/LeaderBoardList'


const LeaderBoard = async ()=>{

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey:['users'],
    queryFn:()=>fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}users/`).then(data=>data.json())
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