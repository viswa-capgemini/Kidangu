import './Navbar.css';

const Navbar = () => {
    return (
        <div className="navbar">
            <header>
                <nav className="navbar-container">
                    <div className="navbar-logo">
                        <img src="/path/to/godrej-logo.png" alt="Godrej Logo" />
                    </div>
                    <ul className="navbar-menu">
                        <li className="navbar-item">
                            <a href="#product-group">Product Group</a>
                        </li>
                        <li className="navbar-item">
                            <a href="#layout-dimensions">Layout Dimensions</a>
                        </li>
                        <li className="navbar-item">
                            <a href="#user-profile">User Profile</a>
                        </li>
                    </ul>
                </nav>
            </header>
        </div>
    );
}

export default Navbar;
