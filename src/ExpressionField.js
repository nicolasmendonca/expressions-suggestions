import React from "react";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import { KEYBOARD_KEYS, variableSplitters } from "./constants";
import { expressionFieldReducer } from "./expressionFieldReducer";
import {
  getCaretPosition,
  setCaretPosition,
  getCurrentExpressionFunction,
  manipulateCaretPosition
} from "./utils";
import FunctionDetails from "./FunctionDetails";

class ExpressionField extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
    this.listRef = React.createRef();
    this.state = expressionFieldReducer(undefined, {});

    /**
     * In order to insert the fields correctly, they must be already wrapped inside
     * brackets. In case they are not, we can do something like
     * ```js
     * const newSuggestions = this.props.suggestions
     *  .map(
     * ({ type, name, ...suggestion }) => type === 'field'
     *  ? { type, name: `[${name}]`,  ...suggestion }
     *  : { type, name, ...suggestion }
     * )
     * this.suggestionsFuse = new Fuse(newSuggestions, someConfig)
     * ```
     */
    this.suggestionsFuse = new Fuse(this.props.suggestions, {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["name"]
    });
    this.subscriptionEvents = "mousedown touchstart input paste cut mousemove select selectstart".split(
      " "
    );
  }

  componentDidUpdate(prevProps) {
    // if the reference for the fields or functions changes, we update the search
    if (prevProps.suggestions !== this.props.suggestions) {
      this.suggestionsFuse = new Fuse(this.props.suggestions, {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ["name"]
      });
    }

    if (prevProps.value !== this.props.value) {
      this.inputRef.current.innerText = this.props.value;
    }
  }

  handleCaretChange = () => this.forceUpdate();

  componentDidMount() {
    const { current: inputRef } = this.inputRef;
    const { initialValue, value } = this.props;

    this.subscriptionEvents.forEach(eventName => {
      inputRef.addEventListener(eventName, this.handleCaretChange);
    });

    if (initialValue || value) {
      this.inputRef.current.innerText = initialValue || value;
    }
  }

  componentWillUnmount() {
    const { current: inputRef } = this.inputRef;
    this.subscriptionEvents.forEach(eventName => {
      inputRef.removeEventListener(eventName, this.handleCaretChange);
    });
  }

  get focusedSuggestion() {
    return this.state.focusedSuggestion;
  }

  get filteredFieldSuggestions() {
    const [, , cleanSearchText] = this.getActiveTextSearch();
    return this.fieldsFuse.search(cleanSearchText);
  }

  get filteredSuggestions() {
    const [, , cleanSearchText] = this.getActiveTextSearch();
    return this.suggestionsFuse.search(cleanSearchText);
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
    const [match] = this.suggestionsFuse.search(currentFunctionName);
    if (!match || match.type !== "function") return null;
    return match;
  }

  dispatchEvent = (action, callback) => {
    const prevState = this.state;
    this.setState(expressionFieldReducer(prevState, action), (...params) => {
      if (callback) callback(...params);
    });
  };

  /** @param {FocusEvent} e */
  handleInputFocus = e => {
    e.persist();
    this.dispatchEvent({ type: "INPUT_FOCUSED" });
  };

  /** @param {FocusEvent} _e */
  handleInputBlur = _e => {
    this.dispatchEvent({ type: "INPUT_BLURRED" });
  };

  shouldRenderSuggestions = () => {
    return (
      this.state.isInputFocused && this.state.filteredSuggestions.length > 0
    );
  };

  shouldRenderFunctionDetails = () => {
    const { currentFunction } = this;

    return (
      this.state.isInputFocused &&
      currentFunction &&
      !this.shouldRenderSuggestions()
    );
  };

  getActiveTextSearch = () => {
    if (!this.inputRef.current) return [0, 0, ""];
    const { innerText } = this.inputRef.current;
    if (!innerText === "") return [0, 0, ""];
    const cursorPosition = getCaretPosition(this.inputRef.current);
    let startIndex = cursorPosition;
    let endIndex = cursorPosition;

    for (startIndex = cursorPosition - 1; startIndex > 0; startIndex--) {
      if (variableSplitters.includes(innerText.charAt(startIndex))) {
        startIndex++;
        break;
      }
    }

    for (endIndex = cursorPosition; endIndex <= innerText.length; endIndex++) {
      if (variableSplitters.includes(innerText.charAt(endIndex))) break;
    }

    const result = [
      startIndex,
      endIndex,
      innerText.substring(startIndex, endIndex)
    ];
    return result;
  };

  handleSuggestionClicked = suggestion => {
    const { innerText } = this.inputRef.current;
    const [start, end] = this.getActiveTextSearch();
    const leftText = innerText.substring(0, start === 0 ? start : start);
    const rightText = innerText.substring(end);
    const newExpression =
      suggestion.type === "function"
        ? [`${leftText}${suggestion.name}(`, `)${rightText}`]
        : [`${leftText}${suggestion.name}`, rightText];

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

  insertFunction = () => {
    const [, , suggestionText] = this.getActiveTextSearch();
    this.handleSuggestionClicked({ name: suggestionText, type: "function" });
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
      case KEYBOARD_KEYS.TAB:
        e.preventDefault();
        const suggestion = filteredSuggestions[focusedSuggestion];
        if (suggestion) this.handleSuggestionClicked(suggestion);
        return;
      default:
        return;
    }
  };

  /** @param {KeyboardEvent} _e */
  handleKeyUp = e => {
    if ([KEYBOARD_KEYS.UP_ARROW, KEYBOARD_KEYS.DOWN_ARROW].includes(e.keyCode))
      return;
    this.dispatchEvent({
      type: "USER_INPUT",
      payload: {
        filteredSuggestions: this.filteredSuggestions
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
        {this.shouldRenderSuggestions() && (
          <ExpressionSuggestions
            ref={this.listRef}
            suggestions={this.state.filteredSuggestions}
            onSuggestionClicked={this.handleSuggestionClicked}
            onSuggestionFocusChange={this.handleSuggestionFocusChange}
            focusedSuggestionIndex={this.focusedSuggestion}
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
