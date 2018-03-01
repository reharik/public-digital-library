// @flow
import AppContainer from './containers/AppContainer';
import React, { Component } from 'react';
import { Switch, Route, Router } from 'react-router-dom';
import history from './history';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import indigo from 'material-ui/colors/indigo';
import { Provider } from 'react-redux';
import ResourceViewerContainer from './containers/ResourceViewerContainer'
import IIIFViewerContainer from './containers/IIIFViewerContainer'

import store from './index';
import * as ui from './state/ui/actions'

import qs from 'query-string'

const theme = createMuiTheme({
    palette: {
        primary: indigo,
        secondary: indigo
    }
});


type Props = { history:{} }

class Redirect404 extends Component<Props>
{
   constructor(props)
   {
      super(props);

      // console.log("props404",props)

      setTimeout((function(that) { return function() { that.props.history.push("/") } })(this), 3000) ;
   }

   render()
   {
      return (<div style={{textAlign:"center",marginTop:"100px",fontSize:"22px"}}>
         Page not found: {this.props.history.location.pathname}
         <br/>
         Redirecting to homepage
      </div>)

   }
}


const makeMainRoutes = () => {


   return (
     <Provider store={store}>
        <MuiThemeProvider theme={theme}>
           <Router history={history}>
             <Switch>
                  <Route exact path="/" render={(props) =>
                     <AppContainer history={history}/> } />
                  <Route path="/search" render={(props) =>
                     <AppContainer history={history}/> } />
                  <Route path="/gallery" render={(props) =>
                     <IIIFViewerContainer location={history.location} history={history}/> }/>
                  <Route path="/resource" render={(props) =>
                     <ResourceViewerContainer history={history}/> } />
                  <Route render={(props) =>
                     <Redirect404  history={history}/>}/>
               </Switch>
            </Router>
         </MuiThemeProvider>
      </Provider>
  );
}
export default makeMainRoutes ;
