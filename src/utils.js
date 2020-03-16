export function getCaretPosition(editableDiv) {
  var caretPos = 0,
    sel,
    range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode === editableDiv) {
        caretPos = range.endOffset;
      }
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    if (range.parentElement() === editableDiv) {
      var tempEl = document.createElement("span");
      editableDiv.insertBefore(tempEl, editableDiv.firstChild);
      var tempRange = range.duplicate();
      tempRange.moveToElementText(tempEl);
      tempRange.setEndPoint("EndToEnd", range);
      caretPos = tempRange.text.length;
    }
  }
  return caretPos;
}

export function setCaretPosition(element, initialPosition) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(element, initialPosition);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Move caret to a specific point in a DOM element
export function setCaretPosition2(el, pos) {
  // Loop through all child nodes
  for (var node of el.childNodes) {
    if (node.nodeType === 3) {
      // we have a text node
      if (node.length >= pos) {
        // finally add our range
        var range = document.createRange(),
          sel = window.getSelection();
        range.setStart(node, pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return -1; // we are done
      } else {
        pos -= node.length;
      }
    } else {
      pos = setCaretPosition(node, pos);
      if (pos === -1) {
        return -1; // no need to finish the for loop
      }
    }
  }
  return pos; // needed because of recursion stuff
}

const variableSplitters = [" ", ",", "(", ")"];

export const getCurrentExpressionFunction = (expression, cursorPosition) => {
  let functionEndPosition = 0;
  let functionStartPosition = 0;
  let parenthesisToIgnore = 0;
  for (let i = cursorPosition - 1; i >= 0; i--) {
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
