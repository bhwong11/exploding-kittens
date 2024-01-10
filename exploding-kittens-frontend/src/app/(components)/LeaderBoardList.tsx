'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apolloClient, GET_USER_WITH_RANKINGS, UPDATE_USER } from "@/graphql"
import { useRef } from "react"
import { isDevMode } from "@/lib/helpers"
import { reactQueryCacheKeys } from "@/data"

type LeaderBoardListProps = {
  truncateTopUsers?:number
}
const LeaderBoardList = ({truncateTopUsers}:LeaderBoardListProps)=>{

  const usernameRef = useRef('')
  const scoreRef = useRef(0)

  const queryClient = useQueryClient()

  const {mutate} = useMutation({
    mutationFn: async ({username,updateUserInput}:UpdateUserByUsernameProps)=> {
      const response = await apolloClient.mutate({
        mutation:UPDATE_USER,
        variables: {
          username,
          updateUserInput
        },
      })      
      return response?.data?.updateUser
    },
    onSuccess:(data)=>{
      queryClient.setQueryData([reactQueryCacheKeys.users],(oldData:usersWithRankingCache) => {
        if(!data){
          return oldData
        }
        return {
          ...oldData,
          results: oldData?.results.map(oldUser=>oldUser.username === data.username ?({
              ...oldUser,
              ...data
            }):oldUser)
        }
      })
    }
  })

  const {data,isLoading,isError,error, refetch} = useQuery({
    queryKey:[reactQueryCacheKeys.users],
    queryFn:async ()=>{
      const response = await apolloClient.query({
        query:GET_USER_WITH_RANKINGS
      })
      return response?.data?.getUsersWithRanking
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
        ?.results
        ?.slice(0,(truncateTopUsers || data?.length))
        .map((user:User)=>(
        <div key={user.username} className="border border-black">
          User Stats:
          <div>username: {user.username}</div>
          <div>wins:{user.wins}</div>
          <div>ranking: {user.ranking}</div>
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

      {/* This is for testing mutatation quickly */}
      { isDevMode && 
      <div>
        <label htmlFor="username-dev-mode-update">username</label>
        <input
          id="username-dev-mode-update"
          onChange={(e)=>usernameRef.current=e.target.value}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <label htmlFor="score-dev-mode-update">score</label>
        <input
          id="score-dev-mode-update"
          type="number"
          onChange={(e)=>scoreRef.current=parseInt(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button className="btn btn-blue" onClick={()=>{
            mutate({
              username:usernameRef.current,
              updateUserInput:{
                wins:scoreRef.current
              }
            })
          }}>
            manual update user score
          </button>
        </div>
        }
    </div>
  )

}

export default LeaderBoardList