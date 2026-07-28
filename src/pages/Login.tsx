import { useNavigate } from 'react-router-dom';

export default function Login() {
  // Hooks always to the first rows!
  const navigate = useNavigate();

  // logic when button is pressed
  const handleLogin = () => {
    // set test token to the browser
    localStorage.setItem("token", "test-token");
    // navigate to the game page
    navigate("/game");
  };

  // components return
  return (
    <div className="flex justify-center items-center h-screen">
      <button 
        onClick={handleLogin} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login
      </button>
    </div>
  );
}