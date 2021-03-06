import * as React from 'react';
import assets from '../libs/assets';

export default class Home extends React.Component {

  render() {
    const img = assets('./images/atomicjolt.jpg');
    return (
      <div>
        <img src={img} alt="Atomic Jolt Logo" />
        <p>Welcome to the React Client starter app by <a href="http://www.atomicjolt.com">Atomic Jolt</a></p>
      </div>
    );
  }
}
