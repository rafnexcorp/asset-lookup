let dataMap = {}; // Global variable to store parsed data (keys will be uppercase)

// ===========================================
// 1. DATA LOADING FUNCTIONS
// ===========================================

// Function to fetch the CSV file and initiate parsing
function loadDataFromCSV() {
    const messageDiv = document.getElementById('message');
    const csvFilePath = 'yourdata.csv'; 

    fetch(csvFilePath)
        .then(response => {
            if (!response.ok) {
                // This error often occurs when not using a local web server (e.g., Live Server)
                throw new Error(`HTTP error! Status: ${response.status}. Ensure you are using a local web server.`);
            }
            return response.text();
        })
        .then(csvContent => {
            parseCSV(csvContent);
            
            if (Object.keys(dataMap).length > 0) {
                messageDiv.textContent = `✅ Data loaded successfully! (${Object.keys(dataMap).length} records)`;
                document.getElementById('issuedOutput').textContent = "Enter Asset Tag and click Lookup.";
                document.getElementById('returnedOutput').textContent = "Enter Asset Tag and click Lookup.";
            } else {
                messageDiv.textContent = "❌ Failed to parse CSV. Check columns, format, or ensure it's not empty.";
            }
        })
        .catch(error => {
            messageDiv.textContent = `❌ Data loading failed: ${error.message}`;
            console.error('Fetch Error:', error);
            document.getElementById('issuedOutput').textContent = "Fatal Error: Could not load data file.";
            document.getElementById('returnedOutput').textContent = "Fatal Error: Could not load data file.";
        });
}

// Function to parse the CSV and prepare the lookup map
function parseCSV(csv) {
    dataMap = {}; 
    const messageDiv = document.getElementById('message');
    
    // Clean and split lines
    const lines = csv.trim().split('\n').map(line => line.replace(/\r/g, ''));

    if (lines.length < 2) return; 
    
    const headers = lines[0].split(',').map(h => h.trim());
    const expectedColumnCount = headers.length;
    
    // Find required column indices
    const assetTagIndex = headers.indexOf('Asset Tag');
    const serialNumberIndex = headers.indexOf('Serial Number');
    const modelNameIndex = headers.indexOf('Model Name');
    const assetTypeIndex = headers.indexOf('Asset Type'); 

    if (assetTagIndex === -1 || serialNumberIndex === -1 || modelNameIndex === -1 || assetTypeIndex === -1) {
        messageDiv.textContent = "❌ Failed to parse CSV: Missing required headers (Asset Tag, Serial Number, Model Name, or Asset Type).";
        return;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; 
        
        const values = line.split(',');
        
        if (values.length !== expectedColumnCount) {
            console.error(`Row ${i + 1} has an inconsistent column count.`);
            messageDiv.textContent = `❌ Failed to parse data. Row ${i + 1} is corrupted (inconsistent columns).`;
            dataMap = {}; 
            return;
        }

        const originalAssetTag = values[assetTagIndex].trim();
        
        // ⭐ CRITICAL for Case-Insensitivity: Store the key in a standardized case (UPPERCASE)
        const standardizedAssetTag = originalAssetTag.toUpperCase(); 

        dataMap[standardizedAssetTag] = {
            'assetTag': originalAssetTag, // Store original tag for display
            'serialNumber': values[serialNumberIndex].trim(),
            'modelName': values[modelNameIndex].trim(),
            'assetType': values[assetTypeIndex].trim()
        };
    }
}

// ===========================================
// 2. UI AND TEMPLATE FUNCTIONS
// ===========================================

