import { useState } from "react";
import { API_URL } from "../config";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      //notify parent AFTER token is saved
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to reach server");
    }
  }

  return (
      <div>
        <p className="flex justify-center p-3 text-2xl">Welcome back!</p>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
              className="p-2 border rounded"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
          />

          <input
              className="p-2 border rounded"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
          />

          <button
              type="submit"
              className="border rounded-full hover:bg-darkGray px-4 py-2"
          >
            Log In
          </button>
        </form>
      </div>
  );
}
