import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './register.css';

export default function Register() {
    const [passwordShow, setPasswordShow] = useState(false) ;
    const [formData, setFormData] = useState({fname:'',lname:'',email:'',phone:'+923054170452',pannum:'',pass:''});
    const defaulterror = {fname:'',lname:'',email:'',phone:'',pannum:'',pass:''};
    const [errors, setErrors] = useState(defaulterror);
    const [errMessage,setErrMessage] = useState('');
    const timeoutRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if(errMessage || errors){
            messageReset();
        }
        return ( () => {
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        })
    },[errMessage,errors])

    const messageReset = () => {
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            setErrMessage('');
            setErrors('');
        },3000)
    }

    const togglePasswordShow = (e) => {
        e.preventDefault();
        {passwordShow ? setPasswordShow(false) : setPasswordShow(true)}
    }

    const handleUserData = async (event) => {
        event.preventDefault();
        let valid = true;
        const newErrors = {};
        if (!formData.fname) {
            newErrors.fname = 'First Name is required';
            valid = false;
        }

        if (!formData.lname) {
            newErrors.lname = 'Last Name is required';
            valid = false;
        }
    
        if (!formData.email) {
          newErrors.email = 'Email is required';
          valid = false;
        }

        if (!formData.phone) {
          newErrors.phone = 'Phone is required';
          valid = false;
        }

        if (!formData.pannum) {
          newErrors.pannum = 'Pan Number is required';
          valid = false;
        } else if(!/[A-Z]{5}[0-9]{4}[A-Z]/.test(formData.pannum)){
          newErrors.pannum = "Enter a valid Pan number ex:(ABCDE1234F)"
          valid = false;
        }

        if (!formData.pass) {
          newErrors.pass = 'Password is required';
          valid = false;
        } else if (formData.pass.length < 8) {
          newErrors.pass = 'Password must be at least 8 characters long';
          valid = false;
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.pass)){
            newErrors.pass = 'Password must be mix of letters and numbers'
            valid = false;
        }
        setErrors(newErrors);
        if (valid) {
            try {
                const response = await axios.post(`https://campaign-server.onrender.com/register`, formData);
                console.log(response.data);
                navigate("/");
                setErrMessage('');
            } catch (error) {
                console.error('Error registering user:', error.response?.data || error.message);
                setErrMessage(error.response?.data?.error || "Something went wrong please try again")
            }
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    
        if (errors[name]) {
          setErrors({ ...errors, [name]: '' });
        }
    }

    return(
        <>
            <div className="registration-container">
            <form onSubmit={handleUserData} className="registration-form">
                <div className="form-group">
                <label htmlFor="fname" className="form-label">First Name</label>
                <input 
                    type="text" 
                    className="form-inputs" 
                    id="fname" 
                    name="fname" 
                    placeholder="First Name" 
                    onChange={handleChange} 
                    value={formData.fname} 
                />
                {errors.fname && (
                    <span className="error-message">{errors.fname}</span>
                )}
                </div>

                <div className="form-group">
                <label htmlFor="lname" className="form-label">Last Name</label>
                <input 
                    type="text" 
                    className="form-inputs" 
                    id="lname" 
                    name="lname" 
                    placeholder="Last Name" 
                    onChange={handleChange} 
                    value={formData.lname} 
                />
                {errors.lname && (
                    <span className="error-message">{errors.lname}</span>
                )}
                </div>

                <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                    type="email" 
                    className="form-inputs" 
                    id="email" 
                    name="email" 
                    placeholder="Email Address" 
                    onChange={handleChange} 
                    value={formData.email} 
                />
                {errors.email && (
                    <span className="error-message">{errors.email}</span>
                )}
                </div>

                <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input 
                    type="number" 
                    className="form-inputs" 
                    id="phone" 
                    name="phone" 
                    placeholder="ex:+923054170452" 
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 12) { 
                            handleChange(e);
                        }
                    }}
                    value={formData.phone} 
                />
                {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                )}
                </div>

                <div className="form-group">
                <label htmlFor="pannum" className="form-label">PAN Card Number</label>
                <input 
                    type="text" 
                    className="form-inputs" 
                    id="pannum" 
                    name="pannum" 
                    placeholder="PAN Card Number" 
                    onChange={handleChange} 
                    value={formData.pannum} 
                />
                {errors.pannum && (
                    <span className="error-message">{errors.pannum}</span>
                )}
                </div>

                <div className="form-group">
                <label htmlFor="pass" className="form-label">Password</label>
                <div className="password-wrapper">
                    <input 
                    type={passwordShow ? "text" : "password"} 
                    className="form-inputs password-input" 
                    id="pass" 
                    name="pass" 
                    placeholder="Password" 
                    onChange={handleChange} 
                    value={formData.pass} 
                    />
                    <button 
                    onClick={togglePasswordShow} 
                    className="toggle-password-btn" 
                    type="button"
                    >
                    <div className={passwordShow ? "openicon" : "closeicon"} />
                    </button>
                </div>
                {errors.pass && (
                    <span className="error-message">{errors.pass}</span>
                )}
                </div>
                <button type="submit" className="submit-btn">Submit</button>
                
                {errMessage && <span className="error-message">{errMessage}</span>}
            </form>
            <div className="back-btn-box">
                <a href="/"><button className="back-btn">Back</button></a>
            </div>
            
            </div>
        </>
     )
}
