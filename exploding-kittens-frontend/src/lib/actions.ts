import { ActionPrompt } from "@/app/[roomNumber]/ActionPrompt"
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"
import { actionTypes, cardTypes } from "@/data"
import { useEffect, useRef, useState } from "react"

export const useGameActions = ()=>{
  const { deck,socket} = useGameStateContext() || {}
  const {players}= usePlayerContext() || {}

  const playerCurrentHand = (playerUsername:string)=>{
    return players?.find(p=>p.username === playerUsername)?.cards ?? []
  }

  const setPlayerHand = (cards:Card[],playerUsername:string)=>{
    const newPlayers = [...(players??[])]
    const currPlayerIndx = players?.findIndex(p=>p.username === playerUsername)
    if((currPlayerIndx || currPlayerIndx===0) && currPlayerIndx!==-1){
      newPlayers[currPlayerIndx].cards = cards
    }
    socket?.emit('all-players',newPlayers)
  }
  
  const drawCard = (playerUsername:string) =>{
    if(deck){
      const newCard = deck[deck.length-1]
      setPlayerHand(
        [ ...playerCurrentHand(playerUsername),newCard]
        ,playerUsername
      )
      const newDeck = deck.slice(0,deck.length-1)
      socket?.emit('deck',newDeck)
      return newCard
    }
  }

  const actions  = {
    drawCard,
    setPlayerHand,
    playerCurrentHand
  }

  return actions
}


export const useCardActions = ()=>{
  const { 
    deck,
    socket,
    turnCount,
    setCurrentActions,
    setActionPrompt,
    setAttackTurns,
    setTurnCount} = useGameStateContext() || {}
  const {players,currentPlayer} = usePlayerContext() || {}
  const [actionsComplete,setActionsComplete]=useState<number>(0)
  const turnPlayer = players?.[(turnCount??0) % (players?.length ?? 1)]
  
  const nopeAction = () =>{
    console.log('activate nope')
    if(setCurrentActions) setCurrentActions(prev=>prev.slice(0,prev.length-1))
    setActionsComplete(prev=>prev+1)
  }

  const diffuseAction = () =>{
    //only activate if turn player
    if(setCurrentActions) setCurrentActions(
      prev=>prev.filter(prev=>prev!==cardTypes.exploding.type)
    )
    setActionsComplete(prev=>prev+1)
    console.log('diffuse')
  }

  //this needs to be added on each submitCallBack to trigger the next event
  //or complete the event chain
  const submitResponseEvent = (
    showToUser:string,
    customOptions:ActionPromptData["options"]={},
    complete:boolean=false
  )=>{
    socket?.emit('next-action-response',{
      showToUser,
      ...(customOptions?{customOptions}:{}),
      complete
    })
  }

  const favorAction = ()=>{
    if(setActionPrompt) {
      setActionPrompt([
          {
            show:true,
            options:{
              username:[...players?.map(p=>({
                value:p.username,
                display:p.username
              }))??[]]
            },
            submitCallBack:(formData:FormData)=>{
              const playerSelected = formData?.get('username')?.toString()
              const customCardsOption = {
                card:players?.find(p=>p.username===playerSelected)?.cards?.map(c=>({
                  value:c.type,
                  display:`${c.type} - ${c.id}`
                })) ?? []
              }
              submitResponseEvent(playerSelected || '',customCardsOption)
            }
          },
          {
            show:true,
            options:{},
            submitCallBack:(formData:FormData)=>{
              const cardType = formData.get('card')

              const currentPlayerIndex = players?.findIndex(p=>p.username==currentPlayer?.username) ?? 0
              const turnPlayerIndex = players?.findIndex(p=>p.username==turnPlayer?.username) ?? 0

              const newCard = players?.[currentPlayerIndex]
                ?.cards
                ?.find(c=>c.type===cardType)

              const newCurrentPlayerHand = players?.[currentPlayerIndex]
                ?.cards.filter(c=>c.id!==newCard?.id) ?? []

              const newTurnPlayerHand = [
                ...players?.[turnPlayerIndex]?.cards ?? []
                ,...(newCard?[newCard]:[])
              ]
              
              const playersCopy = [...players ?? []]
              playersCopy[currentPlayerIndex].cards = newCurrentPlayerHand
              playersCopy[turnPlayerIndex].cards = newTurnPlayerHand

              socket?.emit('all-players',playersCopy)
              setActionPrompt(null)
              submitResponseEvent('',{},true)
              setActionsComplete(prev=>prev+1)
            }
          }
        ]
      )
    }
  }

  const seeTheFutureAction = ()=>{
    console.log('shuffle action')
    if(setActionPrompt) {
      setActionPrompt([
          {
            show:true,
            text:`${deck?.slice(deck.length-3).map(
              c=>`${c.type} - ${c.id}`
            ).join()}`,
            options:{},
            submitCallBack:()=>{
              setActionPrompt(null)
              submitResponseEvent('',{},true)
              setActionsComplete(prev=>prev+1)
            }
          },
        ]
      )
    }
  }

  const attackAction = ()=>{
    console.log('attack action')
    if(setAttackTurns)setAttackTurns(prev=>prev+1)
    if(setTurnCount)(setTurnCount(prev=>prev+1))
  }

  type ActionImpl =  {
    [key in Actions]: any
  }
  const actions:ActionImpl  = {
    //make this objects with an impl method
    [actionTypes.attack]:attackAction,
    [actionTypes.diffuse]:diffuseAction,
    [actionTypes.exploding]:()=>{
      console.log('exploding')
      setActionsComplete(prev=>prev+1)
    },
    [actionTypes.favor]:favorAction,
    [actionTypes.multiple2]:()=>null,
    [actionTypes.multiple3]:()=>null,
    [actionTypes.nope]:nopeAction,
    [actionTypes.seeTheFuture]:seeTheFutureAction,
    [actionTypes.shuffle]:()=>{
      console.log('shuffle')
      setActionsComplete(prev=>prev+1)
    },
    [actionTypes.skip]:()=>null,
  }

  return {
    actions,
    actionsComplete,
    setActionsComplete
  }
}