import { useState , useEffect, useCallback} from 'react'

function Useefhook() {
  const [length, setLength] = useState(2);
  const [numberallowed,setNumberallowed] = useState(false);
  const [charallowed,setcharrallowed] = useState(false);
  const [passwd, setPasswd] = useState("");
  let flag=0;
  // if($@#){
  //  flag  =1;
  // }

  const passwdGen =useCallback(()=> {
   console.log("called");

   let password = '';
   let str ="ABCFERDFGsdfvefs";
   if(numberallowed) str+="1234";
   if(charallowed) str+="!@$%";
   for(let i=0;i<=length;i++){
    let char =Math.floor(Math.random()*str.length+1);
    password+= str.charAt(char);
   }
   setPasswd(password);
  },[length,numberallowed,charallowed,setPasswd])

  useEffect(()=>{passwdGen()},[length,numberallowed,charallowed,passwdGen]);

  return (
    <div className='flex flex-col'>
      <p>password</p>
      <input type="text" placeholder='pop' className='border-2 border-emerald-500' value={passwd}/>
      <input type ="range" className='flex items-center border border-red-500' value={length} onChange={(e)=>{setLength(e.target.value)}} />
      Length:{length}
      <div className='flex'>
        <input type="checkbox" defaultChecked={numberallowed} onChange={() => setNumberallowed((numberallowed)=>!numberallowed)} />nums: {numberallowed.toString()}
      </div>
      <input type="checkbox" defaultChecked={charallowed} onChange={()=> setcharrallowed(!charallowed)} />char:{charallowed.toString()}

    </div>
  )
}

export default Useefhook
