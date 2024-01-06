'use client'

import { HydrationBoundary,HydrationBoundaryProps } from "@tanstack/react-query";

const HydrateWrapper = (props:HydrationBoundaryProps)=>{
  return <HydrationBoundary {...props}/>
}

export default HydrateWrapper