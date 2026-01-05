import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function Register({ closeModal }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd from <input type="date">
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, surname, dob, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => {
        closeModal(); // Close the modal after successful registration
        navigate("/login"); // Redirect to login page after success
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Unable to reach server");
    }
  }

  return (
    <div className=" mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl mb-4 text-center">Create account</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="p-2"
          type="text"
          placeholder="Name"
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="p-2"
          type="text"
          placeholder="Surname"
          id="surname"
          name="surname"
          required
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />

        <input
          className="p-2"
          type="date"
          placeholder="Date of Birth"
          id="dob"
          name="dob"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        <input
          className="p-2"
          type="email"
          placeholder="Email"
          id="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="p-2"
          type="password"
          placeholder="Password"
          id="password"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="border rounded-full hover:bg-darkGray px-4 py-2"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
