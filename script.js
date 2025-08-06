 
      // Global variables
      let files = [];
      let compressedFiles = [];
      let date = new Date()
      let year = date.getFullYear()
      // DOM elements
      const dropzone = document.getElementById("dropzone");
      const fileInput = document.getElementById("fileInput");
      const optionsSection = document.getElementById("optionsSection");
      const filesSection = document.getElementById("filesSection");
      const fileList = document.getElementById("fileList");
      const fileCount = document.getElementById("fileCount");
      const resultsSection = document.getElementById("resultsSection");
      const resultsContainer = document.getElementById("resultsContainer");
      const qualityRange = document.getElementById("qualityRange");
      const qualityValue = document.getElementById("qualityValue");
      const compressBtn = document.getElementById("compressBtn");
      const downloadAllBtn = document.getElementById("downloadAllBtn");
      const newCompressionBtn = document.getElementById("newCompressionBtn");
      let footerYear = document.getElementById('year')
      footerYear.innerText = year

      // Event listeners
      qualityRange.addEventListener("input", updateQualityValue);
      compressBtn.addEventListener("click", compressImages);
      downloadAllBtn.addEventListener("click", downloadAll);
      newCompressionBtn.addEventListener("click", resetApp);

      // Update quality percentage display
      function updateQualityValue() {
        qualityValue.textContent = `${qualityRange.value}%`;
      }

      // Handle dropped files
      function handleDrop(e) {
        e.preventDefault();
        dropzone.classList.remove("active");
        if (e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      }

      // Handle selected files
      function handleFiles(selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          if (file.type.startsWith("image/")) {
            files.push(file);
          }
        }

        if (files.length > 0) {
          displayFiles();
          optionsSection.style.display = "block";
          filesSection.style.display = "block";
          resultsSection.style.display = "none";
        }
      }

      // Display selected files
      function displayFiles() {
        fileList.innerHTML = "";
        fileCount.textContent = `${files.length} ${
          files.length === 1 ? "file" : "files"
        }`;

        files.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            const fileItem = document.createElement("div");
            fileItem.className =
              "file-item group flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition";
            fileItem.innerHTML = `
                        <div class="flex-shrink-0 w-10 h-10 rounded overflow-hidden">
                            <img src="${
                              e.target.result
                            }" class="w-full h-full object-cover">
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-200 truncate">${
                              file.name
                            }</p>
                            <p class="text-xs text-gray-300">${formatFileSize(
                              file.size
                            )}</p>
                        </div>
                        <button onclick="removeFile(${index})" class="file-remove ml-2 opacity-0 group-hover:opacity-100 text-white hover:text-red-300 transition">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
            fileList.appendChild(fileItem);
          };
          reader.readAsDataURL(file);
        });
      }

      // Remove file from list
      function removeFile(index) {
        files.splice(index, 1);
        if (files.length > 0) {
          displayFiles();
        } else {
          fileList.innerHTML = "";
          fileCount.textContent = "0 files";
          optionsSection.style.display = "none";
          filesSection.style.display = "none";
        }
      }

      // Format file size
      function formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      }

      // Compress images
      function compressImages() {
        if (files.length === 0) return;

        // Show loading state
        compressBtn.disabled = true;
        compressBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i> Compressing...';

        // Process files
        compressedFiles = [];
        resultsContainer.innerHTML = "";

        // Process each file
        files.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
              // Get compression settings
              const quality = parseInt(qualityRange.value) / 100;
              const outputFormat =
                document.getElementById("outputFormat").value;
              const format =
                outputFormat === "original"
                  ? file.type.split("/")[1]
                  : outputFormat;

              // Check if resizing is needed
              let width = img.width;
              let height = img.height;
              const resizeWidth = parseInt(
                document.getElementById("resizeWidth").value
              );
              const resizeHeight = parseInt(
                document.getElementById("resizeHeight").value
              );
              const maintainAspect =
                document.getElementById("maintainAspect").checked;

              if (resizeWidth || resizeHeight) {
                if (maintainAspect) {
                  const aspectRatio = img.width / img.height;
                  if (resizeWidth) {
                    width = resizeWidth;
                    height = Math.round(width / aspectRatio);
                  } else if (resizeHeight) {
                    height = resizeHeight;
                    width = Math.round(height * aspectRatio);
                  }
                } else {
                  width = resizeWidth || width;
                  height = resizeHeight || height;
                }
              }

              // Create canvas
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);

              // Compress image
              canvas.toBlob(
                function (blob) {
                  const compressedFile = new File(
                    [blob],
                    `${file.name.split(".")[0]}.${format}`,
                    {
                      type: `image/${format}`,
                      lastModified: Date.now(),
                    }
                  );

                  compressedFiles.push(compressedFile);
                  displayResult(file, compressedFile, index);

                  // If all files are processed
                  if (compressedFiles.length === files.length) {
                    compressBtn.disabled = false;
                    compressBtn.innerHTML =
                      '<i class="fas fa-compress-alt mr-2"></i> Compress Now';
                    optionsSection.style.display = "none";
                    filesSection.style.display = "none";
                    resultsSection.style.display = "block";
                  }
                },
                `image/${format}`,
                quality
              );
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      // Display compression result
      function displayResult(originalFile, compressedFile, index) {
        const resultItem = document.createElement("div");
        resultItem.className =
          "flex flex-col md:flex-row items-center p-4 bg-gray-700 rounded-lg";

        // Original file info
        const originalInfo = document.createElement("div");
        originalInfo.className = "flex-1 flex items-center mb-4 md:mb-0";
        originalInfo.innerHTML = `
                <div class="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-gray-200">
                    <img src="${URL.createObjectURL(
                      originalFile
                    )}" class="w-full h-full object-cover">
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-200">${
                      originalFile.name
                    }</p>
                    <p class="text-xs text-gray-300">${formatFileSize(
                      originalFile.size
                    )}</p>
                    <p class="text-xs text-gray-200 mt-1">Original</p>
                </div>
            `;

        // Arrow icon
        const arrowIcon = document.createElement("div");
        arrowIcon.className = "mx-4 text-gray-100 hidden md:block";
        arrowIcon.innerHTML = '<i class="fas fa-arrow-right"></i>';

        // Compressed file info
        const compressedInfo = document.createElement("div");
        compressedInfo.className = "flex-1 flex items-center mb-4 md:mb-0";
        compressedInfo.innerHTML = `
                <div class="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-gray-200">
                    <img src="${URL.createObjectURL(
                      compressedFile
                    )}" class="w-full h-full object-cover">
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-200">${
                      compressedFile.name
                    }</p>
                    <p class="text-xs text-gray-300">${formatFileSize(
                      compressedFile.size
                    )}</p>
                    <p class="text-xs ${
                      originalFile.size > compressedFile.size
                        ? "text-green-500"
                        : "text-red-500"
                    } mt-1">
                        ${Math.round(
                          (1 - compressedFile.size / originalFile.size) * 100
                        )}% smaller
                    </p>
                </div>
            `;

        // Download button
        const downloadBtn = document.createElement("button");
        downloadBtn.className =
          "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition ml-auto";
        downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i> Download';
        downloadBtn.onclick = function () {
          downloadFile(compressedFile);
        };

        // Build result item
        resultItem.appendChild(originalInfo);
        resultItem.appendChild(arrowIcon);
        resultItem.appendChild(compressedInfo);
        resultItem.appendChild(downloadBtn);

        resultsContainer.appendChild(resultItem);
      }

      // Download single file
      function downloadFile(file) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }

      // Download all files
      function downloadAll() {
        compressedFiles.forEach((file) => {
          downloadFile(file);
        });
      }

      // Reset the app
      function resetApp() {
        files = [];
        compressedFiles = [];
        fileList.innerHTML = "";
        fileCount.textContent = "0 files";
        resultsContainer.innerHTML = "";
        optionsSection.style.display = "none";
        filesSection.style.display = "none";
        resultsSection.style.display = "none";

        // Reset form values
        qualityRange.value = 80;
        qualityValue.textContent = "80%";
        document.getElementById("outputFormat").value = "original";
        document.getElementById("resizeWidth").value = "";
        document.getElementById("resizeHeight").value = "";
        document.getElementById("maintainAspect").checked = false;
      }
