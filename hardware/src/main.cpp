#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include "time.h"
#include <Firebase_ESP_Client.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// --- CONFIG PANTALLA ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// --- CONFIG LUZ ---
#define NUM_LEDS 15

// --- PINES ---
#define VIB_PIN 12
#define LED_PIN 4
#define ALM_PIN 5
#define FRES_PIN 34

// OBJETOS
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// WIFI
#define WIFI_SSID "GalaxyA55"
#define WIFI_PASSWORD "wifibelu"

// FIREBASE
#define API_KEY "AIzaSyBfXNwsGKRkFwRO7LUw96oYWfAkm7H2wwQ"
#define DATABASE_URL "https://wakeycube-default-rtdb.firebaseio.com/"
FirebaseData fbdo;
FirebaseData stream;
FirebaseAuth auth;
FirebaseConfig config;
unsigned long lastUpdatedAt = 0;

// HORA
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC -10800 // Uruguay -3h
#define DAYLIGHT_OFFSET_SEC 0

// VARIABLES DISPLAY
unsigned long lastHourDsply = -1;

// VARIABLES VIBRACION
bool vibrando = false;
bool vibState = false;
unsigned long vibPrevMillis = 0;
unsigned long vibIntervalOn = 300;
unsigned long vibIntervalOff = 300;

// VARIABLES ALARMA
bool sonando = false;
bool pipState = false;
unsigned long pipPrevMillis = 0;
unsigned long pipIntervalOn = 300;
unsigned long pipIntervalOff = 300;

// VARIABLES ACELEROMETRO
bool giroHabilitado = false;

// VARIABLES LUZ
int brilloFinal;

// VARIABLES AJUSTE DE LUZ AUTOMATICO
bool ajusteLuz = false;

// APAGAR TODO CUANDO NO HAY NADA EN EJECUCIÓN
void apagarTodo()
{
  // LUZ
  brilloFinal = 0;
  strip.clear();
  strip.show();

  // VIBRACIÓN
  vibrando = false;
  vibState = false;
  digitalWrite(VIB_PIN, LOW);

  // ALARMA
  sonando = false;
  pipState = false;
  digitalWrite(ALM_PIN, HIGH);

  // AJUSTE LUZ
  ajusteLuz = false;

  Serial.println("Sistema apagado (sin escena activa)");
}

// CONFIG VIBRACIÓN
void configVibr(uint8_t nivel)
{
  vibrando = true;
  switch (nivel)
  {
  // BAJA
  case 1:
    vibIntervalOn = 1000;
    vibIntervalOff = 2000;
    break;

  // MEDIA
  case 2:
    vibIntervalOn = 500;
    vibIntervalOff = 1000;
    break;

  // ALTA
  case 3:
    vibIntervalOn = 300;
    vibIntervalOff = 300;
    break;
  }
}

void loopVibracion()
{
  if (!vibrando)
  {
    digitalWrite(VIB_PIN, LOW);
    return;
  }

  unsigned long ahora = millis();
  unsigned long intervalo = vibState ? vibIntervalOn : vibIntervalOff;

  if (ahora - vibPrevMillis >= intervalo)
  {
    vibPrevMillis = ahora;
    vibState = !vibState;
    digitalWrite(VIB_PIN, vibState ? HIGH : LOW);
  }
}

// CONFIG ALARMA
void configAlm(uint8_t modo)
{
  sonando = true;
  switch (modo)
  {
  // BAJA
  case 1:
    pipIntervalOn = 1000;
    pipIntervalOff = 2000;
    break;

  // MEDIA
  case 2:
    pipIntervalOn = 500;
    pipIntervalOff = 1000;
    break;

  // ALTA
  case 3:
    pipIntervalOn = 300;
    pipIntervalOff = 300;
    break;
  }
}

void loopAlarma()
{
  if (!sonando)
  {
    digitalWrite(ALM_PIN, HIGH);
    return;
  }

  unsigned long ahora = millis();
  unsigned long intervalo = pipState ? pipIntervalOn : pipIntervalOff;

  if (ahora - pipPrevMillis >= intervalo)
  {
    pipPrevMillis = ahora;
    pipState = !pipState;
    digitalWrite(ALM_PIN, pipState ? LOW : HIGH);
  }
}

