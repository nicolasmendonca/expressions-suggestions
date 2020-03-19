import React from "react";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import {
  suggestions,
  KEYBOARD_KEYS,
  variableSplitters,
  fields
} from "./constants";
import { expressionFieldReducer } from "./expressionFieldReducer";
import {
  getCaretPosition,
  setCaretPosition,
  getCurrentExpressionFunction,
  currentInputTextContainsFunction,
  manipulateCaretPosition
} from "./utils";
import FunctionDetails from "./FunctionDetails";

const sanitizeFieldTextSeach = textSearch =>
  textSearch.replace(/\[|\]/g, () => "");

class ExpressionField extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
    this.listRef = React.createRef();
    this.state = expressionFieldReducer(undefined, {});

    this.functionsFuse = new Fuse(suggestions, {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["functionName"]
    });
    this.fieldsFuse = new Fuse(fields, {
      minMatchCharLength: 1,
      keys: ["id", "field"],
      threshold: 0
    });
    this.subscriptionEvents = "mousedown touchstart input paste cut mousemove select selectstart".split(
      " "
    );
  }

  handleCaretChange = () => this.forceUpdate();

  componentDidMount() {
    const { current: inputRef } = this.inputRef;
    this.subscriptionEvents.forEach(eventName => {
      inputRef.addEventListener(eventName, this.handleCaretChange);
    });
  }

  componentWillUnmount() {
    const { current: inputRef } = this.inputRef;
    this.subscriptionEvents.forEach(eventName => {
      inputRef.removeEventListener(eventName, this.handleCaretChange);
    });
  }

  get focusedFunctionSuggestion() {
    return this.state.focusedFunctionSuggestion;
  }

  get filteredFunctionSuggestions() {
    const [, , cleanSearchText] = this.getActiveWrittenFunction();
    const matches = this.functionsFuse.search(cleanSearchText);
    return cleanSearchText.length === 0 ? suggestions : matches;
  }

  get currentFunctionName() {
    if (!this.inputRef.current) return null;
    const { innerText } = this.inputRef.current;
    const cursorPosition = getCaretPosition(this.inputRef.current);
    return getCurrentExpressionFunction(innerText, cursorPosition);
  }

  get currentFunction() {
    const { currentFunctionName } = this;
    if (!currentFunctionName) return null;
    return suggestions.find(sugg => sugg.functionName === currentFunctionName);
  }

  dispatchEvent = (action, callback) => {
    const prevState = this.state;
    this.setState(expressionFieldReducer(prevState, action), (...params) => {
      if (callback) callback(...params);
    });
  };

  getFieldSuggestion = (searchTerm = "") => {
    const sanitized = sanitizeFieldTextSeach(searchTerm);
    const [result] = this.fieldsFuse.search(sanitized);
    return result;
  };

  updateFieldSuggestion = fieldTextSearch => {
    const { current: inputRef } = this.inputRef;
    const suggestion = this.getFieldSuggestion(fieldTextSearch);
    const newEl = document.createElement("span");
    const fieldSuggestionFlement =
      inputRef.querySelector(".field-suggestion") || newEl;
    fieldSuggestionFlement.className = "field-suggestion";
    fieldSuggestionFlement.innerText = suggestion
      ? suggestion.field.substring(fieldTextSearch.length - 1) + "]"
      : "";
    const inputSearchElement = inputRef.childNodes[0];

    const sel = window.getSelection();
    let range = sel.getRangeAt(0);

    // sets the cursor on the last position right before the suggestion
    range.collapse(true);
    range.insertNode(fieldSuggestionFlement);
    range = range.cloneRange();
    range.selectNodeContents(inputSearchElement);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  insertFieldSuggestion = fieldTextSearch => {
    const suggestion = this.getFieldSuggestion(fieldTextSearch);
    if (!suggestion) return;
    const { current: inputRef } = this.inputRef;
    this.removeFieldSuggestion();
    const caretPosition = getCaretPosition(inputRef);
    const leftText = inputRef.innerText.substring(
      0,
      caretPosition - fieldTextSearch.length
    );
    const rightText = inputRef.innerText.substring(caretPosition);
    inputRef.innerText = `${leftText}[${suggestion.field}]${rightText}`;
    manipulateCaretPosition(() =>
      setCaretPosition(inputRef, leftText.length + suggestion.field.length + 2)
    );
  };

  /** @param {FocusEvent} e */
  handleInputFocus = e => {
    e.persist();
    this.dispatchEvent({ type: "INPUT_FOCUSED" });
  };

  /** @param {FocusEvent} e */
  handleInputBlur = e => {
    this.dispatchEvent({ type: "INPUT_BLURRED" });
  };

  shouldRenderFunctionSuggestions = () => {
    const activeWrittenFunction = this.getActiveWrittenFunction();
    return (
      this.state.isInputFocused &&
      currentInputTextContainsFunction(activeWrittenFunction[2]) &&
      this.state.filteredFunctionSuggestions.length > 0
    );
  };

  shouldRenderFunctionDetails = () => {
    const { currentFunction } = this;
    const activeWrittenFunction = this.getActiveWrittenFunction();

    return (
      this.state.isInputFocused &&
      currentFunction &&
      (!activeWrittenFunction[2] || !this.shouldRenderFunctionSuggestions())
    );
  };

  getActiveWrittenFunction = () => {
    if (!this.inputRef.current) return [0, 0, ""];
    const { innerText } = this.inputRef.current;
    const cursorPosition = getCaretPosition(this.inputRef.current);
    if (cursorPosition === 0) return [0, 0, ""];
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (variableSplitters.includes(innerText.charAt(i))) {
        if (i === cursorPosition) return [i, cursorPosition, ""];
        return [i, cursorPosition, innerText.substring(i + 1, cursorPosition)];
      }
    }
    return [0, cursorPosition, innerText];
  };

  handleSuggestionClicked = suggestion => {
    const { innerText } = this.inputRef.current;
    const [start, end] = this.getActiveWrittenFunction();
    const leftText = innerText.substring(0, start === 0 ? start : start + 1);
    const rightText = innerText.substring(end);
    const newExpression = [
      `${leftText}${suggestion.functionName}(`,
      `)${rightText}`
    ];

    this.inputRef.current.innerText = newExpression.join("");

    manipulateCaretPosition(() => {
      setCaretPosition(this.inputRef.current, newExpression[0].length);
    });
  };

  handleSuggestionFocusChange = index => {
    this.dispatchEvent({ type: "SUGGESTION_FOCUSED", payload: index });
  };

  focusOnActiveSuggestion = () => {
    if (!this.listRef.current) return;
    this.listRef.current
      .querySelector(".hasFocus")
      .scrollIntoView({ block: "center", behavior: "smooth" });
  };

  selectNextSuggestion = () => {
    const {
      filteredFunctionSuggestions,
      focusedFunctionSuggestion
    } = this.state;
    const target = filteredFunctionSuggestions[focusedFunctionSuggestion + 1]
      ? focusedFunctionSuggestion + 1
      : 0;
    this.dispatchEvent(
      { type: "SUGGESTION_FOCUSED", payload: target },
      this.focusOnActiveSuggestion
    );
  };

  selectPreviousSuggestion = () => {
    const {
      filteredFunctionSuggestions,
      focusedFunctionSuggestion
    } = this.state;
    const target = filteredFunctionSuggestions[focusedFunctionSuggestion - 1]
      ? focusedFunctionSuggestion - 1
      : filteredFunctionSuggestions.length - 1;
    this.dispatchEvent(
      { type: "SUGGESTION_FOCUSED", payload: target },
      this.focusOnActiveSuggestion
    );
  };

  insertFunction = () => {
    const [, , suggestionText] = this.getActiveWrittenFunction();
    this.handleSuggestionClicked({ functionName: suggestionText });
  };

  /** @param {KeyboardEvent} e */
  handleKeyDown = e => {
    e.persist();

    const {
      filteredFunctionSuggestions,
      focusedFunctionSuggestion
    } = this.state;

    switch (e.keyCode) {
      case KEYBOARD_KEYS.DOWN_ARROW:
        e.preventDefault();
        return this.selectNextSuggestion();
      case KEYBOARD_KEYS.UP_ARROW:
        e.preventDefault();
        return this.selectPreviousSuggestion();
      case KEYBOARD_KEYS.OPEN_PARENTHESIS:
        e.preventDefault();
        return this.insertFunction();
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.TAB:
        e.preventDefault();
        const suggestion =
          filteredFunctionSuggestions[focusedFunctionSuggestion];
        if (suggestion) this.handleSuggestionClicked(suggestion);
        if (this.fieldTextSearch !== false)
          this.insertFieldSuggestion(this.fieldTextSearch);
        return;
      default:
        return;
    }
  };

  /** @param {KeyboardEvent} _e */
  handleKeyUp = _e => {
    this.dispatchEvent({
      type: "USER_INPUT",
      payload: {
        filteredFunctionSuggestions: this.filteredFunctionSuggestions
      }
    });
  };

  render() {
    return (
      <div className="Expression-Field">
        <div
          contentEditable={true}
          ref={this.inputRef}
          className="Expression-Field__input"
          onFocus={this.handleInputFocus}
          onBlur={this.handleInputBlur}
          onKeyDown={this.handleKeyDown}
          onKeyUp={this.handleKeyUp}
        />
        {this.shouldRenderFunctionSuggestions() && (
          <ExpressionSuggestions
            ref={this.listRef}
            suggestions={this.state.filteredFunctionSuggestions}
            onSuggestionClicked={this.handleSuggestionClicked}
            onSuggestionFocusChange={this.handleSuggestionFocusChange}
            focusedSuggestionIndex={this.focusedFunctionSuggestion}
          />
        )}
        {this.shouldRenderFunctionDetails() && (
          <FunctionDetails functionExpression={this.currentFunction} />
        )}
      </div>
    );
  }
}

export default ExpressionField;
