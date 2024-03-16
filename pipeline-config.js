module.exports = {
    sftpConfigFile: "../sftp-config.js",
    productionPath: "housebird_games",
    stagingPath: "housebird_games_staging",
    htaccessFile: "STRATO.htaccess",
    databaseDir: "database",
    uncompressedDir: "img/uploads-uncompressed",
    compressedDir: "uploads",
    faviconPath: "img/logos-originals/Stubenvogel Fun Logo Round.png",
    faviconsOutputDir: "img/favicons",
    faviconsFileName: "Favicon",
    faviconSizes: [

    ],
    manifestIconPath: "img/logos-originals/Stubenvogel Fun Logo Round Icon.png",
    manifestIconOutputDir: "img/icons",
    manifestIconFileName: "Icon",
    manifestIconSizes: [

    ],
    statisticsFile: "pipeline-log.txt",
    ignoredFileTypes: [
        ".zip",
        ".rar",
        ".md",
        ".txt",
        ".psd",
        ".htaccess"
    ],
    directoriesToInclude: [
        "src",
        "fonts",
        "img/favicons",
        "img/icons",
        "img/screenshots",
        "img/elements",
        "img/logos-originals",
        "img/other-logos",
        "fonts",
        "uploads"
    ],
    directoriesToExcludeFromCache: [
        "img/screenshots",
        "database/.git",
        "database/EXAMPLE_housebird_games_config",
        "uploads"
    ]
};