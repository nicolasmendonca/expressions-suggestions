import React from "react";
import ExpressionField from "./ExpressionField";
import "./styles.scss";
import { fields, functions } from "./constants";

export default function App() {
  return (
    <div className="App">
      <ExpressionField suggestions={[...fields, ...functions]} />
      <div className="tutorial">
        <p>Available fields</p>
        <ul>
          {fields.map(field => (
            <li key={field.name}>{field.name}</li>
          ))}
        </ul>
        <p>Available functions</p>
        <ul>
          {functions.map(func => (
            <li key={func.name}>{func.name}()</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
