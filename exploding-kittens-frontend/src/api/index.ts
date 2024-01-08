const getAllUsers = async ()=>{
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/`
  //only save cache for 10 sec for next server rendering
    ,{
      next: { revalidate: 10 },
    }
  )
  const data = await response.json()
  if(response.status!==200){
    throw new Error(data?.message ?? data?.error ?? 'error getting data')
  }
  return data
}

const getAllUsersWithRanking = async ()=>{
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/rankings/`
  //only save cache for 10 sec for next server rendering
    ,{
      next: { revalidate: 10 },
    }
  )
  const data = await response.json()
  if(response.status!==200){
    throw new Error(data?.message ?? data?.error ?? 'error getting data')
  }
  return data
}

//should probably seperate out password/username changes into their own request
const updateUserByUsername = async ({username,updateData={}}:UpdateUserByUsernameProps)=>{
  //add frontend authenication check
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/username/${username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...updateData
        }),
      })

  const data = await response.json()

  if(response.status!==200){
    throw new Error(data?.message ?? data?.error ?? 'error getting data')
  }

  return data
}

export {
  getAllUsers,
  updateUserByUsername,
  getAllUsersWithRanking
}