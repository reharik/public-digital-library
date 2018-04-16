import { call, put, takeLatest, select, all } from 'redux-saga/effects';
import { INITIATE_APP } from '../actions';
import * as dataActions from '../data/actions';
import * as uiActions from '../ui/actions';
import selectors from '../selectors';
import store from '../../index';
import bdrcApi from '../../lib/api';

const api = new bdrcApi();

async function initiateApp(params,iri) {
   try {
      const config = await api.loadConfig();
      store.dispatch(dataActions.loadedConfig(config));
      store.dispatch(dataActions.choosingHost(config.ldspdi.endpoints[config.ldspdi.index]));

      const onto = await api.loadOntology();
      store.dispatch(dataActions.loadedOntology(onto));
      // console.log("params",params)

      let state = !store.getState()

      if(iri && (!state.resources || !state.resources.IRI))
      {
         let res = await api.loadResource(iri)
         store.dispatch(dataActions.gotResource(iri,res));
      }
      else if(!iri && params && params.q) {
         if(params.t && ["Person","Work"].indexOf(params.t) !== -1)
         {
            store.dispatch(dataActions.startSearch(params.q,params.lg,[params.t])); //,params.t.split(",")));
         }
         else
         {
            store.dispatch(dataActions.startSearch(params.q,params.lg));
         }
      }

   } catch(e) {
      console.log('initiateApp error: %o', e);
      // TODO: add action for initiation failure
   }
}

function* watchInitiateApp() {
      yield takeLatest(
         INITIATE_APP,
         (action) => initiateApp(action.payload,action.meta)
      );
}

export function* chooseHost(host:string) {
   try
   {
      yield call([api, api.testHost], host);
      yield put(dataActions.chosenHost(host));
   }
   catch(e)
   {
      // yield put(dataActions.chosenHost(host));
      yield put(dataActions.hostError(host,e.message));
   }
}

export function* watchChoosingHost() {

   yield takeLatest(
      dataActions.TYPES.choosingHost,
      (action) => chooseHost(action.payload)
   );
}

export function* getDatatypes(key,lang) {

   try {

      const datatypes = yield call([api, api.getResultsDatatypes], key,lang);

      yield put(dataActions.foundDatatypes(key,datatypes));

   } catch(e) {
      yield put(dataActions.searchFailed(key, e.message));
      yield put(dataActions.notGettingDatatypes());
   }

}
 async function startSearch(keyword,language,datatype) {

   console.log("sSsearch",keyword,language,datatype);

   // why is this action dispatched twice ???
   store.dispatch(uiActions.loading(keyword, true));
   if(!datatype || datatype.indexOf("Any") !== -1) {
      store.dispatch(dataActions.getDatatypes());
   }
   try {
      let result ;


      result = await api.getStartResults(keyword,language,datatype);

      store.dispatch(uiActions.loading(keyword, false));

      let data = result.data
      data = { numResults:Object.keys(data).length,results : { bindings: {...data } } }
      store.dispatch(dataActions.foundResults(keyword, language, data, datatype));


      if(!datatype || datatype.indexOf("Any") !== -1) {
         store.dispatch(dataActions.foundDatatypes(keyword,{ metadata:result.metadata, hash:true}));
      }
      else {

         if(datatype.indexOf("Person") !== -1) {
            store.dispatch(dataActions.foundFacetInfo(keyword,language,datatype,{"gender":result.metadata }))
         }
         else if(datatype.indexOf("Work") !== -1) {
            store.dispatch(dataActions.foundFacetInfo(keyword,language,datatype,result.metadata))
         }


         if(!store.getState().data.searches[keyword+"@"+language]){
            store.dispatch(dataActions.getDatatypes());
            result = await api.getStartResults(keyword,language);
            data = result.data
            data = { numResults:Object.keys(data).length,results : { bindings: {...data } } }
            store.dispatch(dataActions.foundResults(keyword, language, data));
            store.dispatch(dataActions.foundDatatypes(keyword,{ metadata:result.metadata, hash:true}));
         }
      }
      // store.dispatch(dataActions.foundDatatypes(keyword, JSON.parse(result.metadata).results));
      //store.dispatch(dataActions.foundResults(keyword, language,result));
      //yield put(uiActions.showResults(keyword, language));

   } catch(e) {

      console.log(e);

      store.dispatch(dataActions.searchFailed(keyword, e.message));
      store.dispatch(uiActions.loading(keyword, false));
   }
}

 async function searchKeyword(keyword,language,datatype) {

   console.log("searchK",keyword,language,datatype);

   // why is this action dispatched twice ???
   store.dispatch(uiActions.loading(keyword, true));
   try {
      let result ;

      if(!datatype || datatype.indexOf("Any") !== -1)
         result = await api.getResults(keyword,language);
      else
         result = await api.getResultsOneDatatype(datatype,keyword,language);

      store.dispatch(uiActions.loading(keyword, false));
      store.dispatch(dataActions.foundResults(keyword, language,result));
      //yield put(uiActions.showResults(keyword, language));

   } catch(e) {
      store.dispatch(dataActions.searchFailed(keyword, e.message));
      store.dispatch(uiActions.loading(keyword, false));
   }
}


