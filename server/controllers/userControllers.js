const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../connection.js');
const secretKey = process.env.JWT_SECRET_KEY;
const oracledb = require('oracledb');
const passport = require('passport');

// const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const phoneNumberRegex = /^\d{11}$/;

const register = async (req, res) => {
    let { fullname, email, password, phonenumber, address } = req.body;

    if (!fullname || !email || !password || !phonenumber || !address) {
        console.log(`Error from user register function: Please fill all the fields`);
        return res.status(400).json({
            'status': 'error',
            'message': 'Please fill all the fields'
        });
    }

    email = email.toLowerCase();


    if (password.length < 6) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Password should be 6 characters or more'
        });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Invalid email format'
        });
    }
    if (!phoneNumberRegex.test(phonenumber)) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Invalid phone number format (should be 11 digits)'
        });
    }
    try {

        const connection = await getConnection();
        const HashedPassword = await bcrypt.hash(password, 10);

        const result = await connection.execute(
            `INSERT INTO USERS (fullName, email, password, phone_number, address) values (:fullname, :email, :password, :phone_number, :address)`,
            [fullname, email, HashedPassword, phonenumber, address],
            { autoCommit: true }
        );

        connection.close();
        return res.status(200).json({
            'status': 'success',
            'message': 'User Registered Successfully'
        })



    } catch (err) {
        console.log(`Error from register function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }
}

const login = async (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) {
        console.log(`Error from user login function: Please fill all the fields`);
        return res.status(400).json({
            'status': 'error',
            'message': 'Please fill all the fields'
        })
    }
    email = email.toLowerCase();
    try {
        const connection = await getConnection();
        const result = await connection.execute(
            `SELECT UserID, Role, email, password FROM USERS WHERE email=:email`,
            [email],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const user = result.rows[0];
        connection.close();
        if (user && !user.PASSWORD) {
            return res.status(401).json({
                'status': 'failed',
                'message': 'Please continue with Google'
            })
        }
        if (user && (await bcrypt.compare(password, user.PASSWORD))) {
            const token = jwt.sign({ userId: user.USERID, role: user.ROLE }, secretKey, {
                expiresIn: '1h',
            });
            let redirectUrl = '';
            if (user.ROLE == 'admin') {
                redirectUrl = '/admin/admin-dashboard';
            }
            else if (user.ROLE === 'user') {
                redirectUrl = '/';
            }
            return res.status(200).json({
                'status': 'success',
                'message': 'User Logged In Successfully!',
                'token': token,
                'redirectUrl': redirectUrl
            });


        }

        return res.status(401).json({
            'status': 'failed',
            'message': 'Invalid Credentials!'
        })


    } catch (err) {
        console.log(`Error from login function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }
}

const displayObtainedInfo = (req, res) => {
    let { email, name } = req.query;
    if (!email || !name) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Please provide an email and name'
        })
    }
    return res.status(200).json({
        'status': 'success',
        'message': 'User Details Obtained Successfully!',
    })
}

const addInfo = async (req, res) => {
    let { name, email, phonenumber, address } = req.body;
    if (!name || !email || !phonenumber || !address) {
        console.log(`Error from user addInfo function: Please fill all the fields`);
        return res.status(400).json({
            'status': 'error',
            'message': 'Please fill all the fields'
        })
    }
    if (!phoneNumberRegex.test(phonenumber)) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Invalid phone number format (should be 11 digits)'
        });
    }
    email = email.toLowerCase();
    try {
        const connection = await getConnection();
        await connection.execute(
            `INSERT INTO USERS (fullName, email, phone_number, address) values (:name, :email, :phonenumber, :address)`,
            [name, email, phonenumber, address],
            { autoCommit: true }
        );
        connection.close();
        return res.status(200).json({
            'status': 'success',
            'message': 'User Registration Completed Successfully!',
            'redirectUrl': '/'
        });
    }
    catch (err) {
        console.log(`Error from addInfo function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }

}


const displayUserDetails = async (req, res) => {
    const { userId } = req.user;
    try {
        const connection = await getConnection();
        const result = await connection.execute(
            `SELECT fullName, email, phone_number, address FROM USERS WHERE UserID=:UserID`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        userData = result.rows[0];
        connection.close();
        if (userData) {
            return res.status(200).json({
                'status': 'success',
                'message': 'User Details Fetched Successfully!',
                'data': userData
            })
        }
        return res.status(404).json({
            'status': 'failed',
            'message': 'User Not Found!'
        })

    } catch (err) {
        console.log(`Error from displayUserDetails function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }

}

