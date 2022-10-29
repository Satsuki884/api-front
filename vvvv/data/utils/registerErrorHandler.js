function password_validator(pass) {
    if(!pass) {
        return false;
    }
    return true;
}

function email_validator(email) {
    if(!email) {
        return false;
    }
    return true;
}

function username_validator(fullname) {
    if(!fullname) {
        return false;
    }
    return true;
}

export   { password_validator, username_validator, email_validator };


