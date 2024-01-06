'use client'

import { useQuery } from "@tanstack/react-query"

const LeaderBoardList = ()=>{
  const {data,isLoading,isError} = useQuery({
    queryKey:['users'],
    queryFn:()=>fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}users/`).then(data=>data.json())
  })

  if(isLoading){
    return <>loading...</>
  }

  return (
    <div>
      {JSON.stringify(data)}
    </div>
  )

}

export default LeaderBoardList