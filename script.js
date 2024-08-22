const PAT = 'e3101c08e1b64d19932dc59c48387237';
const USER_ID = 'clarifai';
const APP_ID = 'main';
const MODEL_ID = 'general-image-recognition';
const MODEL_VERSION_ID = 'aa7f35c01e0642fda5cf400f543e7c40';
// Your PAT (Personal Access Token) can be found in the Account's Security section


const USER_ID2 = 'openai';    
const APP_ID2 = 'chat-completion';
const MODEL_ID2 = 'openai-gpt-4-vision';
const MODEL_VERSION_ID2 = '266df29bc09843e0aee9b7bf723c03c2'; 


const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorInfo = document.getElementById('colorInfo');
const instrumentSelect = document.getElementById('instrumentSelect');




let synth; // Declare a global variable to hold the synth

// Initialize the default instrument as MembraneSynth
function initializeSynth() {
    synth = new Tone.MembraneSynth().toDestination();
}

// Initialize Tone.js effects
const reverb = new Tone.Reverb().toDestination();
const delay = new Tone.FeedbackDelay().toDestination();
const chorus = new Tone.Chorus().toDestination();
const phaser = new Tone.Phaser().toDestination();
const vibrato = new Tone.Vibrato().toDestination();

// Chain effects
function connectEffects() {
    synth.connect(reverb);
    reverb.connect(delay);
    delay.connect(chorus);
    chorus.connect(phaser);
    phaser.connect(vibrato);
}

// Initialize the synth and connect effects on page load
initializeSynth();
connectEffects();

let lastColor = '';
const MOVEMENT_DELAY = 300; // Time in milliseconds before sound stops
let moveTimer = null;

fileInput.addEventListener('change', handleFileUpload);

instrumentSelect.addEventListener('change', () => {
    // Reinitialize the synth based on selected instrument
    switch (instrumentSelect.value) {
        case 'PolySynth':
            synth.dispose(); // Dispose of the previous synth to avoid memory leaks
            synth = new Tone.PolySynth().toDestination();
            break;
        case 'Synth':
            synth.dispose();
            synth = new Tone.Synth().toDestination();
            break;
        default:
            synth.dispose();
            synth = new Tone.MembraneSynth().toDestination();
            break;
    }
    connectEffects();
});

function handleFileUpload(event) {
    document.getElementById('reverb-decay').textContent = "analyzing..."
    document.getElementById('delay-time').textContent = "analyzing..."
    document.getElementById('chorus-depth').textContent = "analyzing..."
    document.getElementById('phaser-frequency').textContent = "analyzing..."
    document.getElementById('vibrato-depth').textContent = "analyzing..."

    const file = event.target.files[0];
    if (file) {
        // Display "Analyzing image..." text
        

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                generateMusicPrompt(); // Uncommented this line
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    } else {
        console.error('No file selected or file is invalid.');
    }
}



