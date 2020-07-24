import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import "./App.css";

export const App = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/l">
            <a href="/login">Login</a>
          </Route>
          <Route path="/u">
            <h1>U</h1>
          </Route>
          <Route path="/">
            <h1>home</h1>
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
};
