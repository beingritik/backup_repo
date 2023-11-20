import React from "react";

function Props({ userinfo, arrayval }) {
  console.log("the props passed are as:", { userinfo }, { arrayval });
  return (
    <>
      <p>Props is ready </p>
      <h1>userinfo:{userinfo.name}</h1>
      <h3>userage:{userinfo.age}</h3>
      <h3>arrayval at index zero:{arrayval[0]}</h3>
    </>
  );
}
export default Props;
