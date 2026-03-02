

import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

function TestAuth() {
  const signup = () => {
    createUserWithEmailAndPassword(auth, "test@example.com", "password123")
      .then(userCredential => {
        console.log("User created:", userCredential.user);
      })
      .catch(error => {
        console.error("Error:", error.message);
      });
  };

  return <button onClick={signup}>Test Signup</button>;
}

export default TestAuth;