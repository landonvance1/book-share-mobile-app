// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", "coverage/", ".expo/", "dist/", "build/"],
  },
  {
    rules: {
      // Warn on console.log (but allow console.warn and console.error)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
