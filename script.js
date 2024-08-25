
require("dotenv").config();
const PAT = process.env.KEY;



const USER_ID2 = 'openai';    
const APP_ID2 = 'chat-completion';
const MODEL_ID2 = 'openai-gpt-4-vision';
const MODEL_VERSION_ID2 = '266df29bc09843e0aee9b7bf723c03c2'; 
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorInfo = document.getElementById('colorInfo');
const instrumentSelect = document.getElementById('instrumentSelect');




let synth;

function initializeSynth() {
  // Initialize the default instrument as MonoSynth
  synth = new Tone.Synth().toDestination();
  
}

function updateSynthType(synthType) {
  if (synth) {
    synth.dispose(); // dispose of the current synth
  }
  switch (synthType) {
    case 'AMSynth':
      synth = new Tone.AMSynth().toDestination();
      break;
    case 'DuoSynth':
      synth = new Tone.DuoSynth().toDestination();
      break;
    case 'FMSynth':
      synth = new Tone.FMSynth().toDestination();
      break;
    case 'MembraneSynth':
      synth = new Tone.MembraneSynth().toDestination();
      break;
    case 'MetalSynth':
      synth = new Tone.MetalSynth().toDestination();
      break;
    case 'MonoSynth':
      synth = new Tone.MonoSynth().toDestination();
      break;
    case 'NoiseSynth':
      synth = new Tone.NoiseSynth().toDestination();
      break;
    case 'PluckSynth':
      synth = new Tone.PluckSynth().toDestination();
      break;
    case 'PolySynth':
      synth = new Tone.PolySynth().toDestination();
      break;
    case 'Synth':
      synth = new Tone.Synth().toDestination();
      break;
    default:
      console.error(`Unsupported synth type: ${synthType}`);
  }
}



const reverb = new Tone.Reverb();
const delay = new Tone.FeedbackDelay();
const chorus = new Tone.Chorus();
const phaser = new Tone.Phaser();
const vibrato = new Tone.Vibrato();
const autoFilter = new Tone.AutoFilter();
const autoPanner = new Tone.AutoPanner();
const autoWah = new Tone.AutoWah();
const chebyshev = new Tone.Chebyshev();
const distortion = new Tone.Distortion();
const frequencyShifter = new Tone.FrequencyShifter();
const pingPongDelay = new Tone.PingPongDelay();

const stereoWidener = new Tone.StereoWidener();
const tremolo = new Tone.Tremolo();

// Chain effects
   





let lastColor = '';
const MOVEMENT_DELAY = 400; // Time in milliseconds before sound stops
let moveTimer = null;

fileInput.addEventListener('change', handleFileUpload);



