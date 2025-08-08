// Local integration of intl-tel-input for phone number input with Egypt default and validation

import intlTelInput from './intl-tel-input.min.js';

const phoneInputField = document.querySelector("#phone-number-input");
const errorMsg = document.querySelector("#phone-error-msg");

const iti = intlTelInput(phoneInputField, {
    initialCountry: "eg",
    separateDialCode: true,
    utilsScript: "./utils.js", // path to utils.js for validation
});

function reset() {
    phoneInputField.classList.remove("error");
    errorMsg.innerHTML = "";
    errorMsg.classList.add("hidden");
}

phoneInputField.addEventListener('blur', function() {
    reset();
    if (phoneInputField.value.trim()) {
        if (!iti.isValidNumber()) {
            phoneInputField.classList.add("error");
            errorMsg.innerHTML = "رقم الهاتف غير صالح";
            errorMsg.classList.remove("hidden");
        }
    }
});

phoneInputField.addEventListener('change', reset);
phoneInputField.addEventListener('keyup', reset);

export default iti;
