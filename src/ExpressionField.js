import React from "react";
import ContentEditable from "react-contenteditable";
import Fuse from "fuse.js";
import ExpressionSuggestions from "./ExpressionSuggestions";
import {
  suggestions,
  KEYBOARD_KEYS,
  variableSplitters
  // fields
} from "./constants";
import { expressionFieldReducer } from "./expressionFieldReducer";
import {
  getCaretPosition,
  setCaretPosition,
  getCurrentExpressionFunction,
  currentInputTextContainsFunction
  // insertText
} from "./utils";
import FunctionDetails from "./FunctionDetails";

class ExpressionField extends React.Component {
  constructor(props) {
    super(props);

    this.inputRef = React.createRef();
    this.listRef = React.createRef();
    this.state = expressionFieldReducer(undefined, {});

    this.eventsToSubscribeForCaretChange =
      "keypress mousedown touchstart input paste cut mousemove select selectstart";
  }

  get focusedFunctionSuggestion() {
    return this.state.focusedFunctionSuggestion;
  }

  get filteredFunctionSuggestions() {
    const options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["functionName"]
    };
    const [, , cleanSearchText] = this.getActiveWrittenFunction();
    const matches = new Fuse(suggestions, options).search(cleanSearchText);
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

  componentDidMount() {
    if (!this.inputRef.current) throw new Error("Input ref is not set");

    this.eventsToSubscribeForCaretChange.split(" ").forEach(event => {
      this.inputRef.current.addEventListener(event, this.handleCaretChange);
    });
  }

  componentWillUnmount() {
    this.eventsToSubscribeForCaretChange.split(" ").forEach(event => {
      this.inputRef.current.removeEventListener(event, this.handleCaretChange);
    });
  }

  dispatchEvent = (action, callback) => {
    const prevState = this.state;
    this.setState(expressionFieldReducer(prevState, action), (...params) => {
      if (callback) callback(...params);
      console.log({ prevState, action, state: this.state });
    });
  };

  /* getFieldSuggestion = searchTerm => {
    const sanitized = searchTerm.replace(/\[|\]/g, () => "");
    const [result] = new Fuse(fields, {
      minMatchCharLength: 1,
      keys: ["id", "field"],
      threshold: 0
    }).search(sanitized);
    return result;
  }; */

  handleCaretChange = () =>
    setTimeout(() => {
      const caretPosition = getCaretPosition(this.inputRef.current);
      this.dispatchEvent({
        type: "CURSOR_POSITION_CHANGED",
        payload: caretPosition
      });
    }, 50);

  /** @param {FocusEvent} e */
  handleInputFocus = e => {
    e.persist();
    this.dispatchEvent({ type: "INPUT_FOCUSED" });
  };

  /** @param {FocusEvent} e */
  handleInputBlur = e => {
    this.dispatchEvent({ type: "INPUT_BLURRED" });
  };

  /** @param {KeyboardEvent} e  */
  handleUserInput = e => {
    // console.warn(e)
    this.dispatchEvent({
      type: "USER_INPUT",
      payload: {
        inputValue: e.target.value,
        filteredFunctionSuggestions: this.filteredFunctionSuggestions
      }
    });
    this.handleCaretChange();
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

  /*   insertField = () => {
    const input = this.inputRef.current;
    const caretPosition = getCaretPosition(input);
    const fieldHTML = `<span class="field">[]</span>`;

    this.dispatchEvent({
      type: "INSERT_FIELD_SUGGESTION",
      payload: insertText(input.innerText, caretPosition, fieldHTML)
    });
    setTimeout(() => {
      setCaretPosition(input, caretPosition + 1);
    }, 50);
  }; */

  handleSuggestionClicked = suggestion => {
    const { innerText } = this.inputRef.current;
    const [start, end] = this.getActiveWrittenFunction();
    const leftText = innerText.substring(0, start === 0 ? start : start + 1);
    const rightText = innerText.substring(end);
    const newExpression = [
      `${leftText}${suggestion.functionName}(`,
      `)${rightText}`
    ];

    this.dispatchEvent(
      { type: "SUGGESTION_CLICKED", payload: newExpression.join("") },
      () => {
        setTimeout(() => {
          this.inputRef.current.focus();
          setCaretPosition(this.inputRef.current, newExpression[0].length);
        }, 50);
      }
    );
    this.handleCaretChange();
  };

  handleSuggestionFocusChange = index => {
    this.dispatchEvent({ type: "SUGGESTION_FOCUSED", payload: index });
  };

  focusOnActiveSuggestion = () => {
    if (!this.listRef.current) return;
    this.listRef.current
      .querySelector(".hasFocus") // @TODO Fix
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
    this.handleCaretChange();
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
      case KEYBOARD_KEYS.RIGHT_ARROW:
      case KEYBOARD_KEYS.LEFT_ARROW:
        return this.handleCaretChange();
      case KEYBOARD_KEYS.OPEN_PARENTHESIS:
        e.preventDefault();
        return this.insertFunction();
      case KEYBOARD_KEYS.ENTER:
        e.preventDefault();
        const suggestion =
          filteredFunctionSuggestions[focusedFunctionSuggestion];
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
