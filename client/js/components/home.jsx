"use strict";

import React                    from 'react';
import assets                   from '../libs/assets';
import { MyComponent }          from './my_component';
class Home extends React.Component {

  render(){

    const img = assets("./images/atomicjolt.jpg");

    return<div>
      <MyComponent myProp="myProp" />
      <img src={img} />
    </div>;
  }

}

export { Home as default };
