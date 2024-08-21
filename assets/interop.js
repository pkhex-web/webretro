// When the iframe is ready to receive messages
window.addEventListener('DOMContentLoaded', () => {
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
    saveFile.name = saveFile.name.replace('.sav', '.srm');

    loadSave(saveFile, romFile.name);
    loadRom(romFile);
}

function loadSave(saveFile, romName) {
    const data = {
        name: saveFile.name,
        data: saveFile.bytes,
    }

    romName = romName.split("/").slice(-1)[0].split(".")[0]
    setIdbItem("RetroArch_saves_" + romName, [{ ext: "." + data.name.split(".").slice(-1)[0], dir: "", data: new Uint8Array(data.data) }]);
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