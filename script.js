// --- 1. Wallpaper Theme Switcher ---
const themeBtns = document.querySelectorAll(".theme-btn");
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.body.className = btn.dataset.bg;
    themeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- 2. Built-in Ambient Sound Generator (Web Audio API) ---
let audioCtx = null;
let activeNoiseNode = null;
let currentSoundType = null;

const rainBtn = document.getElementById("rain-sound-btn");
const focusBtn = document.getElementById("focus-sound-btn");

function stopAudio() {
  if (activeNoiseNode) {
    activeNoiseNode.disconnect();
    activeNoiseNode = null;
  }
  rainBtn.textContent = "🎧 Rain Sound: Off";
  focusBtn.textContent = "🌊 Brown Noise: Off";
  rainBtn.classList.remove("playing");
  focusBtn.classList.remove("playing");
  currentSoundType = null;
}

function toggleAmbientSound(type) {
  if (currentSoundType === type) {
    stopAudio();
    return;
  }
  stopAudio();

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "brown") {
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    } else {
      // Filtered pink-like rain noise
      output[i] = white * 0.15;
    }
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = type === "rain" ? 800 : 350;

  whiteNoise.connect(filter);
  filter.connect(audioCtx.destination);
  whiteNoise.start(0);

  activeNoiseNode = filter;
  currentSoundType = type;

  if (type === "rain") {
    rainBtn.textContent = "🎧 Rain Sound: On";
    rainBtn.classList.add("playing");
  } else {
    focusBtn.textContent = "🌊 Brown Noise: On";
    focusBtn.classList.add("playing");
  }
}

rainBtn.addEventListener("click", () => toggleAmbientSound("rain"));
focusBtn.addEventListener("click", () => toggleAmbientSound("brown"));

// --- 3. Pomodoro Timer & Modes ---
let selectedMinutes = 25;
let timeLeft = selectedMinutes * 60;
let timerId = null;

const display = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const modeBtns = document.querySelectorAll(".mode-btn");

function updateDisplay() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  display.textContent = `${mins}:${secs}`;
}

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMinutes = parseInt(btn.dataset.time, 10);
    timeLeft = selectedMinutes * 60;
    updateDisplay();
  });
});

startBtn.addEventListener("click", () => {
  if (timerId) return;
  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerId);
      timerId = null;
      alert("Session complete! Great work.");
    }
  }, 1000);
});

pauseBtn.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  timeLeft = selectedMinutes * 60;
  updateDisplay();
});

// --- 4. Task List with LocalStorage ---
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

let tasks = JSON.parse(localStorage.getItem("devfocus_tasks")) || [];

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");

    const span = document.createElement("span");
    span.textContent = task.text;
    span.style.cursor = "pointer";
    span.onclick = () => {
      tasks[index].done = !tasks[index].done;
      saveAndRender();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.style.padding = "0.25rem 0.6rem";
    delBtn.onclick = () => {
      tasks.splice(index, 1);
      saveAndRender();
    };

    li.append(span, delBtn);
    taskList.appendChild(li);
  });
}

function saveAndRender() {
  localStorage.setItem("devfocus_tasks", JSON.stringify(tasks));
  renderTasks();
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  tasks.push({ text: taskInput.value.trim(), done: false });
  taskInput.value = "";
  saveAndRender();
});

renderTasks();