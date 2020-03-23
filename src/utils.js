const variableSplitters = [" ", ",", "(", ")"];

export const getCurrentExpressionFunction = (expression, caretPosition) => {
  let functionEndPosition = 0;
  let functionStartPosition = 0;
  let parenthesisToIgnore = 0;
  for (let i = caretPosition - 1; i >= 0; i--) {
    if (expression.charAt(i) === ")") {
      parenthesisToIgnore++;
      continue;
    }

    if (expression.charAt(i) === "(") {
      if (parenthesisToIgnore > 0) {
        parenthesisToIgnore--;
        continue;
      }

      functionEndPosition = i;
      break;
    }
  }

  for (let i = functionEndPosition - 1; i >= 0; i--) {
    if (variableSplitters.includes(expression.charAt(i))) {
      functionStartPosition = i;
      break;
    }
  }

  return expression.substring(
    functionStartPosition === 0 ? 0 : functionStartPosition + 1,
    functionEndPosition
  );
};

export const isInsertingField = (text, caretPosition) => {
  if (!text) return false;
  if (["]"].includes(text.charAt(caretPosition - 1))) return false;

  for (let i = caretPosition - 1; i >= 0; i--) {
    if (["["].includes(text.charAt(i))) return text.substring(i, caretPosition);
    if (variableSplitters.includes(text.charAt(i))) return false;
  }

  return false;
};
