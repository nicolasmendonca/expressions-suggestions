import React from "react";
import ContentEditable from "react-contenteditable";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import { suggestions, KEYBOARD_KEYS } from "./constants";
import { expressionFieldReducer } from "./expressionFieldReducer";
import { getCaretPosition } from "./utils";

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
    const cleanSearchText = this.inputRef.current.innerText;
    const matches = new Fuse(suggestions, options).search(cleanSearchText);
    return matches;
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

  handleSuggestionClicked = suggestion => {
    this.dispatchEvent({ type: "SUGGESTION_CLICKED", payload: suggestion });
  };

  handleSuggestionFocusChange = index => {
    this.dispatchEvent({ type: "SUGGESTION_FOCUSED", payload: index });
  };

  focusOnActiveSuggestion = () => {
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
