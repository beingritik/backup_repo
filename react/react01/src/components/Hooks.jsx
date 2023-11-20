import { useState } from "react";

function Hooks() {
  let [counter, setCounter] = useState(9);
  let [warning ,setWarning] = useState(" ");
  const addValue = () => {
    if (counter <20) {
      counter = counter + 1;
      setCounter(counter);
      setWarning(" ")
    } else {
      setCounter(counter);
      setWarning("Invalid");
    }
  };
  const subtractvalue = () => {
    if (counter >0) {
      // setCounter(counter-1);
      // setCounter(counter-1);
      // setCounter(counter-1);
      // setCounter(counter-1);
      

      setCounter(counter-1);
      setCounter(counter = counter-1);
      setCounter(counter = counter-1);

      //this set counter method will ot decrease the value becaise it eill send the value in batch .
      setCounter(counter-1);
      setWarning(" ")
    } else {
      setWarning("Invalid");
      setCounter(counter);
    }
  };
  return (
    <>
      <p>About is ready</p>

      <button onClick={addValue}>Add</button>
      {counter}
      <button onClick={subtractvalue}>Subtract</button>

      {warning}
    </>
  );
}

export default Hooks;
