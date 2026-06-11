import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      "**/coverage/**",
      "out/**",
      ".next/**",
      "coverage/**",
      "**/playwright-report/**",
      "playwright-report/**",
      "**/test-results/**",
      "test-results/**",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
