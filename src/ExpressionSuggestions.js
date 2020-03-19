import React from "react";
import classNames from "classnames";

class Suggestion extends React.PureComponent {
  get suggestionHTML() {
    const { suggestion } = this.props;
    let argumentsHTML = suggestion.arguments
      .map(argument => `<span class="grey">[${argument.name}]</span>`)
      .join(", ");
    return `${suggestion.functionName}(${argumentsHTML})`;
  }

  handleMouseDown = e => {
    e.preventDefault();
    this.props.onSuggestionClicked(this.props.suggestion);
  };

  render() {
    const { suggestion, onSuggestionFocusChange, hasFocus } = this.props;
    return (
      <li
        className={classNames("Expression-Suggestion-List-Item", {
          hasFocus
        })}
        key={suggestion.id}
        onMouseEnter={onSuggestionFocusChange}
        onMouseDown={this.handleMouseDown}
      >
        <span
          className="Expression-Suggestion-List-Item--function-name"
          dangerouslySetInnerHTML={{ __html: this.suggestionHTML }}
        />
      </li>
    );
  }
}

class ExpressionSuggestions extends React.Component {
  render() {
    return (
      <ul ref={this.props.innerRef} className="Expression-Suggestion-List">
        {this.props.suggestions.map((suggestion, index) => (
          <Suggestion
            key={suggestion.id}
            suggestion={suggestion}
            hasFocus={index === this.props.focusedSuggestionIndex}
            onSuggestionFocusChange={() =>
              this.props.onSuggestionFocusChange(index)
            }
            onSuggestionClicked={this.props.onSuggestionClicked}
          />
        ))}
      </ul>
    );
  }
}

export default React.forwardRef((props, ref) => (
  <ExpressionSuggestions {...props} innerRef={ref} />
));
