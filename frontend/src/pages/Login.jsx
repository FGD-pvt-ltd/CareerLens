import React from 'react';

export default function Login() {
  return (
    <div className="page login-page">
      <h2>Sign In to SkillProof</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>Email</label>
          <input type="email" placeholder="name@college.edu" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
