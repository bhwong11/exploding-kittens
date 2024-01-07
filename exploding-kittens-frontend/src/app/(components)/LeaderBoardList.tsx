'use client'

import { useQuery } from "@tanstack/react-query"

type LeaderBoardListProps = {
  truncateTopUsers?:number
}
const LeaderBoardList = ({truncateTopUsers}:LeaderBoardListProps)=>{

  const {data,isLoading,isError,error, refetch} = useQuery({
    queryKey:['users'],
    queryFn:async ()=>{
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}users/`)
      const data = await response.json()
      if(response.status!==200){
        throw new Error(data?.message ?? 'error getting data')
      }
      return data
    },
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
        ?.slice(0,(truncateTopUsers || data.length))
        .map((user:User)=>(
        <div>
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