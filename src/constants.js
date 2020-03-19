export const functions = [
  {
    id: 1,
    name: "LENGTH",
    type: "function",
    description: "Returns the amount of elements inside a list or string",
    arguments: [
      {
        name: "field",
        description: "field that contains certain amount of elements"
      }
    ]
  },
  {
    id: 2,
    name: "CONCATENATE",
    type: "function",
    description: "Prints two fields together",
    arguments: [
      {
        name: "Field_1",
        description: "field that will be prepended with another value"
      },
      {
        name: "Field_2",
        description: "field that will be appended with another value"
      }
    ]
  },
  {
    id: 3,
    name: "ADD",
    type: "function",
    description: "Performs the addition of two values",
    arguments: [
      {
        name: "Augend",
        description: "Numeric value"
      },
      {
        name: "Addend",
        description: "numeric value"
      }
    ]
  },
  {
    id: 4,
    name: "SUBTRACT",
    type: "function",
    description: "Performs the subtraction of two numbers",
    arguments: [
      {
        name: "Subtrahend",
        description: "Numeric value"
      },
      {
        name: "Minuend",
        description: "Numeric value"
      }
    ]
  },
  {
    id: 5,
    name: "MULTIPLY",
    type: "function",
    description: "Performs the multiplication of two values",
    arguments: [
      {
        name: "Multiplicand",
        description: "Numeric value"
      },
      {
        name: "Multiplier",
        description: "Numeric value"
      }
    ]
  },
  {
    id: 6,
    name: "DIVIDE",
    type: "function",
    description: "Performs the division of two numbers",
    arguments: [
      {
        name: "Dividend",
        description: "Numeric value"
      },
      {
        name: "Divisor",
        description: "Numeric value"
      }
    ]
  }
];

export const fields = [
  {
    id: 7,
    name: "job_title",
    type: "field"
  },
  {
    id: 8,
    name: "job_description",
    type: "field"
  }
];

export const KEYBOARD_KEYS = {
  TAB: 9,
  DOWN_ARROW: 40,
  UP_ARROW: 38,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  OPEN_BRACKET: 219,
  CLOSE_BRACKET: 221,
  ENTER: 13,
  OPEN_PARENTHESIS: 57
};

export const variableSplitters = [" ", ",", "(", ")"];
