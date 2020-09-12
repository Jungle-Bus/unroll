function get_parameter_from_url(param_name) {
    param_name = param_name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + param_name + "=([^&#]*)"),
        results = regex.exec(location.href);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//handle the translation
var available_languages = ["en"]
async function load_translation_strings(){
    var user_language = navigator.language;
    if (available_languages.includes(user_language)){
        var i18n_file = `i18n/${user_language}.json`
    } else {
        var i18n_file = "i18n/en.json"
    }

    await fetch(i18n_file).then(function(data) {
            return data.json()
        })
        .then(function(data) {
            _.setTranslation(data);
        })

    //TODO : translate osmose issues ?
}

