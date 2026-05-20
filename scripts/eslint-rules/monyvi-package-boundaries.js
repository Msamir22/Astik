"use strict";

const KNOWN_DEBT_FILE_SUFFIXES = [];

function normalizePath(fileName) {
  return fileName.replace(/\\/g, "/");
}

function isKnownDebtFile(fileName) {
  const normalized = normalizePath(fileName);
  return KNOWN_DEBT_FILE_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function isTestFile(fileName) {
  const normalized = normalizePath(fileName);
  return (
    normalized.includes("/__tests__/") ||
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".test.tsx") ||
    normalized.endsWith(".spec.ts") ||
    normalized.endsWith(".spec.tsx")
  );
}

function isInsidePackage(fileName, packageName) {
  const normalized = normalizePath(fileName);
  return normalized.includes(`packages/${packageName}/`);
}

function isTypeOnlyImport(node) {
  if (node.importKind === "type") {
    return true;
  }

  return (
    node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => specifier.importKind === "type")
  );
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce Monyvi package dependency direction: apps/mobile -> packages/logic -> packages/db.",
      recommended: false,
    },
    schema: [],
    messages: {
      dbReverseImport:
        "packages/db must not import from '{{source}}'. Move formatting/parsing/app concerns out of the DB package.",
      logicRuntimeDbImport:
        "packages/logic may import @monyvi/db for types only. Use import type or a plain interface instead of a runtime DB dependency.",
    },
  },

  create(context) {
    const fileName = context.getFilename();
    if (isKnownDebtFile(fileName) || isTestFile(fileName)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source =
          typeof node.source.value === "string" ? node.source.value : "";

        if (
          isInsidePackage(fileName, "db") &&
          (source === "@monyvi/logic" ||
            source.startsWith("@monyvi/logic/") ||
            source.startsWith("apps/mobile") ||
            source.startsWith("@/"))
        ) {
          context.report({
            node,
            messageId: "dbReverseImport",
            data: { source },
          });
          return;
        }

        if (
          isInsidePackage(fileName, "logic") &&
          (source === "@monyvi/db" || source.startsWith("@monyvi/db/")) &&
          !isTypeOnlyImport(node)
        ) {
          context.report({
            node,
            messageId: "logicRuntimeDbImport",
          });
        }
      },
    };
  },
};
