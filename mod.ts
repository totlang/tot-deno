import * as sigma from "https://cdn.skypack.dev/@nrsk/sigma@v3.6.5?dts";
import { map, mapTo, defer } from "https://cdn.skypack.dev/@nrsk/sigma@v3.6.5?dts";

const token = map(
  sigma.takeUntil(sigma.any(), sigma.whitespace()),
  (v, s) => {
    if (v[0].length < 1) {
      throw new sigma.ParserError({
        span: s,
        pos: -1,
        expected: "whitespace encountered before token"
      });
    }

    return v[0].reduce((prev, val) => prev + val);
  }
);

// TODO change this to a sentinel value?
// type Unit = null;
const unit = mapTo(sigma.string("null"), null);
// unit.with(
//   mapTo(sigma.string("null"), null)
// );

// type Boolean = boolean;
const boolean = sigma.choice(
  mapTo(sigma.string("true"), true),
  mapTo(sigma.string("false"), false)
);
// boolean.with(
//   sigma.choice(
//     mapTo(sigma.string("true"), true),
//     mapTo(sigma.string("false"), false)
//   )
// );

// type Number = number;
const number = sigma.choice(sigma.float(), sigma.whole());
// number.with(
//   sigma.choice(sigma.float(), sigma.whole())
// );

// type String = string;
const string = map(
  sigma.takeRight(sigma.string("\""), sigma.takeUntil(sigma.any(), sigma.string("\""))),
  (v) => v[0].reduce((prev, val) => prev + val)
);
// string.with(
//   map(
//     sigma.takeRight(sigma.string("\""), sigma.takeUntil(sigma.any(), sigma.string("\""))),
//     (v) => v[0].reduce((prev, val) => prev + val)
//   )
// );

const key = sigma.choice(token, string);

// deno-lint-ignore no-explicit-any
type Scalar = null | boolean | number | string | Array<any> | object;
const scalar = sigma.defer<Scalar>();
// const scalar = sigma.choice(
//   unit,
//   bool,
//   number,
//   string
// );

const whitespace = sigma.whitespace();
const comma = sigma.string(",");
const lineComment = sigma.takeRight(
  sigma.string("//"),
  map(
    sigma.takeUntil(
      sigma.any(), sigma.choice(sigma.eol(), sigma.eof())
    ),
    (v) => {
      if (v[0].length < 1) {
        return "";
      }

      return v[0].reduce((prev, val) => prev + val);
    }
  )
);
const blockComment = map(
  sigma.takeRight(
    sigma.string("/*"),
    sigma.takeUntil(sigma.any(), sigma.string("*/"))
  ),
  (v) => {
    if (v[0].length < 1) {
      return "";
    }

    return v[0].reduce((prev, val) => prev + val);
  }
);
const allIgnored = mapTo(
  sigma.many(sigma.choice(lineComment, blockComment, comma, whitespace)),
  null
);

const keyValue = sigma.takeMid(
  allIgnored,
  sigma.takeSides(key, allIgnored, scalar),
  allIgnored
);

const listContents = sigma.many(sigma.takeMid(allIgnored, scalar, allIgnored));
// type List = Array<any>;
const list = sigma.takeMid(
  sigma.string("["),
  listContents,
  sigma.string("]")
);
// list.with(
//   sigma.takeMid(
//     sigma.string("["),
//     listContents,
//     sigma.string("]")
//   )
// );

const dictContents = sigma.map(
  sigma.many(keyValue),
  (v) => {
    const dict = new Map();
    v.forEach(element => {
      dict.set(element[0], element[1]);
    });

    return Object.fromEntries(dict);
  }
);
// type Dict = Map<any, any>;
const dict = sigma.takeMid(sigma.string("{"), dictContents, sigma.string("}"));
// dict.with(
//   sigma.takeMid(sigma.string("{"), dictContents, sigma.string("}"))
// );

scalar.with(
  sigma.choice(
    unit,
    boolean,
    number,
    string,
    list,
    dict
  )
);

/**
 * Parse some input as a generic object.
 * 
 * @param input A string to be parsed into an object.
 */
export const parse = (input: string) => {
  const output = sigma.run(dictContents).with(input);
  
  console.log(output);
};

/**
 * Exported for testing. These are unstable and subject to change.
 */
export const __private = {
  token,

  unit,
  boolean,
  number,
  string,
  
  key,

  scalar,

  whitespace,
  comma,
  lineComment,
  blockComment,
  allIgnored,

  keyValue,

  listContents,
  list,

  dictContents,
  dict
}
/**
 * Exported for testing. This is just `sigma.run`.
 */
export const __private_run = sigma.run;
