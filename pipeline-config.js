module.exports = {
    productionPath: "housebird_games",
    stagingPath: "housebird_games_staging",
    htaccessFile: "STRATO.htaccess",
    databaseDir: "database",
    uncompressedDir: "img/uploads-uncompressed",
    compressedDir: "uploads",
    faviconsInputPath: "img/logos-originals/Stubenvogel Fun Logo Round.png",
    faviconsOutputDir: "img/favicons",
    faviconsBaseFileName: "Favicon",
    faviconSizes: [

    ],
    statisticsFile: "Birdhouse/pipeline-log.txt",
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
        "img/screenshots",
        "img/elements",
        "img/logos-originals",
        "game-servers",
        "fonts",
        "uploads"
    ],
    directoriesToExcludeFromCache: [
        "img/screenshots",
        "uploads"
    ]
};