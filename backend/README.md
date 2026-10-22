# Backend Serverless: AWS Lambda + DynamoDB + API Gateway

Este directorio contiene la infraestructura backend completa para persistir los conciertos de **Festival Control** en **Amazon DynamoDB**.

## Arquitectura

```
[ Frontend Expo Web / App ]
             │
             ▼ HTTPS (CORS)
[ Amazon API Gateway (HTTP API) ]
             │
             ▼ Event Payload
[ AWS Lambda (Node.js 20 / TypeScript) ]
             │
             ▼ SDK v3
[ Amazon DynamoDB (Tabla: FestivalEvents) ]
```

## Estructura

- **`lambda/events.ts`**: Código fuente de la función Lambda con operaciones CRUD completas y soporte CORS.
- **`lambda/package.json`**: Dependencias de la Lambda (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`).
- **`template.yaml`**: Plantilla de infraestructura como código (AWS SAM / CloudFormation) que aprovisiona automáticamente la tabla DynamoDB, la Lambda y la API Gateway.

## Despliegue en AWS (1 solo paso con AWS SAM)

Asegúrate de tener tus credenciales de AWS activas en tu terminal y ejecuta:

```bash
cd backend
sam build
sam deploy --guided
```

Durante el asistente `sam deploy`, acepta los valores por defecto. Al finalizar, SAM te devolverá la URL pública de la API:

```text
Outputs:
ApiUrl = https://d1a2b3c4.execute-api.us-east-1.amazonaws.com
```

## Conectar con el Frontend

1. Copia el valor de `ApiUrl` generado por SAM.
2. Puedes pegarlo directamente en el botón **"Configurar API"** en la barra superior de la aplicación en vivo, o definirlo en tu archivo `.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://d1a2b3c4.execute-api.us-east-1.amazonaws.com
   ```
3. A partir de ese momento, cada creación, edición, cambio de estado y eliminación se guardará permanentemente en tu tabla **DynamoDB**.
