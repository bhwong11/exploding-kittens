import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"
import { actionTypes, cardTypes } from "@/data"
import { useEffect, useRef } from "react"

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
  const { setCurrentActions,currentActions} = useGameStateContext() || {}
  const diffuseActionRef = useRef<boolean>(false)

  useEffect(()=>{
    if(diffuseActionRef.current){
      //set state action complete ++
    }
    //shouldn't listen for global state data
  },[currentActions?.length])
  
  const nopeAction = () =>{
    console.log('activate nope')
    if(setCurrentActions) setCurrentActions(prev=>prev.slice(0,prev.length-1))
  }

  const diffuseAction = () =>{
    console.log('activate diffuse')
    if(setCurrentActions) setCurrentActions(
      prev=>prev.filter(prev=>prev!==cardTypes.exploding.type)
    )
    diffuseActionRef.current = true
  }

type ActionImpl =  {
    [key in Actions]: Function
  }
  const actions:ActionImpl  = {
    //make this objects with an impl method
    [actionTypes.attack]:()=>null,
    [actionTypes.diffuse]:diffuseAction,
    [actionTypes.exploding]:()=>{
      console.log('exploding')
    },
    [actionTypes.favor]:()=>null,
    [actionTypes.multiple2]:()=>null,
    [actionTypes.multiple3]:()=>null,
    [actionTypes.nope]:nopeAction,
    [actionTypes.seeTheFuture]:()=>null,
    [actionTypes.shuffle]:()=>{
      console.log('shuffle')
    },
    [actionTypes.skip]:()=>null
  }

  return actions
}