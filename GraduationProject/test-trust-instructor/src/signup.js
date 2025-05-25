import './signup.css';
import React, { use, useEffect, useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './images/Logo.jpg';

function valid(values) {
    const errors = {};

    const email_pattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const password_pattern=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;


    
    if (values.firstName === " ") {
        errors.firstName = "First name is required!";
    }

    if (values.lastName === ' ') {
        errors.lastName = "Last name is required!";
    }

    if (values.idNumber === ' ') {
        errors.idNumber = "Last ID is required!";
    }

    if (values.position === ' ') {
        errors.position = "Last position is required!";
    }

    if (values.email === ' ') {
        errors.email = "Email is required!";
    }
    else if(!email_pattern.test(values.email)){
        errors.email = "Email is not valid!";
    }

    if (values.password === ' ') {
        errors.password = "Password is required!";
    }
    else if(!password_pattern.test(values.password)){
        errors.password = "Password must be at least 8 characters long and contain at least one letter and one number!";
    }
    return errors;
}


function Signup() {
  const [values, setValues] = useState({
    firstName:' ',
    lastName:' ',
    idNumber:' ',
    position:' ',
    email:' ',
    password:' '
  });
  const [errors, setErrors] = useState({});
  function handleChange(event) {
    const newObject = {...values, [event.target.firstName]: event.target.value};
    setValues(newObject);
  }
  function validation(event){
    event.preventDefault();
    setErrors(valid(values));
  }


  const navigate = useNavigate();

  return (
    <div className="signup-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="arrow">←</span> Back to Home
      </button>

      <div className="signup-content">
        {/* Form Section (Left) */}
        <div className="form-section">
          <div className="signup-card">
            <h2 className="signup-title">Create Your Account</h2>
            
            <form className="signup-form" onSubmit={validation}>
              <div className="name-row">
                <div className="input-group">
                  <label htmlFor="firstName">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    placeholder="First name" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                    {<p style={{color: 'red'}}> {errors.firstName} </p>}

                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    placeholder="Last name" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                  {errors.lastName && <p style={{color: 'red'}}> {errors.lastName} </p>}
                </div>
              </div>

              <div className="ID-and-position-row">
                <div className="input-group">
                  <label htmlFor="idNumber">ID Number</label>
                  <input 
                    type="text" 
                    id="idNumber" 
                    placeholder="Enter ID number" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                  {errors.idNumber && <p style={{color: 'red'}}> {errors.idNumber} </p>}
                </div>
                <div className="input-group">
                  <label htmlFor="position">Position</label>
                  <input 
                    type="text" 
                    id="position" 
                    placeholder="Your position" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                  {errors.position && <p style={{color: 'red'}}> {errors.position} </p>}
                </div>
              </div>

              <div className="Email-and-Password-row">
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="Enter your email" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                  {errors.email && <p style={{color: 'red'}}> {errors.email} </p>}
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input 
                    type="password" 
                    id="password" 
                    placeholder="Create password" 
                    className="signup-input"
                    onChange={handleChange}
                    />
                    {errors.password && <p style={{color: 'red'}}> {errors.password} </p>}

                </div>
              </div>

              <div className="terms-row">
                <input type="checkbox" id="terms" />
                <label htmlFor="terms">I agree to the Terms and Conditions</label>
              </div>

              <button 
                type="submit" 
                className="signup-button"
                //onClick={() => navigate('/Dashboard')}
              >
                Create Account
              </button>
            </form>

            <div className="signup-footer">
              Already have an account? <span className="signup-link" onClick={() => navigate('/login')}>Sign in</span>
            </div>
          </div>
        </div>

        {/* Logo Section (Right) */}
        <div className="logo-section">
          <div className="logo-glow">
            <img src={Logo} alt="Company Logo" className="signup-logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;