TODO 
- transifex push on merge on master
- transifex pull when translation is complete

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
- push `en.json` file to Transifex on merge on master branch (automatically done by travis) // TODO

When the translations are updated:
- pull `lang.json` from Transifex
- check if `lang` is an available language (from commons.js)
