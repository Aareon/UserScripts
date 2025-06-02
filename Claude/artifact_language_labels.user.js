// ==UserScript==
// @name         Claude Artifact Language Labels
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Add programming language labels to Claude artifact titles
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

    // Detect language from code blocks in an artifact
    function detectLanguageFromArtifact(artifactElement) {
        // Look for code elements with language classes
        const codeElements = artifactElement.querySelectorAll('code[class*="language-"], pre[class*="language-"]');

        for (const codeEl of codeElements) {
            const classList = Array.from(codeEl.classList);
            for (const className of classList) {
                if (className.startsWith('language-')) {
                    const lang = className.replace('language-', '').toLowerCase();
                    return lang;
                }
            }
        }

        // Check for HTML artifacts (iframe with HTML content)
        const htmlIframes = artifactElement.querySelectorAll('iframe');
        if (htmlIframes.length > 0) {
            return 'html';
        }

        // Check for React components by looking for JSX-like patterns
        const codeContent = artifactElement.textContent || '';
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