// CONFIG LUZ
void configLuz(String hex, int cantidad, int intensidad, const char *efecto)
{
  // color hex a rgb
  if (hex.startsWith("#"))
  {
    hex = hex.substring(1);
  }

  long number = strtol(hex.c_str(), NULL, 16);

  int r = (number >> 16) & 0xFF;
  int g = (number >> 8) & 0xFF;
  int b = number & 0xFF;

  // % de intensidad que elige el usuario → brillo 0–255
  intensidad = constrain(intensidad, 0, 100);
  brilloFinal = map(intensidad, 0, 100, 0, 255);

  if (strcmp(efecto, "progresivo") == 0)
  {
    for (int brillo = 0; brillo <= brilloFinal; brillo += 5)
    {
      strip.setBrightness(brillo);
      for (int i = 0; i < NUM_LEDS; i++)
      {
        if (i < cantidad)
          strip.setPixelColor(i, strip.Color(r, g, b));
        else
          strip.setPixelColor(i, 0, 0, 0);
      }
      strip.show();
      delay(150);
    }
  }
  else
  {
    strip.setBrightness(brilloFinal);
    for (int i = 0; i < NUM_LEDS; i++)
    {
      if (i < cantidad)
        strip.setPixelColor(i, strip.Color(r, g, b));
      else
        strip.setPixelColor(i, 0, 0, 0);
    }
    strip.show();
  }
}

// LEER ILUMINACION AMBIENTE
int leerFotores()
{
  return analogRead(FRES_PIN);
}

// LEER ACELEROMETRO
bool giroDetectado()
{
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  static int cc = 0;
  if (++cc == 20)
  {
    cc = 0;
  }
  // inclinación del cubito
  if (abs(a.acceleration.x) > 6.0 ||
      abs(a.acceleration.y) > 6.0)
  {
    return true;
  }
  return false;
}

void loopAcelerometro()
{
  if (giroHabilitado && giroDetectado())
  {
    Serial.println("Giro detectado → apagando funcionalidades");

    if (sonando)
    {
      sonando = false;
      pipState = false;
      digitalWrite(ALM_PIN, HIGH);
    }

    if (vibrando)
    {
      vibrando = false;
      vibState = false;
      digitalWrite(VIB_PIN, LOW);
    }
  }
}

void loopAjusteLuz()
{
  static unsigned long lastAjLuz = millis();

  if (millis() - lastAjLuz > 1000)
  {
    lastAjLuz = millis();

    if (ajusteLuz && brilloFinal > 0)
    {
      int fr = leerFotores();
      int porcCorr = map(fr, 0, 4095, -60, 60);
      int newBrillo = brilloFinal + (brilloFinal * porcCorr / 100);
      if (newBrillo > 255)
        newBrillo = 255;
      strip.setBrightness(newBrillo);
      strip.show();
    }
  }
}

