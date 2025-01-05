const CLIENT_ID = '691057096384-74gruqqkglv1urlp8f96vlfib22asrap.apps.googleusercontent.com'; // Replace with your Google Client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let folderId = null;

// Load the Google API Client
function loadGoogleApi() {
  gapi.load('client:auth2', () => {
    gapi.auth2.init({ client_id: CLIENT_ID, scope: SCOPES })
      .then(() => console.log('Google API Client Initialized'))
      .catch(error => console.error('Error initializing Google API Client:', error));
  });
}

// Authenticate the user
function authenticateUser() {
  gapi.auth2.getAuthInstance().signIn()
    .then(() => {
      console.log('User authenticated');
      document.getElementById('file-upload-section').style.display = 'block';
    })
    .catch(error => console.error('Authentication error:', error));
}

// Check or create the "Offers" folder
async function checkOrCreateFolder() {
  try {
    const response = await gapi.client.drive.files.list({
      q: "name='Offers' and mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
      folderId = response.result.files[0].id;
      console.log('Offers folder exists:', folderId);
    } else {
      const createResponse = await gapi.client.drive.files.create({
        resource: {
          name: 'Offers',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = createResponse.result.id;
      console.log('Offers folder created:', folderId);
    }
  } catch (error) {
    console.error('Error checking or creating folder:', error);
  }
}

// Upload file to the "Offers" folder
async function uploadFile(file) {
  try {
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ Authorization: `Bearer ${gapi.auth.getToken().access_token}` }),
      body: form,
    });

    if (response.ok) {
      console.log('File uploaded:', await response.json());
    } else {
      console.error('Error uploading file:', await response.json());
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// Handle file selection and upload
async function handleFileUpload(event) {
  const files = event.target.files;
  if (files.length === 0) {
    alert('Please select at least one file to upload.');
    return;
  }

  document.getElementById('upload-progress').style.display = 'block';

  await checkOrCreateFolder();

  for (const file of files) {
    await uploadFile(file);
  }

  document.getElementById('upload-progress').style.display = 'none';
  alert('Files uploaded successfully!');
}

// Attach event listeners
document.getElementById('authorize-button').addEventListener('click', authenticateUser);
document.getElementById('file-input').addEventListener('change', handleFileUpload);
document.getElementById('upload-button').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

// Load Google API on page load
window.onload = loadGoogleApi;
