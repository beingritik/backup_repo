import { useState } from 'react'

function App() {

  const [color,setColor] = useState('black')
  return (
    <>
      <div className='h-screen w-full duration-200' style={{backgroundColor:color}}>
      <button onClick={()=>{setColor("green")}}className='outline-none px-4 py-1 rounded-full text-white'> Green</button>
      <button onClick={()=>{setColor("red")}}className='outline-none px-4 py-1 rounded-full text-white'> Red</button>
      </div>
    </>
  )
}

export default App
