import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react"
import './login.css';

export default function Login() {

    const [errorMessage, setErrorMessage] = useState('');
    const [passwordShow,setPasswordShow] = useState(false);
    const [loginData, setLoginData] = useState({email:'',pass:''})
    const [showAlert,setShowAlert] = useState(false)
    const timeoutRef = useRef()
    const navigate= useNavigate()

    useEffect(() => {
        if(errorMessage){
            messageReset();
        }
        return ( () => {
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        })
    },[errorMessage])

    const messageReset = () => {
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            setErrorMessage('');
        },1500)
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        try{
            const response = await axios.post("http://localhost:3000/login",loginData);
            console.log(response.data)

            const { token, user } = response.data;

            setShowAlert(true);

            setTimeout(() => {
                setShowAlert(false);
                sessionStorage.setItem("authToken",token);
                if(user.is_admin){
                    navigate('/adminDash');
                }else{
                    navigate('/dashboard');
                }
            }, 3000);


            
        }   
        catch(error){
            setErrorMessage(error.response?.data?.error || 'Login Failed')
            console.error('Error Login user:', error.response?.data || error.message);
        }     

    }

    const handleChange = (e) => {
        const {name , value} = e.target;
        setLoginData({
            ...loginData,
            [name]:value
        });
    }

    const togglePasswordShow = (e) => {
        e.preventDefault();
        {passwordShow? setPasswordShow(false) : setPasswordShow(true)}
    }

    return(
        <>
            <div className="login-container">
            <h1>Login</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                    type="email" 
                    className="form-input" 
                    name="email" 
                    id="email" 
                    placeholder="Email" 
                    required 
                    onChange={handleChange} 
                    value={loginData.email}
                />
                </div>
                <div className="form-group">
                <label htmlFor="pass" className="form-label">Password</label>
                <div className="password-wrapper">
                <input 
                    type={passwordShow ? "text" : "password"} 
                    className="form-input" 
                    id="pass" 
                    name="pass" 
                    placeholder="Password" 
                    required 
                    onChange={handleChange} 
                    value={loginData.pass}
                />
                <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={togglePasswordShow}
                >
                    <div className={passwordShow ? "openicon" : "closeicon"} />
                </button>
                </div>
                </div>
                <button type="submit" className="submit-btn">Submit</button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </form>
            <div className="forgot-password">
                <a href="/forgotPass" className="forgot-password-link">Forgot Password</a>
            </div>
            <div className="signup">
                <a href="/register" className="signup-link">Sign up</a>
            </div>

            {showAlert && (
                <div className="success-alert-overlay">
                    <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.5,
                        scale: { type: "spring", visualDuration: 0.5, bounce: 0.6 },
                    }}
                    className="success-alert-box">
                        <p>Login Successful!</p>
                    </motion.div>
                </div>
            )}
            </div>
        </>
    )
}