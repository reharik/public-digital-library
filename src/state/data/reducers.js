// @flow
import type { Action } from '../actions';
import type {SearchAction} from './actions';
import createReducer from '../../lib/createReducer';
import * as actions from './actions';

let reducers = {};

export type DataState = {
   iri?:string,
   resources?:{[string]:{}},
   facets?:{[string]:boolean|{}},
   keyword?:string,
   language?:string,
   searches:{[keyword:string]:{}|null},
   failures: {[string]: string},
   config: { //[string]: {}},
      ldspdi:{
         endpoints:string[],
         index:number
      }
   },
   datatypes?:boolean|{}
}

const DEFAULT_STATE: DataState = {
   searches:{},
   failures:{},
   loading:{},
   config: {
      ldspdi:{
         endpoints:["http://buda1.bdrc.io:13280"],
         index:0
      }
   },
}

export const loadedConfig = (state: DataState, action: Action) => {
    return {
        ...state,
        config: action.payload
    }
}
reducers[actions.TYPES.loadedConfig] = loadedConfig;

export const loadedOntology = (state: DataState, action: Action) => {
    return {
        ...state,
        ontology: action.payload
    }
}
reducers[actions.TYPES.loadedOntology] = loadedOntology;


export const gotResource = (state: DataState, action: Action) => {
    return {
        ...state,
        "resources": {
           ...state.resources,
           [action.payload]:action.meta
       }
    }
}
reducers[actions.TYPES.gotResource] = gotResource;


export const hostError = (state: DataState, action: actions.SearchFailedAction) => {
    return {
        ...state,
        failures: {
            ...state.failures,
            host: action.payload.error
        }
    }
}
reducers[actions.TYPES.hostError] = hostError;



export const chosenHost = (state: DataState, action: Action) => {

    state = {
        ...state,
        config:
        {
           ...state.config,
           ldspdi:
           {
             ...state.config.ldspdi,
             index:state.config.ldspdi.endpoints.indexOf(action.payload)
           }
        },
        /*
        failures: {
            ...state.failures,
            host: null
        }
        */
    }
    return state ;
}
reducers[actions.TYPES.chosenHost] = chosenHost;



export const searchingKeyword = (state: DataState, action: SearchAction) => {
    return {
        ...state,
        //datatypes:null,
        facets:null,
        //keyword:action.payload.keyword,
        //language:action.payload.language,
        searches:{
           ...state.searches,
           ... action.payload ? {[action.payload.keyword+"@"+action.payload.language]:null}:{}
        }
    }
}
reducers[actions.TYPES.searchingKeyword] = searchingKeyword;


export const getOneDatatype = (state: DataState, action: Action) => {

console.log("get1DT")

    return {
        ...state,
    }
}
reducers[actions.TYPES.getOneDatatype] = getOneDatatype;


export const getDatatypes = (state: DataState, action: Action) => {

   console.log("getDTs")

    return {
        ...state,
        datatypes:true
    }
}
reducers[actions.TYPES.getDatatypes] = getDatatypes;

export const getFacetInfo = (state: DataState, action: actions.SearchAction) => {
    return {
        ...state,
        facets:{ ...state.facets, [action.payload.property]:true }
    }
}
reducers[actions.TYPES.getFacetInfo] = getFacetInfo;

export const notGettingDatatypes = (state: DataState, action: Action) => {
    return {
        ...state,
        datatypes:null
    }
}
reducers[actions.TYPES.notGettingDatatypes] = notGettingDatatypes;


export const foundResults = (state: DataState, action: actions.FoundResultsAction) => {

      return {
      ...state,

      keyword:action.payload.keyword,
      language:action.payload.language,
      searches: {
            ...state.searches,
            [action.payload.keyword + "@" + action.payload.language]: action.payload.results
            }
   }
}
reducers[actions.TYPES.foundResults] = foundResults;

export const foundDatatypes = (state: DataState, action: actions.FoundResultsAction) => {

      return {
      ...state,
      datatypes : action.payload.results
   }
}
reducers[actions.TYPES.foundDatatypes] = foundDatatypes;


export const foundFacetInfo = (state: DataState, action: actions.FoundResultsAction) => {

   console.log("facetinfo",action.payload.property,state.facets)

      return {
      ...state,
      facets : {...state.facets, [action.payload.property]:action.payload.results }
   }
}
reducers[actions.TYPES.foundFacetInfo] = foundFacetInfo;


// Data Reducer
const reducer = createReducer(DEFAULT_STATE, reducers);
export default reducer;
