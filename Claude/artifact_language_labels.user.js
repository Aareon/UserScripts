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

    // Check for UserScript patterns first (most specific)
    function isUserScript(codeContent) {
        // Strong UserScript header block indicators - check for these first
        const headerBlockPatterns = [
            /\/\/\s*==UserScript==/i,
            /\/\/\s*==\/UserScript==/i
        ];

        // If we find either header marker, it's definitely a UserScript
        for (const pattern of headerBlockPatterns) {
            if (pattern.test(codeContent)) {
                return true;
            }
        }

        // UserScript metadata patterns (more comprehensive)
        const userScriptDirectives = [
            /\/\/\s*@name\s+/i,
            /\/\/\s*@namespace\s+/i,
            /\/\/\s*@version\s+/i,
            /\/\/\s*@description\s+/i,
            /\/\/\s*@author\s+/i,
            /\/\/\s*@match\s+/i,
            /\/\/\s*@include\s+/i,
            /\/\/\s*@exclude\s+/i,
            /\/\/\s*@grant\s+/i,
            /\/\/\s*@require\s+/i,
            /\/\/\s*@resource\s+/i,
            /\/\/\s*@run-at\s+/i,
            /\/\/\s*@license\s+/i,
            /\/\/\s*@icon\s+/i,
            /\/\/\s*@updateURL\s+/i,
            /\/\/\s*@downloadURL\s+/i,
            /\/\/\s*@supportURL\s+/i,
            /\/\/\s*@homepageURL\s+/i,
            /\/\/\s*@noframes/i,
            /\/\/\s*@connect\s+/i
        ];

        // Count UserScript directive matches
        let directiveMatches = 0;
        for (const pattern of userScriptDirectives) {
            if (pattern.test(codeContent)) {
                directiveMatches++;
            }
        }

        // If we find 3 or more UserScript directives, it's very likely a UserScript
        if (directiveMatches >= 3) {
            return true;
        }

        // Check for UserScript-specific APIs (Greasemonkey/Tampermonkey)
        const userScriptAPIs = [
            /\bGM_setValue\b/,
            /\bGM_getValue\b/,
            /\bGM_deleteValue\b/,
            /\bGM_listValues\b/,
            /\bGM_addStyle\b/,
            /\bGM_getResourceText\b/,
            /\bGM_getResourceURL\b/,
            /\bGM_openInTab\b/,
            /\bGM_xmlhttpRequest\b/,
            /\bGM_notification\b/,
            /\bGM_setClipboard\b/,
            /\bGM_info\b/,
            /\bGM_download\b/,
            /\bGM_log\b/,
            /\bunsafeWindow\b/,
            // Modern GM API
            /\bGM\.setValue\b/,
            /\bGM\.getValue\b/,
            /\bGM\.deleteValue\b/,
            /\bGM\.listValues\b/,
            /\bGM\.getResourceUrl\b/,
            /\bGM\.xmlHttpRequest\b/,
            /\bGM\.notification\b/,
            /\bGM\.setClipboard\b/,
            /\bGM\.info\b/,
            /\bGM\.log\b/
        ];

        let apiMatches = 0;
        for (const pattern of userScriptAPIs) {
            if (pattern.test(codeContent)) {
                apiMatches++;
            }
        }

        // If we find multiple UserScript APIs plus at least one directive, it's likely a UserScript
        if (apiMatches >= 2 || (apiMatches >= 1 && directiveMatches >= 1)) {
            return true;
        }

        // Check for common UserScript comment patterns
        const userScriptComments = [
            /\/\/.*userscript/i,
            /\/\/.*tampermonkey/i,
            /\/\/.*greasemonkey/i,
            /\/\/.*violentmonkey/i
        ];

        let commentMatches = 0;
        for (const pattern of userScriptComments) {
            if (pattern.test(codeContent)) {
                commentMatches++;
            }
        }

        // If we have UserScript-related comments plus directives, it's likely a UserScript
        if (commentMatches >= 1 && directiveMatches >= 2) {
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