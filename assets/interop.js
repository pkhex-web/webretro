// When the iframe is ready to receive messages
window.addEventListener('DOMContentLoaded', async () => {
    // intercept stderr
    if (Module && "printErr" in Module) {
        const originalPrintErr = Module.printErr;
        Module.printErr = (text) => {
            // if we detect that libretro has synced the save data, we can now save the save data to IndexedDB
            if (/\[libretro INFO\] GBA Savedata: Savedata synced/.test(text)) {
                setTimeout(() => {
                    Module._cmd_savefiles()
                })
            }
            originalPrintErr(text);
        }
    }

    await resourcesReady();
    console.log('Interop resources are ready');
    window.parent.postMessage('iframe-ready', '*');
});

// Add your message event listener
window.addEventListener('message', (event) => {
    const data = event.data;

    if (typeof data !== 'object') return;
    if (!("type" in data)) return;

    switch (data.type) {
        case 'load_game':
            loadGame(data.saveFile, data.romFile);
            break;
    }
});

function loadGame(saveFile, romFile) {
    // Convert save file to SRM as this is the only extension recognized by RetroArch
    if (!saveFile.name.includes(".") || saveFile.name.split('.').length !== 3) {
        saveFile.name = `${saveFile.name}.srm`
    }
    saveFile.name = saveFile.name.replace(/\.[^/.]+$/, '.srm');

    const saveKey = loadSave(saveFile, romFile.name);
    loadRom(romFile);
    
    watchForSaveChanges(saveKey);
}

function loadSave(saveFile, romName) {
    const data = {
        name: saveFile.name,
        data: saveFile.bytes,
    }

    romName = romName.split("/").slice(-1)[0].split(".")[0]
    const saveKey = `RetroArch_saves_${romName}`;
    setIdbItem(saveKey, [{ ext: "." + data.name.split(".").slice(-1)[0], dir: "", data: new Uint8Array(data.data) }]);

    return saveKey;
}

function loadRom(romFile) {
    const data = [
        {
            path: romFile.name,
            data: romFile.bytes
        }
    ];

    readyForInterop(data)
}

function readyForInterop(files) {
    // undefine romUploadCallback to make sure initialization only happens once (it shouldn't anyway)
    romUploadCallback = function () { };

    // set the romName now if using single-file rom
    if (files.length == 1) {
        romName = files[0].path.split("/").slice(-1)[0].split(".")[0];
        document.title = romName + (appIsPwa ? "" : " | webretro");
    }

    if (queries.romshift) {
        let shift = parseInt(queries.romshift);
        for (var i = 0; i < files.length; i++) {
            files[i].data = avShift(new Uint8Array(files[i].data), shift).buffer;
        }
    }

    // remove the file drop listeners
    if (romUploadsReady) {
        document.removeEventListener("dragenter", fileDragEnter);
        document.removeEventListener("dragover", fileDragOver);
        document.removeEventListener("drop", fileDropped);
    }

    // start button (don't delete this section, audio contexts are not allowed to start until a user gesture on the page, in this case, clicking the start button) https://goo.gl/7K7WLu
    startButton.style.display = "initial";
    ffd.style.display = "none";
    startButton.onclick = function () {
        startButton.style.display = "none";
        initFromData(files);
    }
}

let saveChangesWatcher;
async function watchForSaveChanges(saveKey) {
    if (saveChangesWatcher) clearInterval(saveChangesWatcher);

    let saveData = (await getIdbItem(saveKey))[0]?.data;
    let lastChecksum = crc32(saveData);

    setInterval(async () => {
        let saveData = (await getIdbItem(saveKey))[0]?.data;
        let newChecksum = crc32(saveData);

        if (newChecksum !== lastChecksum) {
            lastChecksum = newChecksum;
            window.parent.postMessage({ type: 'new_save_available', bytes: saveData }, '*');
        }
    }, 250)
}

function resourcesReady() {
    return new Promise((resolve, reject) => {
        const checkIdbInstance = setInterval(() => {
            if (wIdb !== null) {
                console.log('IndexedDB instance is ready');
                clearInterval(checkIdbInstance);
                resolve();  // Resolve the promise when idbInstance is ready
            }
        }, 100);  // Check every 100ms

        setTimeout(() => {
            if (wIdb === null) {
                clearInterval(checkIdbInstance);
                reject(new Error('IndexedDB initialization timed out'));
            }
        }, 10000); // Timeout after 10 seconds
    });
}

const table = (function () {
    let values = new Int32Array(256);
    let value_nr = 0;
    while (value_nr < 256) {
        let c = value_nr;
        let iteration = 0;
        while (iteration < 8) {
            c = (
                c & 1
                ? 0xEDB88320 ^ (c >>> 1)
                : c >>> 1
            );
            iteration += 1;
        }
        values[value_nr] = c;
        value_nr += 1;
    }
    return values;
}());

function crc32(byte_array, checksum = 0) {
    checksum ^= 0xFFFFFFFF;
    let byte_nr = 0;
    while (byte_nr < byte_array.length) {
        checksum = (checksum >>> 8) ^ table[
            (checksum ^ byte_array[byte_nr]) & 0xFF
        ];
        byte_nr += 1;
    }
    return checksum ^ 0xFFFFFFFF;
}