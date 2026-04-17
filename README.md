# WakeyCube

WakeyCube is a smart IoT bedside device designed to transform the way users interact with their daily routines.

It combines a physical cube with a web application, enabling real-time control of alarms, lighting, vibration and interactive wake-up experiences.

---

## ✨ Concept

Traditional alarms are passive.

WakeyCube rethinks the waking experience by combining digital configuration with physical interaction.  
Users engage with light, sound, motion and small challenges to build more effective and intentional routines.

---

## 🧠 System Overview

The system connects a web application with a physical ESP32 device using Firebase Realtime Database.

User-defined scenes are created in the app and executed in real time on the device, translating digital actions into physical responses.

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

```
wakeycube/
├── app/        # React application (UI)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── hardware/   # ESP32 firmware
│   ├── src/
│   │   └── main.cpp
│   └── platformio.ini
```

---

## ⚠️ Note

The Firebase instance is no longer active.  
However, the full system logic and structure are preserved for demonstration purposes.

---

## 👩‍💻 Authors

- [Sol Alexandrovic](https://github.com/tu-usuario)  
- [Belén Arís](https://github.com/su-usuario)  

---

## 🔗 Links

Behance: (ponés tu link cuando lo subas)  
