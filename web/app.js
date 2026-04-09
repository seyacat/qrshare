class QRShareApp {
  constructor() {
    this.wsUrl = 'wss://closer.click:4000';
    this.ws = null;
    this.myToken = null;
    this.peerToken = null;
    this.role = null;
    this.pc = null;
    this.dc = null;
    this.files = new Map();
    this.receivedChunks = [];
    this.receivedBytes = 0;

    this.init();
  }

  init() {
    this.detectRole();
    this.renderUI();
    this.connectWebSocket();
  }

  detectRole() {
    const params = new URLSearchParams(window.location.search);
    this.peerToken = params.get('peer');
    this.role = this.peerToken ? 'receiver' : 'sender';
  }

  connectWebSocket() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleWSMessage(msg);
      } catch (error) {
        console.error('Error parsing WS message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('Error de conexión', true);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.updateStatus('Desconectado', true);
    };
  }

  handleWSMessage(msg) {
    if (msg.type === 'connected') {
      this.myToken = msg.token;
      console.log('My token:', this.myToken);

      if (this.role === 'sender') {
        this.onSenderReady();
      } else {
        this.onReceiverReady();
      }
    }
    else if (msg.type === 'message') {
      const innerMsg = JSON.parse(msg.message);
      if (this.role === 'sender') {
        this.handleSenderMessage(innerMsg, msg.from);
      } else {
        this.handleReceiverMessage(innerMsg, msg.from);
      }
    }
  }

  // ===== SENDER =====

  onSenderReady() {
    console.log('Sender ready');
    this.renderSenderUI();
  }

  renderSenderUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="sender-container">
        <h1>QRShare</h1>
        <p class="subtitle">Comparte archivos P2P con WebRTC</p>

        <button id="selectBtn" class="btn btn-primary">Seleccionar Archivo</button>
        <input type="file" id="fileInput" />

        <table class="files-table" style="display: none;">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Tamaño</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="filesTableBody">
          </tbody>
        </table>

        <div class="empty-state" id="emptyState">
          <p>No hay archivos seleccionados</p>
          <p>Haz clic en "Seleccionar Archivo" para comenzar</p>
        </div>
      </div>

      <div id="qrModal" class="modal">
        <div class="modal-content">
          <button class="modal-close" id="closeModal">&times;</button>
          <h2>Compartir Archivo</h2>
          <div id="qrContainer"></div>
          <div class="file-info-modal">
            <p><strong>Archivo:</strong> <span id="modalFileName"></span></p>
            <p><strong>URL:</strong> <span id="modalFileUrl"></span></p>
          </div>
          <div id="transferProgress">
            <p style="font-weight: 600; margin-bottom: 12px;">Progreso de transferencia:</p>
            <div id="progressBar"><div id="progressFill"></div></div>
            <div id="progressText"></div>
          </div>
          <button id="copyUrlBtn" class="btn btn-secondary" style="width: 100%; margin-top: 16px;">Copiar URL</button>
        </div>
      </div>
    `;

    document.getElementById('selectBtn').addEventListener('click', () => this.selectFile());
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.addFile(file);
      }
    });
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyUrl());

    document.getElementById('qrModal').addEventListener('click', (e) => {
      if (e.target.id === 'qrModal') this.closeModal();
    });
  }

  selectFile() {
    document.getElementById('fileInput').click();
  }

  addFile(file) {
    const fileId = 'file_' + Date.now();
    this.files.set(fileId, {
      id: fileId,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      shared: false,
      progress: 0,
      status: 'pending'
    });

    this.updateFilesTable();
  }

  updateFilesTable() {
    const table = document.querySelector('.files-table');
    const tbody = document.getElementById('filesTableBody');
    const emptyState = document.getElementById('emptyState');

    if (this.files.size === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';
    tbody.innerHTML = '';

    this.files.forEach((fileInfo, fileId) => {
      const row = document.createElement('tr');
      let actionBtn = '';

      if (!fileInfo.shared) {
        actionBtn = `<button class="btn btn-primary share-btn" data-file-id="${fileId}" style="padding: 6px 12px; font-size: 0.9em;">Compartir</button>`;
      } else {
        actionBtn = `<button class="btn btn-secondary show-qr-btn" data-file-id="${fileId}" style="padding: 6px 12px; font-size: 0.9em;">Ver QR</button>`;
      }

      row.innerHTML = `
        <td class="file-name">${fileInfo.name}</td>
        <td class="file-size">${this.formatSize(fileInfo.size)}</td>
        <td><span class="file-status status-${fileInfo.status}">${this.getStatusText(fileInfo.status, fileInfo.progress)}</span></td>
        <td>${actionBtn}</td>
      `;

      if (!fileInfo.shared) {
        row.querySelector('.share-btn').addEventListener('click', () => this.shareFile(fileId));
      } else {
        row.querySelector('.show-qr-btn').addEventListener('click', () => this.showQR(fileId));
      }

      tbody.appendChild(row);
    });
  }

  getStatusText(status, progress) {
    if (status === 'pending') return 'Pendiente';
    if (status === 'transferring') return `Transfiriendo ${progress}%`;
    if (status === 'sent') return 'Enviado';
    if (status === 'completed') return 'Completado';
    return 'Compartido';
  }

  shareFile(fileId) {
    const fileInfo = this.files.get(fileId);
    fileInfo.shared = true;
    fileInfo.status = 'shared';
    this.files.set(fileId, fileInfo);
    this.updateFilesTable();
    this.showQR(fileId);
  }

  showQR(fileId) {
    const fileInfo = this.files.get(fileId);
    const url = `${window.location.origin}${window.location.pathname}?peer=${this.myToken}`;

    document.getElementById('modalFileName').textContent = fileInfo.name;
    document.getElementById('modalFileUrl').textContent = url;

    const qrContainer = document.getElementById('qrContainer');
    qrContainer.innerHTML = '';

    try {
      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        type: 'svg',
        data: url,
        dotsOptions: {
          color: '#000000',
          type: 'rounded'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      });
      qrCode.append(qrContainer);
    } catch (error) {
      console.error('Error generating QR:', error);
      qrContainer.innerHTML = `<div style="padding: 20px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 8px;"><p><strong>URL:</strong></p><p style="word-break: break-all; font-family: monospace; font-size: 0.9em;">${url}</p></div>`;
    }

    document.getElementById('qrModal').classList.add('show');
    this.currentFileId = fileId;
  }

  closeModal() {
    document.getElementById('qrModal').classList.remove('show');
  }

  copyUrl() {
    const url = document.getElementById('modalFileUrl').textContent;
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copiada al portapapeles');
    }).catch(() => {
      alert('Error al copiar URL');
    });
  }

  handleSenderMessage(msg, from) {
    if (msg.type === 'hello') {
      console.log('Receiver connected:', from);
      this.createOffer(this.currentFileId, from);
    }
    else if (msg.type === 'answer') {
      console.log('Received answer');
      if (this.pc) {
        this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
    }
    else if (msg.type === 'ice') {
      if (this.pc && msg.candidate) {
        this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          .catch(e => console.warn('ICE error:', e));
      }
    }
  }

  createOffer(fileId, receiverToken) {
    const fileInfo = this.files.get(fileId);

    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.dc = this.pc.createDataChannel('fileTransfer', { ordered: true });

    this.dc.onopen = () => {
      console.log('Data channel open');
      this.startSendingFile(fileId, receiverToken);
    };

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendMessage(receiverToken, { type: 'ice', candidate: e.candidate });
      }
    };

    this.pc.createOffer().then(offer => {
      return this.pc.setLocalDescription(offer);
    }).then(() => {
      this.sendMessage(receiverToken, {
        type: 'offer',
        sdp: this.pc.localDescription
      });
    }).catch(e => console.error('Offer error:', e));
  }

  startSendingFile(fileId, receiverToken) {
    const fileInfo = this.files.get(fileId);
    const file = fileInfo.file;
    const CHUNK_SIZE = 64 * 1024;

    // Send metadata
    this.dc.send(JSON.stringify({
      type: 'metadata',
      name: file.name,
      size: file.size,
      mimeType: file.type
    }));

    let offset = 0;

    const sendNextChunk = () => {
      if (offset >= file.size) {
        this.dc.send(JSON.stringify({ type: 'end' }));
        fileInfo.status = 'sent';
        this.files.set(fileId, fileInfo);
        this.updateFilesTable();
        return;
      }

      // Backpressure
      if (this.dc.bufferedAmount > CHUNK_SIZE * 8) {
        this.dc.onbufferedamountlow = () => {
          this.dc.onbufferedamountlow = null;
          sendNextChunk();
        };
        return;
      }

      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const reader = new FileReader();

      reader.onload = (e) => {
        this.dc.send(e.target.result);
        offset += chunk.size;

        const progress = Math.round((offset / file.size) * 100);
        fileInfo.progress = progress;
        fileInfo.status = 'transferring';
        this.files.set(fileId, fileInfo);
        this.updateFilesTable();

        // Update progress in modal
        document.getElementById('transferProgress').style.display = 'block';
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = `${this.formatSize(offset)} / ${this.formatSize(file.size)} (${progress}%)`;

        setTimeout(sendNextChunk, 0);
      };

      reader.readAsArrayBuffer(chunk);
    };

    fileInfo.status = 'transferring';
    this.files.set(fileId, fileInfo);
    this.updateFilesTable();
    sendNextChunk();
  }

  sendMessage(to, msgObj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not ready');
      return;
    }

    const msg = {
      to: [to],
      message: JSON.stringify(msgObj)
    };

    this.ws.send(JSON.stringify(msg));
  }

  // ===== RECEIVER =====

  onReceiverReady() {
    console.log('Receiver ready, connecting to sender:', this.peerToken);
    this.renderReceiverUI();
    this.notifySender();
  }

  renderReceiverUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="receiver-container">
        <h1>QRShare</h1>
        <p class="subtitle">Recepción de archivo</p>

        <div id="fileInfoReceiver">
          <div class="receiver-file-name" id="receiverFileName"></div>
          <div class="receiver-file-detail" id="receiverFileSize"></div>
        </div>

        <div id="receiverStatus">Conectando...</div>

        <div id="progressContainerReceiver">
          <div id="progressBar"><div id="progressFill"></div></div>
          <div id="progressText"></div>
        </div>

        <button id="downloadBtn" class="btn btn-primary">Descargar Archivo</button>
      </div>
    `;
  }

  notifySender() {
    this.sendMessage(this.peerToken, {
      type: 'hello',
      token: this.myToken
    });
    this.updateStatus('Esperando archivo...');
  }

  updateStatus(text, isError = false) {
    const statusEl = document.getElementById('receiverStatus');
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = isError ? 'error' : '';
    }
  }

  handleReceiverMessage(msg, from) {
    if (msg.type === 'offer') {
      console.log('Received offer');
      this.createAnswer(msg.sdp, from);
    }
    else if (msg.type === 'ice') {
      if (this.pc && msg.candidate) {
        this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          .catch(e => console.warn('ICE error:', e));
      }
    }
  }

  createAnswer(offer, senderToken) {
    this.pc = new RTCPeerConnection({ iceServers: [] });

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendMessage(senderToken, { type: 'ice', candidate: e.candidate });
      }
    };

    this.pc.ondatachannel = (e) => {
      this.dc = e.channel;
      this.setupReceiverDataChannel(senderToken);
    };

    this.pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => this.pc.createAnswer())
      .then(answer => this.pc.setLocalDescription(answer))
      .then(() => {
        this.sendMessage(senderToken, {
          type: 'answer',
          sdp: this.pc.localDescription
        });
      })
      .catch(e => console.error('Answer error:', e));
  }

  setupReceiverDataChannel(senderToken) {
    this.dc.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'metadata') {
          document.getElementById('fileInfoReceiver').style.display = 'block';
          document.getElementById('receiverFileName').textContent = msg.name;
          document.getElementById('receiverFileSize').textContent = this.formatSize(msg.size);
          document.getElementById('progressContainerReceiver').style.display = 'block';
          this.updateStatus('Recibiendo...');
        }
        else if (msg.type === 'end') {
          this.completeTransfer();
        }
      } else {
        // Binary chunk
        this.receivedChunks.push(e.data);
        this.receivedBytes += e.data.byteLength;

        const fileSize = parseInt(document.getElementById('receiverFileSize').textContent);
        if (fileSize > 0) {
          const progress = Math.round((this.receivedBytes / fileSize) * 100);
          document.getElementById('progressFill').style.width = progress + '%';
          document.getElementById('progressText').textContent =
            `${this.formatSize(this.receivedBytes)} / ${this.formatSize(fileSize)} (${progress}%)`;
        }
      }
    };

    this.dc.onerror = (e) => {
      console.error('Data channel error:', e);
      this.updateStatus('Error en la transferencia', true);
    };
  }

  completeTransfer() {
    const fileName = document.getElementById('receiverFileName').textContent;
    const blob = new Blob(this.receivedChunks);
    const url = URL.createObjectURL(blob);

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    };

    this.updateStatus('✓ Transferencia completada');
    document.getElementById('progressFill').style.width = '100%';
    downloadBtn.click();
  }

  // ===== UTILS =====

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  renderUI() {
    if (this.role === 'sender') {
      this.renderSenderUI();
    } else {
      this.renderReceiverUI();
    }
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new QRShareApp();
});
