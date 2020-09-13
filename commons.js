function get_parameter_from_url(param_name) {
    param_name = param_name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + param_name + "=([^&#]*)"),
        results = regex.exec(location.href);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//detect language, get the appropriate translation file, translate html content
var available_languages = ["en", "fr", "es", "it"];
var current_language = "en"; //also used to get Osmose issue and Wikipedia extract
var i18n_messages = {}
async function load_translation_strings(){
    var user_language = navigator.language;
    if (available_languages.includes(user_language)){
        var i18n_file = `i18n/${user_language}.json`;
        current_language = user_language;
    } else {
        var i18n_file = "i18n/en.json"
    }

    await fetch(i18n_file).then(function(data) {
            return data.json()
        })
        .then(function(data) {
            i18n_messages = data
        })
        .catch(function(error) {
            console.error(`error loading ${i18n_file}: ${error}`);
        });

    var html_elements_to_translate = document.querySelectorAll("[data-i18n]");
    html_elements_to_translate.forEach(function(elem) {
        elem.textContent = i18n_messages[elem.getAttribute("data-i18n")]
    });
}

