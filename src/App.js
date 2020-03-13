import React from "react";
import ExpressionField from "./ExpressionField";
import "./styles.scss";

export default function App() {
  return (
    <div className="App">
      <p>(escribi "CONCAT")</p>
      <ExpressionField />
    </div>
  );
}
