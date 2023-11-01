import LoginForm from "../components/LoginForm"
import styles from "./login.module.css"


function Login() {
    return (
        <div className={styles.loginContainer}>
            <LoginForm apiURL="http://192.168.18.139:3001/users/login" Type="User" />
        </div>
    )
}


export default Login
