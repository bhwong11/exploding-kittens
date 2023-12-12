import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"
import { actionTypes, cardTypes,responseActionsTypes } from "@/data"
import { useState, useMemo } from "react"
import { addCardsToHand, removeCardsFromHand } from "@/lib/helpers"

export const useGameActions = ()=>{
  const { deck,socket,discardPile,currentActions} = useGameStateContext() || {}
  const {players,currentPlayer}= usePlayerContext() || {}
  const playerCards = players?.find(player=>player.username===currentPlayer?.username)?.cards

  const getPlayerCurrentHand = (playerUsername:string)=>{
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

  const addToDiscard = (cards:Card[])=>{
    socket?.emit('discard-pile',[...(discardPile??[]),...cards])
  }
  
  const drawCard = (playerUsername:string) =>{
    if(deck){
      const newCard = deck[deck.length-1]
      setPlayerHand(
        [ ...getPlayerCurrentHand(playerUsername),newCard]
        ,playerUsername
      )
      const newDeck = deck.slice(0,deck.length-1)
      socket?.emit('deck',newDeck)
      return newCard
    }
  }

  //can remove single card based on id or types, as well as cards
  const discardCards = (cards?:Card[],cardId?:number | null,cardType?:CardType | null)=>{
    if(!cardId && !cardType && !cards) {
      console.error('discard card function failed with missing both cardId and cardType args')
      return
    }

    const player = players?.find(player=>player.username===currentPlayer?.username)

    const discardedCards = player?.cards?.filter(card=>{
      //cardId is the prioritized arg
      const cardInputIds = cards?.map(c=>c.id) ?? []
      return cardInputIds.includes(card.id)
      || card.id===cardId
      || cardType===card.type
    }) ?? []

    const playerNewCards = player?.cards?.filter(
      card=>!discardedCards?.map(c=>c.id).includes(card.id)
    )

    if(!playerNewCards || !currentPlayer?.username){
      console.error('discard card function failed with missing new cards and currentPlayer.username')
      return
    }
    setPlayerHand(playerNewCards ,currentPlayer?.username)
    addToDiscard(discardedCards)
  }

  const singleCardActionRequirements = {
    [actionTypes.nope]:()=>(
      ((currentActions?.length ?? 0)>0 
      && currentActions?.[(currentActions?.length ?? 1)-1] !== actionTypes.exploding
      && currentActions?.[(currentActions?.length ?? 1)-1] !== actionTypes.diffuse)
      ?? false
    ),
    [actionTypes.diffuse]:()=>(
      currentActions?.includes(actionTypes.exploding) ?? false
    ),
  }

  const multiCardActionRequirements:{[key:number]:Function} = {
    2:(selectedCards:Card[])=>(
      selectedCards.length===2 && new Set(selectedCards.map(c=>c.type)).size === 1
    ),
    3:(selectedCards:Card[])=>(
      selectedCards.length===3 && new Set(selectedCards.map(c=>c.type)).size === 1
    ),
  }

  const isActionValidFromCards=(selectedCards:Card[])=>{
    if(!selectedCards.length) return false

    if(selectedCards.length===1){
      const cardInActions = Object.values(actionTypes).find(aType=>aType===selectedCards[0]?.type)
      if(!cardInActions)return false

      const singleCardActionType = Object.keys(singleCardActionRequirements)
      .find(aType=>aType===selectedCards[0].type) as keyof typeof singleCardActionRequirements
      
      if(singleCardActionType){
        return singleCardActionRequirements[singleCardActionType]()
      }
    }

    if(selectedCards.length>1){
      if(multiCardActionRequirements[selectedCards.length]){
        return multiCardActionRequirements[selectedCards.length](selectedCards)
      }
    }
    return true
  }


  const validResponseCards = useMemo(()=>playerCards?.filter(card=>(
    responseActionsTypes.includes(card.type as typeof responseActionsTypes[number])
    && isActionValidFromCards([card])
  )) ?? [],[playerCards?.length, isActionValidFromCards])

  const actions  = {
    drawCard,
    setPlayerHand,
    getPlayerCurrentHand,
    discardCards,
    isActionValidFromCards,
    validResponseCards
  }

  return actions
}


//probably should seperate each impl into it's own file eventually
export const useCardActions = ()=>{
  const { 
    deck,
    socket,
    turnCount,
    setCurrentActions,
    setActionPrompt,
    setAttackTurns,
    setTurnCount
  } = useGameStateContext() || {}
  const {players,currentPlayer} = usePlayerContext() || {}
  const [actionsComplete,setActionsComplete]=useState<number>(0)
  const turnPlayer = players?.[(turnCount??0) % (players?.length ?? 1)]

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

  const favorAction = ()=>{
    if(setActionPrompt) {
      setActionPrompt([
          {
            text:'Choose a player to steal a card from',
            options:{
              username:[...players
              ?.filter(p=>p.username!==currentPlayer?.username)
              ?.map(p=>({
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
            text:'Choose a card to give away',
            options:{},
            submitCallBack:(formData:FormData)=>{
              const cardType = formData.get('card')

              const currentPlayerIndex = players?.findIndex(p=>p.username==currentPlayer?.username) ?? 0

              const newCard = players?.[currentPlayerIndex]
                ?.cards
                ?.find(c=>c.type===cardType)
              
              removeCardsFromHand(socket,[...(newCard?[newCard]:[])],currentPlayer?.username,players)
              addCardsToHand(socket,[...(newCard?[newCard]:[])],turnPlayer?.username,players)

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
    setActionsComplete,
  }
}