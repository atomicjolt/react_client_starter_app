import { combineReducers } from 'redux';
import settings            from 'atomic-reactor/libs/reducers/settings';
import jwt                 from 'atomic-reactor/libs/reducers/jwt';
import application         from './application';

const rootReducer = combineReducers({
  settings,
  jwt,
  application,
});

export default rootReducer;
