import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.199.0/assert/mod.ts";
import { __private as p, __private_run as run } from "./mod.ts";

// deno-lint-ignore no-explicit-any
const dictFrom = (o: object): Map<string, any> => {
  return new Map(Object.entries(o))
}

Deno.test("token", () => {
  const parser = p.token;

  let output = run(parser).with("test ");

  assert(output.isOk);
  assertEquals(output.value, "test");

  output = run(parser).with("test");

  assertFalse(output.isOk);

  try {
    // This should never happen
    output = run(parser).with(" test");
  } catch (e) {
    assert(!e.isOk);
  }
});

Deno.test("unit", () => {
  const parser = p.unit;

  const output = run(parser).with("null");

  assert(output.isOk);
  assertEquals(output.value, null);
});

Deno.test("boolean", () => {
  const parser = p.boolean;

  let output = run(parser).with("true");

  assert(output.isOk);
  assertEquals(output.value, true);

  output = run(parser).with("false");

  assert(output.isOk);
  assertEquals(output.value, false);

  // Expected to fail, only true/false are allowed
  output = run(parser).with("True");

  assertFalse(output.isOk);
});

Deno.test("number", () => {
  const parser = p.number;

  let output = run(parser).with("1");

  assert(output.isOk);
  assertEquals(output.value, 1);

  output = run(parser).with("1.");

  assert(output.isOk);
  assertEquals(output.value, 1.);

  output = run(parser).with("1.1");

  assert(output.isOk);
  assertEquals(output.value, 1.1);

  output = run(parser).with("0.1");

  assert(output.isOk);
  assertEquals(output.value, 0.1);

  // Numbers need to start with a number
  output = run(parser).with(".1")

  assertFalse(output.isOk);
});

Deno.test("string", () => {
  const parser = p.string;

  let output = run(parser).with('"hello"');

  assert(output.isOk);
  assertEquals(output.value, "hello");

  // Strings must always be surrounded by double quotes
  output = run(parser).with("hello");

  assertFalse(output.isOk);

  // Strings must always be surrounded by double quotes, single quotes are invalid
  output = run(parser).with("'hello'");

  assertFalse(output.isOk);
});

// TODO you-win August 21, 2023: this needs more tests
Deno.test("key", () => {
  const parser = p.key;

  let output = run(parser).with("hello ");

  assert(output.isOk);
  assertEquals(output.value, "hello");

  output = run(parser).with('"hello" ');

  assert(output.isOk);
  assertEquals(output.value, '"hello"');

  output = run(parser).with("'hello' ");

  assert(output.isOk);
  assertEquals(output.value, "'hello'");
});

// Scalar is just a combination of all previous parsers, so thorough testing is
// unnecessary in this test. The individual parsers should be tested instead.
Deno.test("scalar", () => {
  const parser = p.scalar;

  let output = run(parser).with("null");

  assert(output.isOk);
  assertEquals(output.value, null);

  output = run(parser).with("true");

  assert(output.isOk);
  assertEquals(output.value, true);

  output = run(parser).with("1.0");
  
  assert(output.isOk);
  assertEquals(output.value, 1.0);

  output = run(parser).with('"hello"');

  assert(output.isOk);
  assertEquals(output.value, "hello");

  output = run(parser).with("[]");

  assert(output.isOk);
  assertEquals(output.value, []);

  output = run(parser).with("{}");

  assert(output.isOk);
  assertEquals(output.value, {});
});

Deno.test("whitespace", () => {
  const parser = p.whitespace;

  let output = run(parser).with(" ");

  assert(output.isOk);
  assertEquals(output.value, " ");

  output = run(parser).with("   ");

  assert(output.isOk);
  assertEquals(output.value, "   ");

  output = run(parser).with(" hello");

  assert(output.isOk);
  assertEquals(output.value, " ");

  output = run(parser).with("");

  assertFalse(output.isOk);
});

Deno.test("comma", () => {
  const parser = p.comma;

  let output = run(parser).with(",");

  assert(output.isOk);
  assertEquals(output.value, ",");

  output = run(parser).with(" ,");
  
  assertFalse(output.isOk);
});

Deno.test("lineComment", () => {
  const parser = p.lineComment;

  let output = run(parser).with("// hello world!");

  assert(output.isOk);
  assertEquals(output.value, " hello world!");

  output = run(parser).with("//hello world!");

  assert(output.isOk);
  assertEquals(output.value, "hello world!");

  output = run(parser).with("//");

  assert(output.isOk);
  assertEquals(output.value, "");

  output = run(parser).with("hello 2");

  assertFalse(output.isOk);
});

