import React from 'react';
import ResumeUpload from '../components/ResumeUpload';
import ProfileInput from '../components/ProfileInput';

export default function ProfileSetup() {
  return (
    <div className="page profile-setup-page">
      <h2>Candidate Profile Setup</h2>
      <p>Submit your resume, repository links, and professional targets.</p>
      <ResumeUpload />
      <ProfileInput />
    </div>
  );
}
