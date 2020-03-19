import { suggestions } from "./constants";

const initialState = {
  isInputFocused: false,
  inputContent: "",
  focusedFunctionSuggestion: 0,
  filteredFunctionSuggestions: suggestions,
  cursorPosition: 0
};

export const expressionFieldReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INPUT_FOCUSED":
      return {
        ...state,
        isInputFocused: true,
        focusedFunctionSuggestion:
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
        focusedFunctionSuggestion:
          filteredFunctionSuggestions.length === 0 ? -1 : 0,
        filteredFunctionSuggestions
      };
    case "SUGGESTION_FOCUSED":
      return {
        ...state,
        focusedFunctionSuggestion: action.payload
      };
    default:
      return state;
  }
};
