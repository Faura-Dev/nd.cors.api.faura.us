import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx"];
const importPathGroups = [
	{
		pattern: "@/types/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/interfaces/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/enums/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/models/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/api/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/utilities/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/functions/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/tests/**",
		group: "type",
		position: "after",
	},
	{
		pattern: "@/**",
		group: "type",
		position: "after",
	},
];

export default [
	{
		ignores: [
			"src/generated/**",
			".github/**",
			".next/**",
			".run/**",
			".vercel/**",
			"node_modules/**",
			"supabase/**",
			"scripts/**",
		],
	},
	{
		files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			import: importPlugin,
		},
		settings: {
			react: {
				version: "detect",
			},
			"import/resolver": {
				alias: {
					map: [["@", "./src"]],
					extensions: [...sourceExtensions, ".json"],
				},
				typescript: {
					project: "./tsconfig.json",
					alwaysTryTypes: true,
					extensions: sourceExtensions,
				},
				node: {
					extensions: sourceExtensions,
					paths: ["src"],
				},
			},
		},
		rules: {
			"no-console": "warn",
			"no-debugger": "warn",
			"no-empty-pattern": "warn",
			"no-param-reassign": [
				"warn",
				{
					props: false,
				},
			],
			"no-prototype-builtins": "warn",
			"no-shadow": "off",
			"no-use-before-define": "off",
			"no-unused-vars": "off",
			"no-useless-catch": "warn",
			"no-var": "warn",
			"no-warning-comments": ["warn", { terms: ["!"] }],
			"object-shorthand": "warn",
			"prefer-const": "error",
			"require-await": "off",
			"import/extensions": [
				"error",
				"never",
				{
					css: "always",
					sass: "always",
					scss: "always",
				},
			],
			"import/no-default-export": "off",
			"import/no-extraneous-dependencies": [
				"error",
				{
					devDependencies: [
						"**/*.test.{ts,tsx}",
						"**/__tests__/**",
						"**/jest.setup.ts",
						"**/jest.config.ts",
						"**/*.stories.{ts,tsx}",
					],
					optionalDependencies: false,
					peerDependencies: false,
				},
			],
			"import/no-unresolved": "error",
			"import/order": [
				"warn",
				{
					alphabetize: { order: "asc", caseInsensitive: true },
					groups: [
						"external",
						"type",
						"internal",
						"builtin",
						["parent", "sibling", "index"],
						"unknown",
					],
					pathGroups: importPathGroups,
					"newlines-between": "always",
					pathGroupsExcludedImportTypes: ["builtin", "type"],
					named: true,
				},
			],
		},
	},
	{
		files: ["**/*.{ts,tsx,d.ts}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir,
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			"@typescript-eslint/await-thenable": "warn",
			"@typescript-eslint/ban-ts-comment": "warn",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "separate-type-imports",
				},
			],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-duplicate-type-constituents": "warn",
			"@typescript-eslint/no-empty-object-type": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-floating-promises": [
				"error",
				{ ignoreVoid: true },
			],
			"@typescript-eslint/no-redundant-type-constituents": "warn",
			"@typescript-eslint/no-shadow": "warn",
			"@typescript-eslint/no-unnecessary-type-assertion": "error",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-use-before-define": [
				"warn",
				{ functions: false, variables: false },
			],
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/strict-boolean-expressions": "warn",
		},
	},
	{
		files: [
			"eslint.config.js",
			"eslint.config.mjs",
			"eslint.config.cjs",
			"eslint.config.ts",
			"vite.config.js",
			"vite.config.mjs",
			"vite.config.cjs",
			"vite.config.ts",
		],
		rules: {
			"import/extensions": "off",
			"import/no-extraneous-dependencies": "off",
			"import/no-unresolved": "off",
			"import/order": "off",
		},
	},
];
