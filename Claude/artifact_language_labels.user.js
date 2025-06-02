// ==UserScript==
// @name         Claude Artifact Language Labels
// @namespace    https://github.com/Aareon
// @version      1.1
// @description  Add programming language labels to Claude artifact titles with improved TypeScript detection and UserScript support
// @author       Aareon
// @match        https://claude.ai/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Language mapping for common languages
    const languageMap = {
        'javascript': 'JS',
        'typescript': 'TS',
        'userscript': 'UserScript',
        'python': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        'csharp': 'C#',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'Sass',
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML',
        'sql': 'SQL',
        'bash': 'Bash',
        'shell': 'Shell',
        'powershell': 'PowerShell',
        'php': 'PHP',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'dart': 'Dart',
        'r': 'R',
        'matlab': 'MATLAB',
        'scala': 'Scala',
        'perl': 'Perl',
        'lua': 'Lua',
        'haskell': 'Haskell',
        'clojure': 'Clojure',
        'elixir': 'Elixir',
        'erlang': 'Erlang',
        'fsharp': 'F#',
        'vb': 'VB',
        'vbnet': 'VB.NET',
        'markdown': 'MD',
        'tex': 'LaTeX',
        'dockerfile': 'Docker',
        'nginx': 'Nginx',
        'apache': 'Apache',
        'react': 'React',
        'vue': 'Vue',
        'angular': 'Angular'
    };

    // CSS for language badges
    const languageBadgeCSS = `
        .artifact-language-badge {
            display: inline-flex;
            align-items: center;
            background: rgba(59, 130, 246, 0.1);
            color: rgb(59, 130, 246);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
            margin-right: 8px;
            flex-shrink: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            height: fit-content;
        }

        .artifact-language-badge.html {
            background: rgba(228, 77, 38, 0.1);
            color: rgb(228, 77, 38);
            border-color: rgba(228, 77, 38, 0.2);
        }

        .artifact-language-badge.css {
            background: rgba(21, 114, 182, 0.1);
            color: rgb(21, 114, 182);
            border-color: rgba(21, 114, 182, 0.2);
        }

        .artifact-language-badge.js,
        .artifact-language-badge.javascript {
            background: rgba(247, 223, 30, 0.1);
            color: rgb(181, 160, 0);
            border-color: rgba(247, 223, 30, 0.2);
        }

        .artifact-language-badge.python {
            background: rgba(53, 114, 165, 0.1);
            color: rgb(53, 114, 165);
            border-color: rgba(53, 114, 165, 0.2);
        }

        .artifact-language-badge.react {
            background: rgba(97, 218, 251, 0.1);
            color: rgb(97, 218, 251);
            border-color: rgba(97, 218, 251, 0.2);
        }

        .artifact-language-badge.typescript,
        .artifact-language-badge.ts {
            background: rgba(49, 120, 198, 0.1);
            color: rgb(49, 120, 198);
            border-color: rgba(49, 120, 198, 0.2);
        }

        .artifact-language-badge.userscript {
            background: rgba(255, 140, 0, 0.1);
            color: rgb(255, 140, 0);
            border-color: rgba(255, 140, 0, 0.2);
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
            .artifact-language-badge {
                background: rgba(59, 130, 246, 0.15);
                color: rgb(96, 165, 250);
                border-color: rgba(59, 130, 246, 0.3);
            }
        }
    `;

    // Add CSS to page
    function addCSS() {
        if (document.getElementById('claude-language-badge-css')) return;

        const style = document.createElement('style');
        style.id = 'claude-language-badge-css';
        style.textContent = languageBadgeCSS;
        document.head.appendChild(style);
    }

    // Check for UserScript patterns
    function isUserScript(codeContent) {
        // UserScript header block patterns
        const userScriptPatterns = [
            // UserScript header block
            /\/\/\s*==UserScript==/,
            /\/\/\s*@name\s+/,
            /\/\/\s*@namespace\s+/,
            /\/\/\s*@version\s+/,
            /\/\/\s*@description\s+/,
            /\/\/\s*@author\s+/,
            /\/\/\s*@match\s+/,
            /\/\/\s*@include\s+/,
            /\/\/\s*@grant\s+/,
            /\/\/\s*@require\s+/,
            /\/\/\s*@resource\s+/,
            /\/\/\s*@run-at\s+/,
            /\/\/\s*@license\s+/,
            /\/\/\s*==\/UserScript==/
        ];

        // Check for UserScript-specific patterns
        let userScriptMatches = 0;
        for (const pattern of userScriptPatterns) {
            if (pattern.test(codeContent)) {
                userScriptMatches++;
            }
        }

        // Strong indicators - if we find the header markers or multiple directives
        if (codeContent.includes('==UserScript==') || 
            codeContent.includes('==/UserScript==') || 
            userScriptMatches >= 3) {
            return true;
        }

        // Also check for common UserScript APIs
        const userScriptAPIs = [
            /GM_setValue/,
            /GM_getValue/,
            /GM_deleteValue/,
            /GM_listValues/,
            /GM_addStyle/,
            /GM_getResourceText/,
            /GM_getResourceURL/,
            /GM_openInTab/,
            /GM_xmlhttpRequest/,
            /GM_notification/,
            /GM_setClipboard/,
            /GM_info/,
            /unsafeWindow/
        ];

        let apiMatches = 0;
        for (const pattern of userScriptAPIs) {
            if (pattern.test(codeContent)) {
                apiMatches++;
            }
        }

        // If we find multiple UserScript APIs, it's likely a UserScript
        if (apiMatches >= 2) {
            return true;
        }

        return false;
    }

    // Comprehensive TypeScript detection function
    function isTypeScriptCode(codeContent) {
        // TypeScript-specific patterns based on official documentation and research
        const tsPatterns = [
            // Type annotations with colon syntax
            /\w+\s*:\s*(string|number|boolean|any|unknown|void|never|object)\b/,
            /\w+\s*:\s*\w+\[\]/,  // Array type annotations like string[]
            
            // Generic syntax with angle brackets
            /\<[A-Z][A-Za-z0-9]*(\s*,\s*[A-Z][A-Za-z0-9]*)*\>/,
            /\w+\<\w+\>/,  // Generic function calls or type usage
            
            // Interface declarations
            /interface\s+[A-Za-z][A-Za-z0-9]*\s*\{/,
            /interface\s+[A-Za-z][A-Za-z0-9]*\s*\<.*?\>\s*\{/, // Generic interfaces
            
            // Type alias declarations
            /type\s+[A-Za-z][A-Za-z0-9]*\s*=/,
            /type\s+[A-Za-z][A-Za-z0-9]*\s*\<.*?\>\s*=/,  // Generic type aliases
            
            // Enum declarations
            /enum\s+[A-Za-z][A-Za-z0-9]*\s*\{/,
            
            // Class access modifiers
            /\b(public|private|protected|readonly)\s+\w+/,
            
            // Function parameter and return type annotations
            /\(\s*\w+\s*:\s*\w+/,  // Function parameters with types
            /\)\s*:\s*(string|number|boolean|void|any|unknown|never|Promise|object)/,  // Return type annotations
            
            // Union types
            /:\s*\w+\s*\|\s*\w+/,
            
            // Optional properties and parameters
            /\w+\?\s*:/,  // Optional properties in interfaces/objects
            /\w+\?\s*\)/,  // Optional function parameters
            
            // Advanced TypeScript patterns
            /extends\s+\w+\s*\<.*?\>/,  // Generic extends
            /implements\s+\w+/,  // Class implements interface
            /keyof\s+\w+/,  // keyof operator
            /typeof\s+\w+/,  // typeof operator for type queries
            /namespace\s+\w+/,  // Namespace declarations
            /declare\s+(var|let|const|function|class|interface|type|enum)/,  // Ambient declarations
            
            // Mapped types
            /\[\s*\w+\s+in\s+keyof\s+\w+\s*\]/,
            
            // Assertion syntax
            /as\s+(string|number|boolean|any|unknown|object|\w+)/,
            /\<\w+\>/,  // Type assertions with angle bracket syntax
            
            // Import/export with types
            /import\s+type\s+/,
            /export\s+type\s+/,
            
            // Utility types
            /\b(Partial|Required|Readonly|Record|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|InstanceType)\s*\<\w+\>/
        ];

        // Check for multiple TypeScript patterns to increase confidence
        let matchCount = 0;
        for (const pattern of tsPatterns) {
            if (pattern.test(codeContent)) {
                matchCount++;
                // If we find 2 or more distinct TypeScript patterns, it's likely TypeScript
                if (matchCount >= 2) {
                    return true;
                }
            }
        }

        // Single strong indicators that are almost exclusively TypeScript
        const strongTsPatterns = [
            /interface\s+\w+/,
            /type\s+\w+\s*=/,
            /enum\s+\w+/,
            /\b(public|private|protected)\s+\w+/,
            /implements\s+\w+/,
            /namespace\s+\w+/
        ];

        for (const pattern of strongTsPatterns) {
            if (pattern.test(codeContent)) {
                return true;
            }
        }

        return false;
    }

    // Detect language from code blocks in an artifact
    function detectLanguageFromArtifact(artifactElement) {
        // Get the code content for pattern analysis first
        const codeContent = artifactElement.textContent || '';

        // Check for UserScript patterns first (most specific) - do this before checking explicit language classes
        if (isUserScript(codeContent)) {
            return 'userscript';
        }

        // Look for code elements with language classes
        const codeElements = artifactElement.querySelectorAll('code[class*="language-"], pre[class*="language-"]');

        for (const codeEl of codeElements) {
            const classList = Array.from(codeEl.classList);
            for (const className of classList) {
                if (className.startsWith('language-')) {
                    const lang = className.replace('language-', '').toLowerCase();
                    // Skip generic 'javascript' if we have more specific patterns to check
                    if (lang === 'javascript') {
                        // Check for TypeScript or other patterns first
                        if (isTypeScriptCode(codeContent)) {
                            return 'typescript';
                        }
                        // Check for React
                        if (codeContent.includes('React') || codeContent.includes('useState') || codeContent.includes('useEffect') || codeContent.includes('jsx')) {
                            return 'react';
                        }
                        // If no other patterns found, return javascript
                        return 'javascript';
                    }
                    return lang;
                }
            }
        }

        // Check for HTML artifacts (iframe with HTML content)
        const htmlIframes = artifactElement.querySelectorAll('iframe');
        if (htmlIframes.length > 0) {
            return 'html';
        }

        // Check for TypeScript-specific patterns (check before JavaScript since TS is a superset)
        if (isTypeScriptCode(codeContent)) {
            return 'typescript';
        }

        // Check for React components by looking for JSX-like patterns
        if (codeContent.includes('React') || codeContent.includes('useState') || codeContent.includes('useEffect') || codeContent.includes('jsx')) {
            return 'react';
        }

        // Check for common file extensions or content patterns
        if (codeContent.includes('<!DOCTYPE html>') || codeContent.includes('<html')) {
            return 'html';
        }

        if (codeContent.includes('def ') && codeContent.includes('import ')) {
            return 'python';
        }

        if (codeContent.includes('function ') || codeContent.includes('const ') || codeContent.includes('let ')) {
            return 'javascript';
        }

        return null;
    }

    // Add language badge to artifact header
    function addLanguageBadgeToHeader(headerArea, language) {
        // Remove existing badge if present
        const existingBadge = headerArea.querySelector('.artifact-language-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        const displayName = languageMap[language.toLowerCase()] || language.toUpperCase();

        const badge = document.createElement('div');
        badge.className = `artifact-language-badge ${language.toLowerCase()}`;
        badge.textContent = displayName;
        badge.title = `Language: ${displayName}`;

        // Find the left section (first div) to add the badge there
        const leftSection = headerArea.querySelector('div.flex.items-center.flex-1');
        if (leftSection) {
            leftSection.appendChild(badge);
        } else {
            // Fallback: add to the beginning of header
            headerArea.insertBefore(badge, headerArea.firstChild);
        }
    }

    // Process artifact titles
    function processArtifactTitles() {
        // Find all artifact containers by looking for the specific structure
        const artifactContainers = document.querySelectorAll('div[class*="flex"][class*="h-full"][class*="overflow-hidden"]');

        artifactContainers.forEach(container => {
            // Check if this container has artifact content (code, iframe, etc.)
            const hasArtifactContent = container.querySelector('code[class*="language-"], iframe, pre[class*="language-"]');
            if (!hasArtifactContent) return;

            // Skip if already processed
            if (container.querySelector('.artifact-language-badge')) return;

            // Find the header area where we can add the badge
            const headerArea = container.querySelector('div.pr-2.pl-3.flex.items-center.justify-between');
            if (!headerArea) return;

            const language = detectLanguageFromArtifact(container);
            if (language) {
                addLanguageBadgeToHeader(headerArea, language);
            }
        });
    }

    // Initialize
    function init() {
        addCSS();
        processArtifactTitles();
    }

    // Set up mutation observer to handle dynamically added content
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node contains artifact content or is an artifact container
                            if (node.querySelector('code[class*="language-"], iframe, pre[class*="language-"]') ||
                                (node.matches && node.matches('div[class*="flex"][class*="h-full"][class*="overflow-hidden"]'))) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                // Delay processing to ensure DOM is stable and content is loaded
                setTimeout(processArtifactTitles, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1500); // Give Claude time to load artifacts
            setupObserver();
        });
    } else {
        setTimeout(init, 1500);
        setupObserver();
    }

    // Also run periodically to catch any missed artifacts
    setInterval(processArtifactTitles, 5000);

})();