const fileInput = document.getElementById('fileInput');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colorInfo = document.getElementById('colorInfo');

        // Initialize Tone.js sampler with C4 and A4
        const sampler = new Tone.Sampler({
            urls: {
                C4: "C4.mp3",
                A4: "A4.mp3",
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
        }).toDestination();

        // Initialize Tone.js pitch shift and effects
        const pitchShift = new Tone.PitchShift().toDestination();
        const reverb = new Tone.Reverb().toDestination();
        const delay = new Tone.FeedbackDelay().toDestination();
        const chorus = new Tone.Chorus().toDestination();
        const phaser = new Tone.Phaser().toDestination();
        const vibrato = new Tone.Vibrato().toDestination();

        // Chain effects
        sampler.connect(pitchShift);
        pitchShift.connect(reverb);
        reverb.connect(delay);
        delay.connect(chorus);
        chorus.connect(phaser);
        phaser.connect(vibrato);

        let currentNote = null;
        let lastColor = '';
        let isPlaying = false;
        let moveTimer = null;
        const MOVEMENT_DELAY = 300; // Time in milliseconds before sound stops

        fileInput.addEventListener('change', handleFileUpload);

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
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
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
                if (isPlaying) {
                    sampler.triggerRelease(currentNote);
                    isPlaying = false;
                }
            }, MOVEMENT_DELAY);
        });

        canvas.addEventListener('mouseleave', () => {
            if (isPlaying) {
                sampler.triggerRelease(currentNote);
                isPlaying = false;
            }
        });

        function getContrastColor(color) {
            const [r, g, b] = color.match(/\d+/g).map(Number);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000' : '#fff';
        }

        function playColorSound(color) {
            const note = getColorNote();
            if (color !== lastColor) {
                if (isPlaying) {
                    sampler.triggerRelease(currentNote);
                    isPlaying = false;
                }
                if (note) {
                    currentNote = note;
                    const pitchValue = getPitchValue(color);
                    pitchShift.pitch = pitchValue;
                    sampler.triggerAttack(note);
                    isPlaying = true;
                    lastColor = color;
                }
            }
        }

        function getColorNote() {
            // Return either 'C4' or 'A4'
            return Math.random() > 0.5 ? 'C4' : 'A4';
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
            delay.delayTime.value = (1 - brightnessNorm) * 1.5; // Longer delay for darker images
            chorus.depth.value = saturationNorm; // More chorus depth for higher saturation
            phaser.baseModulationFrequency.value = (saturationNorm * 10) + 0.5; // Higher phaser frequency for higher saturation
            vibrato.depth.value = saturationNorm * 0.5; // Adjust vibrato depth based on saturation

            // Reconnect effects chain
            sampler.disconnect();
            sampler.connect(pitchShift);
            pitchShift.connect(reverb);
            reverb.connect(delay);
            delay.connect(chorus);
            chorus.connect(phaser);
            phaser.connect(vibrato);
        }