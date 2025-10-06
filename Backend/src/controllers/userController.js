import wrapAsync from "../utils/wrapAsync.js"
import httpStatus from "http-status"
import { User } from "../models/user.js"
import bcrypt, { hash } from "bcrypt"
import crypto from "crypto"
import { Meeting } from "../models/meeting.js"

const login = wrapAsync(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(httpStatus.NOT_FOUND).send({ message: "please enter username and password" });
    }

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({ message: "user not found" });
    }
    let isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
        let token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();
        res.status(httpStatus.OK).json({ token: token });
    }
    else {
        res.status(httpStatus.UNAUTHORIZED).json({ message: "wrong username or password entered" });
    }
})

const register = wrapAsync(async (req, res) => {
    const { name, username, password } = req.body;
    console.log(req.body);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        console.log("user already exists");
        return res.status(httpStatus.FOUND).json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name: name,
        username: username,
        password: hashedPassword
    });
    await newUser.save();
    console.log("user created successfully");
    res.status(httpStatus.CREATED).json({ message: "user registered succsessfully" });
})

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        const meetings = await Meeting.find({ user_id: user.username })
        res.json(meetings);
    } catch (error) {
        res.json({ message: `1something went wrong ${error}` })
    }
}


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;
    console.log("Received:", token, meeting_code);  // <--- add this
    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
        })

        await newMeeting.save();
        console.log("Saved meeting:", newMeeting); // <--- add this
        res.status(httpStatus.CREATED).json({ message: "added meeting to history" })

    } catch (error) {
        res.json({ message: `something went wrong ${error}` })
    }

}


export { login, register, getUserHistory, addToHistory };