// PDF Converter Pro - Main JavaScript File
class PDFConverterPro {
    constructor() {
        this.currentTool = null;
        this.uploadedFiles = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDragAndDrop();
        this.loadLastUsedTool();
    }

    bindEvents() {
        // Tool card clicks
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.openTool(tool);
            });
        });

        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('tool-modal').addEventListener('click', (e) => {
            if (e.target.id === 'tool-modal') {
                this.closeModal();
            }
        });

        // File input change
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Upload area click
        document.getElementById('upload-area').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        // Process button
        document.getElementById('process-btn').addEventListener('click', () => {
            this.processFiles();
        });

        // Search bar functionality
        const searchBar = document.getElementById('tool-search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                document.querySelectorAll('.tool-card').forEach(card => {
                    const title = card.querySelector('h3').textContent.toLowerCase();
                    const description = card.querySelector('p').textContent.toLowerCase();
                    const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
                    card.style.display = isVisible ? 'block' : 'none';
                });
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    openTool(toolName) {
        this.currentTool = toolName;
        this.uploadedFiles = [];

        const modal = document.getElementById('tool-modal');
        const modalTitle = document.getElementById('modal-title');
        const fileInput = document.getElementById('file-input');

        // Set modal title and file input accept
        const toolConfig = this.getToolConfig(toolName);
        modalTitle.textContent = toolConfig.title;
        fileInput.accept = toolConfig.accept;

        // Clear previous state
        this.clearFileList();
        this.clearResults();
        this.hideProgress();
        this.setupToolOptions(toolName);

        // Save as last used tool
        this.saveLastUsedTool();

        // Show tool description as notification
        this.showNotification(toolConfig.description, 'info');

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('tool-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.uploadedFiles = [];
        this.currentTool = null;
    }

    getToolConfig(toolName) {
        const configs = {
            'pdf-to-png': {
                title: 'PDF to PNG Converter',
                accept: '.pdf',
                description: 'Convert PDF pages to PNG images'
            },
            'pdf-to-jpeg': {
                title: 'PDF to JPEG Converter',
                accept: '.pdf',
                description: 'Convert PDF pages to JPEG images'
            },
            'png-to-pdf': {
                title: 'PNG to PDF Converter',
                accept: '.png',
                description: 'Convert PNG images to PDF'
            },
            'jpeg-to-pdf': {
                title: 'JPEG to PDF Converter',
                accept: '.jpg,.jpeg',
                description: 'Convert JPEG images to PDF'
            },
            'pdf-to-txt': {
                title: 'PDF to Text Converter',
                accept: '.pdf',
                description: 'Extract text from PDF files'
            },
            'txt-to-pdf': {
                title: 'Text to PDF Converter',
                accept: '.txt',
                description: 'Convert text files to PDF'
            },
            'merge-pdf': {
                title: 'Merge PDF Files',
                accept: '.pdf',
                description: 'Combine multiple PDF files'
            },
            'split-pdf': {
                title: 'Split PDF File',
                accept: '.pdf',
                description: 'Split PDF into separate files'
            },
            'compress-pdf': {
                title: 'Compress PDF File',
                accept: '.pdf',
                description: 'Reduce PDF file size'
            },
            'rotate-pdf': {
                title: 'Rotate PDF Pages',
                accept: '.pdf',
                description: 'Rotate PDF pages'
            },
            'remove-metadata': {
                title: 'Remove PDF Metadata',
                accept: '.pdf',
                description: 'Strip all metadata from PDF files'
            }
        };
        return configs[toolName] || { title: 'PDF Tool', accept: '*', description: '' };
    }

    handleFileSelect(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push(file);
                this.addFileToList(file);
            }
        });
        this.updateProcessButton();

        // Show reordering tip for multiple files
        if (this.uploadedFiles.length > 1) {
            const toolName = this.currentTool;
            if (toolName === 'merge-pdf') {
                this.showNotification('💡 Tip: Drag files or use arrow buttons to reorder them before merging', 'info');
            } else if (this.uploadedFiles.length === 2) {
                this.showNotification('💡 Tip: You can reorder files by dragging or using the arrow buttons', 'info');
            }
        }
    }

    validateFile(file) {
        const toolConfig = this.getToolConfig(this.currentTool);
        const acceptedTypes = toolConfig.accept.split(',').map(type => type.trim());

        if (acceptedTypes.includes('*')) return true;

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isValid = acceptedTypes.some(type =>
            type === fileExtension ||
            file.type.includes(type.replace('.', ''))
        );

        if (!isValid) {
            this.showError(`File type not supported for this tool: ${file.name}`);
            return false;
        }

        return true;
    }

    addFileToList(file) {
        const fileList = document.getElementById('file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item fade-in';
        fileItem.draggable = this.uploadedFiles.length > 1;
        fileItem.dataset.fileName = file.name;

        const fileSize = this.formatFileSize(file.size);
        const fileIcon = this.getFileIcon(file.type);

        // Show reorder controls only when there are multiple files
        const showReorderControls = this.uploadedFiles.length > 1;
        const currentIndex = this.uploadedFiles.findIndex(f => f.name === file.name);
        const isFirst = currentIndex === 0;
        const isLast = currentIndex === this.uploadedFiles.length - 1;

        const reorderControls = showReorderControls ? `
            <div class="reorder-controls">
                <button class="reorder-btn" onclick="window.pdfConverter.moveFileUp('${file.name}')" 
                        title="Move up" ${isFirst ? 'disabled' : ''}>
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="reorder-btn" onclick="window.pdfConverter.moveFileDown('${file.name}')" 
                        title="Move down" ${isLast ? 'disabled' : ''}>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="drag-handle" title="Drag to reorder">
                    <i class="fas fa-grip-vertical"></i>
                </div>
            </div>
        ` : '';

        fileItem.innerHTML = `
            ${reorderControls}
            <div class="file-info">
                <i class="fas ${fileIcon} file-icon"></i>
                <div class="file-details">
                    <h5>${file.name}</h5>
                    <p>${fileSize}</p>
                </div>
            </div>
            <div class="file-actions">
                <button class="preview-file" onclick="window.pdfConverter.previewFile('${file.name}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="remove-file" onclick="window.pdfConverter.removeFile('${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        fileList.appendChild(fileItem);

        // Add drag and drop event listeners only if there are multiple files
        if (showReorderControls) {
            this.setupFileReorderEvents(fileItem);
        }

        // Generate preview for image files automatically
        if (file.type.includes('image')) {
            this.generateImagePreview(file);
        }
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        this.updateFileList();
        this.updateProcessButton();
    }

    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        this.uploadedFiles.forEach(file => this.addFileToList(file));
    }

    // File reordering methods
    moveFileUp(fileName) {
        const index = this.uploadedFiles.findIndex(file => file.name === fileName);
        if (index > 0) {
            // Swap with previous file
            [this.uploadedFiles[index - 1], this.uploadedFiles[index]] =
                [this.uploadedFiles[index], this.uploadedFiles[index - 1]];
            this.updateFileList();
        }
    }

    moveFileDown(fileName) {
        const index = this.uploadedFiles.findIndex(file => file.name === fileName);
        if (index < this.uploadedFiles.length - 1) {
            // Swap with next file
            [this.uploadedFiles[index], this.uploadedFiles[index + 1]] =
                [this.uploadedFiles[index + 1], this.uploadedFiles[index]];
            this.updateFileList();
        }
    }

    setupFileReorderEvents(fileItem) {
        fileItem.addEventListener('dragstart', (e) => {
            fileItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', fileItem.dataset.fileName);
        });

        fileItem.addEventListener('dragend', (e) => {
            fileItem.classList.remove('dragging');
            // Remove all drop indicators
            document.querySelectorAll('.file-item').forEach(item => {
                item.style.borderTop = '';
                item.style.borderBottom = '';
            });
        });

        fileItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const draggingItem = document.querySelector('.file-item.dragging');
            if (draggingItem && draggingItem !== fileItem) {
                const rect = fileItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                // Clear previous indicators
                fileItem.style.borderTop = '';
                fileItem.style.borderBottom = '';

                // Show drop indicator
                if (e.clientY < midY) {
                    fileItem.style.borderTop = '3px solid var(--accent-color)';
                } else {
                    fileItem.style.borderBottom = '3px solid var(--accent-color)';
                }
            }
        });

        fileItem.addEventListener('dragleave', (e) => {
            // Only clear if we're actually leaving the element
            const rect = fileItem.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right ||
                e.clientY < rect.top || e.clientY > rect.bottom) {
                fileItem.style.borderTop = '';
                fileItem.style.borderBottom = '';
            }
        });

        fileItem.addEventListener('drop', (e) => {
            e.preventDefault();
            fileItem.style.borderTop = '';
            fileItem.style.borderBottom = '';

            const draggedFileName = e.dataTransfer.getData('text/plain');
            const targetFileName = fileItem.dataset.fileName;

            if (draggedFileName && draggedFileName !== targetFileName) {
                const draggedIndex = this.uploadedFiles.findIndex(file => file.name === draggedFileName);
                const targetIndex = this.uploadedFiles.findIndex(file => file.name === targetFileName);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Determine if we should insert before or after target
                    const rect = fileItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const insertAfter = e.clientY >= midY;

                    // Remove dragged file
                    const draggedFile = this.uploadedFiles.splice(draggedIndex, 1)[0];

                    // Calculate new insertion index
                    let newIndex = targetIndex;
                    if (draggedIndex < targetIndex) {
                        newIndex = targetIndex - 1;
                    }
                    if (insertAfter) {
                        newIndex++;
                    }

                    // Insert at new position
                    this.uploadedFiles.splice(newIndex, 0, draggedFile);
                    this.updateFileList();
                }
            }
        });
    }

    clearFileList() {
        document.getElementById('file-list').innerHTML = '';
    }

    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('image')) return 'fa-file-image';
        if (fileType.includes('text')) return 'fa-file-alt';
        return 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupToolOptions(toolName) {
        const optionsContainer = document.getElementById('tool-options');
        optionsContainer.innerHTML = '';

        switch (toolName) {
            case 'pdf-to-png':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="all-pages" checked>
                            <label for="all-pages">Convert all pages</label>
                        </div>
                    </div>
                `;
                break;

            case 'pdf-to-jpeg':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="all-pages" checked>
                            <label for="all-pages">Convert all pages</label>
                        </div>
                    </div>
                `;
                break;

            case 'split-pdf':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <label>Split Method</label>
                        <select id="split-method">
                            <option value="pages">Split by pages</option>
                            <option value="range">Split by range</option>
                        </select>
                    </div>
                    <div class="option-group" id="page-range-group" style="display: none;">
                        <label>Page Range (e.g., 1-5, 7, 9-12)</label>
                        <input type="text" id="page-range" placeholder="1-5, 7, 9-12">
                    </div>
                `;

                document.getElementById('split-method').addEventListener('change', (e) => {
                    const rangeGroup = document.getElementById('page-range-group');
                    rangeGroup.style.display = e.target.value === 'range' ? 'block' : 'none';
                });
                break;

            case 'rotate-pdf':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <label>Rotation Angle</label>
                        <select id="rotation-angle">
                            <option value="90">90° Clockwise</option>
                            <option value="180">180°</option>
                            <option value="270">270° Clockwise (90° Counter-clockwise)</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="all-pages-rotate" checked>
                            <label for="all-pages-rotate">Rotate all pages</label>
                        </div>
                    </div>
                `;
                break;

            case 'compress-pdf':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <p>Click "Process Files" to compress your PDF.</p>
                    </div>
                `;
                break;

            case 'remove-metadata':
                optionsContainer.innerHTML = `
                    <div class="option-group">
                        <p>Click "Process Files" to remove all metadata from your PDF.</p>
                        <p style="font-size: 0.9rem; color: rgba(248, 250, 252, 0.6); margin-top: 0.5rem;">
                            This will strip all metadata including author, title, creation date, and other identifying information.
                        </p>
                    </div>
                `;
                break;
        }
    }

    updateProcessButton() {
        const processBtn = document.getElementById('process-btn');
        const hasFiles = this.uploadedFiles.length > 0;

        processBtn.disabled = !hasFiles;

        if (hasFiles) {
            const fileCount = this.uploadedFiles.length;
            const fileText = fileCount === 1 ? 'file' : 'files';
            processBtn.innerHTML = `
                <i class="fas fa-cog"></i>
                Process ${fileCount} ${fileText}
            `;
        } else {
            processBtn.innerHTML = `
                <i class="fas fa-cog"></i>
                Process Files
            `;
        }
    }

    async processFiles() {
        if (this.uploadedFiles.length === 0) return;

        this.showProgress();
        this.clearResults();

        try {
            let results = [];

            switch (this.currentTool) {
                case 'pdf-to-png':
                    results = await this.convertPdfToPng();
                    break;
                case 'pdf-to-jpeg':
                    results = await this.convertPdfToJpeg();
                    break;
                case 'png-to-pdf':
                    results = await this.convertPngToPdf();
                    break;
                case 'jpeg-to-pdf':
                    results = await this.convertJpegToPdf();
                    break;
                case 'pdf-to-txt':
                    results = await this.convertPdfToTxt();
                    break;
                case 'txt-to-pdf':
                    results = await this.convertTxtToPdf();
                    break;
                case 'merge-pdf':
                    results = await this.mergePdfs();
                    break;
                case 'split-pdf':
                    results = await this.splitPdf();
                    break;
                case 'compress-pdf':
                    results = await this.compressPdf();
                    break;
                case 'rotate-pdf':
                    results = await this.rotatePdf();
                    break;
                case 'remove-metadata':
                    results = await this.removeMetadata();
                    break;
            }

            this.showResults(results);
        } catch (error) {
            this.showError('Processing failed: ' + error.message);
        } finally {
            this.hideProgress();
        }
    }
    // Helper functions for UI
    showProgress() {
        const progressContainer = document.getElementById('progress-container');
        const progressFill = document.getElementById('progress-fill');
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';

        // Simulate progress
        this.progressInterval = setInterval(() => {
            const currentWidth = parseInt(progressFill.style.width) || 0;
            if (currentWidth < 90) {
                progressFill.style.width = (currentWidth + 5) + '%';
            }
        }, 300);
    }

    hideProgress() {
        const progressContainer = document.getElementById('progress-container');
        const progressFill = document.getElementById('progress-fill');

        // Complete the progress bar
        progressFill.style.width = '100%';

        // Clear the interval
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // Hide after a short delay
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 500);
    }

    showResults(results) {
        if (!results || results.length === 0) return;

        const resultsSection = document.getElementById('results-section');
        const resultsList = document.getElementById('results-list');

        resultsList.innerHTML = '';

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item fade-in';

            resultItem.innerHTML = `
                <div class="file-info">
                    <i class="fas ${this.getFileIcon(result.type)} file-icon"></i>
                    <div class="file-details">
                        <h5>${result.name}</h5>
                        <p>${this.formatFileSize(result.size)}</p>
                    </div>
                </div>
                <button class="download-btn" onclick="window.pdfConverter.downloadResult('${result.url}', '${result.name}')">
                    <i class="fas fa-download"></i> Download
                </button>
            `;

            resultsList.appendChild(resultItem);
        });

        resultsSection.style.display = 'block';
    }

    clearResults() {
        const resultsSection = document.getElementById('results-section');
        const resultsList = document.getElementById('results-list');

        resultsList.innerHTML = '';
        resultsSection.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // Remove any existing notifications
        this.removeNotifications();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;

        // Set icon based on type
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';

        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                this.removeNotifications();
            }, 300);
        }, 3000);
    }

    removeNotifications() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }

    // File preview functionality
    previewFile(fileName) {
        const file = this.uploadedFiles.find(f => f.name === fileName);
        if (!file) return;

        if (file.type.includes('image')) {
            this.previewImage(file);
        } else if (file.type.includes('pdf')) {
            this.previewPdf(file);
        } else if (file.type.includes('text')) {
            this.previewText(file);
        } else {
            this.showNotification('Preview not available for this file type', 'info');
        }
    }

    async previewImage(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showPreviewModal(file.name, `
                    <div class="file-preview">
                        <img src="${e.target.result}" alt="${file.name}">
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            this.showError('Failed to preview image');
        }
    }

    async previewPdf(file) {
        try {
            const url = URL.createObjectURL(file);
            this.showPreviewModal(file.name, `
                <div class="file-preview">
                    <iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>
                </div>
            `);
        } catch (error) {
            this.showError('Failed to preview PDF');
        }
    }

    async previewText(file) {
        try {
            const text = await file.text();
            this.showPreviewModal(file.name, `
                <div class="file-preview">
                    <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 8px; max-height: 500px; overflow-y: auto;">${text}</pre>
                </div>
            `);
        } catch (error) {
            this.showError('Failed to preview text file');
        }
    }

    showPreviewModal(fileName, content) {
        // Create modal if it doesn't exist
        let previewModal = document.getElementById('preview-modal');
        if (!previewModal) {
            previewModal = document.createElement('div');
            previewModal.id = 'preview-modal';
            previewModal.className = 'modal';

            previewModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="preview-title">File Preview</h3>
                        <button class="close-btn" id="close-preview">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="preview-content">
                    </div>
                </div>
            `;

            document.body.appendChild(previewModal);

            // Close button event
            document.getElementById('close-preview').addEventListener('click', () => {
                previewModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });

            // Click outside to close
            previewModal.addEventListener('click', (e) => {
                if (e.target.id === 'preview-modal') {
                    previewModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Update content
        document.getElementById('preview-title').textContent = `Preview: ${fileName}`;
        document.getElementById('preview-content').innerHTML = content;

        // Show modal
        previewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Generate image preview for image files
    generateImagePreview(file) {
        if (!file.type.includes('image')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileList = document.getElementById('file-list');
            const fileItem = fileList.querySelector(`.file-item:last-child`);

            if (fileItem) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'file-preview';
                previewDiv.innerHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-height: 100px;">`;

                fileItem.appendChild(previewDiv);
            }
        };
        reader.readAsDataURL(file);
    }

    downloadResult(url, fileName) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Save and load last used tool - Last used highlighting removed
    saveLastUsedTool() {
        if (this.currentTool) {
            localStorage.setItem('pdfConverterLastTool', this.currentTool);
        }
    }

    loadLastUsedTool() {
        // Last used tool highlighting functionality removed
    }

    // PDF to PNG Conversion
    async convertPdfToImage(format = 'png') {
        const results = [];
        const allPages = document.getElementById('all-pages').checked;
        const isJpeg = format === 'jpeg';

        for (const file of this.uploadedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const pageCount = pdf.numPages;

                const pagesToConvert = allPages
                    ? Array.from({ length: pageCount }, (_, i) => i + 1)
                    : [1];

                for (const pageNum of pagesToConvert) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;

                    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
                    const quality = isJpeg ? 0.9 : undefined;
                    const dataUrl = canvas.toDataURL(mimeType, quality);

                    const blob = await (await fetch(dataUrl)).blob();
                    const url = URL.createObjectURL(blob);

                    const fileName = `${file.name.replace('.pdf', '')}_page${pageNum}.${format}`;

                    results.push({
                        name: fileName,
                        type: mimeType,
                        size: blob.size,
                        url: url
                    });
                }
            } catch (error) {
                console.error(`Error converting PDF to ${format.toUpperCase()}:`, error);
                throw new Error(`Failed to convert ${file.name} to ${format.toUpperCase()}`);
            }
        }
        return results;
    }

    async convertPdfToPng() {
        return this.convertPdfToImage('png');
    }

    // PDF to JPEG Conversion
    async convertPdfToJpeg() {
        return this.convertPdfToImage('jpeg');
    }

    // PNG to PDF Conversion
    async convertPngToPdf() {
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const results = [];

            for (const file of this.uploadedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const imageBytes = new Uint8Array(arrayBuffer);

                let image;
                if (file.type.includes('png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else if (file.type.includes('jpg') || file.type.includes('jpeg')) {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else {
                    throw new Error(`Unsupported image format: ${file.type}`);
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            results.push({
                name: 'converted_images.pdf',
                type: 'application/pdf',
                size: blob.size,
                url: url
            });

            return results;
        } catch (error) {
            console.error('Error converting images to PDF:', error);
            throw new Error('Failed to convert images to PDF');
        }
    }

    // JPEG to PDF Conversion
    async convertJpegToPdf() {
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const results = [];

            for (const file of this.uploadedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const imageBytes = new Uint8Array(arrayBuffer);

                // Embed JPEG image
                const image = await pdfDoc.embedJpg(imageBytes);

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            results.push({
                name: 'converted_images.pdf',
                type: 'application/pdf',
                size: blob.size,
                url: url
            });

            return results;
        } catch (error) {
            console.error('Error converting JPEG to PDF:', error);
            throw new Error('Failed to convert JPEG images to PDF');
        }
    }

    // PDF to TXT Conversion
    async convertPdfToTxt() {
        const results = [];

        // Show a processing notification
        this.showNotification('Extracting text from PDF...', 'info');

        for (const file of this.uploadedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                let extractedText = '';

                try {
                    // Create a simple text representation
                    extractedText += `PDF TEXT EXTRACTION\n`;
                    extractedText += `===================\n\n`;
                    extractedText += `File: ${file.name}\n`;
                    extractedText += `Size: ${this.formatFileSize(file.size)}\n\n`;

                    // Use PDF.js for text extraction if available
                    if (typeof pdfjsLib !== 'undefined') {
                        // Load the PDF document
                        const loadingTask = pdfjsLib.getDocument({
                            data: arrayBuffer,
                            verbosity: 0 // Reduce console warnings
                        });
                        const pdf = await loadingTask.promise;
                        const numPages = pdf.numPages;

                        extractedText += `Total Pages: ${numPages}\n\n`;

                        // Extract text from each page
                        for (let i = 1; i <= numPages; i++) {
                            extractedText += `--- PAGE ${i} ---\n`;

                            try {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();

                                if (textContent.items && textContent.items.length > 0) {
                                    // Group text by lines for better formatting
                                    const textItems = textContent.items;
                                    const lines = {};

                                    for (const item of textItems) {
                                        if (item.str && item.str.trim()) {
                                            // Round the y-coordinate to group text lines
                                            const y = Math.round(item.transform[5]);
                                            if (!lines[y]) {
                                                lines[y] = [];
                                            }
                                            lines[y].push({
                                                text: item.str,
                                                x: item.transform[4]
                                            });
                                        }
                                    }

                                    // Sort lines by y-coordinate (top to bottom)
                                    const sortedYs = Object.keys(lines).sort((a, b) => b - a);

                                    // For each line, sort text items by x-coordinate (left to right)
                                    for (const y of sortedYs) {
                                        lines[y].sort((a, b) => a.x - b.x);
                                        const lineText = lines[y].map(item => item.text).join(' ').trim();
                                        if (lineText) {
                                            extractedText += lineText + '\n';
                                        }
                                    }
                                } else {
                                    extractedText += '[No text content found on this page]\n';
                                }

                                extractedText += '\n';
                            } catch (pageError) {
                                extractedText += `[Error extracting text from page ${i}: ${pageError.message}]\n\n`;
                                console.error(`Error extracting text from page ${i}:`, pageError);
                            }
                        }
                    } else {
                        // Fallback to basic extraction using pdf-lib
                        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                        const pageCount = pdfDoc.getPageCount();

                        extractedText += `Total Pages: ${pageCount}\n\n`;
                        extractedText += `[PDF.js library not available for full text extraction]\n\n`;

                        // Try to get metadata
                        try {
                            const title = pdfDoc.getTitle();
                            const author = pdfDoc.getAuthor();
                            const subject = pdfDoc.getSubject();
                            const keywords = pdfDoc.getKeywords();

                            extractedText += `Document Information:\n`;
                            extractedText += `--------------------\n`;
                            if (title) extractedText += `Title: ${title}\n`;
                            if (author) extractedText += `Author: ${author}\n`;
                            if (subject) extractedText += `Subject: ${subject}\n`;
                            if (keywords) extractedText += `Keywords: ${keywords}\n`;
                            extractedText += `--------------------\n\n`;
                        } catch (metadataError) {
                            extractedText += `[Could not extract document metadata]\n\n`;
                        }

                        extractedText += `This is a basic text extraction. For better results, ensure PDF.js library is properly loaded.\n`;
                    }

                } catch (extractionError) {
                    console.error('PDF text extraction error:', extractionError);
                    extractedText = `Failed to extract text from "${file.name}"\n\n`;
                    extractedText += `Error: ${extractionError.message}\n\n`;
                    extractedText += `This may be due to one of the following reasons:\n`;
                    extractedText += `- The PDF contains scanned images rather than actual text\n`;
                    extractedText += `- The PDF is encrypted or password-protected\n`;
                    extractedText += `- The PDF structure is not standard or is corrupted\n\n`;
                    extractedText += `For better results, consider using specialized PDF text extraction tools.`;
                }

                // Create a downloadable text file
                const blob = new Blob([extractedText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                results.push({
                    name: file.name.replace('.pdf', '.txt'),
                    type: 'text/plain',
                    size: blob.size,
                    url: url
                });

                // Show success notification
                this.showNotification(`Text extracted successfully from ${file.name}`, 'success');

            } catch (error) {
                console.error('Error converting PDF to text:', error);
                this.showNotification(`Failed to extract text from ${file.name}`, 'error');
                throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
            }
        }

        return results;
    }

    // TXT to PDF Conversion
    async convertTxtToPdf() {
        const results = [];

        for (const file of this.uploadedFiles) {
            try {
                const text = await file.text();

                // Create PDF document
                const pdfDoc = await PDFLib.PDFDocument.create();
                const page = pdfDoc.addPage([595, 842]); // A4 size

                // Add text to PDF
                const { width, height } = page.getSize();
                page.drawText(text, {
                    x: 50,
                    y: height - 50,
                    size: 12,
                    maxWidth: width - 100,
                    lineHeight: 16
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                results.push({
                    name: file.name.replace('.txt', '.pdf'),
                    type: 'application/pdf',
                    size: blob.size,
                    url: url
                });
            } catch (error) {
                console.error('Error converting text to PDF:', error);
                throw new Error(`Failed to convert ${file.name} to PDF`);
            }
        }

        return results;
    }

    // Merge PDFs
    async mergePdfs() {
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();

            for (const file of this.uploadedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

                pages.forEach(page => {
                    mergedPdf.addPage(page);
                });
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            return [{
                name: 'merged_document.pdf',
                type: 'application/pdf',
                size: blob.size,
                url: url
            }];
        } catch (error) {
            console.error('Error merging PDFs:', error);
            throw new Error('Failed to merge PDF files');
        }
    }

    // Split PDF
    async splitPdf() {
        if (this.uploadedFiles.length !== 1) {
            throw new Error('Please select exactly one PDF file to split');
        }

        const file = this.uploadedFiles[0];
        const results = [];

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            const splitMethod = document.getElementById('split-method').value;
            let pageRanges = [];

            if (splitMethod === 'pages') {
                // Split each page into a separate PDF
                pageRanges = Array.from({ length: pageCount }, (_, i) => [i]);
            } else {
                // Split by range
                const rangeInput = document.getElementById('page-range').value;
                if (!rangeInput.trim()) {
                    throw new Error('Please enter a valid page range');
                }

                // Parse range input (e.g., "1-3, 5, 7-9")
                const ranges = rangeInput.split(',').map(r => r.trim());

                for (const range of ranges) {
                    if (range.includes('-')) {
                        const [start, end] = range.split('-').map(n => parseInt(n) - 1);
                        if (isNaN(start) || isNaN(end) || start < 0 || end >= pageCount || start > end) {
                            throw new Error(`Invalid page range: ${range}`);
                        }
                        pageRanges.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
                    } else {
                        const pageNum = parseInt(range) - 1;
                        if (isNaN(pageNum) || pageNum < 0 || pageNum >= pageCount) {
                            throw new Error(`Invalid page number: ${range}`);
                        }
                        pageRanges.push([pageNum]);
                    }
                }
            }

            // Create a separate PDF for each range
            for (let i = 0; i < pageRanges.length; i++) {
                const range = pageRanges[i];
                const newPdf = await PDFLib.PDFDocument.create();
                const pages = await newPdf.copyPages(pdfDoc, range);

                pages.forEach(page => {
                    newPdf.addPage(page);
                });

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const rangeText = range.length === 1
                    ? `page${range[0] + 1}`
                    : `pages${range[0] + 1}-${range[range.length - 1] + 1}`;

                results.push({
                    name: `${file.name.replace('.pdf', '')}_${rangeText}.pdf`,
                    type: 'application/pdf',
                    size: blob.size,
                    url: url
                });
            }

            return results;
        } catch (error) {
            console.error('Error splitting PDF:', error);
            throw new Error(`Failed to split ${file.name}: ${error.message}`);
        }
    }

    // Compress PDF
    async compressPdf() {
        const results = [];
        const { PDFDocument, PDFName, PDFDict, PDFStream, PDFNumber } = PDFLib;

        for (const file of this.uploadedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const originalSize = file.size;

                // Load PDF
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                // Compress images in the PDF
                const pages = pdfDoc.getPages();
                let imagesCompressed = 0;

                for (const page of pages) {
                    const resources = page.node.Resources();
                    if (!resources) continue;

                    const xobjects = resources.lookup(PDFName.of('XObject'));
                    if (!(xobjects instanceof PDFDict)) continue;

                    for (const [key, value] of xobjects.entries()) {
                        const stream = pdfDoc.context.lookup(value);
                        if (!(stream instanceof PDFStream)) continue;

                        const subtype = stream.dict.get(PDFName.of('Subtype'));
                        if (subtype !== PDFName.of('Image')) continue;

                        try {
                            const imageBytes = stream.getContents();
                            const originalImageSize = imageBytes.length;

                            // Skip very small images
                            if (originalImageSize < 5000) continue;

                            // Try to compress the image using canvas
                            const width = stream.dict.get(PDFName.of('Width'))?.asNumber() || 0;
                            const height = stream.dict.get(PDFName.of('Height'))?.asNumber() || 0;

                            if (width > 0 && height > 0) {
                                // Create canvas and compress image
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = width;
                                canvas.height = height;

                                // Create image from bytes
                                const blob = new Blob([imageBytes]);
                                const img = new Image();
                                const imageUrl = URL.createObjectURL(blob);

                                await new Promise((resolve, reject) => {
                                    img.onload = resolve;
                                    img.onerror = reject;
                                    img.src = imageUrl;
                                });

                                ctx.drawImage(img, 0, 0, width, height);

                                // Compress with good quality (0.8 = 80% quality)
                                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                const compressedBytes = this.dataUrlToBytes(compressedDataUrl);

                                // Only use compressed version if it's significantly smaller
                                if (compressedBytes.length < originalImageSize * 0.85) {
                                    stream.contents = compressedBytes;
                                    stream.dict.set(PDFName.of('Length'), PDFNumber.of(compressedBytes.length));
                                    stream.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                                    imagesCompressed++;
                                }

                                URL.revokeObjectURL(imageUrl);
                            }
                        } catch (error) {
                            console.warn('Failed to compress image:', error);
                        }
                    }
                }

                // Save with compression options
                const pdfBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectStreamsThreshold: 40,
                    updateFieldAppearances: false
                });

                const compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                const compressionRatio = ((originalSize - compressedBlob.size) / originalSize * 100);

                // Only return compressed version if we achieved meaningful compression
                if (compressedBlob.size < originalSize && compressionRatio >= 5) {
                    this.showNotification(`Compressed ${file.name} by ${compressionRatio.toFixed(1)}% (${this.formatFileSize(originalSize - compressedBlob.size)} saved)`, 'success');

                    results.push({
                        name: `compressed_${file.name}`,
                        type: 'application/pdf',
                        size: compressedBlob.size,
                        url: URL.createObjectURL(compressedBlob)
                    });
                } else {
                    this.showNotification(`${file.name} is already optimized (${compressionRatio.toFixed(1)}% reduction)`, 'info');
                    results.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: URL.createObjectURL(file)
                    });
                }

            } catch (error) {
                console.error('Error compressing PDF:', error);
                this.showNotification(`Failed to compress ${file.name}: ${error.message}`, 'error');

                // Return original file as fallback
                results.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: URL.createObjectURL(file)
                });
            }
        }

        return results;
    }

    // Convert data URL to byte array
    dataUrlToBytes(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Remove Metadata from PDF
    async removeMetadata() {
        const results = [];

        for (const file of this.uploadedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const originalSize = file.size;

                // Load the original PDF
                const originalPdf = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                // Create a completely new, empty PDF document
                const cleanPdf = await PDFLib.PDFDocument.create();

                // Copy all pages from original to clean PDF (without metadata)
                const pageIndices = Array.from({ length: originalPdf.getPageCount() }, (_, i) => i);
                const copiedPages = await cleanPdf.copyPages(originalPdf, pageIndices);

                // Add all copied pages to the clean PDF
                copiedPages.forEach(page => cleanPdf.addPage(page));

                // Save the clean PDF (no metadata will be included)
                const cleanPdfBytes = await cleanPdf.save({
                    useObjectStreams: false,
                    addDefaultPage: false,
                    objectStreamsThreshold: 40,
                    updateFieldAppearances: false
                });

                const cleanBlob = new Blob([cleanPdfBytes], { type: 'application/pdf' });
                const cleanSize = cleanBlob.size;

                // Calculate size difference
                const sizeDifference = originalSize - cleanSize;
                const sizeChangeText = sizeDifference > 0 ? 
                    `(${this.formatFileSize(sizeDifference)} smaller)` : 
                    sizeDifference < 0 ? 
                    `(${this.formatFileSize(Math.abs(sizeDifference))} larger)` : 
                    '(same size)';

                this.showNotification(`Metadata removed from ${file.name} ${sizeChangeText}`, 'success');

                results.push({
                    name: `clean_${file.name}`,
                    type: 'application/pdf',
                    size: cleanSize,
                    url: URL.createObjectURL(cleanBlob)
                });

            } catch (error) {
                console.error('Error removing metadata:', error);
                this.showNotification(`Failed to remove metadata from ${file.name}: ${error.message}`, 'error');
                
                // Return original file as fallback
                results.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: URL.createObjectURL(file)
                });
            }
        }

        return results;
    }

    // Rotate PDF
    async rotatePdf() {
        const results = [];
        const rotationAngle = parseInt(document.getElementById('rotation-angle').value);
        const allPages = document.getElementById('all-pages-rotate').checked;

        for (const file of this.uploadedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                // Determine which pages to rotate
                const pagesToRotate = allPages
                    ? Array.from({ length: pageCount }, (_, i) => i)
                    : [0]; // Just first page if not all pages

                // Apply rotation - fix for 180° and 270° rotations
                pagesToRotate.forEach(pageIndex => {
                    const page = pdfDoc.getPage(pageIndex);

                    // Get current rotation if any
                    const currentRotation = page.getRotation().angle;

                    // Calculate new rotation angle (add to current rotation)
                    const newRotation = (currentRotation + rotationAngle) % 360;

                    // Set the new rotation
                    page.setRotation(PDFLib.degrees(newRotation));
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                results.push({
                    name: `rotated_${file.name}`,
                    type: 'application/pdf',
                    size: blob.size,
                    url: url
                });
            } catch (error) {
                console.error('Error rotating PDF:', error);
                throw new Error(`Failed to rotate ${file.name}`);
            }
        }

        return results;
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    window.pdfConverter = new PDFConverterPro();
    console.log('PDF Converter Pro initialized');

    // Make tool cards clickable with cursor pointer
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.cursor = 'pointer';
    });
});

// Initialize FAQ functionality
document.addEventListener('DOMContentLoaded', function () {
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
});

// Add smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function () {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the target section
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Smooth scroll to the section
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Offset for header
                    behavior: 'smooth'
                });
            }
        });
    });
});