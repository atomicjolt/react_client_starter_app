import { combineReducers } from 'redux';
import jwt                 from '../../libs/reducers/jwt';
import settings            from '../../libs/reducers/settings';
import application         from './application';

const rootReducer = combineReducers({
  settings,
  jwt,
  application,
});

export default rootReducer;
