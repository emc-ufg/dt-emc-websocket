const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const mqttBroker = mqtt.connect('mqtt://localhost:1883');
//const mqttBroker = mqtt.connect('mqtt://test.mosquitto.org');
const mqttTopic = 'teste';

// Configurar um listener para encaminhar mensagens do broker MQTT para a Unity via WebSocket
mqttBroker.on('message', (topic, message) => {
    console.log(`Mensagem recebida do tópico ${topic}: ${message}`);
  // Enviar a mensagem para todos os clientes conectados via WebSocket
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ topic, message: message.toString() }));
    }
  });
});

// Inscrever-se no tópico MQTT para receber mensagens
mqttBroker.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error(`Erro ao se inscrever no tópico ${mqttTopic}: ${err}`);
    } else {
      console.log(`Inscrito no tópico ${mqttTopic}`);
    }
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
