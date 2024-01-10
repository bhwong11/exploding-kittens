'use client'

import React,{useState} from "react"
import { useTurns } from "@/lib/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {updateUserByUsername} from "@/api"
import { usePlayerContext } from "@/context/players"
import LeaderBoardList from "@/app/(components)/LeaderBoardList"
import { useRouter } from "next/navigation"
import { apolloClient, UPDATE_USER } from "@/graphql"

const WinnerSave = ()=>{
  const [open,setOpen] = useState(true)
  const queryClient = useQueryClient()

  const {currentPlayer} = usePlayerContext() ||{}

  const router = useRouter()

  const {error,isPending,isSuccess, mutate} = useMutation({
    mutationFn: async ({username,updateUserInput}:UpdateUserByUsernameProps)=> {
      await apolloClient.mutate({
        mutation:UPDATE_USER,
        variables: {
          username,
          updateUserInput
        },
      })      
    },
    onSuccess:()=>{
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // queryClient.setQueryData(['users'],(oldData) => {
      //   return
      // })
    }
  })

  const {winner} = useTurns()

  if(!(winner && currentPlayer?.username ===winner.username)) return null

  return (
    <>
    {(
      <div>
        <button className="btn btn-blue" onClick={()=>setOpen(true)}>
          open
        </button>
      </div>
    )}
  
    {open && (
      <div className="relative z-10" aria-hidden="true" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="flex flex-col items-center rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <button 
                type="button" 
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                onClick={()=>setOpen(false)}
              >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
              </button>
              <h2>Congrats, you're the winner: {currentPlayer?.username}</h2>
              <button className="btn btn-blue" onClick={()=>mutate(
                {
                  username:winner?.username,
                  updateUserInput:{
                    wins:(currentPlayer?.wins ?? 0) +1
                  }
                }
            )}>
                {isPending?"saving...":"save score"}
              </button>
              {error && (
                <div className="bg-red-500">
                  {error.message ?? 'something went wrong, try again later'}
                </div>
              )}

              <button className="btn btn-blue" onClick={()=>router.push('/')}>
                back to home page
              </button>

              {isSuccess && (
                <LeaderBoardList truncateTopUsers={1}/>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  )

}

export default WinnerSave