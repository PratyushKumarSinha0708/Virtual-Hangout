import axios from "axios"
import { createContext, useState, useContext } from "react"
import httpStatus from "http-status"
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "https://virtual-hangout-backend.onrender.com"
})

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const router = useNavigate();

    const [userData, setUserData] = useState(authContext);

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })
            if (request.status === httpStatus.CREATED) {
                console.log("message : ", request.data.message)
                return request.data.message;
            }
        } catch (error) {
            throw error;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });
            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token)
            }
        } catch (error) {
            throw error;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            })
            return request.data;
        } catch (error) {
            throw error
        }
    }

    const addToUserHistory = async (meeting_Code) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code : meeting_Code,
            });
            return request;
        } catch (error) {
            throw error;
        }
    }

    const data = {
        userData, setUserData ,addToUserHistory , getHistoryOfUser, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}