async function getOneDatatype(datatype,keyword,language:string) {

   console.log("searchK1DT",datatype,keyword,language);

   store.dispatch(uiActions.loading(keyword, true));
   try {
      const result = await api.getResultsOneDatatype(datatype,keyword,language);

      store.dispatch(uiActions.loading(keyword, false));
      store.dispatch(dataActions.foundResults(keyword, language, result));

   } catch(e) {
      store.dispatch(dataActions.searchFailed(keyword, e.message));
      store.dispatch(uiActions.loading(keyword, false));
   }
}

async function getOneFacet(keyword,language:string,facet:{[string]:string}) {

   console.log("searchK1F",keyword,language,facet);

   store.dispatch(uiActions.loading(keyword, true));
   try {
      const result = await api.getResultsOneFacet(keyword,language,facet);

      store.dispatch(uiActions.loading(keyword, false));
      store.dispatch(dataActions.foundResults(keyword, language, result));

   } catch(e) {
      store.dispatch(dataActions.searchFailed(keyword, e.message));
      store.dispatch(uiActions.loading(keyword, false));
   }
}


async function getFacetInfo(keyword,language:string,property:string) {

   console.log("searchFacet",keyword,language,property);

   try {
      const result = await api.getResultsSimpleFacet(keyword,language,property);

      //console.log("back from call",property,result);

      store.dispatch(dataActions.foundFacetInfo(keyword, language, property, result));

   } catch(e) {
      store.dispatch(dataActions.searchFailed(keyword, e.message));
   }

}

export function* watchSearchingKeyword() {

   yield takeLatest(
      dataActions.TYPES.searchingKeyword,
      (action) => searchKeyword(action.payload.keyword,action.payload.language,action.payload.datatype)
   );
}

export function* watchStartSearch() {

   yield takeLatest(
      dataActions.TYPES.startSearch,
      (action) => startSearch(action.payload.keyword,action.payload.language,action.payload.datatype)
   );
}

export function* watchGetDatatypes() {

   yield takeLatest(
      dataActions.TYPES.getDatatypes,
      (action) => getDatatypes(action.payload.keyword,action.payload.language)
   );
}

export function* watchGetOneDatatype() {

   yield takeLatest(
      dataActions.TYPES.getOneDatatype,
      (action) => getOneDatatype(action.payload.datatype,action.payload.keyword,action.payload.language)
   );
}

export function* watchGetOneFacet() {

   yield takeLatest(
      dataActions.TYPES.getOneFacet,
      (action) => getOneFacet(action.payload.keyword,action.payload.language,action.payload.facet)
   );
}

export function* watchGetFacetInfo() {

   yield takeLatest(
      dataActions.TYPES.getFacetInfo,
      (action) => getFacetInfo(action.payload.keyword,action.payload.language,action.payload.property)
   );
}
/** Root **/

export default function* rootSaga() {
   yield all([
      watchInitiateApp(),
      watchChoosingHost(),
      //watchGetDatatypes(),
      watchGetFacetInfo(),
      watchGetOneDatatype(),
      watchGetOneFacet(),
      watchSearchingKeyword(),
      watchStartSearch()
   ])
}
