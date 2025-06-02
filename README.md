# UserScripts

A collection of personal UserScripts designed to enhance web browsing experiences. These scripts are tested with TamperMonkey and focus on improving functionality for specific websites and services.

## 📋 Available Scripts

### Amazon Enhancement
- **Amazon Wishlist Total Cost Calculator** - Automatically calculates and displays the total cost of items in Amazon wishlists, including coupon detection and discount information

### Claude.ai Enhancements
- **Claude Artifact Line Numbers** - Adds line numbers to code artifacts with intelligent hiding during generation
- **Claude GitHub Repository Last Commit Info** - Displays last commit information for GitHub repositories included in Claude's Project Knowledge
- **Claude Artifact Language Labels** - Adds programming language badges to artifact titles with comprehensive language detection

## 🚀 Installation

1. Install a UserScript manager extension:
   - [TamperMonkey](https://tampermonkey.net/) (Recommended)
   - [GreaseMonkey](https://www.greasespot.net/)
   - [ViolentMonkey](https://violentmonkey.github.io/)

2. Click on any `.user.js` file in this repository
3. Click the "Raw" button to view the script source
4. Your UserScript manager should automatically detect and prompt for installation

## 📁 Project Structure

```
UserScripts/
├── Amazon/
│   └── wishlist_cost.user.js
├── Claude/
│   ├── artifact_line_numbers.user.js
│   ├── github_commit_info.user.js
│   └── artifact_language_labels.user.js
├── .gitignore
├── LICENSE
└── README.md
```

## 📜 License

These UserScripts are provided under a custom license:
- **Free for personal and educational use**
- **Commercial use is strictly prohibited** without prior written permission
- See [LICENSE](LICENSE) file for complete terms

## 🔧 Development Notes

- Scripts are designed to be lightweight and efficient
- All scripts include proper error handling and cleanup
- Code follows modern JavaScript practices with ES6+ features
- Comprehensive language detection algorithms for accurate classification

## 🤝 Contributing

These are personal UserScripts, but suggestions and bug reports are welcome through GitHub issues.

## ⚠️ Disclaimer

These scripts modify website behavior and may break if target websites change their structure. Use at your own discretion and always keep UserScripts updated.

---

**Author**: Aareon Sullivan  
**Repository**: [UserScripts](https://github.com/Aareon/UserScripts)  
**Tested with**: TamperMonkey