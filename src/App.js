import React, { Component } from 'react';
import {BrowserRouter, Route, Switch } from 'react-router-dom';
import Layout from './components/layout';
import Home from './components/Home';
import { AddRecord } from './components/AddRecord';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Layout>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/addEvent" component={AddRecord} />
          </Switch>
        </Layout>
      </BrowserRouter>
    );
  }
}

export default App;
