import './signup.css';
import { useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './images/Logo.jpg';
import axios from 'axios';

function valid(values) {
    const errors = {};

    const email_pattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const password_pattern=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;


    
    if (!values.firstName.trim()) {
        errors.firstName = "First name is required!";
    }

    if (!values.lastName.trim()) {
        errors.lastName = "Last name is required!";
    }

    if (!values.idNumber.trim()) {
        errors.idNumber = "ID number is required!";
    }

    if (!values.position.trim()) {
        errors.position = "Position is required!";
    }

    if (!values.email.trim()) {
        errors.email = "Email is required!";
    }
    else if(!email_pattern.test(values.email)){
        errors.email = "Email is not valid!";
    }

    if (!values.password.trim()) {
        errors.password = "Password is required!";
    }
    else if(!password_pattern.test(values.password)){
        errors.password = "Password must be at least 8 characters long and contain at least one letter and one number!";
    }
    return errors;
}


function Signup() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    firstName:'',
    lastName:'',
    idNumber:'',
    position:'',
    email:'',
    password:''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  function handleChange(event) {
    const { name, value } = event.target;
    setValues({ ...values, [name]: value });
  }
  function validation(event) {
    event.preventDefault();
    const validationErrors = valid(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
    axios.post('http://localhost:5000/api/auth/signup', values, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log(response.data);
        setIsSubmitted(true);
        navigate('/login');
      })
      .catch(error => {
        console.error('Error during signup:', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Failed to sign up. Please try again.');
      });
  }}

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
                    name="firstName" 
                    className="signup-input"
                    onChange={handleChange}
                  />
                    {errors.firstName && <p style={{color: 'red'}}> {errors.firstName} </p>}

                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    placeholder="Last name" 
                    name="lastName"
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
                    name="idNumber"
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
                    name="position"
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
                    id="email" 
                    placeholder="Enter your email" 
                    name="email"
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
                    name="password"
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