import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"
import { actionTypes, cardTypes,responseActionsTypes, actionWithPrompts } from "@/data"
import { useMemo} from "react"
import { addCardsToHand, getNonLostPlayers, removeCardsFromHand, shuffleArray } from "@/lib/helpers"
import { useAsyncEmitSocketEvent } from "@/lib/hooks"

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
    console.log('set player hand',newPlayers)
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
    responseActionsTypes.includes(card?.type as typeof responseActionsTypes[number])
    && isActionValidFromCards([card])
  )) ?? [],[playerCards?.length, isActionValidFromCards])

  const allowedUserActionsRestrictions = {
    [actionTypes.exploding]:currentPlayer?.username?[currentPlayer.username]:[],
    [actionTypes.diffuse]:[]
  }

  const actions  = {
    drawCard,
    setPlayerHand,
    getPlayerCurrentHand,
    discardCards,
    addToDiscard,
    isActionValidFromCards,
    validResponseCards,
    allowedUserActionsRestrictions
  }

  return actions
}

//probably should seperate each impl into it's own file eventually
export const useCardActions = ()=>{
  const { 
    deck,
    discardPile,
    socket,
    turnCount,
    attackTurns,
    currentActions,
    setCurrentActions,
    setActionPrompt,
    setAttackTurns,
    setTurnCount,
    setDeck
  } = useGameStateContext() || {}
  const {players:allPlayers,currentPlayer,setPlayers} = usePlayerContext() || {}
  const {asyncEmit} = useAsyncEmitSocketEvent()
  const {discardCards,addToDiscard} = useGameActions()

  const players = getNonLostPlayers(allPlayers ?? [])
  const turnPlayer = players[(turnCount??0) % (players?.length ?? 1)]

  const sendActionComplete = (onlyTurnPlayer:boolean)=>{
    if(onlyTurnPlayer){
      if(turnPlayer.username===currentPlayer?.username){
        socket?.emit('action-complete')
      }
      return
    }
    socket?.emit('action-complete')
  }

  //this needs to be added on each submitCallBack to trigger the next event
  //or complete the event chain
  type SubmitResponseEventProps = {
    formData?:FormData,
    complete?:boolean,
  }
  const submitResponseEvent = ({
    formData,
    complete=false,
  }:SubmitResponseEventProps={})=>{

    const formObject = Object.fromEntries(formData?.entries() ?? []);
    socket?.emit('next-action-response',{
      formObject,
      complete,
    })
    if(complete && setActionPrompt) {
      setActionPrompt(null)
      sendActionComplete(false)
    }
  }

  const diffuseActionPrompts = [
    ()=>({
      showToUser:turnPlayer.username,
      text:'choose a position to put the card back in. 0 is on top',
      options:{
        ['deck-placement']:(deck ?? []).map((_,index)=>({
          value:index,
          display:index
        }))
      },
      submitCallBack:(formData:FormData)=>{
        const deckPlacement = formData?.get('deck-placement')?.toString()
        if(!deckPlacement){
          console.log('error: no deck placement found')
          return
        }
        if(!deck){
          console.log('error: deck not found')
          return
        }
        const discardedExploding = discardPile?.find(card=>card.type===actionTypes.exploding)
        if(!discardedExploding){
          console.log('error: no exploding card found')
          return
        }
        const newDeck = [...deck ?? []]
        newDeck.splice(deck.length - parseInt(deckPlacement),0,discardedExploding)
        socket?.emit('deck',newDeck)
        socket?.emit('discard-pile',discardPile?.filter(c=>c.id!==discardedExploding.id) || [])
        submitResponseEvent({complete:true})
      }
    }),
  ]

  const favorActionPrompts = [
    ()=>({
      showToUser:turnPlayer.username,
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
        submitResponseEvent({formData})
      }
    }),
    (previousAnswerObject?:{[key:string]: any})=>({
      showToUser:previousAnswerObject?.username,
      text:'Choose a card to give away',
      options:{
        card:players?.find(p=>p.username===previousAnswerObject?.username)?.cards?.map(c=>({
          value:c.type,
          display:`${c.type} - ${c.id}`
        })) ?? []
      },
      submitCallBack:(formData:FormData)=>{
        const cardType = formData.get('card')

        const currentPlayerIndex = players?.findIndex(p=>p.username==currentPlayer?.username)
        if(!currentPlayerIndex && currentPlayerIndex!==0){
          console.error('current player index not found')
          return
        }

        const newCard = players?.[currentPlayerIndex]
          ?.cards
          ?.find(c=>c.type===cardType)
        
        removeCardsFromHand(socket,[...(newCard?[newCard]:[])],currentPlayer?.username,players)
        addCardsToHand(socket,[...(newCard?[newCard]:[])],turnPlayer?.username,players)

        submitResponseEvent({complete:true})
      }
    })
  ]

  const multiple2ActionPrompts = [
    ()=>({
        showToUser:turnPlayer.username,
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
          const playerSelectedUsername = formData?.get('username')?.toString()
          const selectedPlayerIndex = players?.findIndex(p=>p.username==playerSelectedUsername)
          if(!selectedPlayerIndex && selectedPlayerIndex!==0){
            console.error('current player index not found')
            return
          }

          const cardsShuffled = shuffleArray(players?.[selectedPlayerIndex].cards ?? [])
          const newCard = cardsShuffled[0]
          
          removeCardsFromHand(socket,[...(newCard?[newCard]:[])],playerSelectedUsername,players)
          addCardsToHand(socket,[...(newCard?[newCard]:[])],turnPlayer?.username,players)
          
          submitResponseEvent({complete:true})
        }
      }),
    ]
  
  const multiple3ActionPrompts = [
    ()=>({
      showToUser:turnPlayer.username,
      text:'Choose a player to steal from and a card type',
      options:{
        username:[...players
        ?.filter(p=>p.username!==currentPlayer?.username)
        ?.map(p=>({
          value:p.username,
          display:p.username
        }))??[]],
        card:Object.values(cardTypes).map(card=>({
          value:card.type,
          display:card.type
        }))
      },
      submitCallBack:(formData:FormData)=>{
        const playerSelectedUsername = formData?.get('username')?.toString()
        const cardTypeSelected = formData?.get('card')?.toString()
        
        const newCard = players?.find(p=>p.username === playerSelectedUsername)
          ?.cards?.find(card=>card.type===cardTypeSelected)
        
        if(!newCard){
          submitResponseEvent({})
          return
        }

        removeCardsFromHand(socket,[...(newCard?[newCard]:[])],playerSelectedUsername,players)
        addCardsToHand(socket,[...(newCard?[newCard]:[])],turnPlayer?.username,players)
        
        submitResponseEvent({complete:true})
      }
    }),
    ()=>({
      showToUser:turnPlayer.username,
      text:'Card is Not Found',
      options:{},
      submitCallBack:()=>{
        submitResponseEvent({complete:true})
      }
    })
  ]

  const seeTheFutureActionPrompts = [
    ()=>({
      showToUser:turnPlayer.username,
      text:`the next 3 cards are: ${deck?.slice(deck.length-3).map(
        c=>`${c.type} - ${c.id}`
      ).join()}`,
      options:{},
      submitCallBack:()=>{
        submitResponseEvent({complete:true})
      }
    }),
  ]

  const nopeAction = async () =>{
    console.log('activate nope')
    await asyncEmit({
      eventName:'current-actions',
      trackedListenEvent:'current-actions',
      emitData:currentActions?.slice(0,currentActions.length-1) ?? [],
      eventDataCallBack: (data:Actions[])=>{if(setCurrentActions)setCurrentActions(data)},
      transitionCompletedCallback:()=>sendActionComplete(true)
    })
  }

  const diffuseAction = async () =>{
    console.log('diffuse')
    await asyncEmit({
      eventName:'current-actions',
      trackedListenEvent:'current-actions',
      emitData: currentActions?.filter(currentAction=>currentAction!==cardTypes.exploding.type) ?? [],
      eventDataCallBack: (data:Actions[])=>{
        if(setCurrentActions) setCurrentActions(data)
        if(setActionPrompt) setActionPrompt(diffuseActionPrompts)
      },
    })
  
  }

  const favorAction = async ()=>{
    console.log('favor')
    await asyncEmit({
      eventName:'action-prompt',
      trackedListenEvent:'action-prompt',
      emitData:actionTypes.favor,
      eventDataCallBack: (data:typeof actionWithPrompts[number])=>{
        if(!setActionPrompt) return
        setActionPrompt(actionPromptsData[data])
      },
    })
  }

  const multiple2Action = async ()=>{
    console.log('multiple 2')
    await asyncEmit({
      eventName:'action-prompt',
      trackedListenEvent:'action-prompt',
      emitData:actionTypes.multiple2,
      eventDataCallBack: (data:typeof actionWithPrompts[number])=>{
        if(!setActionPrompt) return
        setActionPrompt(actionPromptsData[data])
      },
    })
  }

  const multiple3Action = async ()=>{
    console.log('multiple 3')
    await asyncEmit({
      eventName:'action-prompt',
      trackedListenEvent:'action-prompt',
      emitData:actionTypes.multiple3,
      eventDataCallBack: (data:typeof actionWithPrompts[number])=>{
        if(!setActionPrompt) return
        setActionPrompt(actionPromptsData[data])
      },
    })
  }

  const seeTheFutureAction = async ()=>{
    console.log('see the future')
    await asyncEmit({
      eventName:'action-prompt',
      trackedListenEvent:'action-prompt',
      emitData:actionTypes.seeTheFuture,
      eventDataCallBack: (data:typeof actionWithPrompts[number])=>{
        if(!setActionPrompt) return
        setActionPrompt(actionPromptsData[data])
      },
    })
  }

  const attackAction = async ()=>{
    console.log('attack action')

    await asyncEmit({
      eventName:'attack-turns',
      trackedListenEvent:'attack-turns',
      emitData:(attackTurns??0)+1,
      eventDataCallBack: (data:number)=>{
        if(!setAttackTurns) return
        setAttackTurns(data)
      },
    })

    await asyncEmit({
      eventName:'turn-count',
      trackedListenEvent:'turn-count',
      emitData:(turnCount??0)+1,
      eventDataCallBack: (data:number)=>{
        if(!setTurnCount) return
        setTurnCount(data)
      },
      transitionCompletedCallback:()=>sendActionComplete(true)
    })
  }

  const explodingAction = async ()=>{
    console.log('exploding')
    const newPlayers = players?.map(player=>{
      if(player.username===turnPlayer?.username){
        return {
          ...player,
          cards:[],
          lose:true
        }
      }
      return player
    })
    const cardsToDiscard = turnPlayer?.cards
    console.log('new players',newPlayers)
    // discardCards(turnPlayer?.cards ?? [])
    await asyncEmit({
      eventName:'all-players',
      trackedListenEvent:'all-players',
      emitData:newPlayers,
      eventDataCallBack: (data:Player[])=>{
        if(!setPlayers) return
        setPlayers(data)
      },
      transitionCompletedCallback:()=>{
        console.log('transition complete',turnPlayer?.cards)
        //discardCards(turnPlayer?.cards ?? [])
        addToDiscard(cardsToDiscard)
        sendActionComplete(true)
      }
    })
  }

  const shuffleAction = async ()=>{
    console.log('shuffle')

    await asyncEmit({
      eventName:'deck',
      trackedListenEvent:'deck',
      emitData:shuffleArray(deck ?? []),
      eventDataCallBack: (data:Card[])=>{
        if(!setDeck) return
        setDeck(data)
      },
      transitionCompletedCallback:()=>sendActionComplete(true)
    })
  }

  const skip = async ()=>{
    console.log('skip')

    await asyncEmit({
      eventName:attackTurns?'attack-turns':'turn-count',
      trackedListenEvent:attackTurns?'attack-turns':'turn-count',
      emitData:((attackTurns || turnCount)??0)+1,
      eventDataCallBack: (data:number)=>{
        if(attackTurns){
          if(setAttackTurns) setAttackTurns(data)
        }else{
          if(setTurnCount) setTurnCount(data)
        }
      },
      transitionCompletedCallback:()=>sendActionComplete(true)
    })
  }

  type ActionImpls =  {
    [key in Actions]: ()=>Promise<void>
  }
  const actions:ActionImpls  = {
    //make this objects with an impl method
    [actionTypes.attack]:attackAction,
    [actionTypes.diffuse]:diffuseAction,
    [actionTypes.exploding]:explodingAction,
    [actionTypes.favor]:favorAction,
    [actionTypes.multiple2]:multiple2Action,
    [actionTypes.multiple3]:multiple3Action,
    [actionTypes.nope]:nopeAction,
    [actionTypes.seeTheFuture]:seeTheFutureAction,
    [actionTypes.shuffle]:shuffleAction,
    [actionTypes.skip]:skip,
  }



  type ActionPrompts ={
      [key in typeof actionWithPrompts[number]]:((previousAnswerObject?:{[key:string]: any})=>ActionPromptData)[]
  }

  const actionPromptsData: ActionPrompts = {
    [actionTypes.diffuse]:diffuseActionPrompts,
    [actionTypes.multiple2]:multiple2ActionPrompts,
    [actionTypes.multiple3]:multiple3ActionPrompts,
    [actionTypes.favor]:favorActionPrompts,
    [actionTypes.seeTheFuture]:seeTheFutureActionPrompts
  }


  return {
    actions,
    actionPromptsData
  }
}