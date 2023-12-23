const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const mqttBroker = mqtt.connect('mqtt://mosquitto:1883');
//const mqttBroker = mqtt.connect('mqtt://test.mosquitto.org');

const mqttTopics = [
    "CAE/S101/sensor/temperatura",
    "CAE/S101/sensor/umidade",
    "CAE/S101/sensor/co2",
    "CAE/S101/sensor/umidade",
    "CAE/S101/sensor/pressao",
    "CAE/S101/sensor/ruido",
    "CAE/S101/sensor/tvoc",
    "CAE/S101/sensor/airquality",
    "CAE/S101/sensor/current",
    "CAE/S101/sensor/luminosidade",
    "CAE/S101/sensor/nox",
    "CAE/S101/sensor/voc",
    "CAE/S101/action/turn_on/hvac",
    "CAE/S101/action/turn_off/hvac",
    "CAE/S101/action/turn_on/lights",
    "CAE/S101/action/turn_off/lights"
];

// Configurar um listener para encaminhar mensagens do broker MQTT para a Unity via WebSocket
mqttBroker.on('message', (topic, message) => {
    console.log(`Mensagem recebida do tópico ${topic}: ${message}`);
    // Verificar se o tópico está na lista desejada
    if (mqttTopics.includes(topic)) {
        // Enviar a mensagem para todos os clientes conectados via WebSocket
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ topic, message: message.toString() }));
            }
        });
    }
});

// Inscrever-se nos tópicos MQTT para receber mensagens
mqttTopics.forEach((topic) => {
    mqttBroker.subscribe(topic, (err) => {
        if (err) {
            console.error(`Erro ao se inscrever no tópico ${topic}: ${err}`);
        } else {
            console.log(`Inscrito no tópico ${topic}`);
        }
    });
});

// Configurar WebSocket para lidar com a conexão da Unity
wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');

    // Lógica para lidar com mensagens enviadas pela Unity
    ws.on('message', (data) => {
        // Lógica para encaminhar a mensagem MQTT para o broker
        const { topic, message } = JSON.parse(data);
        mqttBroker.publish(topic, message);
    });

    // Lógica para lidar com a desconexão da Unity
    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

// ... Resto do código ...

const PORT = 5555;
server.listen(PORT, () => {
    console.log(`Servidor intermediário rodando na porta ${PORT}`);
});
