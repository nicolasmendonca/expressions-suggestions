import React from "react";

class FunctionDetails extends React.Component {
  render() {
    const { functionExpression } = this.props;
    const args = functionExpression.arguments.map(
      arg => `<span key={arg.name} class="gray">[${arg.name}]</span>`
    );
    return (
      <div className="FunctionDetails">
        <div className="FunctionDetails--function-name-box">
          <p
            className="FunctionDetails--function-name"
            dangerouslySetInnerHTML={{
              __html: `${functionExpression.name}(${args.join(", ")})`
            }}
          />
          <p className="functionDetails--function-description">
            {functionExpression.description}
          </p>
        </div>
        <ul className="FunctionDetails--argument-list">
          {functionExpression.arguments.map(arg => (
            <li key={arg.name}>
              <p className="FunctionDetails--argument-name">[{arg.name}]</p>
              <p className="FunctionDetails--argument-detail">
                {arg.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default FunctionDetails;
