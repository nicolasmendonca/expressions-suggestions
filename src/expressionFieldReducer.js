import { suggestions } from "./constants";

const initialState = {
  isInputFocused: false,
  inputContent: "",
  focusedSuggestion: 0,
  filteredSuggestions: suggestions
};

export const expressionFieldReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INPUT_FOCUSED":
      return {
        ...state,
        isInputFocused: true,
        focusedSuggestion: state.filteredSuggestions.length === 0 ? -1 : 0
      };
    case "INPUT_BLURRED":
      return {
        ...state,
        isInputFocused: false
      };
    case "USER_INPUT":
      const filteredSuggestions = action.payload.filteredSuggestions;
      return {
        ...state,
        focusedSuggestion: filteredSuggestions.length === 0 ? -1 : 0,
        inputContent: action.payload.inputValue,
        filteredSuggestions
      };
    case "SUGGESTION_CLICKED":
      return {
        ...state,
        isInputFocused: false,
        inputContent: action.payload.function
      };
    case "SUGGESTION_FOCUSED":
      return {
        ...state,
        focusedSuggestion: action.payload
      };
    default:
      return state;
  }
};
