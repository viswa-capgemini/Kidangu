import './styles.css'

const Header = () => {
    return (
            <div class="header">
                <div class="logo-img">
                <img src="/path/to/godrej-logo.png" alt="Godrej Logo" />
                </div>
                <div class="search">
                <input type="text" placeholder="Search model/Model ID.."></input>
                </div>
            </div>
    )
}

export default Header