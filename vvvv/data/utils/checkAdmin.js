
const checkAdmin = (req, res, next) => {
    //console.log(req.user.role,'\n');
    if (req.user.role === 'admin') {
        //console.log('2\n');
        return next();
    }
    else {
        //console.log('3\n');
        return res.send('You not admin :(');
    }
}

export {checkAdmin};

