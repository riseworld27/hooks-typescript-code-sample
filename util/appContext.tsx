import React, { useContext, useReducer, Reducer, Dispatch } from 'react';
import { IUser } from '../service/user';
import { Nullable, ISyncData, FormMap } from '../types';
import { EMPTY_SYNC_DATA, EMPTY_FORM_DATA } from '../service/sync';

export interface IAppContext {
  user: Nullable<IUser>;
  syncData: ISyncData;
  loaded: boolean;
  forms: FormMap;
}

export type PartialAppContext = Partial<IAppContext>;

type ContextInfo = [IAppContext, Dispatch<PartialAppContext>];

const initialAppContext: IAppContext = {
  user: null,
  syncData: EMPTY_SYNC_DATA,
  loaded: false,
  forms: EMPTY_FORM_DATA
};

const AppContext = React.createContext<ContextInfo>([
  initialAppContext,
  () => {}
]);

interface IAppContextProviderProps {
  reducer: Reducer<IAppContext, PartialAppContext>;
  initialState: IAppContext;
}

const AppContextProvider: React.FunctionComponent<IAppContextProviderProps> = ({
  reducer,
  initialState,
  children
}) => (
  <AppContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </AppContext.Provider>
);

const useAppContext: () => ContextInfo = () => useContext(AppContext);

export { AppContextProvider, useAppContext, initialAppContext };
