import React from 'react';

export default function ResumeUpload() {
  return (
    <div className="component-container resume-upload-component">
      <h3>Resume Upload</h3>
      <input type="file" accept=".pdf,.doc,.docx" />
    </div>
  );
}
