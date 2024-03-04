type CardPileProps = {
  cards: Card[]
  //in rem
  width?: number
  height?: number
  cardOffset?: number
  cardsPerVisualCard?: number,
  title: string,
  backgroundColor?: string,
  showFront?: boolean
}
const CardPile = ({
  cards,
  //in rem
  width = 5,
  height = 7,
  cardOffset = 0.3,
  cardsPerVisualCard = 5,
  title = '',
  backgroundColor = "#9E9E9E",
  showFront = false
}:CardPileProps)=>{
  const cardsDisplayed = Math.floor((cards?.length || 0)/cardsPerVisualCard)

  const generateCardFrontProps = (card:Card)=>({
    backgroundImage: `url(${card.image})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${width}rem ${height}rem`
  })
  
  return (
    <div>
      <p>{title}</p>
      <div style={{
        height:`${height+cardOffset*cardsDisplayed}rem`,
        width:`${width+cardOffset*cardsDisplayed}rem`,
      }}>
        {Array.from(Array(cardsDisplayed).keys()).map((idx)=>(
          <div className="w-[5rem] border border-black shadow-lg relative text-center flex flex-col justify-center" style={{
            height: `${height}rem`,
            width:`${width}rem`,
            top: `-${idx===0?0:idx*(height-cardOffset)}rem`,
            left:`${idx===0?0:idx*cardOffset}rem`,
            backgroundColor,
            ...(showFront?generateCardFrontProps(cards[idx]):{}),
          }}>
            <div className="bg-gray-300">
              {idx===cardsDisplayed-1 && `cards: ${cards.length}`}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default CardPile