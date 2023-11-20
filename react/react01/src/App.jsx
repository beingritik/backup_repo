import { useState } from 'react';
import Hooks from './components/Hooks';
import Props from './components/Props';

function App() {
  const [count, setCount] = useState(0)
  let Myobject = {
    name:"ritik jain",
    age:21,
    address:"india"
  }
  let array1  = [1,2,3,true]

  return (
    <>
      <h2>app is ready</h2>
      <Hooks />
      <Props userinfo={Myobject} arrayval={array1}/>
    </>
  )
};

export default App
