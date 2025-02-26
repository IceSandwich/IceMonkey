# IceMonkey

Run typescript in Tampermonkey.

## Usage

1. Add script `gm/IceMonkey.js` in your monkey manager.
2. Install [lite-server](https://www.npmjs.com/package/lite-server#installation-and-usage).
3. Cd to `html` and run `lite-server`.
4. Configure your `tsconfig.json` to generate js files in `html/js`.
5. Add `index.ts` and define the main entry function `export function main()`. This function will be invoked at the beginning of the page loading so you can setup hooks at this time.

## Other things
1. **Alway use module**. IceMonkey **only** work with modules so you need to export your functions in your typescript.
2. **Look through IceMonkey.js**. In some cases, you need to modify configuration in `gm/IceMonkey.js`. You can add thirdparty js library there and put it in `IM_context` so that your ts can access it.
