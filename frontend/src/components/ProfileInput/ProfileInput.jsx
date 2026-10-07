import React from 'react';

export default function ProfileInput() {
  return (
    <div className="component-container profile-input-component">
      <h3>Profile Links & Details</h3>
      <input type="text" placeholder="GitHub Profile URL" />
      <input type="text" placeholder="LinkedIn Profile URL" />
    </div>
  );
}
