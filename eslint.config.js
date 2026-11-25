// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.claude/*'],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      // React Compiler rules that eslint-config-expo 56 turned on as errors.
      // They flag existing patterns (mostly useRef(new Animated.Value()).current)
      // where the compiler already skips the component, so behaviour is
      // unchanged. Kept visible as warnings until they're cleaned up.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]);
