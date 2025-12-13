/**
 * Modal Component
 * 
 * Handles file upload modal
 */

export class Modal {
  constructor(options = {}) {
    this.onUpload = options.onUpload || (() => {});
    this.selectedFiles = [];
  }

  init() {
    this.modal = document.getElementById('uploadModal');
    this.uploadZone = document.getElementById('uploadZone');
    this.fileInput = document.getElementById('fileInput');
    this.confirmBtn = document.getElementById('confirmUpload');
    
    this.bindEvents();
  }

  bindEvents() {
    // Open modal
    document.getElementById('uploadBtn')?.addEventListener('click', () => {
      this.open();
    });

    // Close modal
    document.getElementById('closeModal')?.addEventListener('click', () => {
      this.close();
    });

    document.getElementById('cancelUpload')?.addEventListener('click', () => {
      this.close();
    });

    // Click outside to close
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // File input
    this.uploadZone?.addEventListener('click', () => {
      this.fileInput?.click();
    });

    this.fileInput?.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    this.uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadZone.classList.add('dragover');
    });

    this.uploadZone?.addEventListener('dragleave', () => {
      this.uploadZone.classList.remove('dragover');
    });

    this.uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    // Confirm upload
    this.confirmBtn?.addEventListener('click', () => {
      if (this.selectedFiles.length > 0) {
        this.onUpload(this.selectedFiles);
        this.close();
      }
    });
  }

  handleFiles(files) {
    this.selectedFiles = Array.from(files);
    this.updateUI();
  }

  updateUI() {
    if (this.selectedFiles.length > 0) {
      this.confirmBtn.disabled = false;
      
      const names = this.selectedFiles.map(f => f.name).join(', ');
      this.uploadZone.querySelector('p').textContent = `Selected: ${names}`;
    } else {
      this.confirmBtn.disabled = true;
      this.uploadZone.querySelector('p').textContent = 'Drag and drop files here, or click to browse';
    }
  }

  open() {
    this.modal?.classList.add('active');
    this.selectedFiles = [];
    this.updateUI();
  }

  close() {
    this.modal?.classList.remove('active');
    this.selectedFiles = [];
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }
}