function handleFileUpload(event) {
document.getElementById('synth-type').textContent = "analyzing..."
document.getElementById('reverb-decay').textContent = "analyzing..."
document.getElementById('delay-time').textContent = "analyzing..."
document.getElementById('chorus-depth').textContent = "analyzing..."
document.getElementById('phaser-frequency').textContent = "analyzing..."
document.getElementById('vibrato-depth').textContent = "analyzing..."
document.getElementById('auto-filter-frequency').textContent = "analyzing..."
document.getElementById('auto-panner-amount').textContent = "analyzing..."
document.getElementById('auto-wah-frequency').textContent = "analyzing..."
document.getElementById('chebyshev-order').textContent = "analyzing..."
document.getElementById('distortion-gain').textContent = "analyzing..."
document.getElementById('frequency-shifter-frequency').textContent = "analyzing..."
document.getElementById('ping-pong-delay-time').textContent = "analyzing..."
document.getElementById('stereo-widener-width').textContent = "analyzing..."
document.getElementById('tremolo-depth').textContent = "analyzing..."




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
                generateMusicPrompt(); 
                
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
                            "raw": "YOU HAVE TO Generate number values between 0 and 1 (to two decimal places) for each of the following effects ( AutoFilter, AutoPanner, AutoWah, Chebyshev, Chorus, Distortion, FeedbackDelay, FrequencyShifter, Phaser, PingPongDelay, Reverb, StereoWidener, Tremolo, Vibrato) based on this picture: The value can be 0 to turn the effect off, but the maximum is 1. Provide a reason for each value you choose.  OUTPUT FORMAT SHOULD LOOK LIKE THIS: Reverb: 0.1 - A reason why you set this value. THIS IS USED FOR AN EXPERIMENT, YOU MUST GENEATE VALUES! TRY NOT TO USE ALL THE EFFECTS, THIS MEANS SOME EFFECT VALUES SHOULD BE 0! ALSO CHOOSE A SYNTH BASED O THE IMAGE (AMSynth, DuoSynth, FMSynth, MembraneSynth, MetalSynth, MonoSynth, NoiseSynth, PluckSynth, Synth). OUTPUT LIKE THIS: Synth: the synth you choose  "
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
                
       
const synthMatch = outputText.match(/Synth:\s*(.*?)\s*-\s*(.*)/);
const synthType = synthMatch[1];
const synthTypeElement = synthMatch[1];    
const synthName = synthType === 'Synth' ? 'Basic Synth' : synthType;
document.getElementById('synth-type').textContent = synthName;
updateSynthType(synthType);


//Extract values for effects
const reverbMatch = outputText.match(/Reverb:\s*([\d\.]+)\s*-\s*([^D]*)/);
const delayMatch = outputText.match(/FeedbackDelay:\s*([\d\.]+)\s*-\s*([^C]*)/);
const chorusMatch = outputText.match(/Chorus:\s*([\d\.]+)\s*-\s*([^P]*)/);
const phaserMatch = outputText.match(/Phaser:\s*([\d\.]+)\s*-\s*([^V]*)/);
const vibratoMatch = outputText.match(/Vibrato:\s*([\d\.]+)\s*-\s*(.*)/);
const autoFilterMatch = outputText.match(/AutoFilter:\s*([\d\.]+)\s*-\s*(.*)/);
const autoPannerMatch = outputText.match(/AutoPanner:\s*([\d\.]+)\s*-\s*(.*)/);
const autoWahMatch = outputText.match(/AutoWah:\s*([\d\.]+)\s*-\s*(.*)/);
const chebyshevMatch = outputText.match(/Chebyshev:\s*([\d\.]+)\s*-\s*(.*)/);
const distortionMatch = outputText.match(/Distortion:\s*([\d\.]+)\s*-\s*(.*)/);
const frequencyShifterMatch = outputText.match(/FrequencyShifter:\s*([\d\.]+)\s*-\s*(.*)/);
const pingPongDelayMatch = outputText.match(/PingPongDelay:\s*([\d\.]+)\s*-\s*(.*)/);
const stereoWidenerMatch = outputText.match(/StereoWidener:\s*([\d\.]+)\s*-\s*(.*)/);
const tremoloMatch = outputText.match(/Tremolo:\s*([\d\.]+)\s*-\s*(.*)/);

// Handle cases where the match might not be found
const reverbValue = reverbMatch ? parseFloat(reverbMatch[1]) : null;
const delayValue = delayMatch ? parseFloat(delayMatch[1]) : null;
const chorusValue = chorusMatch ? parseFloat(chorusMatch[1]) : null;
const phaserValue = phaserMatch ? parseFloat(phaserMatch[1]) : null;
const vibratoValue = vibratoMatch ? parseFloat(vibratoMatch[1]) : null;
const autoFilterValue = autoFilterMatch ? parseFloat(autoFilterMatch[1]) : null;
const autoPannerValue = autoPannerMatch ? parseFloat(autoPannerMatch[1]) : null;
const autoWahValue = autoWahMatch ? parseFloat(autoWahMatch[1]) : null;
const chebyshevValue = chebyshevMatch ? parseFloat(chebyshevMatch[1]) : null;
const distortionValue = distortionMatch ? parseFloat(distortionMatch[1]) : null;
const frequencyShifterValue = frequencyShifterMatch ? parseFloat(frequencyShifterMatch[1]) : null;
const pingPongDelayValue = pingPongDelayMatch ? parseFloat(pingPongDelayMatch[1]) : null;
const stereoWidenerValue = stereoWidenerMatch ? parseFloat(stereoWidenerMatch[1]) : null;
const tremoloValue = tremoloMatch ? parseFloat(tremoloMatch[1]) : null;

  

  
const regexPattern = /(\w+):\s*[\d\.]+\s*-\s*(.*)/g;

let match;
const reasons = {};

// Extract reasons for each effect
while ((match = regexPattern.exec(outputText)) !== null) {
    const effect = match[1];
    const reason = match[2].trim();
    reasons[effect] = reason;
}

// Log extracted reasons (or use them as needed)
console.log(reasons);

// Example of how to display reasons (assuming you have HTML elements with IDs matching effect names)
for (const [effect, reason] of Object.entries(reasons)) {
    const elementId = `${effect}Reason`;
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = reason;
    }
}

adjustEffectsBasedOnImage(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, autoFilterValue, autoPannerValue, autoWahValue, chebyshevValue, distortionValue, frequencyShifterValue, pingPongDelayValue, stereoWidenerValue, tremoloValue);
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

        const volumeFeedbackElement = document.getElementById('volume-feedback');
        volumeFeedbackElement.textContent = `Volume: ${volumeValue.toFixed(2)}`; // Display volume value with 2 decimal places

        const noteFeedbackElement = document.getElementById('note-feedback');
        noteFeedbackElement.textContent = `Note: ${note}`; // Display current note
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





