const test = require("node:test");
const assert = require("node:assert/strict");

const { applyFundSplit } = require("./fund-split.js");

test("split doubles shares and halves the cost basis without changing total value", () => {
  const result = applyFundSplit(
    {
      id: "fund-1",
      name: "ACME",
      shares: "100",
      costPerShare: "10",
      value: "1000",
      cashFlow: "50",
    },
    "split",
  );

  assert.deepEqual(result, {
    id: "fund-1",
    name: "ACME",
    shares: "200",
    costPerShare: "5",
    value: "1000",
    cashFlow: "50",
  });
});

test("reverse split halves shares and doubles the cost basis without changing total value", () => {
  const result = applyFundSplit(
    {
      id: "fund-2",
      name: "Beta",
      shares: "100",
      costPerShare: "10",
      value: "1000",
      cashFlow: "25",
    },
    "reverse",
  );

  assert.deepEqual(result, {
    id: "fund-2",
    name: "Beta",
    shares: "50",
    costPerShare: "20",
    value: "1000",
    cashFlow: "25",
  });
});
