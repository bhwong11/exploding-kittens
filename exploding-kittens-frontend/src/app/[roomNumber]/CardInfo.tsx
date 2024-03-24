type CardInfoProps = {
  card: Card
}

const CardInfo = ({
  card
}:CardInfoProps)=>{
 
  const {
    type,
    id
  } = card
  
  return (
    <div className="flex flex-col justify-center align-center">
      <p>id: {id}</p>
      <p>Card Type: {type}</p>
      <div>{JSON.stringify(card)}</div>
    </div>
  )
}

export default CardInfo