// eslint.config.js

import globals from "globals";
import standard from 'eslint-config-standard';

export default [
  {
    files: [ "**/*.js", "**/*.ts", "**/*.tsx" ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        myCustomGlobal: "readonly",
      },
    },
    // 'extends': ['eslint:recommended', 'google'],
    // 'extends': ['google'],
    plugins: {
      standard,
    },
    'rules': {
      // MDM they don't call me [Michael 4k] for nothing.
      // I have to save SOME lint dignity.  Is this too much to ask?
      // NOTE first param is 0 (off), 1 (warn) or 2 (error).
      'require-jsdoc': 'off',
      'object-curly-spacing': [ 'error', 'always', { objectsInObjects: false, arraysInObjects: false }],
      'space-in-parens': [ 'error', 'always', { exceptions: [ '{}', '[]', '()', 'empty' ]}],
      'array-bracket-spacing': [ 'error', 'always', { objectsInArrays: false, arraysInArrays: false }],
      'computed-property-spacing': [ 'error', 'always' ],
      'max-len': [ 'error', { code: 190, tabWidth: 2 }],
      'object-curly-newline': [ 'error', { ObjectExpression: { consistent: true }}],
      'no-nested-ternary': 'off',
      'no-underscore-dangle': [ 'error', { allow: [ '_id' ]}],
      'arrow-parens': [ 'error', 'as-needed' ],
      'comma-dangle': [ 'error', 'always-multiline' ],
      // Broken
      // 'no-unused-vars': [ 'error', { args: 'none', ignoreRestSiblings: true }],
      'no-console': [ 'off', { allow: [ 'warn', 'error' ]}],
      'import/prefer-default-export': [ 'off' ],
      'class-methods-use-this': [ 'off' ],
      'react/destructuring-assignment': [ 'off' ],
      'no-param-reassign': [ 'error', { props: false }],
      'no-return-assign': [ 'off' ],
      'no-return-await': [ 'off' ],
      'template-curly-spacing': 'off',
      indent: [ 'error', 2, {
        ignoredNodes: [ 'TemplateLiteral' ],
        SwitchCase: 1,
      }],
      'no-use-before-define': [ 'error', { functions: false }],
    },
  },
];
