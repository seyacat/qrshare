class QRShareApp {
    constructor() {
        this.files = new Map();
        this.serverOnline = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateEmptyState();
    }

    bindEvents() {
        document.getElementById('selectFileBtn').addEventListener('click', () => this.selectFile());
        
        const closeModal = document.querySelector('.close');
        closeModal.addEventListener('click', () => this.closeModal());
        
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyUrl());
        
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('qrModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    async selectFile() {
        try {
            const fileInfo = await window.electronAPI.selectFile();
            if (fileInfo) {
                this.addFileToTable(fileInfo);
            }
        } catch (error) {
            console.error('Error al seleccionar archivo:', error);
            this.showError('Error al seleccionar el archivo');
        }
    }

    addFileToTable(fileInfo) {
        const fileId = 'file_' + Date.now();
        this.files.set(fileId, { ...fileInfo, id: fileId, shared: false });
        
        this.updateFilesTable();
        this.updateEmptyState();
    }

    updateFilesTable() {
        const tbody = document.getElementById('filesTableBody');
        tbody.innerHTML = '';

        this.files.forEach((file, fileId) => {
            const row = this.createFileRow(file, fileId);
            tbody.appendChild(row);
        });
    }

    createFileRow(file, fileId) {
        const row = document.createElement('tr');
        
        const sizeFormatted = this.formatFileSize(file.size);
        const fileExtension = file.type ? file.type.toUpperCase() : 'DESCONOCIDO';

        row.innerHTML = `
            <td class="file-name">${file.name}</td>
            <td class="file-size">${sizeFormatted}</td>
            <td><span class="file-type">${fileExtension}</span></td>
            <td>
                <span class="file-status ${file.shared ? 'status-shared' : 'status-pending'}">
                    ${file.shared ? 'Compartido' : 'Pendiente'}
                </span>
            </td>
            <td>
                ${!file.shared ? 
                    `<button class="btn btn-primary share-btn" data-file-id="${fileId}">Compartir</button>` : 
                    `<button class="btn btn-secondary show-qr-btn" data-file-id="${fileId}">Ver QR</button>
                     <button class="btn btn-danger remove-btn" data-file-id="${fileId}">Eliminar</button>`
                }
            </td>
        `;

        this.bindRowEvents(row, fileId);
        return row;
    }

    bindRowEvents(row, fileId) {
        const shareBtn = row.querySelector('.share-btn');
        const showQrBtn = row.querySelector('.show-qr-btn');
        const removeBtn = row.querySelector('.remove-btn');

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareFile(fileId));
        }
        
        if (showQrBtn) {
            showQrBtn.addEventListener('click', () => this.showQR(fileId));
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeFile(fileId));
        }
    }

    async shareFile(fileId) {
        const file = this.files.get(fileId);
        if (!file) return;

        try {
            const shareResult = await window.electronAPI.shareFile(file);
            
            file.shared = true;
            file.shareInfo = shareResult;
            this.files.set(fileId, file);
            
            this.updateFilesTable();
            this.updateServerStatus(true);
            this.showQR(fileId);
            
        } catch (error) {
            console.error('Error al compartir archivo:', error);
            this.showError('Error al compartir el archivo');
        }
    }

    async removeFile(fileId) {
        try {
            await window.electronAPI.removeFile(fileId);
            this.files.delete(fileId);
            this.updateFilesTable();
            this.updateEmptyState();
            
            if (this.files.size === 0) {
                this.updateServerStatus(false);
            }
            
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            this.showError('Error al eliminar el archivo');
        }
    }

    showQR(fileId) {
        const file = this.files.get(fileId);
        if (!file || !file.shareInfo) return;

        const modal = document.getElementById('qrModal');
        const qrContainer = document.getElementById('qrContainer');
        const fileName = document.getElementById('modalFileName');
        const fileUrl = document.getElementById('modalFileUrl');
        const fileIp = document.getElementById('modalFileIp');

        fileName.textContent = file.name;
        fileUrl.textContent = file.shareInfo.url;
        fileIp.textContent = file.shareInfo.ip + ':' + file.shareInfo.port;

        qrContainer.innerHTML = '';
        try {
            const qrCode = new QRCodeStyling({
                width: 200,
                height: 200,
                type: "svg",
                data: file.shareInfo.url,
                image: "",
                dotsOptions: {
                    color: "#000000",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "#ffffff",
                },
                imageOptions: {
                    crossOrigin: "anonymous",
                    margin: 10
                }
            });

            qrCode.append(qrContainer);
        } catch (error) {
            console.error('Error generando QR:', error);
            // Fallback: mostrar la URL como texto
            qrContainer.innerHTML = '<div style="text-align: center; padding: 20px; border: 1px solid #ccc; background: #f9f9f9;"><p><strong>URL para compartir:</strong></p><p style="word-break: break-all; font-family: monospace;">' + file.shareInfo.url + '</p></div>';
        }

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('qrModal');
        modal.style.display = 'none';
    }

    async copyUrl() {
        const urlElement = document.getElementById('modalFileUrl');
        const url = urlElement.textContent;
        
        try {
            await navigator.clipboard.writeText(url);
            this.showMessage('URL copiada al portapapeles');
        } catch (error) {
            console.error('Error copiando URL:', error);
            this.showError('Error al copiar la URL');
        }
    }

    updateServerStatus(online) {
        this.serverOnline = online;
        const statusElement = document.querySelector('#serverStatus span');
        
        if (online) {
            statusElement.textContent = 'Conectado';
            statusElement.className = 'status-online';
        } else {
            statusElement.textContent = 'Desconectado';
            statusElement.className = 'status-offline';
        }
    }

    updateEmptyState() {
        const tbody = document.getElementById('filesTableBody');
        const table = document.getElementById('filesTable');
        
        if (this.files.size === 0) {
            if (!tbody.querySelector('.empty-state')) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-state';
                emptyRow.innerHTML = `
                    <td colspan="5">
                        <div style="text-align: center; padding: 40px;">
                            <p>No hay archivos seleccionados</p>
                            <p>Haz clic en "Seleccionar Archivo" para comenzar</p>
                        </div>
                    </td>
                `;
                tbody.appendChild(emptyRow);
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showMessage(message) {
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QRShareApp();
});