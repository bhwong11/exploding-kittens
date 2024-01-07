'use client'

import { useQuery } from "@tanstack/react-query"
import { getAllUsersWithRanking } from "@/api"

type LeaderBoardListProps = {
  truncateTopUsers?:number
}
const LeaderBoardList = ({truncateTopUsers}:LeaderBoardListProps)=>{

  const {data,isLoading,isError,error, refetch} = useQuery({
    queryKey:['users'],
    queryFn:getAllUsersWithRanking,
    staleTime: 1000 * 60,
    retry:2,
    // refetch every 5 minutes
    refetchInterval:1000 * 60 * 5
  })

  if(isError){
    return <>error {JSON.stringify(error?.message)}</>
  }

  if(isLoading){
    return <>loading...</>
  }

  return (
    <div>
      {data
        ?.results
        ?.slice(0,(truncateTopUsers || data.length))
        .map((user:User)=>(
        <div key={user.username}>
          USER!!
          {JSON.stringify(user)}
        </div>
      ))}

      <div>
        <button className="btn btn-blue" onClick={()=>{
          //manually refetch, bypasses cache
          refetch()
        }}>
          get latest top scores
        </button>
      </div>
    </div>
  )

}

export default LeaderBoardList