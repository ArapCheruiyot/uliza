const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const API_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let folderId = null;

document.getElementById('authorize-btn').addEventListener('click', () => {
    gapi.load('client:auth2', () => {
        gapi.auth2.init({ client_id: CLIENT_ID }).then(() => {
            gapi.auth2.getAuthInstance().signIn().then(initApp);
        });
    });
});

function initApp() {
    gapi.client.load('drive', 'v3').then(() => {
        checkOrCreateFolder();
        document.getElementById('upload-section').classList.remove('hidden');
    });
}

function checkOrCreateFolder() {
    gapi.client.drive.files.list({
        q: "name='offers' and mimeType='application/vnd.google-apps.folder'",
        spaces: 'drive'
    }).then(response => {
        const files = response.result.files;
        if (files.length) {
            folderId = files[0].id;
            document.getElementById('notification').textContent = 'Folder "offers" exists.';
        } else {
            createOffersFolder();
        }
    });
}

function createOffersFolder() {
    const metadata = {
        name: 'offers',
        mimeType: 'application/vnd.google-apps.folder'
    };
    gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id'
    }).then(response => {
        folderId = response.result.id;
        document.getElementById('notification').textContent = 'Folder "offers" created.';
    });
}

const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const progress = document.getElementById('progress');

fileInput.addEventListener('change', () => {
    fileList.innerHTML = '';
    Array.from(fileInput.files).forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            fileInput.files = removeFile(fileInput.files, index);
            listItem.remove();
        });

        listItem.appendChild(removeBtn);
        fileList.appendChild(listItem);
    });
    uploadBtn.disabled = !fileInput.files.length;
});

uploadBtn.addEventListener('click', () => {
    Array.from(fileInput.files).forEach(uploadFile);
});

function uploadFile(file) {
    const metadata = {
        name: file.name,
        parents: [folderId]
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    gapi.client.request({
        path: '/upload/drive/v3/files?uploadType=multipart',
        method: 'POST',
        body: form
    }).then(() => {
        progress.style.width = '100%';
        alert(`${file.name} uploaded successfully!`);
    });
}

function removeFile(files, index) {
    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file, i) => {
        if (i !== index) dataTransfer.items.add(file);
    });
    return dataTransfer.files;
}
