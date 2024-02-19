import { usePlayerSocket } from "@/lib/hooks"
import { usePlayerContext } from "@/context/players"
import { useState } from "react"

const ChooseOwner = ()=>{
  const { currentPlayerFromList, chooseOwner } = usePlayerSocket()
  const {players} = usePlayerContext() || {}

  const [open, setOpen] = useState(false)


  if(!currentPlayerFromList?.isOwner) return null

  return (
    <>
      {open && <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center items-center">
            <div className="flex flex-col items-center rounded-lg bg-white text-left shadow-xl transition-all my-8 w-full max-w-lg py-5 px-2">
            <button 
                type="button" 
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                onClick={()=>setOpen(false)}
              >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
              </button>
            
            <form className="flex flex-col w-fit" onSubmit={(e)=>{
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              setOpen(false)
              if(typeof formData.get('choose-owner-username') === 'string') {
                chooseOwner(formData.get('choose-owner-username') as string)
              }
            }}>

              <label htmlFor='choose-owner-username' className="font-semibold mb-1">
                choose owner:
              </label>
              <select id='choose-owner' name='choose-owner-username' className="mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                {players?.filter(player=>!player.isOwner)?.map(player=>(
                  <option 
                    key={`option-choose-owner-${player.username}`}
                    value={player.username}
                  >
                    {player.username}
                  </option>
                ))}
              </select>

              <button type="submit" className="btn btn-blue">Submit</button>
            </form>
            </div>
          </div>
        </div>
      </div>}

      <button className="btn btn-blue" onClick={()=>setOpen(true)}>
          choose new owner
      </button>
    </>
  )
}

export default ChooseOwner