function adjustEffectsBasedOnImage(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, autoFilterValue, autoPannerValue, autoWahValue, chebyshevValue, distortionValue, frequencyShifterValue, pingPongDelayValue, stereoWidenerValue, tremoloValue) 
{

    if (reverb && reverb.wet) { 
        reverb.wet.value = reverbValue; }

    if (delay && delay.wet) {
        delay.wet.value = delayValue;}

    if (chorus && chorus.wet) {
        chorus.wet.value = chorusValue;}

    if (phaser && phaser.wet) {
        phaser.wet.value = phaserValue;}

    if (vibrato && vibrato.wet) {
        vibrato.wet.value = vibratoValue;}

    if (autoFilter && autoFilter.wet) {
        autoFilter.wet.value = autoFilterValue;}

    if (autoPanner && autoPanner.wet) {
        autoPanner.wet.value = autoPannerValue;}

    if (autoWah && autoWah.wet) {
        autoWah.wet.value = autoWahValue;}
    
    if (chebyshev && chebyshev.wet) {
        chebyshev.wet.value = chebyshevValue;}

    if (distortion && distortion.wet) {
        distortion.wet.value = distortionValue / 5;}

    
    if (frequencyShifter && frequencyShifter.wet) {
        frequencyShifter.frequency.value = frequencyShifterValue * 100;}
    
    if (pingPongDelay && pingPongDelay.wet) {
        pingPongDelay.wet.value = pingPongDelayValue;}



    if (stereoWidener && stereoWidener.wet) {
        stereoWidener.wet.value = stereoWidenerValue;}

    if (tremolo && tremolo.wet) {
        tremolo.wet.value = tremoloValue;}

setTimeout(function() { connectEffects(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, autoFilterValue, autoPannerValue, autoWahValue, chebyshevValue, distortionValue, frequencyShifterValue, pingPongDelayValue, stereoWidenerValue, tremoloValue); }, 2000);
 
    // Update #effects-info element with new values
   

document.getElementById('reverb-decay').textContent = reverb.wet.value;
document.getElementById('delay-time').textContent = delay.wet.value;
document.getElementById('chorus-depth').textContent = chorus.wet.value;
document.getElementById('phaser-frequency').textContent = phaser.wet.value;
document.getElementById('vibrato-depth').textContent = vibrato.wet.value;
document.getElementById('auto-filter-frequency').textContent = autoFilter.wet.value;
document.getElementById('auto-panner-amount').textContent = autoPanner.wet.value;
document.getElementById('auto-wah-frequency').textContent = autoWah.wet.value;
document.getElementById('chebyshev-order').textContent = chebyshev.wet.value;
document.getElementById('distortion-gain').textContent = distortion.wet.value;
document.getElementById('frequency-shifter-frequency').textContent = frequencyShifter.frequency.value;
document.getElementById('ping-pong-delay-time').textContent = pingPongDelay.wet.value;
document.getElementById('stereo-widener-width').textContent = stereoWidener.wet.value;
document.getElementById('tremolo-depth').textContent = tremolo.wet.value;

    
}


function connectEffects(reverbValue, delayValue, chorusValue, phaserValue, vibratoValue, autoFilterValue, autoPannerValue, autoWahValue, chebyshevValue, distortionValue, frequencyShifterValue, pingPongDelayValue, stereoWidenerValue, tremoloValue) {
    let previousEffect = synth; // Start with the synth as the first effect in the chain

    // Utility function to connect an effect if its value is greater than 0
    function connectIfActive(effect, value) {
        if (value > 0) {
            previousEffect.connect(effect);
            previousEffect = effect;
        }
    }

    // Connect effects conditionally
    
    connectIfActive(chorus, chorusValue);
    connectIfActive(phaser, phaserValue);
    connectIfActive(vibrato, vibratoValue);
    connectIfActive(autoFilter, autoFilterValue);
    connectIfActive(autoPanner, autoPannerValue);
    connectIfActive(autoWah, autoWahValue);
    connectIfActive(chebyshev, chebyshevValue);
    connectIfActive(distortion, distortionValue);
    connectIfActive(frequencyShifter, frequencyShifterValue);
    connectIfActive(tremolo, tremoloValue);
    connectIfActive(stereoWidener, stereoWidenerValue);
    connectIfActive(pingPongDelay, pingPongDelayValue);
    connectIfActive(delay, delayValue);
    connectIfActive(reverb, reverbValue);

    // Finally connect the last effect in the chain to the destination
    previousEffect.toDestination();
}






function typeWriter(reasontext) {
    let i = 0;
    let txt = reasontext;
    let speed = 50;
  
    function writeNextChar() {
      if (i < txt.length) {
        document.getElementById("reasontyper").innerHTML += txt.charAt(i);
        i++;
        setTimeout(writeNextChar, speed);
      }
    }
  
    writeNextChar();
  }

  