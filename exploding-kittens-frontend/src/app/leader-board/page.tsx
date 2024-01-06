import { dehydrate, HydrationBoundary, QueryClient, useQuery } from '@tanstack/react-query'
import LeaderBoardList from '@/app/leader-board/list'
import HydrateWrapper from '@/app/hydrations/hydrate-client'


const LeaderBoard = async ()=>{

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey:['users'],
    queryFn:()=>fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}users/`).then(data=>data.json())
  })


  const dehydratedState = dehydrate(queryClient)
  console.log('DEHYRDARTWD',JSON.stringify(dehydratedState))

  return (
  <HydrationBoundary state={JSON.parse(JSON.stringify(dehydratedState))}>
    <LeaderBoardList/>
  </HydrationBoundary>
  //<LeaderBoardList/>
  )
}

export default LeaderBoard