import React from "react";
import { useSelector } from "react-redux";
import { selectView } from "../reducers/view.js";
import { DocumentState } from "../actions/viewTypes.js";
import Logo from "./Logo";
import LoadingAnimation from "./LoadingAnimation";

export default function LoadingScreen(props) {
  const view = useSelector(selectView);
  if (
    view.documentState === DocumentState.NONE ||
    view.documentState === DocumentState.LOADING
  ) {
    return (
      <div className="App flex-force-center">
        <Logo />
        <LoadingAnimation />
      </div>
    );
  } else if (view.documentState === DocumentState.ERROR) {
    return (
      <div className="App flex-force-center">
        <Logo />
        <div className="has-text-danger block">{view.message.text}</div>
      </div>
    );
  }
}
