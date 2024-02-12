type CardPileProps = {
  cards: Card[]
  //in rem
  width?: number
  height?: number
  cardOffset?: number
  cardsPerVisualCard?: number,
  title: string
}
const CardPile = ({
  cards,
  //in rem
  width = 5,
  height = 7,
  cardOffset = 0.3,
  cardsPerVisualCard = 5,
  title = ''
}:CardPileProps)=>{
  const cardsDisplayed = Math.floor((cards?.length || 0)/cardsPerVisualCard)
  return (
    <div>
      <p>{title}</p>
      <div style={{
        height:`${height+cardOffset*cardsDisplayed}rem`
      }}>
        {Array.from(Array(cardsDisplayed).keys()).map((idx)=>(
          <div className="w-[5rem] border border-black bg-gray-500 shadow-lg relative text-center flex flex-col justify-center" style={{
            height: `${height}rem`,
            width:`${width}rem`,
            top: `-${idx===0?0:idx*(height-cardOffset)}rem`,
            left:`${idx===0?0:idx*cardOffset}rem`
          }}>
            {idx===cardsDisplayed-1 && `cards: ${cards.length}`}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CardPile