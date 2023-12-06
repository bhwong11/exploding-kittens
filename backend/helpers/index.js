export const generateRoutes = (routesPathMap,app)=>{
  Object.entries(routesPathMap).forEach(([routePath,routeView])=>{
    app.use(routePath,routeView)
  })
}

export const emitToPlayerRoom = (io,socket,event,data,customErrorMessage)=>{
  if(io || !socket || !event || !data){
    console.log('missing data')
  }
  const playerRoom = Array.from(socket.rooms)[1]
  if(!playerRoom){
    socket.emit('error',{
      message: customErrorMessage ?? 'no room found for player'
    })
  }
  io.to(playerRoom).emit(event,data)
}