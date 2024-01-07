'use client'

import React,{ useEffect, useState } from "react"
import { usePlayerSocket, useTurns } from "@/lib/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {updateUserByUsername} from "@/api"
import { usePlayerContext } from "@/context/players"
import LeaderBoardList from "@/app/(components)/LeaderBoardList"

const WinnerSave = ()=>{
  const queryClient = useQueryClient()

  const {currentPlayer} = usePlayerContext() ||{}

  const {error,isPending,isSuccess, mutate} = useMutation({
    mutationFn: async ({username,updateData}:UpdateUserByUsernameProps)=> {
      if(!winner){
        throw new Error('no winner set')
      }
      if(currentPlayer?.username !== winner.username){
        throw new Error('current user is not winner ,sorry :(')
      }
      await updateUserByUsername({username,updateData})
    },
    onSuccess:()=>{
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  const {winner} = useTurns()

  return winner && currentPlayer?.username ===winner.username && (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
    
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="flex flex-col items-center rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <h2>Congrats, you're the winner: {currentPlayer?.username}</h2>
            <button className="btn btn-blue" onClick={()=>mutate(
              {
                username:winner?.username ?? 'test1',
                updateData:{
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

            {isSuccess && (
              <LeaderBoardList truncateTopUsers={1}/>
            )}
          </div>
        </div>
      </div>
    </div>
  
  )

}

export default WinnerSave