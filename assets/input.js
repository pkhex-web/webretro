document.addEventListener('DOMContentLoaded', () => {
    const eventTypeMap = {
        mouse: ['mousedown', 'mouseup'],
        touch: ['touchstart', 'touchend']
    }

    const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);
    const toggleInputs = () => {
        console.log(navigator.userAgent);
        if (isMobile()) {
            document.getElementById('inputs').style.display = 'flex';
        } else {
            document.getElementById('inputs').style.display = 'none';
        }
    }

    const toLeft = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_left']) });
    const toDown = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_down']) });
    const toUp = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_up']) });
    const toRight = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_right']) });

    const pressStart = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_start']) });
    const pressSelect = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_select']) });
    
    const pressL1 = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_l']) });
    const pressR1 = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_r']) });
    
    const pressA = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_a']) });
    const pressB = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_b']) });
    const pressX = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_x']) });
    const pressY = () => fakeKeyPress({ code: configIDToCode(keybindsObj['input_player1_y']) });

    toggleInputs();
    window.addEventListener('resize', toggleInputs);

    let holdInterval;
    document.addEventListener('mouseup', () => {
        if (holdInterval) clearInterval(holdInterval);
    });
    const addEvent = (element, eventType, callback) => {
        element.addEventListener(eventTypeMap[eventType][0], (event) => {
            if (holdInterval) clearInterval(holdInterval);

            event.preventDefault();
            callback();

            holdInterval = setInterval(() => {
                callback();
            }, 50);
        });

        element.addEventListener(eventTypeMap[eventType][1], () => {
            isHolding = false;
            clearInterval(holdInterval);
        });
    }

    // Hook up the events
    addEvent(document.getElementById('input-left'), 'mouse', toLeft);
    addEvent(document.getElementById('input-down'), 'mouse', toDown);
    addEvent(document.getElementById('input-up'), 'mouse', toUp);
    addEvent(document.getElementById('input-right'), 'mouse', toRight);

    addEvent(document.getElementById('input-start'), 'mouse', pressStart);
    addEvent(document.getElementById('input-select'), 'mouse', pressSelect);
    addEvent(document.getElementById('input-shoulder-left'), 'mouse', pressL1);
    addEvent(document.getElementById('input-shoulder-right'), 'mouse', pressR1);

    addEvent(document.getElementById('input-a'), 'mouse', pressA);
    addEvent(document.getElementById('input-b'), 'mouse', pressB);
    addEvent(document.getElementById('input-x'), 'mouse', pressX);
    addEvent(document.getElementById('input-y'), 'mouse', pressY);

    addEvent(document.getElementById('input-left'), 'touch', toLeft);
    addEvent(document.getElementById('input-down'), 'touch', toDown);
    addEvent(document.getElementById('input-up'), 'touch', toUp);
    addEvent(document.getElementById('input-right'), 'touch', toRight);

    addEvent(document.getElementById('input-start'), 'touch', pressStart);
    addEvent(document.getElementById('input-select'), 'touch', pressSelect);
    addEvent(document.getElementById('input-shoulder-left'), 'touch', pressL1);
    addEvent(document.getElementById('input-shoulder-right'), 'touch', pressR1);

    addEvent(document.getElementById('input-a'), 'touch', pressA);
    addEvent(document.getElementById('input-b'), 'touch', pressB);
    addEvent(document.getElementById('input-x'), 'touch', pressX);
    addEvent(document.getElementById('input-y'), 'touch', pressY);
});