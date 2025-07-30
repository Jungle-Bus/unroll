## Principles

Do not modify `lang.json` files in this repo. Translations happen on [Transifex](https://www.transifex.com/jungle-bus/unroll) only.

Client-side, on load:

- detect language
- load appropriate json file
- replace all strings by their translations in js, and in html


## Workflow

When new messages are added into the code:

- add them into `en.json` file
- use `i18n_message['translation_key']` into the code

The `en.json` file is automatically sync with Transifex on merge on master branch

When the translations are updated:

- pull `lang.json` from Transifex
- add `lang` as available language (in `commons.js`) if necessary
