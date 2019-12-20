import { Plugin } from "rollup";
import { createFilter } from "rollup-pluginutils";
import { dirname } from "path";
import { readFileSync } from "fs";

type PathCondition = string | RegExp;

interface RollupPluginBinaryOptions {
  include: PathCondition | Array<PathCondition>;
  exclude?: PathCondition | Array<PathCondition>;
}

const readFileRegex = /(require\(['"]fs["']\)|fs.)?readFileSync\(([^)]+)(,['"][^)]+['"])?\)/gi;

export default function RollupPluginBinary(
  options: RollupPluginBinaryOptions = { include: "**/*" }
): Plugin {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: "rollup-binary",
    transform(code, id) {
      if (!filter(id)) return;

      let newCode = code.replace(
        readFileRegex,
        (match, _, sourceMatch, encodingMatch) => {
          let srcEval: string;

          try {
            let srcEval = eval(
              sourceMatch.replace(/__dirname/g, `"${dirname(id)}"`)
            );

            if (typeof srcEval !== "string") return match;

            console.info(
              `Match: ${sourceMatch}, encoding: ${encodingMatch}, source: ${srcEval}`
            );
          } catch (ex) {
            return match;
          }

          return "TEST_INSERT_STRING";
        }
      );

      return {
        code: newCode,
        map: null
      };
    }
  };
}
