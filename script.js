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

// Initialize Tone.js pitch shift and effects
const pitchShift = new Tone.PitchShift().toDestination();
const reverb = new Tone.Reverb().toDestination();
const delay = new Tone.FeedbackDelay().toDestination();
const chorus = new Tone.Chorus().toDestination();
const phaser = new Tone.Phaser().toDestination();
const vibrato = new Tone.Vibrato().toDestination();

// Chain effects
function connectEffects() {
    synth.connect(pitchShift);
    pitchShift.connect(reverb);
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
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                analyzeImage();
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    } else {
        console.error('No file selected or file is invalid.');
    }
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
        const note = getColorNote();
        const pitchValue = getPitchValue(color);
        pitchShift.pitch = pitchValue;
        synth.triggerAttack(note);
        lastColor = color;
    }
}

function getColorNote() {
    // Generate a note based on color's brightness
    const notes = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'];
    return notes[Math.floor(Math.random() * notes.length)];
}

function getPitchValue(color) {
    // Use the color's brightness to determine pitch shift
    const [r, g, b] = color.match(/\d+/g).map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return (brightness - 128) / 10; // Normalize to a range of -12 to +12 semitones
}

function analyzeImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let brightnessSum = 0;
    let saturationSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        brightnessSum += brightness;

        // Saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        saturationSum += max - min;

        pixelCount++;
    }

    const avgBrightness = brightnessSum / pixelCount;
    const avgSaturation = saturationSum / pixelCount;

    adjustEffectsBasedOnImage(avgBrightness, avgSaturation);
}

function adjustEffectsBasedOnImage(brightness, saturation) {
    const brightnessNorm = Math.min(Math.max(brightness / 255, 0), 1);
    const saturationNorm = Math.min(Math.max(saturation / 255, 0), 1);
  
    // Example adjustments
    reverb.decay = brightnessNorm * 10;
    if (delay && delay.delayTime) {
      delay.delayTime.value = Math.min(Math.max((1 - brightnessNorm) * 1.5, 0), 1); // Ensure value is within [0, 1]
    }
    if (chorus && chorus.wet) {
      chorus.wet.value = Math.min(Math.max(saturationNorm * 0.9, 0), 1); // Ensure value is within [0, 1]
    }
    if (phaser && phaser.wet) {
      phaser.wet.value = Math.min(Math.max((saturationNorm * 0.9) + 0.1, 0), 1); // Ensure value is within [0, 1]
    }
    if (vibrato && vibrato.wet) {
      vibrato.wet.value = Math.min(Math.max(saturationNorm * 0.5, 0), 1); // Ensure value is within [0, 1]
    }
  
    // Update #effects-info element with new values
    document.getElementById('reverb-decay').textContent = reverb.decay.toFixed(2);
    document.getElementById('delay-time').textContent = delay.delayTime.value.toFixed(2);
    document.getElementById('chorus-depth').textContent = chorus.wet.value.toFixed(2);
    document.getElementById('phaser-frequency').textContent = phaser.wet.value.toFixed(2);
    document.getElementById('vibrato-depth').textContent = vibrato.wet.value.toFixed(2);
}
