const fs = require('fs');
const path = require('path');

// Test file creation
const testContent = "This is a test PDF content";
const testPath = "/mnt/d/FeiYuzi/project/AI_resume/file_pipeline/uploads/pending/test-file.txt";

try {
  fs.writeFileSync(testPath, testContent);
  console.log("Test file created successfully at:", testPath);
  
  // Check if file exists
  if (fs.existsSync(testPath)) {
    console.log("File exists and is readable");
    // Clean up test file
    fs.unlinkSync(testPath);
    console.log("Test file cleaned up");
  }
} catch (error) {
  console.error("Error creating test file:", error);
}