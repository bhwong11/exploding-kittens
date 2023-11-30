import { useGameStateContext } from "@/context/gameState"
import { actionTypes } from "@/data"

export const useActions = ()=>{
  const { setCurrentActions } = useGameStateContext() || {}
  
  const nopeAction = () =>{
    console.log('activate nope')
    if(setCurrentActions) setCurrentActions(prev=>prev.slice(0,prev.length-1))
  }

type ActionImpl =  {
    [key in Actions]: Function
  }
  const actions:ActionImpl  = {
    [actionTypes.attack]:()=>null,
    [actionTypes.diffuse]:()=>null,
    [actionTypes.exploding]:()=>null,
    [actionTypes.favor]:()=>null,
    [actionTypes.multiple2]:()=>null,
    [actionTypes.multiple3]:()=>null,
    [actionTypes.nope]:nopeAction,
    [actionTypes.seeTheFuture]:()=>null,
    [actionTypes.shuffle]:()=>{
      console.log('shuffle')
    },
    [actionTypes.skip]:()=>null,
  }

  return actions
}