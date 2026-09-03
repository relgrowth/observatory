import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**','test-results/**','playwright-report/**','coverage/**','artwork-sources/**','public/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-unused-vars': ['error',{argsIgnorePattern:'^_',caughtErrors:'none'}],
      'no-constant-binary-expression': 'error',
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'no-empty': ['error',{allowEmptyCatch:true}],
    },
  },
  { files:['tests/**/*.{js,mjs}'], languageOptions:{globals:{...globals.browser,...globals.node,...globals.vitest}} },
]
