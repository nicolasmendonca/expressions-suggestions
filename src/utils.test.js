import { getCurrentExpressionFunction, isInsertingField } from "./utils";

describe("expression", () => {
  test("[empty string]", () => {
    expect(getCurrentExpressionFunction("", 0)).toBe("");
  });

  test("ADD(#)", () => {
    expect(getCurrentExpressionFunction("ADD()", 4)).toBe("ADD");
  });

  test("ADD(2, #)", () => {
    expect(getCurrentExpressionFunction("ADD(2, )", 7)).toBe("ADD");
  });

  test("ADD(SUBTRACT(#))", () => {
    expect(getCurrentExpressionFunction("ADD(2, SUBTRACT())", 16)).toBe(
      "SUBTRACT"
    );
  });

  test("ADD(SUBTRACT(2, #))", () => {
    expect(getCurrentExpressionFunction("ADD(2, SUBTRACT(2, ))", 19)).toBe(
      "SUBTRACT"
    );
  });

  test("ADD(SUBTRACT(2, 3), #)", () => {
    expect(getCurrentExpressionFunction("ADD(SUBTRACT(2, 3), #)", 20)).toBe(
      "ADD"
    );
  });

  test("ADD(SUBTRACT(2, 3), LENGTH(#))", () => {
    expect(
      getCurrentExpressionFunction("ADD(SUBTRACT(2, 3), LENGTH(#))", 27)
    ).toBe("LENGTH");
  });

  test("ADD(SUBTRACT(2, 3), LENGTH(#))", () => {
    expect(
      getCurrentExpressionFunction("ADD(SUBTRACT(2, 3), LENGTH(#))", 27)
    ).toBe("LENGTH");
  });

  test('ADD(SUBTRACT(2, 3), LENGTH("ASD", [some_field]), #)', () => {
    expect(
      getCurrentExpressionFunction(
        'ADD(SUBTRACT(2, 3), LENGTH("ASD", [some_field]), )',
        49
      )
    ).toBe("ADD");
  });
});

describe("field", () => {
  describe("isInsertingField", () => {
    test("*empty_string*", () => {
      expect(isInsertingField("", 0)).toBeFalsy();
    });

    test("ADD(#)", () => {
      expect(isInsertingField("ADD", 4)).toBeFalsy();
    });

    test("ADD([#])", () => {
      expect(isInsertingField("ADD([])", 5)).toBeTruthy();
    });

    test("ADD(#, [some_field])", () => {
      expect(isInsertingField("ADD(, [some_field])", 4)).toBeFalsy();
    });

    test("ADD([some_field], #)", () => {
      expect(isInsertingField("ADD([some_field], )", 18)).toBeFalsy();
    });

    test("ADD([some_field], [#)", () => {
      expect(isInsertingField("ADD([some_field], [)", 19)).toBeTruthy();
    });

    test("ADD([some_field], [another_field]#)", () => {
      expect(
        isInsertingField("ADD([some_field], [another_field])", 33)
      ).toBeFalsy();
    });
  });
});
