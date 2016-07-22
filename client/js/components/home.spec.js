"use strict";

import React        from 'react';
import ReactDOM     from 'react-dom';
import TestUtils    from 'react/lib/ReactTestUtils';
import Home         from './home';
import { __RewireAPI__ as HomeRewireApi }         from './home';

const FakeComponent = React.createClass({
  render() {
    return <div className="fake-component" />
  }
})

describe('home', function() {
  var result;
  var props;

  beforeEach(()=>{
    HomeRewireApi.__Rewire__('MyComponent', FakeComponent);
    props = {};
    result = TestUtils.renderIntoDocument(<Home {...props} />);
  });

  afterEach(() => {
    HomeRewireApi.__ResetDependency__('MyComponent');
  })

  it('does not render MyComponent', function() {
    var fakeComponent = TestUtils.findRenderedDOMComponentWithClass(result, 'fake-component');
    expect(ReactDOM.findDOMNode(result).textContent).not.toContain("Hello World");
  });
});
