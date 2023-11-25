export const generateRoutes = (routesPathMap,app)=>{
  Object.entries(routesPathMap).forEach(([routePath,routeView])=>{
    app.use(routePath,routeView)
  })
}