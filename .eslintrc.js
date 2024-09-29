module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
      "max-len": ["error", { "code": 160 }],
      "no-console": ["warn", { allow: ["warn", "error", "clear"] }],
      "no-debugger": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-extra-semi": "error",
      "no-func-assign": "error",
      "no-obj-calls": "error",
      "no-sparse-arrays": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { "args": "none" }],
      "valid-typeof": "warn",
      "curly": "error",
      "eqeqeq": "warn",
      "no-else-return": "warn",
      "no-eval": "error",
      "semi-spacing": "error",
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "prefer-const": "error",
      "quotes": ["error", "single"],
      "semi": [
        "error",
        "always"
      ],
      "indent": [
        "error",
        4
      ],
      "object-curly-spacing": [
        "error",
        "always"
      ],
      "padding-line-between-statements": [
        "error",
        {
          "blankLine": "always",
          "prev": "*",
          "next": "return"
        },
        {
          "blankLine": "always",
          "prev": [
            "const",
            "let",
            "var"
          ],
          "next": "*"
        },
        {
          "blankLine": "any",
          "prev": [
            "const",
            "let",
            "var"
          ],
          "next": [
            "const",
            "let",
            "var"
          ]
        },
        {
          "blankLine": "always",
          "prev": "directive",
          "next": "*"
        },
        {
          "blankLine": "any",
          "prev": "directive",
          "next": "directive"
        }
      ]
  },
};
