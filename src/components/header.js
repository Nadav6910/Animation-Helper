import "../styles/header.css"
import logo from "../images/header-logo.svg"

export default function Header() {
    return (
        <header className="header">
            <img src={logo} alt="LOGO" />
            <div className="header-text-container">
                <p className="header-text">Animation-Helper</p>
                <p className="header-sub-text">By Nadav Shor</p>
            </div>
        </header> 
    )
}