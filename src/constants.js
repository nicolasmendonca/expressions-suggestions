export const suggestions = [
  {
    id: 1,
    functionName: "LENGTH",
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
    functionName: "CONCATENATE",
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
    functionName: "ADD",
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
    functionName: "SUBTRACT",
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
    functionName: "MULTIPLY",
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
    functionName: "DIVIDE",
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
    id: 1,
    field: "job_title"
  },
  {
    id: 2,
    field: "job_description"
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