// Function to perform the lookup
function performLookup() {
    // ⭐ CRITICAL for Case-Insensitivity: Convert input to the standardized case (UPPERCASE)
    const inputTag = document.getElementById('assetTagInput').value.trim().toUpperCase(); 
    
    const issuedOutputDiv = document.getElementById('issuedOutput');
    const returnedOutputDiv = document.getElementById('returnedOutput');
    const copyIssuedButton = document.getElementById('copyIssuedButton');
    const copyReturnedButton = document.getElementById('copyReturnedButton');
    const messageDiv = document.getElementById('message');

    copyIssuedButton.disabled = true; 
    copyReturnedButton.disabled = true;

    if (Object.keys(dataMap).length === 0) {
        issuedOutputDiv.textContent = "Error: Data has not loaded or is empty. Check data loading status.";
        returnedOutputDiv.textContent = "Error: Data has not loaded or is empty. Check data loading status.";
        return;
    }
    
    if (!inputTag) {
        issuedOutputDiv.textContent = "Please enter an Asset Tag.";
        returnedOutputDiv.textContent = "Please enter an Asset Tag.";
        return;
    }

    // Lookup using the standardized uppercase input
    const item = dataMap[inputTag];

    if (item) {
        // ⭐ CONDITIONAL LOGIC for 'JC Removed: Y' line
        let jcRemovedLine = '';
        if (item.assetType.toLowerCase() === 'laptop') {
            jcRemovedLine = 'JC Removed: Y\n';
        }
        
        // --- TEMPLATE 1: FACILITIES ISSUED ---
        // Use item.assetTag (original case) for display
        const issuedTemplate = `Facilities: ${item.assetType} Issued
Model: ${item.modelName}
Serial Number: ${item.serialNumber}
Asset Tag: ${item.assetTag}
            
CMDB Updated: Y`;
        
        // --- TEMPLATE 2: FACILITIES RETURNED ---
        const returnedTemplate = `Facilities: ${item.assetType} Returned
Model: ${item.modelName}
Serial Number: ${item.serialNumber}
Asset Tag: ${item.assetTag}
            
${jcRemovedLine}CMDB Updated: Y`;

        issuedOutputDiv.textContent = issuedTemplate;
        returnedOutputDiv.textContent = returnedTemplate;
        copyIssuedButton.disabled = false;
        copyReturnedButton.disabled = false;
        messageDiv.textContent = `✅ Asset Tag ${item.assetTag} found.`;
    } else {
        // Use the original input value for the error message
        const errorMsg = `Error: Asset Tag "${document.getElementById('assetTagInput').value.trim()}" not found in the loaded data.`;
        issuedOutputDiv.textContent = errorMsg;
        returnedOutputDiv.textContent = errorMsg;
        messageDiv.textContent = ""; 
    }
}

// Function to copy the output text to the clipboard
function copyOutput(elementId) {
    const outputText = document.getElementById(elementId).textContent;
    const messageDiv = document.getElementById('message');

    navigator.clipboard.writeText(outputText)
        .then(() => {
            messageDiv.textContent = `✅ Successfully copied text from the ${elementId.includes('Issued') ? 'Issued' : 'Returned'} template!`;
            setTimeout(() => {
                messageDiv.textContent = "";
            }, 3000);
        })
        .catch(err => {
            messageDiv.textContent = "❌ Failed to copy. Your browser may not support this feature.";
            console.error('Copy failed:', err);
        });
}

// Function to clear the input and output fields
function clearFields() {
    document.getElementById('assetTagInput').value = '';
    document.getElementById('issuedOutput').textContent = 'Enter Asset Tag and click Lookup.';
    document.getElementById('returnedOutput').textContent = 'Enter Asset Tag and click Lookup.';
    
    // Clear the asset tag found message
    if (document.getElementById('message').textContent.startsWith('✅ Asset Tag')) {
        document.getElementById('message').textContent = '';
    }

    document.getElementById('copyIssuedButton').disabled = true;
    document.getElementById('copyReturnedButton').disabled = true;
}

// ⭐ NEW: Function to check if the pressed key is the Enter key
function checkEnter(event) {
    if (event.key === 'Enter') {
        performLookup();
        event.preventDefault(); 
    }
}

// ===========================================
// 3. INITIALIZATION
// ===========================================

// Start the data loading process automatically when the script executes
loadDataFromCSV();
