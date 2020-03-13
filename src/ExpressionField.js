import React from "react";
import ContentEditable from "react-contenteditable";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import { suggestions, KEYBOARD_KEYS } from "./constants";
import { expressionFieldReducer } from "./expressionFieldReducer";
import { getCaretPosition, setCaretPosition2 } from "./utils";

class ExpressionField extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
    this.listRef = React.createRef();
    this.state = expressionFieldReducer(undefined, {});
  }

  get focusedSuggestion() {
    return this.state.focusedSuggestion;
  }

  get filteredSuggestions() {
    const options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["function"]
    };
    const [, , cleanSearchText] = this.getSuggestionText();
    const matches = new Fuse(suggestions, options).search(cleanSearchText);
    return cleanSearchText.length === 0 ? suggestions : matches;
  }

  dispatchEvent = (action, callback) => {
    const prevState = this.state;
    this.setState(expressionFieldReducer(prevState, action), (...params) => {
      if (callback) callback(...params);
      console.log({ prevState, action, state: this.state });
    });
  };

  /** @param {FocusEvent} e */
  handleInputFocus = e => {
    this.dispatchEvent({ type: "INPUT_FOCUSED" });
  };

  /** @param {FocusEvent} e */
  handleInputBlur = e => {
    this.dispatchEvent({ type: "INPUT_BLURRED" });
  };

  /** @param {KeyboardEvent} e  */
  handleUserInput = e => {
    this.dispatchEvent({
      type: "USER_INPUT",
      payload: {
        inputValue: e.target.value,
        filteredSuggestions: this.filteredSuggestions
      }
    });
  };

  shouldRenderSuggestions = () => {
    return (
      this.state.isInputFocused && this.state.filteredSuggestions.length > 0
    );
  };

  getSuggestionText = () => {
    const { innerText } = this.inputRef.current;
    const cursorPosition = getCaretPosition(this.inputRef.current);
    for (let i = cursorPosition; i >= 0; i--) {
      if (innerText.charAt(i) === "(") {
        if (i === cursorPosition) return [i, cursorPosition, ""];
        return [i, cursorPosition, innerText.substring(i + 1, cursorPosition)];
      }
    }
    return [0, cursorPosition, innerText];
  };

  handleSuggestionClicked = suggestion => {
    const { innerText } = this.inputRef.current;
    const [start, end] = this.getSuggestionText();
    const leftText = innerText.substring(0, start);
    const rightText = innerText.substring(end);
    const newExpression =
      start === 0
        ? [`${leftText}${suggestion.functionName}(`, `)${rightText}`]
        : [`${leftText}(${suggestion.functionName}(`, `)${rightText}`];
    debugger;
    this.dispatchEvent(
      { type: "SUGGESTION_CLICKED", payload: newExpression.join("") },
      () => {
        setTimeout(() => {
          this.inputRef.current.focus();
          setCaretPosition2(this.inputRef.current, newExpression[0].length);
        }, 0);
        // setCurrentCursorPosition(newExpression[0].length, this.inputRef.current);
      }
    );
  };

  handleSuggestionFocusChange = index => {
    this.dispatchEvent({ type: "SUGGESTION_FOCUSED", payload: index });
  };

  focusOnActiveSuggestion = () => {
    if (!this.listRef.current) return;
    this.listRef.current
      .querySelector(".hasFocus")
      .scrollIntoView({ block: "center" });
  };

  selectNextSuggestion = () => {
    const { filteredSuggestions, focusedSuggestion } = this.state;
    const target = filteredSuggestions[focusedSuggestion + 1]
      ? focusedSuggestion + 1
      : 0;
    this.dispatchEvent(
      { type: "SUGGESTION_FOCUSED", payload: target },
      this.focusOnActiveSuggestion
    );
  };

  selectPreviousSuggestion = () => {
    const { filteredSuggestions, focusedSuggestion } = this.state;
    const target = filteredSuggestions[focusedSuggestion - 1]
      ? focusedSuggestion - 1
      : filteredSuggestions.length - 1;
    this.dispatchEvent(
      { type: "SUGGESTION_FOCUSED", payload: target },
      this.focusOnActiveSuggestion
    );
  };

  /** @param {KeyboardEvent} e */
  handleKeyDown = e => {
    e.persist();
    const { filteredSuggestions, focusedSuggestion } = this.state;

    switch (e.keyCode) {
      case KEYBOARD_KEYS.DOWN_ARROW:
        e.preventDefault();
        return this.selectNextSuggestion();
      case KEYBOARD_KEYS.UP_ARROW:
        e.preventDefault();
        return this.selectPreviousSuggestion();
      case KEYBOARD_KEYS.ENTER:
        e.preventDefault();
        const suggestion = filteredSuggestions[focusedSuggestion];
        return this.handleSuggestionClicked(suggestion);
      default:
        return;
    }
  };

  render() {
    return (
      <div className="Expression-Field">
        <ContentEditable
          innerRef={this.inputRef}
          className="Expression-Field__input"
          html={this.state.inputContent}
          onFocus={this.handleInputFocus}
          // onBlur={this.handleInputBlur}
          onChange={this.handleUserInput}
          onKeyDown={this.handleKeyDown}
        />
        {this.shouldRenderSuggestions() && (
          <ExpressionSuggestions
            ref={this.listRef}
            suggestions={this.state.filteredSuggestions}
            onSuggestionClicked={this.handleSuggestionClicked}
            onSuggestionFocusChange={this.handleSuggestionFocusChange}
            focusedSuggestionIndex={this.focusedSuggestion}
          />
        )}
      </div>
    );
  }
}

export default ExpressionField;
