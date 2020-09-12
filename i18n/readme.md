When the code is updated:
- extract strings to translate as xx.po
- convert po to json
- push xx.json to transifex

When the translations are updated:
- get *.json from transifex

Client-side, on load:
- detect language
- load appropriate json file
- replace all strings by their translations in js, and in html

TODO 
- add _() and rewrite_html everywhere
- handle *.pot (ou qqch de ce genre pour avoir le fichier en et un fichier source à pousser sur transifex)
- écrire les scripts travis qui vont bien
xgettext *.js --from-code=UTF-8 --output=i18n/en.po
python2 po2json.py ../en.po
(réécrire polib en py3 ?)