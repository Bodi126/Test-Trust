export default function valid(values) {
    const errors = {};

    const email_pattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const password_pattern=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;


    if (values.firstName === "") {
        errors.firstName = "First name is required!";
    }

    if (values.lasttName === "") {
        errors.lastName = "Last name is required!";
    }

    if (values.email === "") {
        errors.email = "Email is required!";
    }
    else if(!email_pattern.test(values.email)){
        errors.email = "Email is not valid!";
    }

    if (values.password === "") {
        errors.password = "Password is required!";
    }
    else if(!password_pattern.test(values.password)){
        errors.password = "Password must be at least 8 characters long and contain at least one letter and one number!";
    }
}
