// utils/exportDeploy.js

/**
 * Export project files as a ZIP
 */
export const exportProject = async (files, projectName = 'my-project') => {
  try {
    // Create a simple text file with all the code
    let exportContent = `# ${projectName}\n\n`;
    exportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    exportContent += `---\n\n`;

    // Add each file to the export
    Object.entries(files).forEach(([filename, fileData]) => {
      exportContent += `## File: ${filename}\n\n`;
      exportContent += '```\n';
      exportContent += fileData.code || '';
      exportContent += '\n```\n\n';
    });

    // Create a blob and download
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Project exported successfully!' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export project' };
  }
};

/**
 * Prepare files for deployment
 */
export const prepareForDeployment = (files) => {
  try {
    // Create deployment instructions
    const deploymentGuide = `
# Deployment Guide

## Steps to Deploy Your Project:

1. **Save Your Files**
   - Download the exported project files
   - Extract them to a new folder

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run Locally**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Deploy to Vercel** (Recommended)
   - Install Vercel CLI: \`npm i -g vercel\`
   - Run: \`vercel\`
   - Follow the prompts

5. **Deploy to Netlify**
   - Install Netlify CLI: \`npm i -g netlify-cli\`
   - Run: \`netlify deploy\`
   - Follow the prompts

6. **Deploy to GitHub Pages**
   - Push your code to GitHub
   - Enable GitHub Pages in repository settings
   - Select your branch and folder

## Environment Variables
Make sure to set up your environment variables in your deployment platform:
- API keys
- Database URLs
- Other sensitive data

## Need Help?
Visit the documentation for your chosen platform or contact support.
    `;

    return {
      success: true,
      guide: deploymentGuide,
      message: 'Deployment guide generated!'
    };
  } catch (error) {
    console.error('Deployment prep error:', error);
    return {
      success: false,
      message: 'Failed to prepare deployment guide'
    };
  }
};

/**
 * Copy project code to clipboard
 */
export const copyToClipboard = async (files) => {
  try {
    let content = '';
    Object.entries(files).forEach(([filename, fileData]) => {
      content += `// ${filename}\n`;
      content += fileData.code || '';
      content += '\n\n';
    });

    await navigator.clipboard.writeText(content);
    return { success: true, message: 'Code copied to clipboard!' };
  } catch (error) {
    console.error('Copy error:', error);
    return { success: false, message: 'Failed to copy code' };
  }
};