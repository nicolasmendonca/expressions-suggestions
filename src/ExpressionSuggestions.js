import React from "react";
import classNames from "classnames";

class Suggestion extends React.PureComponent {
  get suggestionHTML() {
    let currentFieldNumber = 1;
    let functionText = this.props.suggestion.function;

    while (functionText.includes("%")) {
      functionText = functionText.replace(
        "%",
        `<span class="grey">[field_${currentFieldNumber}]</span>`
      );
      currentFieldNumber++;
    }

    return functionText;
  }

  render() {
    const {
      suggestion,
      onSuggestionFocusChange,
      onSuggestionClicked,
      hasFocus
    } = this.props;
    return (
      <li
        className={classNames("Expression-Suggestion-List-Item", {
          hasFocus
        })}
        key={suggestion.id}
        onMouseEnter={onSuggestionFocusChange}
        onMouseDown={() => onSuggestionClicked(suggestion)}
        dangerouslySetInnerHTML={{ __html: this.suggestionHTML }}
      />
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
