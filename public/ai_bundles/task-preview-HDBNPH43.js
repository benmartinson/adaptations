var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app/javascript/ai_bundles/task_preview_1766084044_fc97c024.jsx
var require_task_preview_1766084044_fc97c024 = __commonJS({
  "app/javascript/ai_bundles/task_preview_1766084044_fc97c024.jsx"() {
    var SectionTitle = ({ children }) => /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2" }, children);
    SectionTitle.propTypes = {
      children: PropTypes.node.isRequired
    };
  }
});

// app/javascript/ai_bundles/task-preview_entry_1766084044_fc97c024.jsx
var import_task_preview_1766084044_fc97c024 = __toESM(require_task_preview_1766084044_fc97c024());
var export_default = import_task_preview_1766084044_fc97c024.default;
export {
  export_default as default
};