const updateUserDetails = async (req, res) => {
    const { userId } = req.user;
    let { fullname, oldpassword, newpassword, phonenumber, address } = req.body;
    try {
        const connection = await getConnection();
        if (fullname) {
            await connection.execute(
                `UPDATE USERS SET fullName=:fullName WHERE UserID=:UserID`,
                [fullname, userId],
                { autoCommit: true }
            );
        }
        if (newpassword && newpassword.length >= 6) {

            const HashedNewPassword = await bcrypt.hash(newpassword, 10);
            const result = await connection.execute(
                `SELECT password FROM USERS WHERE UserID=:UserID`,
                [userId],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const user = result.rows[0];
            if (!await bcrypt.compare(oldpassword, user.PASSWORD)) {
                return res.status(400).json({
                    'status': 'error',
                    'message': 'Old Password is incorrect!'
                })
            }
            if (oldpassword === newpassword) {
                return res.status(400).json({
                    'status': 'error',
                    'message': 'New Password cannot be the same as the old password!'
                })
            }
            await connection.execute(
                `UPDATE USERS SET password=:password WHERE UserID=:UserID`,
                [HashedNewPassword, userId],
                { autoCommit: true }
            );
        }
        if (phonenumber && phoneNumberRegex.test(phonenumber)) { // Update Phone Number
            await connection.execute(
                `UPDATE USERS SET phone_number=:phone_number WHERE UserID=:UserID`,
                [phonenumber, userId],
                { autoCommit: true }
            );
        }
        if (address) { // Update Address
            await connection.execute(
                `UPDATE USERS SET address=:address WHERE UserID=:UserID`,
                [address, userId],
                { autoCommit: true }
            );
        }
        connection.close();
        return res.status(200).json({
            'status': 'success',
            'message': 'user details updated successfully'
        })


    } catch (err) {
        console.log(`Error from updateUserDetails function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }
}

const browseRestaurants = async (req, res) => {
    let { name } = req.query;
    if (!name) {
        try {
            const connection = await getConnection();
            const result = await connection.execute(
                `SELECT RestaurantID, email, RestaurantName, address, phone_number, website FROM RESTAURANTS`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            connection.close();
            if (result.rows.length === 0) {
                return res.status(404).json({
                    'status': 'failed',
                    'message': 'No Restaurants Found!'
                })
            }
            return res.status(200).json({
                'status': 'success',
                'message': 'Details Fetched Successfully!',
                'data': result.rows

            })
        } catch (err) {
            console.log(`Error from browseRestaurants function ${err}`);
            return res.status(500).json({
                'status': 'error',
                'message': 'This is an issue from our end please try again later!'
            })
        }
    }
    name = name.toUpperCase();
    try {
        const connection = await getConnection();
        const query = `SELECT RestaurantID, email, RestaurantName, address, phone_number, website FROM RESTAURANTS WHERE RestaurantName LIKE '%' || :name || '%'`;
        const result = await connection.execute(
            query,
            [name],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        connection.close();
        if (result.rows.length !== 0) {
            return res.status(200).json({
                'status': 'success',
                'message': 'Details Fetched Successfully!',
                'data': result.rows

            })
        }
        return res.status(404).json({
            'status': 'failed',
            'message': 'No Restaurant Found!'
        })
    }
    catch (err) {
        console.log(`Error from browseRestaurants function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }

}



const browseProducts = async (req, res) => {
    const { restaurantid } = req.query;
    if (!restaurantid) {
        console.log(`Error from browseProducts function: Please provide a Restaurant ID`);
        return res.status(400).json({
            'status': 'error',
            'message': 'Please provide a Restaurant ID to browse products'
        })
    }
    try {
        const connection = await getConnection();
        const result = await connection.execute(
            `SELECT * FROM RESTAURANTITEMS WHERE restaurantId=:restaurantid`,
            [restaurantid],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        connection.close();
        if (result.rows.length === 0) {
            return res.status(404).json({
                'status': 'failed',
                'message': 'No Products Found!'
            })
        }
        return res.status(200).json({
            'status': 'success',
            'message': 'Details Fetched Successfully!',
            'data': result.rows

        })
    } catch (err) {
        console.log(`Error from browseProducts function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }

}

const placeOrder = async (req, res) => {
    let total = 0;
    const { userId } = req.user;
    const { restaurantid, products } = req.body;
    if (!restaurantid || !products) {
        console.log(`Error from placeOrder function: Please provide a Restaurant ID and Products`);
        return res.status(400).json({
            'status': 'error',
            'message': 'Please provide a Restaurant ID and Products'
        })
    }

    try {
        const connection = await getConnection();
        for (let i = 0; i < products.length; i++) {
            const result = await connection.execute(
                `SELECT price FROM RESTAURANTITEMS WHERE productId=:productId`,
                [products[i].productid],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const price = result.rows[0].PRICE;
            total += price * products[i].quantity;
        }
        const orderStatus = 'Processing';
        const orderDate = formatDatetime(new Date());
        const insertResult = await connection.execute(
            `INSERT INTO ORDERS (UserID, RestaurantID, OrderTimeDate, OrderStatus, GRANDTOTAL) 
             values (:userId, :restaurantid, TO_TIMESTAMP(:orderDate, 'YYYY-MM-DD HH24:MI:SS.FF3'), :orderStatus, :total)
             RETURNING OrderID INTO :orderId`,
            { userId, restaurantid, orderDate, orderStatus, total, orderId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
            { autoCommit: true }
        );

        const orderId = insertResult.outBinds.orderId[0];

        for (let i = 0; i < products.length; i++) {
            let subtotal = 0;
            const result = await connection.execute(
                `SELECT price FROM RESTAURANTITEMS WHERE productId=:productId`,
                [products[i].productid],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const price = result.rows[0].PRICE;
            subtotal += price * products[i].quantity;
            await connection.execute(
                `INSERT INTO ORDER_DETAILS (OrderID, ProductID, Quantity, Subtotal) values (:orderId, :productId, :quantity, :subtotal)`,
                [orderId, products[i].productId, products[i].quantity, subtotal],
                { autoCommit: true }
            )
        }
        connection.close();
        return res.status(200).json({
            'status': 'success',
            'message': 'Order Placed Successfully!',
            'orderId': orderId
        });
    }
    catch (err) {
        console.log(`Error from placeOrder function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }

}

const getOrderHistory = async (req, res) => {
    const { userId } = req.user;
    try {
        const connection = await getConnection();
        const result = await connection.execute(
            `SELECT OrderID, RESTAURANTS.RestaurantName, OrderTimeDate, OrderStatus, GRANDTOTAL
             FROM ORDERS
             inner join RESTAURANTS ON ORDERS.RestaurantID = RESTAURANTS.RestaurantID
             WHERE UserID=:userId
             ORDER BY OrderTimeDate DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        connection.close();
        if (result.rows.length === 0) {
            return res.status(404).json({
                'status': 'failed',
                'message': 'No Order History Found!'
            })
        }
        return res.status(200).json({
            'status': 'success',
            'message': 'Details Fetched Successfully!',
            'data': result.rows

        })
    }
    catch (err) {
        console.log(`Error from getOrderHistory function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }
}

const getOrderDetails = async (req, res) => {
    const { userId } = req.user;
    const { orderid } = req.query;
    if (!orderid) {
        return res.status(400).json({
            'status': 'error',
            'message': 'Please provide an Order ID!'
        })
    }
    try {
        const connection = await getConnection();
        const result = await connection.execute(
            `SELECT RESTAURANTS.RestaurantName, OrderTimeDate, OrderStatus, RESTAURANTITEMS.NAME,
             ORDER_DETAILS.Quantity, ORDER_DETAILS.SUBTOTAL, GRANDTOTAL
             FROM ORDERS
             inner join RESTAURANTS ON ORDERS.RestaurantID = RESTAURANTS.RestaurantID
             inner join ORDER_DETAILS ON ORDERS.OrderID = ORDER_DETAILS.OrderID
             inner join RESTAURANTITEMS ON ORDER_DETAILS.ProductID = RESTAURANTITEMS.ProductID
             WHERE ORDERS.OrderID=:orderid AND ORDERS.UserID=:userId`,
            [orderid, userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        connection.close();
        if (result.rows.length === 0) {
            return res.status(404).json({
                'status': 'failed',
                'message': 'No Order Details Found or You do not have access to this'
            })
        }
        return res.status(200).json({
            'status': 'success',
            'message': 'Details Fetched Successfully!',
            'data': result.rows

        })
    }
    catch (err) {
        console.log(`Error from getOrderDetails function ${err}`);
        return res.status(500).json({
            'status': 'error',
            'message': 'This is an issue from our end please try again later!'
        })
    }
}

// -----------------------------------------------------------HELPERS-----------------------------------------------------------


const formatDatetime = (datetime) => {
    const year = datetime.getFullYear();
    const month = String(datetime.getMonth() + 1).padStart(2, '0');
    const day = String(datetime.getDate()).padStart(2, '0');
    const hours = String(datetime.getHours()).padStart(2, '0');
    const minutes = String(datetime.getMinutes()).padStart(2, '0');
    const seconds = String(datetime.getSeconds()).padStart(2, '0');
    const milliseconds = String(datetime.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

module.exports = {
    register,
    login,
    displayUserDetails,
    updateUserDetails,
    browseRestaurants,
    browseProducts,
    placeOrder,
    getOrderHistory,
    getOrderDetails,
    addInfo,
    displayObtainedInfo,
}