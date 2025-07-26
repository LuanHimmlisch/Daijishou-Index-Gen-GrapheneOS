#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process');

const outDir = path.join(__dirname, 'out');
const templateDir = path.join(__dirname, '/template');
const indexFileName = 'index.json';
const files = fs.readdirSync(templateDir);

if (fs.existsSync(outDir) && fs.readdirSync(outDir).length) {
    fs.rmSync(outDir, { force: true, recursive: true });
}

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

const [user_number, random1, random2, server_url] = process.argv.slice(2);
const errors = [];

if (user_number === undefined) errors.push("Required argument [user_number] not provided.");
if (random1 === undefined) errors.push("Required argument [random1] not provided.");
if (random2 === undefined) errors.push("Required argument [random2] not provided.");

if (errors.length) {
    console.error(errors[0]);
    process.exit(1);
}

let filesIndex = 0;
const filesLength = files.length;
const filesExported = [];

while (filesIndex < filesLength) {
    const fileName = files[filesIndex];
    const filePath = path.join(templateDir, fileName);

    if (fileName !== indexFileName && fs.statSync(filePath).isFile() && filePath.endsWith('.json')) {
        const fileContent = JSON.parse(fs.readFileSync(filePath));
        const filePathOut = path.join(outDir, fileName);
        const playersLength = fileContent?.playerList?.length;

        if (playersLength) {
            let playersIndex = 0;

            while (playersIndex < playersLength) {
                const player = fileContent.playerList[playersIndex];

                if (typeof player.amStartArguments === 'string') {
                    player.amStartArguments = player.amStartArguments.replaceAll('/data/app/', `/data/app/~~${random1}==/com.retroarch-${random2}==/`);
                    player.amStartArguments = player.amStartArguments.replaceAll('/data/data/', `/data/user/${user_number}/`);
                    player.amStartArguments = player.amStartArguments.replaceAll('/storage/emulated/0/', `/storage/emulated/${user_number}/`);

                    fileContent.playerList[playersIndex] = player;
                }
                ++playersIndex;
            }
        }

        filesExported.push(fileName);
        fs.writeFileSync(filePathOut, JSON.stringify(fileContent, null, 2));
    }

    ++filesIndex
}

const indexJson = JSON.parse(
    fs.readFileSync(path.join(templateDir, indexFileName))
);

let platformIndex = 0;
const platformLength = indexJson.platformList.length;
const validatedPlatforms = [];

while (platformIndex < platformLength) {
    const platform = indexJson.platformList[platformIndex];

    if (filesExported.includes(platform.filename)) {
        validatedPlatforms.push(platform);
    }

    ++platformIndex;
}

indexJson.platformList = validatedPlatforms;
indexJson.baseUri = server_url ?? 'http://localhost:8000';

fs.writeFileSync(path.join(outDir, indexFileName), JSON.stringify(indexJson, null, 2));

console.log('Finished!');
