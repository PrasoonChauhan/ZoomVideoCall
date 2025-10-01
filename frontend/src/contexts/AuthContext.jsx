import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import httpStatus from "http-status";
import server from "../enviroment";

// 1. Create the context
export const AuthContext = createContext(null);

// 2. Configure axios client
const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

// 3. Provider component
export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
      throw new Error("Registration failed");
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", { username, password });
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        navigate("/home");
        return request.data;
      }
      throw new Error("Login failed");
    } catch (error) {
      throw error;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const request = await client.get("/get_all_activity", {
        params: { token: localStorage.getItem("token") },
      });
      return request.data; // return only data
    } catch (e) {
      throw e;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request.data; // return only data
    } catch (e) {
      throw e;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
