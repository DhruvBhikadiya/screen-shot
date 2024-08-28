const bcrypt = require('bcrypt');
const db = require('../Config/db');
const { createToken } = require('../Config/token.js');

module.exports.registrationPage = (req, res) => {
    return res.render('adminPannel/registration.ejs');
};

module.exports.registration = async (req, res) => {
    try {
        if (!req.body) {
            console.log("Please fill the form");
        }

        const { fname, lname, email, password } = req.body;
        const name = fname + ' ' + lname;
        const hashpassword = await bcrypt.hash(password, 10);
        const data = db.query(`select insert_ss_admin($1,$2,$3)`, [name, email, hashpassword]);
        if (data) {
            return res.redirect('/admin');
        }
        else {
            return res.redirect('back');
        }
    }
    catch (e) {
        console.log(e);
        return res.redirect('back');
    }
};

module.exports.loginPage = (req, res) => {
    return res.render('adminPannel/login.ejs');
};

module.exports.login = async (req, res) => {
    try {
        if (!req.body) {
            console.log("Please fill the form");
        }

        const { email, password } = req.body;

        const checkEmail = await db.query(`select * from login_ss_admin($1)`, [email]);

        if (!checkEmail) {
            console.log("User not found");
            return res.redirect('back');
        }

        const checkPass = await bcrypt.compare(password, checkEmail.rows[0].password);

        if (!checkPass) {
            console.log("Please enter right password");
            return res.redirect('back');
        }
        else {
            const payload = {
                id: checkEmail.rows[0].id,
                email: checkEmail.rows[0].email,
                password: checkEmail.rows[0].password
            }
            const token = createToken(payload);
            if(token){
                const binaryToken = (event) => {
                    return event.split('').map(char => {
                        const asciiValue = char.charCodeAt(0);
            
                        const binaryValue = asciiValue.toString(2);
            
                        return binaryValue.padStart(8, '0');
                    }).join(' ');
                };
                const binaryTokenString = binaryToken(token);
                res.cookie('toAu', binaryTokenString);
                res.cookie('user', checkEmail.rows);
                return res.redirect('/admin/home');
            }
            else{
                console.log("Token not created");
            }
        }
    }
    catch (e) {
        console.log(e);
        return res.redirect('back');
    }
};

module.exports.logout = (req, res) => {
    try {
        res.clearCookie('user');
        res.clearCookie('toAu');
        return res.redirect('/admin/');
    }
    catch (e) {
        console.log(e);
        console.log("Something went wrong");
    }
};

module.exports.home = (req, res) => {
    const currentUser = req.cookies.user;
    return res.render('adminPannel/index.ejs', { currentUser });
};