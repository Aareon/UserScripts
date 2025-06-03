// ==UserScript==
// @name         Claude Artifact Language Labels
// @namespace    https://github.com/Aareon
// @version      1.2
// @description  Add programming language labels to Claude artifact titles with improved TypeScript detection and UserScript support
// @author       Aareon
// @match        https://claude.ai/*
// @require      https://cdn.jsdelivr.net/gh/Aareon/UserScripts@main/Claude/ClaudeStyleCommon.user.js
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Wait for ClaudeStyles to be available
    function waitForClaudeStyles(callback) {
        if (window.ClaudeStyles) {
            callback();
        } else {
            setTimeout(() => waitForClaudeStyles(callback), 100);
        }
    }

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

    // Additional CSS specific to language badges
    const additionalCSS = `
        .artifact-language-badge {
            ${window.ClaudeStyles.components.badgeBase}
            margin-left: 8px;
            margin-right: 8px;
            flex-shrink: 0;
            height: fit-content;
        }

        /* Specific badge colors using the common system */
        .artifact-language-badge.claude-badge-userscript {
            ${window.ClaudeStyles.components.badgeBase}
            background: rgba(255, 140, 0, 0.1);
            color: rgb(255, 140, 0);
            border-color: rgba(255, 140, 0, 0.2);
        }

        .artifact-language-badge.claude-badge-react {
            ${window.ClaudeStyles.components.badgeBase}
            background: rgba(97, 218, 251, 0.1);
            color: rgb(97, 218, 251);
            border-color: rgba(97, 218, 251, 0.2);
        }
    `;

    // Check for UserScript patterns first (most specific)
    function isUserScript(codeContent) {
        const headerBlockPatterns = [
            /\/\/\s*==UserScript==/i,
            /\/\/\s*==\/UserScript==/i
        ];

        for (const pattern of headerBlockPatterns) {
            if (pattern.test(codeContent)) {
                return true;
            }
        }

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

        let directiveMatches = 0;
        for (const pattern of userScriptDirectives) {
            if (pattern.test(codeContent)) {
                directiveMatches++;
            }
        }

        if (directiveMatches >= 3) {
            return true;
        }

        const userScriptAPIs = [
            /\bGM_setValue\b/, /\bGM_getValue\b/, /\bGM_deleteValue\b/, /\bGM_listValues\b/,
            /\bGM_addStyle\b/, /\bGM_getResourceText\b/, /\bGM_getResourceURL\b/, /\bGM_openInTab\b/,
            /\bGM_xmlhttpRequest\b/, /\bGM_notification\b/, /\bGM_setClipboard\b/, /\bGM_info\b/,
            /\bGM_download\b/, /\bGM_log\b/, /\bunsafeWindow\b/,
            /\bGM\.setValue\b/, /\bGM\.getValue\b/, /\bGM\.deleteValue\b/, /\bGM\.listValues\b/,
            /\bGM\.getResourceUrl\b/, /\bGM\.xmlHttpRequest\b/, /\bGM\.notification\b/,
            /\bGM\.setClipboard\b/, /\bGM\.info\b/, /\bGM\.log\b/
        ];

        let apiMatches = 0;
        for (const pattern of userScriptAPIs) {
            if (pattern.test(codeContent)) {
                apiMatches++;
            }
        }

        if (apiMatches >= 2 || (apiMatches >= 1 && directiveMatches >= 1)) {
            return true;
        }

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

        if (commentMatches >= 1 && directiveMatches >= 2) {
            return true;
        }

        return false;
    }

    // Comprehensive TypeScript detection function
    function isTypeScriptCode(codeContent) {
        const tsPatterns = [
            /\w+\s*:\s*(string|number|boolean|any|unknown|void|never|object)\b/,
            /\w+\s*:\s*\w+\[\]/,
            /\<[A-Z][A-Za-z0-9]*(\s*,\s*[A-Z][A-Za-z0-9]*)*\>/,
            /\w+\<\w+\>/,
            /interface\s+[A-Za-z][A-Za-z0-9]*\s*\{/,
            /interface\s+[A-Za-z][A-Za-z0-9]*\s*\<.*?\>\s*\{/,
            /type\s+[A-Za-z][A-Za-z0-9]*\s*=/,
            /type\s+[A-Za-z][A-Za-z0-9]*\s*\<.*?\>\s*=/,
            /enum\s+[A-Za-z][A-Za-z0-9]*\s*\{/,
            /\b(public|private|protected|readonly)\s+\w+/,
            /\(\s*\w+\s*:\s*\w+/,
            /\)\s*:\s*(string|number|boolean|void|any|unknown|never|Promise|object)/,
            /:\s*\w+\s*\|\s*\w+/,
            /\w+\?\s*:/,
            /\w+\?\s*\)/,
            /extends\s+\w+\s*\<.*?\>/,
            /implements\s+\w+/,
            /keyof\s+\w+/,
            /typeof\s+\w+/,
            /namespace\s+\w+/,
            /declare\s+(var|let|const|function|class|interface|type|enum)/,
            /\[\s*\w+\s+in\s+keyof\s+\w+\s*\]/,
            /as\s+(string|number|boolean|any|unknown|object|\w+)/,
            /\<\w+\>/,
            /import\s+type\s+/,
            /export\s+type\s+/,
            /\b(Partial|Required|Readonly|Record|Pick|Omit|Exclude|Extract|NonNullable|ReturnType|InstanceType)\s*\<\w+\>/
        ];

        let matchCount = 0;
        for (const pattern of tsPatterns) {
            if (pattern.test(codeContent)) {
                matchCount++;
                if (matchCount >= 2) {
                    return true;
                }
            }
        }

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
        const codeContent = artifactElement.textContent || '';

        // Check for UserScript patterns first
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
                    if (lang === 'javascript') {
                        if (isTypeScriptCode(codeContent)) {
                            return 'typescript';
                        }
                        if (codeContent.includes('React') || codeContent.includes('useState') || codeContent.includes('useEffect') || codeContent.includes('jsx')) {
                            return 'react';
                        }
                        return 'javascript';
                    }
                    return lang;
                }
            }
        }

        // Check for HTML artifacts
        const htmlIframes = artifactElement.querySelectorAll('iframe');
        if (htmlIframes.length > 0) {
            return 'html';
        }

        // Check for TypeScript-specific patterns
        if (isTypeScriptCode(codeContent)) {
            return 'typescript';
        }

        // Check for React components
        if (codeContent.includes('React') || codeContent.includes('useState') || codeContent.includes('useEffect') || codeContent.includes('jsx')) {
            return 'react';
        }

        // Check for other patterns
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

        // Use ClaudeStyles to create the badge
        const badge = window.ClaudeStyles.createLanguageBadge(language, displayName);
        badge.className += ' artifact-language-badge';

        // Add specific badge class for enhanced styling
        if (language.toLowerCase() === 'userscript') {
            badge.className += ' claude-badge-userscript';
        } else if (language.toLowerCase() === 'react') {
            badge.className += ' claude-badge-react';
        }

        // Find the left section to add the badge
        const leftSection = headerArea.querySelector('div.flex.items-center.flex-1');
        if (leftSection) {
            leftSection.appendChild(badge);
        } else {
            headerArea.insertBefore(badge, headerArea.firstChild);
        }
    }

    // Process artifact titles
    function processArtifactTitles() {
        const artifactContainers = document.querySelectorAll('div[class*="flex"][class*="h-full"][class*="overflow-hidden"]');

        artifactContainers.forEach(container => {
            const hasArtifactContent = container.querySelector('code[class*="language-"], iframe, pre[class*="language-"]');
            if (!hasArtifactContent) return;

            if (container.querySelector('.artifact-language-badge')) return;

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
        // Add CSS using ClaudeStyles
        window.ClaudeStyles.addCommonCSS('claude-language-badges-css', additionalCSS);
        processArtifactTitles();
    }

    // Set up mutation observer
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.querySelector('code[class*="language-"], iframe, pre[class*="language-"]') ||
                                (node.matches && node.matches('div[class*="flex"][class*="h-full"][class*="overflow-hidden"]'))) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                setTimeout(processArtifactTitles, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start when ClaudeStyles is ready
    waitForClaudeStyles(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(init, 1500);
                setupObserver();
            });
        } else {
            setTimeout(init, 1500);
            setupObserver();
        }

        // Periodic check
        setInterval(processArtifactTitles, 5000);
    });

})();