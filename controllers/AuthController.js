// controllers/AuthController.js
import { db } from "../utils/PrismaClient.js"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"





// make way to to rester the cookies in the broaser auto matulcaly.



const secretKey = 'servertvp239cvdasd2'; // Replace with a strong and secure secret key

const generateToken = (user) => {
    const payload = {
        userId: user.id,
    };

    const token = jwt.sign(payload, secretKey);

    return token;
};



const Register = async(req, res) => {
    const { CreateUserData } = req.body;
    const { username, email, password, phone } = CreateUserData
    if (!username || !email || !password || !phone) {
        return res.status(200).json({ error: 'Please provide all required filed' });
    }
    console.log(username, email, password, phone);



    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { name: username },
                    { email },
                    { phoneNumber: phone },
                ],
            },
        });

        if (user) {
            return res.status(200).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword,
                phoneNumber: phone,
                // Additional user data if needed
            },
        });

        // Optionally, you can generate a token and include it in the response
        const token = generateToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(201).json({ user: { username: newUser.name, email: newUser.email } });

    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};









const login = async(req, res) => {
    const { LoginUserData } = req.body;

    const { LoginMethod, password } = LoginUserData
    if (!LoginMethod || !password) {
        return res.status(200).json({ error: 'Please provide all required information' });
    }

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { name: LoginMethod },
                    { email: LoginMethod },
                    { phoneNumber: LoginMethod },
                ],
            },
        });


        if (!user) {
            return res.status(200).json({ error: 'Invalid login credentials' });
        }

        // Compare the entered password with the hashed password from the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(200).json({ error: 'Invalid login credentials' });
        }

        // If password matches, generate a token
        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1day
            sameSite: 'None',
        });
        res.json({ token, user: { username: user.name, email: user.email } });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const FetchUser = async(req, res) => {
    const userId = req.user.userId;
    // 
    const user = await db.user.findFirst({
        where: {
            id: userId
        },
        select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            image: true,
            about: true,
            date: true
        },
    });

    return res.status(200).json(user)
}


export { login, Register, FetchUser };