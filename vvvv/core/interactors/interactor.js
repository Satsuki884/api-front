function get_current_date() {
    return new Date().toISOString().substring(0, 19).replace('T', ' ');
}


export {get_current_date};