function fetchWithRetry(url, options, retries = 3, delay = 500) {
    return new Promise((resolve, reject) => {
        fetch(url, options)
            .then(response => {
                if (response.ok) {
                    resolve(response.json());
                } else {
                    if (retries > 0) {
                        setTimeout(() => {
                            fetchWithRetry(url, options, retries - 1, delay)
                                .then(resolve)
                                .catch(reject);
                        }, delay);
                    } else {
                        reject(new Error(`Failed to fetch ${url} after ${retries} retries: ${response.statusText}`));
                    }
                }
            })
            .catch(error => {
                if (retries > 0) {
                    setTimeout(() => {
                        fetchWithRetry(url, options, retries - 1, delay)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                } else {
                    reject(new Error(`Fetch failed after ${retries} retries: ${error.message}`));
                }
            });
    });
}


function generateMusicPrompt() {
    console.log("generateMusicPrompt called");
    const fileInput = document.getElementById('fileInput').files[0];
    if (!fileInput) {
        alert("Please select an image first.");
        return;
    }

    console.log("File input:", fileInput);

    const reader = new FileReader();
    reader.onloadend = function () {
        const base64Image = reader.result.split(',')[1];
        console.log("Base64 image:", base64Image);

        const raw = JSON.stringify({
            "user_app_id": {
                "user_id": USER_ID2,
                "app_id": APP_ID2
            },
            "inputs": [
                {
                    "data": {
                        "text": {
                            "raw": "Generate number values between 0 and 1 for reverb, delay, chorus, phaser, vibrato based on the feelings of this picture: (OUTPUT FORMAT EXAMPLE: Reverb: 0.1 - A reason why you set this value)"
                        },
                        "image": {
                            "base64": base64Image
                        }
                    }
                }
            ]
        });

        console.log("Raw data:", raw);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Key ' + PAT,
                'Content-Type': 'application/json'
            },
            body: raw
        };

        console.log("Request options:", requestOptions);

        fetch("https://api.clarifai.com/v2/models/" + MODEL_ID2 + "/versions/" + MODEL_VERSION_ID2 + "/outputs", requestOptions)
            .then(response => {
                console.log("Response status:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("Data:", data);
                if (data.status.code !== 10000) {
                    console.error("API Error:", data.status);
                } else {
                    const outputText = data.outputs[0].data.text.raw;
                    console.log("Text Output:", outputText);

                    // Improved extraction of values and reasons
                    const reverbMatch = outputText.match(/Reverb:\s*([\d\.]+)\s*-\s*([^D]*)/);
                    const delayMatch = outputText.match(/Delay:\s*([\d\.]+)\s*-\s*([^C]*)/);
                    const chorusMatch = outputText.match(/Chorus:\s*([\d\.]+)\s*-\s*([^P]*)/);
                    const phaserMatch = outputText.match(/Phaser:\s*([\d\.]+)\s*-\s*([^V]*)/);
                    const vibratoMatch = outputText.match(/Vibrato:\s*([\d\.]+)\s*-\s*(.*)/);

                    // Handle cases where the match might not be found
                    const reverbValue = reverbMatch ? parseFloat(reverbMatch[1]) : 'N/A';
                    const delayValue = delayMatch ? parseFloat(delayMatch[1]) : 'N/A';
                    const chorusValue = chorusMatch ? parseFloat(chorusMatch[1]) : 'N/A';
                    const phaserValue = phaserMatch ? parseFloat(phaserMatch[1]) : 'N/A';
                    const vibratoValue = vibratoMatch ? parseFloat(vibratoMatch[1]) : 'N/A';

                    // Extract and clean reasons
                    const reverbReason = reverbMatch ? reverbMatch[2].trim() : 'N/A';
                    const delayReason = delayMatch ? delayMatch[2].trim() : 'N/A';
                    const chorusReason = chorusMatch ? chorusMatch[2].trim() : 'N/A';
                    const phaserReason = phaserMatch ? phaserMatch[2].trim() : 'N/A';
                    const vibratoReason = vibratoMatch ? vibratoMatch[2].trim() : 'N/A';

                    adjustEffectsBasedOnImage(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, reverbReason, delayReason, chorusReason, phaserReason, vibratoReason);
                }
            })
            .catch(error => console.error('Fetch error:', error));
    };

    reader.onerror = function (error) {
        console.error("FileReader error:", error);
    };

    reader.readAsDataURL(fileInput);
}





canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();

    // Scale the mouse coordinates to the canvas size
    const scaleX = canvas.width / rect.width;   // Width scaling factor
    const scaleY = canvas.height / rect.height; // Height scaling factor

    // Calculate the correct coordinates on the canvas
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Retrieve the color data from the canvas at the calculated coordinates
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const a = pixel[3];

    const color = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    colorInfo.textContent = `Color: ${color}`;
    colorInfo.style.backgroundColor = color;
    colorInfo.style.color = getContrastColor(color);

    playColorSound(color);

    // Reset the movement timer
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
        synth.triggerRelease(); // Release the note after the delay
    }, MOVEMENT_DELAY);
});

canvas.addEventListener('mouseleave', () => {
    synth.triggerRelease(); // Release the note when the mouse leaves the canvas
});

function getContrastColor(color) {
    const [r, g, b] = color.match(/\d+/g).map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000' : '#fff';
}

function playColorSound(color) {
    if (color !== lastColor) {
        const note = getColorNote(color);
        const volumeValue = getVolumeValue(color);
        synth.volume.value = volumeValue;  // Adjust the volume based on brightness
        synth.triggerAttack(note);
        lastColor = color;
    }
}

function getColorNote(color) {
    const [r, g, b] = color.match(/\d+/g).map(Number);

    // Calculate a color intensity (0-1 scale)
    const intensity = (r + g + b) / (3 * 255);

    // Map intensity to a note from C1 to C4
    const notes = ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
    const noteIndex = Math.floor(intensity * (notes.length - 1));
    return notes[noteIndex];
}

function getVolumeValue(color) {
    // Use the color's brightness to determine volume
    const [r, g, b] = color.match(/\d+/g).map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return (brightness - 128) / 128; // Normalize to a range of -1 to +1 for Tone.js volume control
}



function adjustEffectsBasedOnImage(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, reverbReason, delayReason,chorusReason, phaserReason, vibratoReason) 
{
    
  
  
        delay.delayTime.value = delayValue;
        reverb.wet.value = reverbValue;
        chorus.wet.value = chorusValue;
        phaser.wet.value = phaserValue;
        vibrato.depth.value = vibratoValue;



  
    // Update #effects-info element with new values
    document.getElementById('reverb-decay').textContent = reverb.decay.toFixed(2);
    document.getElementById('delay-time').textContent = delay.delayTime.value.toFixed(2);
    document.getElementById('chorus-depth').textContent = chorus.wet.value.toFixed(2);
    document.getElementById('phaser-frequency').textContent = phaser.wet.value.toFixed(2);
    document.getElementById('vibrato-depth').textContent = vibrato.wet.value.toFixed(2);

    document.getElementById('reverb-reason').textContent = reverbReason;
    document.getElementById('delay-reason').textContent = delayReason;
    document.getElementById('chorus-reason').textContent = chorusReason;
    document.getElementById('phaser-reason').textContent = phaserReason;
    document.getElementById('vibrato-reason').textContent = vibratoReason;
}
