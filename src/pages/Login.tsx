import { useNavigate } from "react-router-dom";

export default function Login() {
  // Hooks always to the first rows!
  const navigate = useNavigate();

  // logic when button is pressed, async to make it nonblockin
  const handleLogin = async () => {
    try {
      // execute the post request to caddy endpoint
      const response = await fetch('api/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // send mock credentials as JSON
        body: JSON.stringify({
          username: "mhirvasm",
          password: "testing123",
        }),
      });
      //verify HTTP status 200
      if (response.ok) {
        // if need response body 
        //const data = await response.json();

        //save the token (ensure 'datat.token matches the exact keyt what backend sends)
        const renewResponse = await fetch('api/renew', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "hello",
          }),
        });
        if (renewResponse.ok) {
          // catch the jwt token from response 
          const jwt = await renewResponse.json();
          localStorage.setItem("jwt", jwt.token);

          //force navigation to gameroute
          navigate("/game");
        } else {
          //handle hhtp 401 or 400 (unauthorized / bad reequest)
          console.error("Renew rejected by server");
        }
      } else {
        //handle hhtp 401 or 400 (unauthorized / bad reequest)
        console.error("Login rejected by server");
      }
    } catch (error) {
      // handle network failure
      console.error("Network error:", error);
    }
  };

  // components return
  return (
    <div className="flex justify-center items-center h-screen flex-col">
      <h1>Login Page</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Execute Mock Login
      </button>
    </div>
  );
}
