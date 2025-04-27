import React, { useState } from 'react';

function FileUpload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('No file selected!');
      return;
    }

    // Assuming you want to upload the file to a server or an external service
    // Here's an example of how to do it using fetch to send the file to a backend.
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('YOUR_BACKEND_URL_HERE', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('File uploaded successfully!');
      } else {
        alert('File upload failed!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  return (
    <div>
      <h2>Upload a File</h2>
      <input type="file" onChange={handleFileChange} />
      {file && <p>File selected: {file.name}</p>}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default FileUpload;