// PARSEAR JSON QUE VIENE DE FIREBASE
void parsearEjecucion(const String &payload)
{
  StaticJsonDocument<4096> doc;
  DeserializationError error = deserializeJson(doc, payload);

  if (error)
  {
    Serial.print("Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // detectar cambios aunque siga activa
  unsigned long updatedAt = doc["updatedAt"] | 0;
  if (updatedAt != 0 && updatedAt == lastUpdatedAt)
    return;
  lastUpdatedAt = updatedAt;

  // 1️ Leer activa
  bool activa = doc["activa"] | false;

  if (!activa)
  {
    apagarTodo();
    Serial.print("Sistema apagado (sin escena activa)");
    return;
  }

  sonando = false;
  pipState = false;
  digitalWrite(ALM_PIN, HIGH);

  vibrando = false;
  vibState = false;
  digitalWrite(VIB_PIN, LOW);

  giroHabilitado = false;

  // 2️ Leer acciones (array)
  JsonArray acciones = doc["acciones"].as<JsonArray>();
  for (JsonObject accion : acciones)
  {
    const char *funcionalidad = accion["funcionalidad"];

    // --- ALARMA ---
    if (strcmp(funcionalidad, "alarma") == 0)
    {
      const char *smodo = accion["parametros"]["modo"] | "modo1";
      uint8_t modo = 2;

      if (strcmp(smodo, "modo1") == 0)
        modo = 1;
      else if (strcmp(smodo, "modo2") == 0)
        modo = 2;
      else if (strcmp(smodo, "modo3") == 0)
        modo = 3;
      configAlm(modo);
    }

    // --- VIBRACIÓN ---
    else if (strcmp(funcionalidad, "vibracion") == 0)
    {
      const char *velocidad = accion["parametros"]["velocidad"] | "media";
      uint8_t modo = 2;

      if (strcmp(velocidad, "alta") == 0)
        modo = 3;
      else if (strcmp(velocidad, "baja") == 0)
        modo = 1;
      configVibr(modo);
    }

    // --- SACUDIR PARA APAGAR ---
    else if (strcmp(funcionalidad, "giro") == 0)
      giroHabilitado = true;

    // --- FOTORESISTOR ---
    else if (strcmp(funcionalidad, "ajuste_luz") == 0)
    {
      ajusteLuz = true;
    }

    // --- LUZ ---
    else if (strcmp(funcionalidad, "luz") == 0)
    {
      const char *color = accion["parametros"]["color"] | "#ffffff";
      const char *efecto = accion["parametros"]["efecto"] | "instantaneo";
      int intensidad = atoi(accion["parametros"]["intensidad"] | "100");
      configLuz(String(color), NUM_LEDS, intensidad, efecto);
    }
  }
}

// STREAM CALLBACK
void streamCallback(FirebaseStream data)
{
  String colorHex;
  Serial.printf("📡 Stream en %s → %s\n", data.dataPath().c_str(), data.stringData().c_str());
  if (data.dataPath() == "/")
    parsearEjecucion(data.stringData());
}

void streamTimeoutCallback(bool timeout)
{
  if (timeout)
  {
    Serial.println("⏳ Stream timeout — reconectando…");
  }
}

void dispMsg(const char *msg)
{
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS))
    return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 20);
  display.println(msg);
  display.display();
}

// FIREBASE CONFIG
void configFirebase()
{
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // LOGIN ANÓNIMO
  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("Usuario anónimo creado correctamente");
  }
  else
  {
    Serial.printf("Error en signUp: %s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // STREAM A EJECUCIÓN (aunque no exista todavía)
  if (!Firebase.RTDB.beginStream(&stream, "/ejecucion"))
  {
    Serial.println("Error iniciando stream:");
    Serial.println(stream.errorReason());
  }

  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);
}

void setup()
{
  Serial.begin(115200);

  // Inicializar componentes
  pinMode(VIB_PIN, OUTPUT);
  digitalWrite(VIB_PIN, LOW);

  pinMode(ALM_PIN, OUTPUT);
  digitalWrite(ALM_PIN, HIGH);

  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS))
  {
    Serial.println("No se encontró OLED");
    for (;;)
      ;
  }

  dispMsg("Iniciando...");

  // Conectar WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  dispMsg("Conectando Wifi...");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("Conectado a WiFi");

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

  configFirebase();

  if (!mpu.begin())
  {
    Serial.println("MPU6050 no encontrado");
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);
}

void loop()
{
  // Obtener hora NTP
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo))
  {
    Serial.println("Error obteniendo hora");
    delay(1000);
    return;
  }

  if (millis() - lastHourDsply > 500)
  {
    lastHourDsply = millis();
    char buffer[9];
    if ((timeinfo.tm_sec % 2) == 0)
      strftime(buffer, sizeof(buffer), "%H:%M", &timeinfo);
    else
      strftime(buffer, sizeof(buffer), "%H %M", &timeinfo);

    display.clearDisplay();
    display.setTextSize(4);
    display.setCursor(5, 25);
    display.println(buffer);
    display.display();
  }

  loopVibracion();
  loopAlarma();
  loopAcelerometro();
  loopAjusteLuz();

  delay(50);
}
