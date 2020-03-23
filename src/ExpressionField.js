import React from "react";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import { KEYBOARD_KEYS, variableSplitters } from "./constants";
import { getCurrentExpressionFunction } from "./utils";
import FunctionDetails from "./FunctionDetails";
import { position } from "caret-pos";

/**
 * @typedef {Object} Argument
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} Suggestion
 * @property {string} name
 * @property {number} [id]
 * @property {string} [description]
 * @property {Argument[]} [arguments]
 * @property {'field'|'function'} type
 */

class ExpressionField extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
    this.listRef = React.createRef();
    this.state = {
      isInputFocused: false,
      focusedSuggestion: 0,
      filteredSuggestions: []
    };

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
    this.subscriptionEvents =
      "mousedown touchstart input paste cut mousemove select selectstart";
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
      this.inputRef.current.value = this.props.value;
    }
  }

  componentDidMount() {
    const { current: inputRef } = this.inputRef;
    const { initialValue, value } = this.props;

    this.subscriptionEvents.split(" ").forEach(eventName => {
      inputRef.addEventListener(eventName, this.handleCaretChange);
    });

    if (initialValue || value) {
      inputRef.value = initialValue || value;
    }
  }

  componentWillUnmount() {
    const { current: inputRef } = this.inputRef;
    this.subscriptionEvents.split(" ").forEach(eventName => {
      inputRef.removeEventListener(eventName, this.handleCaretChange);
    });
  }

  get focusedSuggestionIndex() {
    return this.state.focusedSuggestion;
  }

  /** @returns {suggestion[]} suggestions */
  get filteredSuggestions() {
    const [, , cleanSearchText] = this.getActiveTextSearch();
    return this.suggestionsFuse.search(cleanSearchText);
  }

  get caretPosition() {
    return position(this.inputRef.current).pos;
  }

  set caretPosition(pos) {
    position(this.inputRef.current, pos);
  }

  /** @returns {string|null} */
  get currentFunctionName() {
    if (!this.inputRef.current) return null;
    const { caretPosition } = this;
    return getCurrentExpressionFunction(
      this.inputRef.current.value,
      caretPosition
    );
  }

  /** @returns {string|null} */
  get currentFunction() {
    const { currentFunctionName } = this;
    if (!currentFunctionName) return null;
    const [match] = this.suggestionsFuse.search(currentFunctionName);
    if (!match || match.type !== "function") return null;
    return match;
  }

  /** @param {FocusEvent} e */
  handleInputFocus = e => {
    e.persist();
    this.setState({ isInputFocused: true });
  };

  /** @param {FocusEvent} _e */
  handleInputBlur = _e => this.setState({ isInputFocused: false });

  /** @returns {boolean} */
  shouldRenderSuggestions = () =>
    this.state.isInputFocused && this.state.filteredSuggestions.length > 0;

  /** @returns {boolean} */
  shouldRenderFunctionDetails = () =>
    this.state.isInputFocused &&
    this.currentFunction &&
    !this.shouldRenderSuggestions();

  /** @returns {[number, number, string]} [startPosition, endPosition, match] */
  getActiveTextSearch = () => {
    if (!this.inputRef.current) return [0, 0, ""];
    const { value } = this.inputRef.current;
    if (!value === "") return [0, 0, ""];
    const { caretPosition } = this;
    let startIndex = caretPosition;
    let endIndex = caretPosition;

    for (startIndex = caretPosition - 1; startIndex > 0; startIndex--) {
      if (variableSplitters.includes(value.charAt(startIndex))) {
        startIndex++;
        break;
      }
    }

    for (endIndex = caretPosition; endIndex <= value.length; endIndex++) {
      if (variableSplitters.includes(value.charAt(endIndex))) break;
    }

    const result = [
      startIndex,
      endIndex,
      value.substring(startIndex, endIndex)
    ];
    return result;
  };

  /** @param {Partial<Suggestion>} suggestion */
  handleSuggestionClicked = suggestion => {
    const { value } = this.inputRef.current;
    const [start, end] = this.getActiveTextSearch();
    const leftText = value.substring(0, start === 0 ? start : start);
    const rightText = value.substring(end);
    const newExpression =
      suggestion.type === "function"
        ? [`${leftText}${suggestion.name}(`, `)${rightText}`]
        : [`${leftText}${suggestion.name}`, rightText];

    this.inputRef.current.value = newExpression.join("");

    this.caretPosition = newExpression[0].length;
  };

  // Required to check if the new caret position is pointing to another field/function
  handleCaretChange = () => this.forceUpdate();

  /** @param {number} index */
  handleSuggestionFocusChange = index =>
    this.setState({
      isInputFocused: true,
      focusedSuggestion: index
    });

  focusOnActiveSuggestion = () => {
    if (!this.listRef.current) return;
    this.listRef.current
      .querySelector(".hasFocus")
      .scrollIntoView({ block: "center", behavior: "smooth" });
  };

  moveSuggestionIndex = increment => {
    const { filteredSuggestions, focusedSuggestion } = this.state;
    const target = filteredSuggestions[focusedSuggestion + increment]
      ? focusedSuggestion + increment
      : 0;
    this.setState(
      {
        focusedSuggestion: target
      },
      this.focusOnActiveSuggestion
    );
  };

  selectNextSuggestion = () => this.moveSuggestionIndex(+1);
  selectPreviousSuggestion = () => this.moveSuggestionIndex(-1);

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
      case KEYBOARD_KEYS.ESCAPE:
        return this.setState({ isInputFocused: false });
      default:
        return;
    }
  };

  /** @param {KeyboardEvent} _e */
  handleKeyUp = e => {
    if ([KEYBOARD_KEYS.UP_ARROW, KEYBOARD_KEYS.DOWN_ARROW].includes(e.keyCode))
      return;

    const { filteredSuggestions } = this;
    this.setState({
      focusedSuggestion: filteredSuggestions.length === 0 ? -1 : 0,
      filteredSuggestions
    });
  };

  render() {
    return (
      <div className="Expression-Field">
        <input
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
            focusedSuggestionIndex={this.focusedSuggestionIndex}
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
