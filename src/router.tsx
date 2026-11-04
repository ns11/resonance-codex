import { createRouter, parseSearchWith, stringifySearchWith } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

/** Section ids like 1.4 must stay strings. The default search codec JSON-parses
 *  anything that starts with a digit, so ?sec=1.4 arrived as a number and crashed. */
function parseSearchValue(value: string) {
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  return JSON.parse(value);
}

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
    parseSearch: parseSearchWith(parseSearchValue),
    stringifySearch: stringifySearchWith(JSON.stringify),
  });
}