import axios from "axios";
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import './forgotpass.css'

function ForgotPasss() {

    const [forgotPassData,setForgotPassData] = useState({email:'',pan:''});
    const [passData,setPassDate] = useState({newpass:'',confirmpass:''});
    const [userInfo,setUserInfo] = useState([])
    const [passwordShow,setPasswordShow] = useState({newpass:false, confirmpass:false});
    const [errorMessage, setErrorMessage] = useState('');
    const [isValidate,setIsValidate] = useState(false);
    const [showAlert,setShowAlert] = useState(false);
    const timeoutRef = useRef(null);
    const navigator = useNavigate();

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
        },2000)
    }

    const handleSubmitValidation = async (event) => {
        event.preventDefault();
        try{
            const response = await axios.post("https://campaign-server.onrender.com/forgotpass",forgotPassData)
            console.log(response.data.message);
            setUserInfo(response.data.user);
            setIsValidate(true)
        }catch(error){
            setErrorMessage(error.response.data.error || 'Error in Forgot Password.')
            console.error('Error Forgot password:', error.response?.data || error.message);
        }
    }

    const handleSubmitChange = async (event) => {       
        event.preventDefault();
        if(passData.newpass !== passData.confirmpass){
            setErrorMessage('Confirm password does not match.');
            return;
        }
        try{
            const response = await axios.post("https://campaign-server.onrender.com/change-pass",{ userId: userInfo._id, newpass: passData.newpass })
            setShowAlert(true)
            setTimeout(() => {
                setShowAlert(false)
                navigator('/')
            },1500);
        }catch(error){
            setErrorMessage(error.response?.data?.error || 'Error in Canging Password.')
            console.error('Error Changing password:', error.response?.data || error.message);
        }
    }

    const handleChange = (e) => {
        const {name,value} = e.target;
        setForgotPassData({
            ...forgotPassData,
            [name]:value
        });
    }

    const handleChangePass = (e) => {
        const {name, value} = e.target;
        setPassDate({
            ...passData,
            [name]:value
        })
    }

    const togglePasswordShow = (e) => {
        e.preventDefault();
        const name = e.target.getAttribute('name')
        if(name == 'newpassbtn'){
            {passwordShow.newpass ? setPasswordShow({...passwordShow, newpass:false}) : setPasswordShow({...passwordShow,newpass:true})}
        }
        if(name == 'confirmpassbtn'){
            {passwordShow.confirmpass ? setPasswordShow({...passwordShow,confirmpass:false}) : setPasswordShow({...passwordShow, confirmpass:true})}
        }
       
    }

  return (
    <>
    { !isValidate ? (
        <div className="validation-container">
        <h1>Validation</h1>
        <form onSubmit={handleSubmitValidation} className="forgot-pass-form">
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
                value={forgotPassData.email}
            />
            </div>
            <div className="form-group">
            <label htmlFor="pass" className="form-label">PanNumber</label>
            <input 
                type='text' 
                className="form-input" 
                id="pan" 
                name="pan" 
                placeholder="Pan Card Number" 
                required 
                onChange={handleChange} 
                value={forgotPassData.pan}
            />
            </div>
            <button type="submit" className="submit-btn">Submit</button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </form>
        </div>
    ) : (
        <div className="changepass-container">
        <h1>ChangePassword</h1>
        <form onSubmit={handleSubmitChange} className="Change-pass-form">
            <div className="form-group">
                <label htmlFor="newpass" className="form-label">New Password</label>
                <div className="password-wrapper">
                <input 
                    type={passwordShow.newpass ? "text" : "password"} 
                    className="form-input" 
                    id="newpass" 
                    name="newpass" 
                    placeholder="New Password" 
                    required 
                    onChange={handleChangePass} 
                    value={passData.newpass}
                />
                <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={togglePasswordShow}
                >
                    <div name="newpassbtn" className={passwordShow.newpass ? "openicon" : "closeicon"} />
                </button>
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="pass" className="form-label">Confirm Password</label>
                <div className="password-wrapper">
                <input 
                    type={passwordShow.confirmpass ? "text" : "password"} 
                    className="form-input" 
                    id="confirmpass" 
                    name="confirmpass" 
                    placeholder="Confirm Password" 
                    required 
                    onChange={handleChangePass} 
                    value={passData.confirmpass}
                />
                <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={togglePasswordShow}
                >
                    <div name="confirmpassbtn" className={passwordShow.confirmpass ? "openicon" : "closeicon"} />
                </button>
                </div>
            </div>
            <button type="submit" className="submit-btn">Submit</button>

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
                        <p>Password Changed Successful</p>
                    </motion.div>
                </div>
            )}

            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </form>
        </div>
    )}
        
    </>
  )
}

export default ForgotPasss
