import { Component } from "./models/component/index.js";
import { renderSsr } from "./render/index.render.js";
import parse from "../parse/index.js";
import fuzzymatch from "../utils/fuzzymatch.js";
import get_name_from_filename from "./utils/get_name_from_filename.js";
import { valid_namespaces } from "../utils/namespaces.js";

const valid_options = [
  "name",
  "filename",
  "sourcemap",
  "enableSourcemap",
  "generate",
  "errorMode",
  "varsReport",
  "outputFilename",
  "cssOutputFilename",
  "sveltePath",
  "dev",
  "accessors",
  "immutable",
  "hydratable",
  "legacy",
  "customElement",
  "namespace",
  "tag",
  "css",
  "loopGuardTimeout",
  "preserveComments",
  "preserveWhitespace",
  "cssHash",
  "discloseVersion",
];
const valid_css_values = [true, false, "injected", "external", "none"];
const regex_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
const regex_starts_with_lowercase_character = /^[a-z]/;

let warned_of_format = false;
let warned_boolean_css = false;

/**
 * @param {import('../interfaces.js').CompileOptions} options
 * @param {import('../interfaces.js').Warning[]} warnings
 */
function validate_options(options, warnings) {
  if (/** @type {any} */ (options).format) {
    if (!warned_of_format) {
      warned_of_format = true;
      console.warn(
        'The format option has been removed in Svelte 4, the compiler only outputs ESM now. Remove "format" from your compiler options. ' +
          "If you did not set this yourself, bump the version of your bundler plugin (vite-plugin-svelte/rollup-plugin-svelte/svelte-loader)"
      );
    }
    delete (/** @type {any} */ (options).format);
  }

  const { name, filename, loopGuardTimeout, dev, namespace, css } = options;
  Object.keys(options).forEach((key) => {
    if (!valid_options.includes(key)) {
      const match = fuzzymatch(key, valid_options);
      let message = `Unrecognized option '${key}'`;
      if (match) message += ` (did you mean '${match}'?)`;
      throw new Error(message);
    }
  });
  if (name && !regex_valid_identifier.test(name)) {
    throw new Error(`options.name must be a valid identifier (got '${name}')`);
  }
  if (name && regex_starts_with_lowercase_character.test(name)) {
    const message = "options.name should be capitalised";
    warnings.push({
      code: "options-lowercase-name",
      message,
      filename,
      toString: () => message,
    });
  }
  if (loopGuardTimeout && !dev) {
    const message = "options.loopGuardTimeout is for options.dev = true only";
    warnings.push({
      code: "options-loop-guard-timeout",
      message,
      filename,
      toString: () => message,
    });
  }

  if (css === true || css === false) {
    options.css = css === true ? "injected" : "external";
    if (!warned_boolean_css) {
      console.warn(
        `compilerOptions.css as a boolean is deprecated. Use '${options.css}' instead of ${css}.`
      );
      warned_boolean_css = true;
    }
  }

  if (!valid_css_values.includes(options.css)) {
    throw new Error(
      `compilerOptions.css must be 'injected', 'external' or 'none' (got '${options.css}').`
    );
  }

  if (namespace && valid_namespaces.indexOf(namespace) === -1) {
    const match = fuzzymatch(namespace, valid_namespaces);
    if (match) {
      throw new Error(
        `Invalid namespace '${namespace}' (did you mean '${match}'?)`
      );
    } else {
      throw new Error(`Invalid namespace '${namespace}'`);
    }
  }

  if (options.discloseVersion == undefined) {
    options.discloseVersion = true;
  }
}

export const compile = (source, options = {}) => {
  options = Object.assign(
    { generate: "dom", dev: false, enableSourcemap: true, css: "injected" },
    options
  );

  const warnings = [];
  validate_options(options, warnings);
  const ast = parse(source, options);

  const component = new Component(
    ast,
    source,
    options.name || get_name_from_filename(options.filename) || "Component",
    options,
    warnings
  );

  // *** НЕ РЕНДЕР SSR!!!

  // renderBody
  // renderHead
  // renderCss
  // ??renderJs

  // а еще лучше, пере тем, как недерить - разделить шаблон на эти куски
  // и отправлять на реднер только если один из кусков есть!

  const renderSsrResult = renderSsr(component, options);

  // почему я тут получаю готовый css, а для того, чтобы получить html
  // нужно закидывать результат в generate?
  // вынеси этот функционал на один уровень, сделать асинхронно и последовательно

  // bteToCss
  // bteToHtml
  // bteToHead

  // При этом нужно, чтобы функции свелт выполнялись в штатном.
  // 	типо slot и в целом, скрипты в script

  // if else
  // работа с массивами,
  // прокидывание пропсов

  // нужно вытащить из generate скрипт, который
  // делает из js html и поместить его в
  // renderSsr.

  // на выходе я хочу получать две строки:
  // html и css

  const output = component.generate(renderSsrResult);

  return output;
};
