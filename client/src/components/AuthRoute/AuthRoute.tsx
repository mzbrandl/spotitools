import { useAtom } from "jotai";
import React, { Children, ReactChildren } from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";

interface AuthRouteProps extends RouteProps {
  isLoggedIn: boolean;
}

export const AuthRoute: React.FC<AuthRouteProps> = (props) => {
  const isLoggedIn = props.isLoggedIn;

  if (!isLoggedIn) return <Redirect to="/" />

  return <Route {...props}>{props.children}</Route>;

}