# WakeyCube

WakeyCube is an IoT smart device designed to transform the way users interact with their daily routines.

It combines a physical cube with a web application, allowing real-time control of alarms, lighting, vibration and interactive wake-up experiences.

---

## ✨ Concept

Traditional alarms are passive.

WakeyCube turns waking up into an interactive experience through light, sound, motion and small challenges that require user engagement.

---

## 🧠 System Overview

The system connects a web application with a physical ESP32 device using Firebase Realtime Database.

User-defined scenes are created in the app and executed in real time on the device.

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Firebase
- Zustand
- React Query

### Hardware
- ESP32
- NeoPixel LED strip
- MPU6050 (motion sensor)
- OLED display
- Buzzer
- Vibration motor

---

## 🧩 Features

- Smart alarm system  
- Adaptive lighting  
- Motion-based interaction  
- Scene automation  
- Real-time device control  

---

## 📂 Project Structure
```wakeycube/
├── app/ # React application (UI)
│ ├── src/
│ ├── public/
│ └── package.json
│
├── hardware/ # ESP32 firmware
│ ├── src/
│ │ └── main.cpp
│ └── platformio.ini```


---

## ⚠️ Note

The Firebase instance is no longer active.  
However, the full system logic and structure are preserved for demonstration purposes.

---

## 👩‍💻 Authors

- Sol Alexandrovic  
- Belén Arís  

---

## 🔗 Links

Behance: https://www.behance.net/solalexandrovic
