import axios from "axios";
import { GET_ERRORS, SET_CURRENT_USER } from "./types";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from 'jwt-decode';

//Register User
export const registerUser = (userData, history) => (dispatch) => {
  axios
    .post("/api/users/register", userData)
    .then((res) => history.push("/login"))
    .catch((err) =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data,
      })
    );
};

//Login - Get User Token
export const loginUser = (userData) => (dispatch) => {
  axios
    .post("/api/users/login", userData)
    .then((res) => {

        //save to local storage
        const { token } = res.data;
        //set token to local storage
        localStorage.setItem('jwtToken',token);
        //set token to auth header
        setAuthToken(token);
        //decode token to get user data
        const decoded = jwt_decode(token);
        //set current user
        dispatch(setCurrenUser(decoded));
    })
    .catch((err) =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data,
      })
    );
};



//set logged in user
export const setCurrenUser = (decoded) => {
    return {
        type :  SET_CURRENT_USER,
        payload : decoded
    }
}


//Log user Out

export const logoutUser = () => dispatch => {
  
  //remove the roken from local storage
  localStorage.removeItem('jwtToken');

  // remove auth header for future requests
  setAuthToken(false);

  //set the the current user to {} isAuthenticate to false.
  dispatch(setCurrenUser({}));

}

