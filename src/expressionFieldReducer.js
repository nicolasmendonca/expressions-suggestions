import { suggestions } from "./constants";

const initialState = {
  isInputFocused: false,
  inputContent: "",
  focusedSuggestion: 0,
  filteredFunctionSuggestions: suggestions,
  cursorPosition: 0
};

export const expressionFieldReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INPUT_FOCUSED":
      return {
        ...state,
        isInputFocused: true,
        focusedSuggestion:
          state.filteredFunctionSuggestions.length === 0 ? -1 : 0
      };
    case "INPUT_BLURRED":
      return {
        ...state,
        isInputFocused: false
      };
    case "USER_INPUT":
      const filteredFunctionSuggestions =
        action.payload.filteredFunctionSuggestions;
      return {
        ...state,
        focusedSuggestion: filteredFunctionSuggestions.length === 0 ? -1 : 0,
        inputContent: action.payload.inputValue,
        filteredFunctionSuggestions
      };
    case "SUGGESTION_CLICKED":
      return {
        ...state,
        inputContent: action.payload
      };
    case "SUGGESTION_FOCUSED":
      return {
        ...state,
        focusedSuggestion: action.payload
      };
    case "CURSOR_POSITION_CHANGED":
      return {
        ...state,
        cursorPosition: action.payload
      };
    default:
      return state;
  }
};