Deno.test("blockComment", () => {
  const parser = p.blockComment;

  let output = run(parser).with("/* hello */");

  assert(output.isOk);
  assertEquals(output.value, " hello ");

  output = run(parser).with("/* hello \n*/");

  assert(output.isOk);
  assertEquals(output.value, " hello \n");

  // Unclosed block comment
  output = run(parser).with("/* hello \n");

  assertFalse(output.isOk);

  // Unopened block comment
  output = run(parser).with("hello \n*/");

  assertFalse(output.isOk);
});

// allIgnored is a combination of all previous ignored parsers, so thorough testing
// is not necessary in this test.
Deno.test("allIgnored", () => {
  const parser = p.allIgnored;

  let output = run(parser).with(" ");

  assert(output.isOk);
  assertEquals(output.value, null);

  output = run(parser).with(",");

  assert(output.isOk);
  assertEquals(output.value, null);

  output = run(parser).with("// hello");

  assert(output.isOk);
  assertEquals(output.value, null);

  output = run(parser).with("/*\nhello\n*/");

  assert(output.isOk);
  assertEquals(output.value, null);
});

Deno.test("keyValue", () => {
  const parser = p.keyValue;

  let output = run(parser).with("hello 1");

  assert(output.isOk);
  assertEquals(output.value, ["hello", 1]);

  output = run(parser).with("hello \"world\"");

  assert(output.isOk);
  assertEquals(output.value, ["hello", "world"]);

  output = run(parser).with("hello \"world\"//comment");

  assert(output.isOk);
  assertEquals(output.value, ["hello", "world"]);

  output = run(parser).with("hello \"world\"/*block comment/*");

  assert(output.isOk);
  assertEquals(output.value, ["hello", "world"]);

  output = run(parser).with("hello /*inner block comment*/ \"world\"");

  assert(output.isOk);
  assertEquals(output.value, ["hello", "world"]);

  output = run(parser).with("\"hello\" \"world\"//comment");

  assert(output.isOk);
  assertEquals(output.value, ["\"hello\"", "world"]);

  output = run(parser).with("hello false");

  assert(output.isOk);
  assertEquals(output.value, ["hello", false]);

  output = run(parser).with("hello null");

  assert(output.isOk);
  assertEquals(output.value, ["hello", null]);

  output = run(parser).with("hello [1]");

  assert(output.isOk);
  assertEquals(output.value, ["hello", [1]])

  output = run(parser).with("hello {value 1}");

  assert(output.isOk);
  assertEquals(output.value, ["hello", {value: 1}]);

  // No value
  output = run(parser).with("hello")

  assertFalse(output.isOk)

  // No value
  output = run(parser).with("hello ")

  assertFalse(output.isOk)

  // No value
  output = run(parser).with("hello // comment")

  assertFalse(output.isOk)
});

Deno.test("listContents", () => {
  const parser = p.listContents;

  let output = run(parser).with("1 \"hello\" false null");

  assert(output.isOk);
  assertEquals(output.value, [1, "hello", false, null]);

  output = run(parser).with("");

  assert(output.isOk);
  assertEquals(output.value, []);

  output = run(parser).with("1 // hello");

  assert(output.isOk);
  assertEquals(output.value, [1]);
})

// TODO more cases
Deno.test("list", () => {
  const parser = p.list;

  let output = run(parser).with("[1 \"hello\" false null]");

  assert(output.isOk);
  assertEquals(output.value, [1, "hello", false, null]);

  output = run(parser).with("[1 \"hello\" false /* inner */ null] // hello");

  assert(output.isOk);
  assertEquals(output.value, [1, "hello", false, null]);

  output = run(parser).with("[]");

  assert(output.isOk);
  assertEquals(output.value, []);

  // TODO broken
  // output = run(parser).with("[/* blah */]");

  // console.log(output);

  // assert(output.isOk);
  // assertEquals(output.value, []);
});

Deno.test("dictContents", () => {
  const parser = p.dictContents;

  let output = run(parser).with(`
    hello "world"
    num 1
    bool true
    unit null
  `);

  assert(output.isOk);
  assertEquals(output.value, {
    hello: "world",
    num: 1,
    bool: true,
    unit: null
  });

  output = run(parser).with(`
    hello "world" // line comment
    num /*block comment */ 1
    /* block comment */ bool true
    unit
    null
  `);

  assert(output.isOk);
  assertEquals(output.value, {
    hello: "world",
    num: 1,
    bool: true,
    unit: null
  });

  output = run(parser).with(`
    inner {}
  `);

  assert(output.isOk);
  assertEquals(output.value, { inner: {} });
});

Deno.test("dict", () => {
  const parser = p.dict;

  let output = run(parser).with("{}");

  assert(output.isOk);
  assertEquals(output.value, {});
});
