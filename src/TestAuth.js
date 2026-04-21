// Change 'checkIn' to 'addAttendance' to match your firebase.js exports
import { auth, addAttendance } from "./firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";

function TestAuth() {
  const signup = () => {
    createUserWithEmailAndPassword(auth, "test@example.com", "password123")
      .then(userCredential => {
        console.log("User created:", userCredential.user);
        alert("Auth Success!");
      })
      .catch(error => {
        console.error("Error:", error.message);
      });
  };

  const handleTestCheckIn = async () => {
    // addAttendance requires (empId, hours, rate) based on your firebase logic
    const docRef = await addAttendance("EMP_101", 8, 1500); 
    if (docRef) {
      alert("Database Success! Record created in Firestore.");
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
      <button onClick={signup}>Test Signup (Auth)</button>
      <button 
        onClick={handleTestCheckIn} 
        style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '10px', borderRadius: '5px' }}
      >
        Test Attendance (Firestore)
      </button>
    </div>
  );
}

export default TestAuth;